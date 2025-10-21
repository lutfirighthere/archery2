// OneShot.pro - Main Application Logic
// Handles session management, camera setup, and pose detection

class OneShotApp {
    constructor() {
        this.pose = null;
        this.camera = null;
        this.poseAnalyzer = null;
        this.uiController = null;
        this.shotHistory = null;
        
        this.isSessionActive = false;
        this.currentShots = 0;
        this.maxShots = CONFIG.tiers.free.maxShots;
        this.userConfig = null;
        this.lastShotTime = 0;
        
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasCtx = null;
        
        // Store current pose data for shot capture
        this.lastLandmarks = null;
        this.lastResults = null;
        this.frameCount = 0;
    }

    async initialize() {
        console.log('Initializing OneShot.pro...');
        
        // Initialize components
        this.poseAnalyzer = new PoseAnalyzer();
        this.uiController = new UIController();
        this.shotHistory = new ShotHistory();
        
        // Make UI controller available globally for onclick handlers
        window.uiController = this.uiController;
        window.shotHistory = this.shotHistory;
        
        console.log('OneShot.pro initialized successfully');
    }

    async startSession() {
        // Get user configuration from form
        this.userConfig = {
            height: parseFloat(document.getElementById('height').value),
            distance: parseFloat(document.getElementById('distance').value),
            drawLength: parseFloat(document.getElementById('drawLength').value),
            bowType: document.getElementById('bowType').value,
            hand: document.querySelector('input[name="hand"]:checked').value,
            experience: document.querySelector('input[name="experience"]:checked').value
        };

        console.log('Starting session with config:', this.userConfig);

        // Hide setup form, show video container
        document.getElementById('setupForm').style.display = 'none';
        document.getElementById('videoContainer').classList.add('active');

        // Initialize video elements
        this.videoElement = document.getElementById('videoElement');
        this.canvasElement = document.getElementById('canvasElement');
        this.canvasCtx = this.canvasElement.getContext('2d');

        // Update UI
        this.uiController.updateStatusBar('Initializing MediaPipe Pose...');
        this.uiController.updateShotCounter(this.currentShots, this.maxShots);

        // Initialize MediaPipe Pose
        await this.initializePose();

        // Start camera
        await this.startCamera();

        this.isSessionActive = true;
        this.uiController.updateStatusBar('Session active', 'Ready');
    }

    async initializePose() {
    console.log('Initializing MediaPipe Pose (safe version)...');

    // Detect correct Pose constructor for different CDN versions
    const PoseCtor = (window.Pose && window.Pose.Pose) ? window.Pose.Pose : window.Pose;

    this.pose = new PoseCtor({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    // Relaxed settings + selfie mode for front-facing webcams
    this.pose.setOptions({
        selfieMode: true,
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.3,
        minTrackingConfidence: 0.3
    });

    this.pose.onResults((results) => this.onPoseResults(results));

    console.log('MediaPipe Pose initialized with selfieMode + relaxed confidence');
}


    async startCamera() {
        console.log('Starting camera...');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: CONFIG.camera.width,
                    height: CONFIG.camera.height,
                    facingMode: CONFIG.camera.facingMode
                }
            });

