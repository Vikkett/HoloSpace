# HoloSpace

## Description

HoloSpace est une application web immersive qui transforme les données personnelles en une galaxie 3D interactive. L'application utilise une IA (Groq API) pour analyser les réponses des utilisateurs et générer automatiquement un univers visuel unique composé de planètes et étoiles.


## Getting Started

### Prerequisites

| Dépendance | Version | Utilisation |
|------------|---------|-------------|
| Node.js    | v18+    | Runtime JavaScript backend |
| MySQL      | 8.0+    | Base de données utilisateurs et univers |
| npm        | 9+      | Gestionnaire de packages |
| VS Code    | dernière| IDE de développement |
| Navigateur | Chrome/Safari | WebGL 2.0 requis |

### Configuration

#### Base de données MySQL

```bash
# Créer la base de données
mysql -u root -p &lt; database/schema.sql
```

### Deployment

#### 1. Installation des dépendances
#### Dev environment
```bash
# Cloner le repository
git clone https://github.com/Vikkett/HoloSpace.git
cd holospace

# Installer les packages
npm install

# Build et lancement 
# Mode développement
npm run dev

# lancement de test 
# Tests unitaires (Jest)
git add .
git commit -m "ajout fonctionnalité"
git push origin feature/prototype   # <-- GitHub lance les tests AUTOMATIQUEMENT
```

#### 2. Integration environment
```bash
# Build pour production
npm run build
```

### Directory Structure 
```
holospace/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD GitHub Actions - tests auto à chaque push
├── src/
│   ├── html/                   # Frontend - pages statiques
│   │   ├── index.html          # Page d'accueil / landing
│   │   └── login.html          # Authentification (connexion/inscription)
│   │
│   ├── css/
│   │   ├── style.css           # Styles de page main
│   │   └── login.css           # Styles page login
│
├── .gitignore                  # Exclusions Git (node_modules, .env, dist)
├── package.json                # Dépendances npm et scripts
└── README.md                   # Ce fichier
```
## Collaborate 

#### Proposer une nouvelle fonctionnalité
```bash 
# 1. Issue : Ouvrir une issue sur GitHub décrivant la feauture
# 2. Discussion : Attendre validation ou feedback
# 3. Pull Request : Créer une branche feature/nom-feature et soumettre
```

### Workflow Git 

```bash
# Branche principale
main        # Code stable, déployable

# Branche de développement
develop     # Intégration des features

# Branches de travail
feature/prototype # Prototype
```

## Liscence 
Ce projet est sous licence MIT

## Contact 
Email : varennikvika@gmail.com ou par des issues
