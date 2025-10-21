// OneShot.pro Pose Analyzer
// Analyzes archer form from MediaPipe pose landmarks
// EXACTLY matches Python posture_metrics() logic

class PoseAnalyzer {
    constructor() {
        this.landmarks = CONFIG.landmarks;
        this.thresholds = CONFIG.thresholds;
    }

    /**
     * Calculate all pose metrics from landmarks
     * Matches Python posture_metrics() function exactly
     */
    calculateMetrics(poseLandmarks, userConfig) {
        const hand = userConfig.hand;
        
        // Determine bow side and draw side based on hand (matches Python logic)
        const bowSide = hand === 'left' ? 'LEFT' : 'RIGHT';
        const drawSide = hand === 'left' ? 'RIGHT' : 'LEFT';
        
        // Get landmark indices
        const bowShoulderIdx = this.landmarks[`${bowSide}_SHOULDER`];
        const bowElbowIdx = this.landmarks[`${bowSide}_ELBOW`];
        const bowWristIdx = this.landmarks[`${bowSide}_WRIST`];
        
        const drawShoulderIdx = this.landmarks[`${drawSide}_SHOULDER`];
        const drawElbowIdx = this.landmarks[`${drawSide}_ELBOW`];
        const drawWristIdx = this.landmarks[`${drawSide}_WRIST`];
        
        const leftShoulderIdx = this.landmarks.LEFT_SHOULDER;
        const rightShoulderIdx = this.landmarks.RIGHT_SHOULDER;
        const leftHipIdx = this.landmarks.LEFT_HIP;
        const rightHipIdx = this.landmarks.RIGHT_HIP;
        const leftEarIdx = this.landmarks.LEFT_EAR;
        const rightEarIdx = this.landmarks.RIGHT_EAR;
        const noseIdx = this.landmarks.NOSE;
        const mouthIdx = hand === 'right' ? this.landmarks.MOUTH_LEFT : this.landmarks.MOUTH_RIGHT;
        
        // Extract points (x, y normalized 0-1)
        const bowShoulder = poseLandmarks[bowShoulderIdx];
        const bowElbow = poseLandmarks[bowElbowIdx];
        const bowWrist = poseLandmarks[bowWristIdx];
        
        const drawShoulder = poseLandmarks[drawShoulderIdx];
        const drawElbow = poseLandmarks[drawElbowIdx];
        const drawWrist = poseLandmarks[drawWristIdx];
        
        const leftShoulder = poseLandmarks[leftShoulderIdx];
        const rightShoulder = poseLandmarks[rightShoulderIdx];
        const leftHip = poseLandmarks[leftHipIdx];
        const rightHip = poseLandmarks[rightHipIdx];
        const leftEar = poseLandmarks[leftEarIdx];
        const rightEar = poseLandmarks[rightEarIdx];
        const nose = poseLandmarks[noseIdx];
        const mouth = poseLandmarks[mouthIdx];

        // 1. SHOULDER LINE - Robust angle calculation (matches Python)
        let angSh = Math.abs(Utils.calculateLineAngle(leftShoulder, rightShoulder));
        const shoulderLineDeg = Math.min(angSh, Math.abs(180.0 - angSh));

        // 2. BOW ELBOW - Joint angle at bow elbow
        const bowElbowDeg = Utils.calculateAngle(bowShoulder, bowElbow, bowWrist);

        // 3. DRAW ALIGNMENT - Alignment of draw elbow with arrow line
        const a1 = Utils.calculateLineAngle(drawShoulder, drawWrist);
        const a2 = Utils.calculateLineAngle(drawElbow, drawWrist);
        let angleDiff = Math.abs(a1 - a2);
        const drawAlignDeg = Math.min(angleDiff, 360 - angleDiff);

        // 4. HEAD TILT - Calculate head tilt
        let headTiltDeg;
        if (leftEar.visibility > 0 && rightEar.visibility > 0) {
            // Use ears if visible
            headTiltDeg = Math.abs(Utils.calculateLineAngle(leftEar, rightEar));
        } else {
            // Fallback to nose-mouth angle
            const noseMouthAngle = Utils.calculateLineAngle(mouth, nose);
            headTiltDeg = Math.abs(noseMouthAngle - 90.0);
        }

        // 5. SPINE LEAN - Calculate spine deviation from vertical
        const midHip = Utils.getMidpoint(leftHip, rightHip);
        const midShoulder = Utils.getMidpoint(leftShoulder, rightShoulder);
        const angleShHip = Math.abs(Utils.calculateLineAngle(midHip, midShoulder));
        const spineLeanDeg = Math.abs(90.0 - angleShHip);

        // 6. ANCHOR RATIO - Distance from draw wrist to mouth vs shoulder width
        const shoulderWidth = Utils.calculateDistance(leftShoulder, rightShoulder);
        const anchorDist = Utils.calculateDistance(drawWrist, mouth);
        const anchorRatio = shoulderWidth > 0 ? anchorDist / shoulderWidth : Infinity;

        return {
            shoulderLineDeg: parseFloat(shoulderLineDeg.toFixed(1)),
            bowElbowDeg: parseFloat(bowElbowDeg.toFixed(1)),
            drawAlignDeg: parseFloat(drawAlignDeg.toFixed(1)),
            headTiltDeg: parseFloat(headTiltDeg.toFixed(1)),
            spineLeanDeg: parseFloat(spineLeanDeg.toFixed(1)),
            anchorRatio: parseFloat(anchorRatio.toFixed(2)),
            shoulderWidthPx: parseFloat(shoulderWidth.toFixed(1)),
            confidence: this.calculateConfidence(poseLandmarks)
        };
    }