            this.videoElement.srcObject = stream;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    resolve();
                };
            });

            // Set canvas size to match video
            this.canvasElement.width = this.videoElement.videoWidth;
            this.canvasElement.height = this.videoElement.videoHeight;

            console.log(`Camera resolution: ${this.videoElement.videoWidth}x${this.videoElement.videoHeight}`);
            console.log(`Canvas size: ${this.canvasElement.width}x${this.canvasElement.height}`);

            // Start pose detection loop
            this.detectPose();

            console.log('Camera started successfully');
        } catch (error) {
            console.error('Camera error:', error);
            this.uiController.updateStatusBar('Camera error: ' + error.message);
            alert('Could not access camera. Please check permissions and try again.');
        }
    }

    // --- Pose detection using MediaPipe CameraUtils ---
    async detectPose() {
    console.log("Starting real-time pose detection loop (CameraUtils)…");

    const onFrame = async () => {
        await this.pose.send({ image: this.videoElement });
    };

    try {
        this.camera = new Camera(this.videoElement, {
            onFrame,
            width: CONFIG.camera.width,
            height: CONFIG.camera.height
        });
        await this.camera.start();
        console.log("CameraUtils loop started — frames streaming to Pose.");
    } catch (err) {
        console.error("CameraUtils failed:", err);
        this.uiController.updateStatusBar("Camera error: " + err.message);
    }
}

    onPoseResults(results) {
        this.frameCount++;
        
        // Store results for shot capture
        this.lastResults = results;
        this.lastLandmarks = results.poseLandmarks;

        // Clear canvas and draw video
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        this.canvasCtx.drawImage(
            results.image,
            0, 0,
            this.canvasElement.width,
            this.canvasElement.height
        );

        if (results.poseLandmarks && results.poseLandmarks.length > 0) {
            // Log every 30 frames to confirm detection
            if (this.frameCount % 30 === 0) {
                console.log(`Pose detected! Landmarks: ${results.poseLandmarks.length}`);
            }

            // Draw skeleton connections FIRST (behind joints)
            this.drawConnections(results.poseLandmarks);
            
            // Draw joint markers on top
            this.drawLandmarks(results.poseLandmarks);

            // Analyze form
            const evaluation = this.poseAnalyzer.evaluateForm(
                results.poseLandmarks,
                this.userConfig
            );

            // Calculate metrics
            const metrics = this.poseAnalyzer.calculateMetrics(
                results.poseLandmarks,
                this.userConfig
            );

            // Update form panel
            this.uiController.updateFormPanel(evaluation, metrics, this.userConfig);

            // Calculate confidence
            const confidence = this.calculateConfidence(results.poseLandmarks);

            // Update status with pass/fail count
            const passCount = Object.values(evaluation).filter(e => e.pass).length;
            const totalChecks = Object.values(evaluation).length;
            
            this.uiController.updateStatusBar(
                `Pose detected (confidence: ${(confidence * 100).toFixed(0)}%)`,
                `${passCount}/${totalChecks} passing`
            );

            // Draw additional visual indicators
            this.drawFormIndicators(results.poseLandmarks, evaluation, metrics);

        } else {
            if (this.frameCount % 30 === 0) {
                console.log('No pose detected in frame');
            }
            this.uiController.updateStatusBar('Position yourself in frame - no pose detected', '');
        }

        this.canvasCtx.restore();
    }

    drawConnections(landmarks) {
        const ctx = this.canvasCtx;
        const width = this.canvasElement.width;
        const height = this.canvasElement.height;

        // Full MediaPipe Pose connections (matching Python POSE_CONNECTIONS)
        const connections = [
            // Face
            [0, 1], [1, 2], [2, 3], [3, 7],
            [0, 4], [4, 5], [5, 6], [6, 8],
            [9, 10],
            // Torso
            [11, 12], [11, 23], [12, 24], [23, 24],
            // Left arm
            [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
            // Right arm
            [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
            // Left leg
            [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
            // Right leg
            [24, 26], [26, 28], [28, 30], [28, 32], [30, 32]
        ];

        ctx.strokeStyle = CONFIG.ui.skeletonColor;
        ctx.lineWidth = CONFIG.ui.skeletonThickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        let drawnCount = 0;
        connections.forEach(([startIdx, endIdx]) => {
            if (startIdx < landmarks.length && endIdx < landmarks.length) {
                const start = landmarks[startIdx];
                const end = landmarks[endIdx];

                if (start.visibility > 0.2 && end.visibility > 0.2) {
                    ctx.beginPath();
                    ctx.moveTo(start.x * width, start.y * height);
                    ctx.lineTo(end.x * width, end.y * height);
                    ctx.stroke();
                    drawnCount++;
                }
            }
        });

        if (this.frameCount % 30 === 0) {
            console.log(`Drew ${drawnCount} skeleton connections`);
        }
    }

    drawLandmarks(landmarks) {
        const ctx = this.canvasCtx;
        const width = this.canvasElement.width;
        const height = this.canvasElement.height;

        ctx.fillStyle = CONFIG.ui.jointColor;

        // Draw ALL visible landmarks
        let drawnCount = 0;
        landmarks.forEach((landmark, idx) => {
            if (landmark.visibility > 0.2) {
                ctx.beginPath();
                ctx.arc(
                    landmark.x * width,
                    landmark.y * height,
                    CONFIG.ui.jointRadius,
                    0,
                    2 * Math.PI
                );
                ctx.fill();
                drawnCount++;
            }
        });

        if (this.frameCount % 30 === 0) {
            console.log(`Drew ${drawnCount} joint markers`);
        }
    }

    drawFormIndicators(landmarks, evaluation, metrics) {
        const width = this.canvasElement.width;
        const height = this.canvasElement.height;

        // Draw anchor point circle indicator
        const hand = this.userConfig.hand;
        const wristIdx = hand === 'right' ? 16 : 15;
        const mouthLeftIdx = 9;
        const mouthRightIdx = 10;

        if (wristIdx < landmarks.length && mouthLeftIdx < landmarks.length && mouthRightIdx < landmarks.length) {
            const wrist = landmarks[wristIdx];
            const mouthLeft = landmarks[mouthLeftIdx];
            const mouthRight = landmarks[mouthRightIdx];

            if (wrist.visibility > 0.5 && mouthLeft.visibility > 0.5 && mouthRight.visibility > 0.5) {
                const mouthCenter = {
                    x: (mouthLeft.x + mouthRight.x) / 2 * width,
                    y: (mouthLeft.y + mouthRight.y) / 2 * height
                };

                const wristPoint = {
                    x: wrist.x * width,
                    y: wrist.y * height
                };

                this.uiController.drawAnchorCircle(
                    this.canvasCtx,
                    wristPoint,
                    mouthCenter,
                    evaluation.anchor.pass
                );
            }
        }
    }

    calculateConfidence(landmarks) {
        const keyIndices = [11, 12, 13, 14, 15, 16, 0];
        let sum = 0;
        let count = 0;

        keyIndices.forEach(idx => {
            if (idx < landmarks.length && landmarks[idx].visibility !== undefined) {
                sum += landmarks[idx].visibility;
                count++;
            }
        });

        return count > 0 ? sum / count : 0;
    }

    captureShot() {
        const now = Date.now();
        if (now - this.lastShotTime < CONFIG.session.shotCooldown) {
            console.log('Shot cooldown active');
            this.uiController.updateStatusBar('Please wait between shots...', '');
            return;
        }

        if (this.currentShots >= this.maxShots) {
            this.uiController.showUpgradePrompt();
            return;
        }

        if (!this.lastLandmarks || this.lastLandmarks.length === 0) {
            this.uiController.updateStatusBar('No pose detected - please position yourself in frame');
            return;
        }

        console.log('Capturing shot...');

        const metrics = this.poseAnalyzer.calculateMetrics(this.lastLandmarks, this.userConfig);
        const evaluation = this.poseAnalyzer.evaluateForm(this.lastLandmarks, this.userConfig);
        const shotSummary = this.createShotSummary(metrics, evaluation);

        this.shotHistory.addShot(shotSummary);
        this.currentShots++;
        this.uiController.updateShotCounter(this.currentShots, this.maxShots);
        this.uiController.flashCapture(this.canvasElement);
        this.uiController.showShotModal(shotSummary);

        if (shotSummary.feedback.message) {
            setTimeout(() => {
                this.uiController.speakFeedback(shotSummary.feedback.message);
            }, 500);
        }

        this.lastShotTime = now;
        console.log('Shot captured:', shotSummary);
    }

    createShotSummary(metrics, evaluation) {
        const errors = [];
        
        Object.entries(evaluation).forEach(([key, entry]) => {
            if (!entry.pass) {
                const severity = this.calculateErrorSeverity(entry.value, entry.threshold);
                errors.push({
                    type: entry.name,
                    severity: severity,
                    description: entry.description || `${entry.name} out of range`,
                    value: entry.value,
                    threshold: entry.threshold
                });
            }
        });

        const overallScore = this.calculateOverallScore(evaluation);
        const feedback = this.generateFeedback(errors, overallScore);

        return {
            timestamp: new Date().toISOString(),
            metrics: metrics,
            evaluation: evaluation,
            errors: errors,
            overallScore: overallScore,
            feedback: feedback,
            userConfig: this.userConfig
        };
    }

    calculateErrorSeverity(value, threshold) {
        const deviation = Math.abs(value - threshold);
        const ratio = deviation / Math.max(threshold, 1);
        if (ratio > 0.5) return 'high';
        if (ratio > 0.25) return 'medium';
        return 'low';
    }

    calculateOverallScore(evaluation) {
        const checks = Object.values(evaluation);
        const passCount = checks.filter(e => e.pass).length;
        return Math.round((passCount / checks.length) * 100);
    }

    generateFeedback(errors, score) {
        if (errors.length === 0) {
            return {
                message: 'Excellent Form!',
                detail: 'All form checks passed. Great shot!',
                type: 'positive'
            };
        }

        const priorityError = errors.sort((a, b) => {
            const severityOrder = { high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        })[0];

        const messages = {
            'Shoulder Level': 'Focus on keeping your shoulders level throughout the draw.',
            'Bow Arm Extension': 'Extend your bow arm fully for better stability.',
            'Draw Alignment': 'Align your draw elbow with the arrow.',
            'Head Position': 'Keep your head level and anchor consistently.',
            'Spine Alignment': 'Stand tall with a neutral spine.',
            'Anchor Point': 'Find a consistent anchor point on your face.'
        };

        return {
            message: priorityError.type,
            detail: messages[priorityError.type] || 'Work on improving your form.',
            type: 'corrective'
        };
    }

    toggleSession() {
        if (this.isSessionActive) {
            this.stopSession();
        }
    }

    stopSession() {
        console.log('Stopping session...');
        this.isSessionActive = false;

        if (this.videoElement && this.videoElement.srcObject) {
            const tracks = this.videoElement.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.videoElement.srcObject = null;
        }

        document.getElementById('videoContainer').classList.remove('active');
        document.getElementById('setupForm').style.display = 'block';
        this.currentShots = 0;
        console.log('Session stopped');
    }

    viewHistory() {
        const stats = this.shotHistory.getStats();
        
        if (stats && stats.totalShots > 0) {
            alert(
                `Session Statistics:\n\n` +
                `Total Shots: ${stats.totalShots}\n` +
                `Average Score: ${stats.averageScore}%\n` +
                `Best Score: ${stats.bestScore}%\n` +
                `Common Errors: ${stats.commonErrors.map(e => e.type).join(', ') || 'None'}`
            );
        } else {
            alert('No shots recorded in this session yet.');
        }
    }
}

class ShotHistory {
    constructor() {
        this.shots = [];
    }

    addShot(shot) {
        this.shots.push(shot);
    }

    getShots() {
        return this.shots;
    }

    getStats() {
        if (this.shots.length === 0) return null;

        const scores = this.shots.map(s => s.overallScore);
        const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const bestScore = Math.max(...scores);

        const errorCounts = {};
        this.shots.forEach(shot => {
            shot.errors.forEach(error => {
                errorCounts[error.type] = (errorCounts[error.type] || 0) + 1;
            });
        });

        const commonErrors = Object.entries(errorCounts)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        return {
            totalShots: this.shots.length,
            averageScore,
            bestScore,
            commonErrors
        };
    }

    clear() {
        this.shots = [];
    }
}

let app;

window.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing app...');
    app = new OneShotApp();
    await app.initialize();
});

function startSession() {
    if (app) {
        app.startSession();
    }
}

function captureShot() {
    if (app) {
        app.captureShot();
    }
}

function toggleSession() {
    if (app) {
        app.toggleSession();
    }
}

function viewHistory() {
    if (app) {
        app.viewHistory();
    }
}