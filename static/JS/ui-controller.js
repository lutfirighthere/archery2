// OneShot.pro UI Controller
// Manages all UI interactions and visual feedback

class UIController {
    constructor() {
        this.isPanelCollapsed = false;
        this.lastStatusUpdate = 0;
        this.speechSynthesis = window.speechSynthesis;
    }

    // Update status bar
    updateStatusBar(message, rightMessage = '') {
        const statusText = document.getElementById('statusText');
        const statusRight = document.getElementById('statusRight');
        
        if (statusText) statusText.textContent = message;
        if (statusRight) statusRight.textContent = rightMessage;
    }

    // Update form panel with checks
    updateFormPanel(evaluation, metrics, userConfig) {
        const container = document.getElementById('checksContainer');
        if (!container) return;

        // Update panel info
        const panelInfo = document.getElementById('panelInfo');
        if (panelInfo) {
            panelInfo.textContent = `H: ${userConfig.height}m | D: ${userConfig.distance}m | ${userConfig.hand.toUpperCase()}`;
        }

        // Create check items
        const checks = [
            { key: 'shoulderLine', eval: evaluation.shoulderLine },
            { key: 'bowElbow', eval: evaluation.bowElbow },
            { key: 'drawAlign', eval: evaluation.drawAlign },
            { key: 'headTilt', eval: evaluation.headTilt },
            { key: 'spineLean', eval: evaluation.spineLean },
            { key: 'anchor', eval: evaluation.anchor }
        ];

        container.innerHTML = checks.map(check => {
            const status = check.eval.pass ? 'pass' : 'fail';
            const metricDisplay = check.eval.unit === 'ratio' 
                ? check.eval.value.toFixed(2)
                : `${check.eval.value}${check.eval.unit}`;

            return `
                <div class="check-item">
                    <div class="check-dot ${status}"></div>
                    <span>${check.eval.name}</span>
                    <span class="metric">${metricDisplay}</span>
                </div>
            `;
        }).join('');
    }

    // Update shot counter
    updateShotCounter(currentShots, maxShots) {
        const shotCount = document.getElementById('shotCount');
        const shotLimit = document.getElementById('shotLimit');
        
        if (shotCount) shotCount.textContent = currentShots;
        if (shotLimit) shotLimit.textContent = maxShots;

        // Disable shot button if limit reached
        const shotButton = document.getElementById('shotButton');
        if (shotButton && currentShots >= maxShots) {
            shotButton.disabled = true;
            shotButton.style.opacity = '0.5';
            shotButton.style.cursor = 'not-allowed';
        }
    }

    // Draw skeleton on canvas
    drawSkeleton(ctx, landmarks, width, height) {
        const ui = CONFIG.ui;
        
        // Draw connections
        ctx.strokeStyle = ui.skeletonColor;
        ctx.lineWidth = ui.skeletonThickness;
        ctx.lineCap = 'round';

        CONFIG.connections.forEach(([startIdx, endIdx]) => {
            const start = landmarks[startIdx];
            const end = landmarks[endIdx];

            if (start.visibility > 0.5 && end.visibility > 0.5) {
                ctx.beginPath();
                ctx.moveTo(start.x * width, start.y * height);
                ctx.lineTo(end.x * width, end.y * height);
                ctx.stroke();
            }
        });

        // Draw joints
        ctx.fillStyle = ui.jointColor;
        landmarks.forEach(landmark => {
            if (landmark.visibility > 0.5) {
                ctx.beginPath();
                ctx.arc(
                    landmark.x * width,
                    landmark.y * height,
                    ui.jointRadius,
                    0,
                    2 * Math.PI
                );
                ctx.fill();
            }
        });
    }

