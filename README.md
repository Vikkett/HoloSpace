# HoloSpace

## Description

HoloSpace is an immersive web application that transforms personal data into an interactive 3D galaxy. The application utilizes AI (Gemini API) to analyze user responses and automatically generate a unique visual universe composed of planets and stars.

## Getting Started

### Prerequisites

| Dependency | Version | Usage |
|------------|---------|-------------|
|[Node.js](https://nodejs.org/en/download)   | v18+    | JavaScript backend runtime |
|[MySql](https://www.mysql.com/downloads/)      | 8.0+    | User and universe database |
| npm        | 9+      | Package manager            |
|[VS Code](https://code.visualstudio.com/download)   | 1.95+| Development IDE            |
| Browser    | Chrome/Safari | WebGL 2.0 required   |



### Configuration

### Deployment

#### 1. Installation of dependencies
#### Dev environment

Clone the repository
[GitHub Vikket](https://github.com/Vikkett/HoloSpace) 

```bash
# Install packages
npm install

# Development Mode (Frontend)
npm run dev

# Backend Mode 
cd server
node server.mjs

# Run Tests
npm test
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
│       └── ci.yml                      
│  
├── server
│   └── server.mjs            
├── src/                               
│   ├── css/
│   │   ├── style.css         
│   │   └── login.css         
│   ├── index.html
│   ├── universe.html
│   └── ai-universe.html
│
├── tests
│   └── basic.test.js           
├── .gitignore
├── package-lock.json               
├── package.json             
├── README.md
└── vite.config.js                 
```
## Collaboration

#### Proposing a new feature
 
1. Issue: Open an issue on [GitHub](https://github.com/Vikkett/HoloSpace/issues) describing the feature.
2. Discussion: Wait for validation or feedback.
3. Pull Request: Create a branch feature/feature-name and submit.


### Git Workflow

```bash
# Main Branch
main        # Stable code, deployable

# Development Branch
develop     # Feature integration

```

## License
This project is licensed under the MIT License.

## Contact 
Email: varennikvika@gmail.com or via [GitHub Issues](https://github.com/Vikkett/HoloSpace/issues).
