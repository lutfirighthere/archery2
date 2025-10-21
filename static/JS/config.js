// OneShot.pro Configuration
// Form analysis thresholds and constants (matches Python config.py)

const CONFIG = {
    // Camera Settings
    camera: {
        width: 1280,
        height: 720,
        facingMode: 'user'
    },

    // Pose Detection (matches Python POSE_CONFIDENCE and settings)
    pose: {
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.3,
        minTrackingConfidence: 0.3
    },

    // Form Analysis Thresholds (matches Python config.py exactly)
    thresholds: {
        shoulderLine: {
            max: 10.0,
            unit: '°',
            name: 'Shoulder Level',
            description: 'Keep shoulders level'
        },
        bowElbow: {
            target: 175.0,
            tolerance: 15.0,
            unit: '°',
            name: 'Bow Arm Extension',
            description: 'Straighten bow elbow'
        },
        drawAlign: {
            max: 15.0,
            unit: '°',
            name: 'Draw Alignment',
            description: 'Align draw elbow with string'
        },
        headTilt: {
            max: 12.0,
            unit: '°',
            name: 'Head Position',
            description: 'Keep head level'
        },
        spineLean: {
            max: 12.0,
            unit: '°',
            name: 'Spine Alignment',
            description: 'Stand tall, reduce lean'
        },
        anchorRatio: {
            max: 0.25,
            unit: 'ratio',
            name: 'Anchor Point',
            description: 'Anchor to mouth corner'
        }
    },

    // Tier Limits
    tiers: {
        free: {
            maxShots: 5,
            features: ['basic_feedback', 'form_analysis'],
            name: 'Free'
        },
        pro: {
            maxShots: Infinity,
            features: ['basic_feedback', 'form_analysis', 'biosensors', 'advanced_analytics', 'unlimited_shots'],
            name: 'Pro',
            price: 20
        },
        club: {
            maxShots: Infinity,
            features: ['all_pro', 'multi_user', 'coach_tools', 'team_dashboard'],
            name: 'Club',
            setupFee: 150,
            monthlyFee: 25
        }
    },

    // UI Settings (matches Python styling)
    ui: {
        skeletonColor: 'rgba(165, 180, 210, 0.8)',
        skeletonThickness: 3,
        jointColor: 'rgba(190, 205, 230, 0.9)',
        jointRadius: 5,
        anchorCircleColor: 'rgba(59, 130, 246, 0.6)',
        anchorCircleRadius: 20,
        statusUpdateInterval: 100, // ms
        feedbackDelay: 200 // ms before showing feedback
    },

    // Pose Landmark Indices (MediaPipe Pose - matches Python)
    landmarks: {
        NOSE: 0,
        LEFT_EYE_INNER: 1,
        LEFT_EYE: 2,
        LEFT_EYE_OUTER: 3,
        RIGHT_EYE_INNER: 4,
        RIGHT_EYE: 5,
        RIGHT_EYE_OUTER: 6,
        LEFT_EAR: 7,
        RIGHT_EAR: 8,
        MOUTH_LEFT: 9,
        MOUTH_RIGHT: 10,
        LEFT_SHOULDER: 11,
        RIGHT_SHOULDER: 12,
        LEFT_ELBOW: 13,
        RIGHT_ELBOW: 14,
        LEFT_WRIST: 15,
        RIGHT_WRIST: 16,
        LEFT_PINKY: 17,
        RIGHT_PINKY: 18,
        LEFT_INDEX: 19,
        RIGHT_INDEX: 20,
        LEFT_THUMB: 21,
        RIGHT_THUMB: 22,
        LEFT_HIP: 23,
        RIGHT_HIP: 24,
        LEFT_KNEE: 25,
        RIGHT_KNEE: 26,
        LEFT_ANKLE: 27,
        RIGHT_ANKLE: 28,
        LEFT_HEEL: 29,
        RIGHT_HEEL: 30,
        LEFT_FOOT_INDEX: 31,
        RIGHT_FOOT_INDEX: 32
    },

    // Skeleton Connections (matches Python mp_pose.POSE_CONNECTIONS)
    connections: [
        [11, 12], // shoulders
        [11, 13], [13, 15], // left arm
        [12, 14], [14, 16], // right arm
        [11, 23], [12, 24], // torso
        [23, 24], // hips
        [23, 25], [25, 27], // left leg
        [24, 26], [26, 28]  // right leg
    ],

    // Audio Feedback (Text-to-Speech messages - matches Python)
    audioFeedback: {
        shoulderLine: "Level your shoulders",
        bowElbow: "Straighten your bow arm",
        drawAlign: "Align your draw elbow",
        headTilt: "Keep your head level",
        spineLean: "Stand up straight",
        anchorRatio: "Anchor to your mouth corner",
        goodForm: "Good form",
        poseNotDetected: "Position yourself in frame"
    },

    // Session Settings
    session: {
        autoSaveInterval: 30000, // 30 seconds
        maxSessionDuration: 3600000, // 1 hour
        shotCooldown: 2000 // 2 seconds between shots
    },

    // API Endpoints (for future backend integration)
    api: {
        baseUrl: '/api/v1',
        endpoints: {
            sessions: '/sessions',
            shots: '/shots',
            users: '/users',
            coaches: '/coaches',
            clubs: '/clubs',
            analytics: '/analytics'
        }
    },

    // Storage Keys
    storage: {
        userProfile: 'oneshot_user_profile',
        sessionData: 'oneshot_session_data',
        settings: 'oneshot_settings',
        shotHistory: 'oneshot_shot_history'
    }
};

// Utility Functions (matches Python utils.py geometry functions)
const Utils = {
    // Calculate angle between three points (matches Python _angle_deg)
    calculateAngle(a, b, c) {
        const BA = {x: a.x - b.x, y: a.y - b.y};
        const BC = {x: c.x - b.x, y: c.y - b.y};
        
        const dotProduct = BA.x * BC.x + BA.y * BC.y;
        const magBA = Math.sqrt(BA.x * BA.x + BA.y * BA.y);
        const magBC = Math.sqrt(BC.x * BC.x + BC.y * BC.y);
        
        if (magBA === 0 || magBC === 0) return NaN;
        
        const cosAngle = Math.max(-1, Math.min(1, dotProduct / (magBA * magBC)));
        return Math.abs(Math.acos(cosAngle) * 180 / Math.PI);
    },

    // Calculate line angle to horizontal (matches Python _line_angle_deg)
    calculateLineAngle(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        // Note: in images, y increases downward, so negate dy
        return Math.abs(Math.atan2(-dy, dx) * 180.0 / Math.PI);
    },

    // Calculate distance between two points (matches Python _dist)
    calculateDistance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    },

    // Get midpoint (matches Python _midpoint)
    getMidpoint(p1, p2) {
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        };
    },

    // Format timestamp
    formatTimestamp(date) {
        return new Date(date).toLocaleString();
    },

    // Format duration
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    // Generate UUID
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, Utils };
}