    // Draw anchor circle indicator
    drawAnchorCircle(ctx, wristPoint, mouthPoint, isCorrect) {
        const ui = CONFIG.ui;
        ctx.strokeStyle = isCorrect ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        // Draw line from wrist to mouth
        ctx.beginPath();
        ctx.moveTo(wristPoint.x, wristPoint.y);
        ctx.lineTo(mouthPoint.x, mouthPoint.y);
        ctx.stroke();

        // Draw circle at mouth
        ctx.beginPath();
        ctx.arc(mouthPoint.x, mouthPoint.y, ui.anchorCircleRadius, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.setLineDash([]);
    }

    // Draw bow arm stability indicator
    drawStabilityIndicator(ctx, elbowPoint, isStable) {
        ctx.strokeStyle = isStable ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(elbowPoint.x, elbowPoint.y, 30, 0, 2 * Math.PI);
        ctx.stroke();
    }

    // Speak feedback using text-to-speech
    speakFeedback(message) {
        if (!this.speechSynthesis) return;
        
        // Cancel any ongoing speech
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        this.speechSynthesis.speak(utterance);
    }

    // Show shot summary modal
    showShotModal(shotSummary) {
        const modal = document.getElementById('shotModal');
        const modalBody = document.getElementById('shotModalBody');
        
        if (!modal || !modalBody) return;

        const errorList = shotSummary.errors.length > 0 
            ? shotSummary.errors.map(error => `
                <div class="error-item">
                    <span class="error-severity ${error.severity}">${error.severity.toUpperCase()}</span>
                    <strong>${error.type}:</strong> ${error.description}
                    <span class="error-value">${error.value.toFixed(1)} (target: ${error.threshold})</span>
                </div>
            `).join('')
            : '<p style="color: var(--success);">✓ All form checks passed!</p>';

        modalBody.innerHTML = `
            <div class="shot-summary">
                <div class="score-circle">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(100, 100, 100, 0.2)" stroke-width="8"/>
                        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--accent-blue)" stroke-width="8"
                                stroke-dasharray="${(shotSummary.overallScore / 100) * 339.292} 339.292"
                                transform="rotate(-90 60 60)" stroke-linecap="round"/>
                        <text x="60" y="70" text-anchor="middle" font-size="32" font-weight="bold" fill="var(--text-primary)">
                            ${shotSummary.overallScore}
                        </text>
                    </svg>
                    <p>Form Score</p>
                </div>
                
                <div class="feedback-message">
                    <h3>${shotSummary.feedback.message}</h3>
                    <p>${shotSummary.feedback.detail}</p>
                </div>

                <div class="metrics-grid">
                    <div class="metric-card">
                        <span class="metric-label">Shoulder Level</span>
                        <span class="metric-value">${shotSummary.metrics.shoulderLineDeg}°</span>
                    </div>
                    <div class="metric-card">
                        <span class="metric-label">Bow Elbow</span>
                        <span class="metric-value">${shotSummary.metrics.bowElbowDeg}°</span>
                    </div>
                    <div class="metric-card">
                        <span class="metric-label">Draw Align</span>
                        <span class="metric-value">${shotSummary.metrics.drawAlignDeg}°</span>
                    </div>
                    <div class="metric-card">
                        <span class="metric-label">Head Tilt</span>
                        <span class="metric-value">${shotSummary.metrics.headTiltDeg}°</span>
                    </div>
                </div>

                <div class="errors-section">
                    <h4>Form Analysis</h4>
                    ${errorList}
                </div>

                <div class="timestamp">
                    Shot captured at ${new Date(shotSummary.timestamp).toLocaleTimeString()}
                </div>
            </div>
        `;

        modal.classList.add('active');
    }

    // Toggle form panel collapse
    togglePanel() {
        const panel = document.getElementById('formPanel');
        const toggle = document.querySelector('.panel-toggle');
        
        if (!panel) return;

        this.isPanelCollapsed = !this.isPanelCollapsed;
        panel.classList.toggle('collapsed', this.isPanelCollapsed);
        if (toggle) {
            toggle.classList.toggle('rotated', this.isPanelCollapsed);
        }
    }

    // Show upgrade prompt for free tier users
    showUpgradePrompt() {
        const message = "You've reached your free tier limit (5 shots). Upgrade to Pro for unlimited shots and advanced features!";
        this.updateStatusBar(message);
        
        // Optional: Show modal or toast notification
        if (confirm(message + '\n\nWould you like to learn more about Pro?')) {
            window.location.href = '/pricing'; // Redirect to pricing page
        }
    }

    // Add visual flash effect for shot capture
    flashCapture(canvas) {
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'white';
        overlay.style.opacity = '0.7';
        overlay.style.pointerEvents = 'none';
        overlay.style.transition = 'opacity 0.3s';
        
        canvas.parentElement.appendChild(overlay);
        
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }, 100);
    }
}

// Modal control functions
function closeModal() {
    const modal = document.getElementById('shotModal');
    if (modal) modal.classList.remove('active');
}

function nextShot() {
    closeModal();
    // Focus back on capture button
    const shotButton = document.getElementById('shotButton');
    if (shotButton && !shotButton.disabled) {
        shotButton.focus();
    }
}

function togglePanel() {
    if (window.uiController) {
        window.uiController.togglePanel();
    }
}

function showLogin() {
    alert('Login functionality coming soon!\n\nFor now, enjoy the free tier with 5 shots per session.');
}

function viewHistory() {
    if (window.shotHistory) {
        const stats = window.shotHistory.getStats();
        if (stats) {
            alert(`Session Statistics:\n\n` +
                  `Total Shots: ${stats.totalShots}\n` +
                  `Average Score: ${stats.averageScore}%\n` +
                  `Common Errors: ${stats.commonErrors.map(e => e.type).join(', ') || 'None'}`);
        } else {
            alert('No shots recorded in this session yet.');
        }
    }
}