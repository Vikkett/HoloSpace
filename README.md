# HoloSpace

## Description

HoloSpace is an immersive web application that transforms personal data into an interactive 3D galaxy. The application utilizes AI (Groq API) to analyze user responses and automatically generate a unique visual universe composed of planets and stars.

## Getting Started

### Prerequisites

| Dependency | Version | Usage |
|------------|---------|-------------|
| Node.js    | v18+    | JavaScript backend runtime |
| MySQL      | 8.0+    | User and universe database |
| npm        | 9+      | Package manager |
| VS Code    | 1.95.3  | Development IDE |
| Navigateur | Chrome/Safari | WebGL 2.0 required|

### Configuration

#### MySQL database

```bash
# Create the database
mysql -u root -p < database/schema.sql
```

### Deployment

#### 1. Installation of dependencies
#### Dev environment
```bash
# Clone the repository
git clone https://github.com/Vikkett/HoloSpace.git
cd holospace

# Install packages
npm install

# Build and Launch

# Development Mode
npm run dev

# Backend Mode 
node server.js

# Run Tests
npm test
# Unit Tests (Jest)
git add .
git commit -m "added feature"
git push origin feature/prototype   # <-- GitHub launches tests AUTOMATICALLY
```

#### 2. Integration environment
```bash
# Build for production
npm run build
```

### Directory Structure 
```
holospace/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD - auto-tests on every push         
│  
├── server
│   └── server.mjs              # backend file
├── src/
│   ├──html                     
│   │  └──index.html            # Home / Landing page
│   │
│   └── css/
│       ├── style.css           # Main page styles
│       └── login.css           # Login window styles
│
├── tests
│   └── basic.test.js           # Test scripts
├── .gitignore                  # Git exclusions (node_modules, .env, dist)
├── package.json                # npm dependencies and scripts
└── README.md                   # This file
```
## Collaboration

#### Proposing a new feature
```bash 
# 1. Issue: Open an issue on GitHub describing the feature.
# 2. Discussion: Wait for validation or feedback.
# 3. Pull Request: Create a branch feature/feature-name and submit.
```

### Git Workflow

```bash
# Main Branch
main        # Stable code, deployable

# Development Branch
develop     # Feature integration

# Working Branches
feature/prototype # Prototype development
```

## License
This project is licensed under the MIT License.

## Contact 
Email: varennikvika@gmail.com or via GitHub Issues.
