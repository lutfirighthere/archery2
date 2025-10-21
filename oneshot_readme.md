# OneShot.pro - AI Archery Training Platform

**Tagline:** "Train Like You Only Got One Shot."

A comprehensive AI-powered archery training system that provides real-time form analysis, instant feedback, and remote coach oversight using computer vision and machine learning.

## 🎯 Project Overview

OneShot.pro transforms archery training by combining:
- **Real-time pose analysis** using MediaPipe
- **Dual-camera vision** for comprehensive form capture
- **Instant audio/visual feedback** per shot
- **Arrow trajectory tracking** and outcome correlation
- **Biosensor integration** for heart rate, breathing, and tremor analysis
- **Coach oversight tools** for remote training
- **Club management** with team dashboards and leaderboards

## 📁 Project Structure

```
oneshot-pro/
├── frontend/
│   ├── index.html              # Main HTML page
│   ├── styles.css              # Complete stylesheet
│   ├── config.js               # Configuration & constants
│   ├── pose-analyzer.js        # Form analysis engine
│   ├── ui-controller.js        # UI management
│   └── app.js                  # Main application logic
├── backend/
│   └── src/main/java/pro/oneshot/
│       ├── model/              # Entity models
│       │   ├── User.java
│       │   ├── Session.java
│       │   └── Shot.java
│       ├── controller/         # REST controllers
│       │   ├── SessionController.java
│       │   ├── ShotController.java
│       │   ├── AnalyticsController.java
│       │   ├── CoachController.java
│       │   └── ClubController.java
│       ├── service/            # Business logic
│       │   ├── SessionService.java
│       │   ├── ShotService.java
│       │   ├── PoseAnalysisService.java
│       │   └── AnalyticsService.java
│       ├── repository/         # Data access
│       └── dto/                # Data transfer objects
├── ml/
│   └── python/                 # Python ML services
│       ├── pose_estimator.py
│       ├── arrow_tracker.py
│       └── form_analyzer.py
├── docs/
│   ├── api-spec.yaml          # OpenAPI specification
│   └── architecture.md        # System architecture
└── README.md
```

## 🚀 Quick Start

### Frontend Setup

1. **Open index.html** in a modern browser (Chrome, Firefox, Edge)
2. **Allow camera permissions** when prompted
3. **Fill in your profile** (height, draw length, bow type, hand)
4. **Start training session**

### Backend Setup (Java/Spring Boot)

```bash
# Clone repository
git clone https://github.com/yourusername/oneshot-pro.git
cd oneshot-pro/backend

# Build with Maven
mvn clean install

# Run application
mvn spring-boot:run

# Or with Gradle
./gradlew bootRun
```

### Database Setup

```sql
-- PostgreSQL setup
CREATE DATABASE oneshot_pro;

-- Run migrations
flyway migrate
```

## 💰 Pricing Tiers

### Free Tier
- ✅ Camera-only analytics
- ✅ Basic feedback
- ✅ Up to **5 shots per session**
- ✅ Community support
- ❌ No live 1:1 coaching
- ❌ Limited progress history (30 days)

### Pro Tier ($20/month)
- ✅ All Free features
- ✅ **Unlimited shots**
- ✅ Real-time AI coaching
- ✅ Streaks & goals
- ✅ Advanced analytics
- ✅ Biosensor integration
- ✅ Personal recommendations
- ✅ Training plans

### Club Tier ($150 setup + $25/month)
- ✅ All Pro features
- ✅ Hardware package support
- ✅ Multi-user/team dashboard
- ✅ Range/class management
- ✅ Student progress tracking
- ✅ Heatmaps
- ✅ Coach assignment
- ✅ Dedicated support

## 🎓 Key Features

### Real-Time Form Analysis

The system analyzes 6 critical form metrics:

1. **Shoulder Level** (target: ≤ 10°)
2. **Bow Arm Extension** (target: 175° ± 15°)
3. **Draw Alignment** (target: ≤ 15°)
4. **Head Position** (target: ≤ 12°)
5. **Spine Alignment** (target: ≤ 12°)
6. **Anchor Point** (ratio: ≤ 0.25)

### Pose Detection

Uses **MediaPipe Pose** for:
- 33 body landmarks
- Real-time tracking (30+ FPS)
- High accuracy (95%+)
- On-device processing

### Shot Phases

Detects and analyzes:
1. **Draw Start**
2. **Anchor Lock**
3. **Expansion**
4. **Release**
5. **Follow-Through**

## 🔧 Technical Stack

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling (responsive, modern design)
- **Vanilla JavaScript** - Logic
- **MediaPipe Pose** - Pose estimation
- **Canvas API** - Video rendering