    /**
     * Evaluate form against thresholds
     * Matches Python posture_passfail() function exactly
     */
    evaluateForm(poseLandmarks, userConfig) {
        const metrics = this.calculateMetrics(poseLandmarks, userConfig);
        
        return {
            shoulderLine: {
                name: this.thresholds.shoulderLine.name,
                value: metrics.shoulderLineDeg,
                threshold: this.thresholds.shoulderLine.max,
                unit: this.thresholds.shoulderLine.unit,
                pass: metrics.shoulderLineDeg <= this.thresholds.shoulderLine.max,
                description: this.thresholds.shoulderLine.description
            },
            bowElbow: {
                name: this.thresholds.bowElbow.name,
                value: metrics.bowElbowDeg,
                threshold: this.thresholds.bowElbow.target,
                unit: this.thresholds.bowElbow.unit,
                pass: Math.abs(metrics.bowElbowDeg - this.thresholds.bowElbow.target) <= this.thresholds.bowElbow.tolerance,
                description: this.thresholds.bowElbow.description
            },
            drawAlign: {
                name: this.thresholds.drawAlign.name,
                value: metrics.drawAlignDeg,
                threshold: this.thresholds.drawAlign.max,
                unit: this.thresholds.drawAlign.unit,
                pass: metrics.drawAlignDeg <= this.thresholds.drawAlign.max,
                description: this.thresholds.drawAlign.description
            },
            headTilt: {
                name: this.thresholds.headTilt.name,
                value: metrics.headTiltDeg,
                threshold: this.thresholds.headTilt.max,
                unit: this.thresholds.headTilt.unit,
                pass: metrics.headTiltDeg <= this.thresholds.headTilt.max,
                description: this.thresholds.headTilt.description
            },
            spineLean: {
                name: this.thresholds.spineLean.name,
                value: metrics.spineLeanDeg,
                threshold: this.thresholds.spineLean.max,
                unit: this.thresholds.spineLean.unit,
                pass: metrics.spineLeanDeg <= this.thresholds.spineLean.max,
                description: this.thresholds.spineLean.description
            },
            anchor: {
                name: this.thresholds.anchorRatio.name,
                value: metrics.anchorRatio,
                threshold: this.thresholds.anchorRatio.max,
                unit: this.thresholds.anchorRatio.unit,
                pass: metrics.anchorRatio <= this.thresholds.anchorRatio.max,
                description: this.thresholds.anchorRatio.description
            }
        };
    }

    /**
     * Calculate confidence score based on landmark visibility
     */
    calculateConfidence(poseLandmarks) {
        // Key landmarks for archery (matches Python key indices)
        const keyIndices = [
            this.landmarks.LEFT_SHOULDER,
            this.landmarks.RIGHT_SHOULDER,
            this.landmarks.LEFT_ELBOW,
            this.landmarks.RIGHT_ELBOW,
            this.landmarks.LEFT_WRIST,
            this.landmarks.RIGHT_WRIST,
            this.landmarks.NOSE
        ];
        
        let sum = 0;
        let count = 0;
        
        keyIndices.forEach(idx => {
            if (idx < poseLandmarks.length && poseLandmarks[idx].visibility !== undefined) {
                sum += poseLandmarks[idx].visibility;
                count++;
            }
        });
        
        return count > 0 ? sum / count : 0;
    }

    /**
     * Detect shot phase based on pose (for future use)
     * Matches Python phase detection logic
     */
    detectPhase(metrics, previousMetrics) {
        if (!previousMetrics) return 'rest';
        
        // Simple phase detection based on bow elbow angle
        if (metrics.bowElbowDeg > 160 && metrics.anchorRatio < 0.3) {
            return 'anchor';
        } else if (metrics.bowElbowDeg > 140) {
            return 'draw';
        } else if (metrics.bowElbowDeg < 140) {
            return 'rest';
        }
        
        return 'unknown';
    }

    /**
     * Get landmark by name (helper method)
     */
    getLandmark(poseLandmarks, name) {
        const index = this.landmarks[name];
        return poseLandmarks[index];
    }

    /**
     * Check if all required landmarks are visible
     */
    hasRequiredLandmarks(poseLandmarks, userConfig) {
        const hand = userConfig.hand;
        const bowSide = hand === 'left' ? 'LEFT' : 'RIGHT';
        const drawSide = hand === 'left' ? 'RIGHT' : 'LEFT';
        
        const requiredIndices = [
            this.landmarks[`${bowSide}_SHOULDER`],
            this.landmarks[`${bowSide}_ELBOW`],
            this.landmarks[`${bowSide}_WRIST`],
            this.landmarks[`${drawSide}_SHOULDER`],
            this.landmarks[`${drawSide}_ELBOW`],
            this.landmarks[`${drawSide}_WRIST`],
            this.landmarks.LEFT_SHOULDER,
            this.landmarks.RIGHT_SHOULDER,
            this.landmarks.NOSE
        ];
        
        const visibilityThreshold = 0.5;
        
        for (const idx of requiredIndices) {
            if (idx >= poseLandmarks.length || poseLandmarks[idx].visibility < visibilityThreshold) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Generate priority feedback message (matches Python build_status_sentence)
     */
    getPriorityFeedback(metrics, flags) {
        const checks = [
            { key: 'shoulder_line_ok', message: `Keep shoulders level (${metrics.shoulderLineDeg.toFixed(0)}° <= ${this.thresholds.shoulderLine.max}°)` },
            { key: 'bow_elbow_ok', message: `Straighten bow elbow (${metrics.bowElbowDeg.toFixed(0)}° ~ ${this.thresholds.bowElbow.target}°)` },
            { key: 'draw_align_ok', message: `Align draw elbow with string (${metrics.drawAlignDeg.toFixed(0)}° <= ${this.thresholds.drawAlign.max}°)` },
            { key: 'head_tilt_ok', message: `Reduce head tilt (${metrics.headTiltDeg.toFixed(0)}° <= ${this.thresholds.headTilt.max}°)` },
            { key: 'spine_lean_ok', message: `Stand tall; reduce spine lean (${metrics.spineLeanDeg.toFixed(0)}° <= ${this.thresholds.spineLean.max}°)` },
            { key: 'anchor_ok', message: 'Anchor to mouth corner' }
        ];
        
        for (const check of checks) {
            if (!flags[check.key]) {
                return check.message;
            }
        }
        
        return 'Form looks good';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PoseAnalyzer;
}