### Backend
- **Java 17** - Language
- **Spring Boot 3.x** - Framework
- **Spring Security** - Authentication
- **Spring Data JPA** - Data access
- **PostgreSQL** - Primary database
- **TimescaleDB** - Time-series metrics
- **Redis** - Caching & sessions
- **S3** - Video storage

### ML/AI
- **Python 3.10+** - ML runtime
- **TensorFlow** - Model training
- **MediaPipe** - Pose estimation
- **OpenCV** - Video processing
- **FastAPI** - ML service API

## 📡 API Documentation

### Authentication
```http
POST /api/v1/auth/register
POST /api/v1/auth/login
```

### Sessions
```http
POST   /api/v1/sessions          # Create session
GET    /api/v1/sessions          # List sessions
GET    /api/v1/sessions/{id}     # Get session
PATCH  /api/v1/sessions/{id}/end # End session
```

### Shots
```http
POST /api/v1/shots                      # Record shot
GET  /api/v1/sessions/{id}/shots        # List shots
POST /api/v1/shots/analyze              # Analyze frame
```

### Analytics
```http
GET /api/v1/analytics/progress         # User progress
GET /api/v1/analytics/errors/trends    # Error trends
GET /api/v1/analytics/metrics          # Performance metrics
```

See [api-spec.yaml](docs/api-spec.yaml) for complete API documentation.

## 🎨 UI Components

### Setup Form
- User profile configuration
- Bow specifications
- Experience level selection

### Training View
- Live video feed with pose overlay
- Real-time form panel
- Status bar with feedback
- Shot counter

### Shot Modal
- Detailed analysis
- Score visualization (0-100)
- Error breakdown
- Recommendations

### Analytics Dashboard
- Progress charts
- Error trends
- Session history
- Leaderboard

## 📊 Data Models

### User
```java
{
  id: UUID,
  email: string,
  name: string,
  tier: enum(FREE, PRO, CLUB),
  profile: ArcherProfile,
  createdAt: timestamp
}
```

### Session
```java
{
  id: UUID,
  userId: UUID,
  startTime: timestamp,
  endTime: timestamp,
  shotCount: integer,
  targetDistance: double,
  summary: SessionSummary
}
```

### Shot
```java
{
  id: UUID,
  sessionId: UUID,
  timestamp: timestamp,
  poseMetrics: PoseMetrics,
  errors: FormError[],
  feedback: Feedback,
  score: integer (0-100)
}
```

## 🧪 Testing

### Frontend Testing
```bash
# Open in browser with console
# Check for errors
# Test camera permissions
```

### Backend Testing
```bash
# Run unit tests
mvn test

# Run integration tests
mvn verify

# Test coverage
mvn jacoco:report
```

## 🚢 Deployment

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to CDN/S3
aws s3 sync dist/ s3://oneshot-pro-frontend
```

### Backend Deployment
```bash
# Build Docker image
docker build -t oneshot-pro-api .

# Deploy to cloud
kubectl apply -f k8s/deployment.yaml
```

## 📅 Roadmap

### Phase 1: MVP (Nov 2025)
- ✅ Free tier launch
- ✅ Basic pose analysis
- ✅ Web application
- ✅ 5 shots per session

### Phase 2: Pro Tier (April 2026)
- 🔄 Unlimited shots
- 🔄 Biosensor integration
- 🔄 Advanced analytics
- 🔄 Mobile apps (iOS/Android)

### Phase 3: Club Features (June 2026)
- 🔄 Multi-user dashboards
- 🔄 Coach tools
- 🔄 Team management
- 🔄 Hardware packages

### Phase 4: Expansion (Aug 2026)
- 🔄 Multi-sport support (darts, bowling, javelin)
- 🔄 AR guidance
- 🔄 Coach marketplace
- 🔄 Auto target scoring

## 🎯 Success Metrics

- **D1 Retention:** > 60%
- **D7 Retention:** > 35%
- **Weekly Sessions:** 3+ per active user
- **Form Improvement:** 25% error reduction in 4 weeks
- **Growth Target T1:** 10k Free, 200 Pro, 30 Clubs

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

Copyright © 2025 OneShot.pro. All rights reserved.

## 📧 Contact

- **Support:** support@oneshot.pro
- **Sales:** sales@oneshot.pro
- **Website:** https://oneshot.pro

## 🙏 Acknowledgments

- MediaPipe team for pose estimation
- Archery community for feedback
- KTSA for partnership

---

**Built with ❤️ for archers, by archers.**