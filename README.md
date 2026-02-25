# HoloSpace

Carte 3D immersive de ton univers numérique, transforme tes données personnelles (centres d'intérêt, musique, projets) en une galaxie interactive WebGL


IA 
-  Génération d’univers selon de réponse d’user et données personnelles (Humeur a côté pour l’instant)
- Groq, ollama et OpenAI - Ollama a besoin bc de puissance, OPenAI payent et Groq utilise pas puissance d’ordi vu que c’est une API et en plus il permet 30 requête par minute

Frontend : 
- HTML et CSS et pas Vue parce que facile et rapide pour un prototype rapide et vue est mieux pour interface avec bcd des menus 

Backend :
- Node.js et pas d’autres outils parce que j’utilise three.js pour 3D et donc vu qu’il est aussi en js et bien communique ensemble c’est mieux d’avoir node.js comme backend (Tous les tutos Three.js + backend utilisent Node.js/Express) ;  (API Grooq retourne JSON → Node.js le manipule natif, pas de conversion)

3D :
- Three.js est pas Unity WebGL parce que c’est une Bibliothèque la plus utilisée, gratuit, évolutif, pas de licence commerciale

Tests :
- Le dossier .github/workflows/ contient des scripts automatiques qui s'exécutent à chaque fois que tu pousses du code sur GitHub
    * Tu pushes ton code ──► GitHub détecte le fichier ──► Exécute les tests automatiquement    ->  ci.yml
    * Alertes immédiates si erreur 
    * Historique de ce qui a cassé quand 
    * Tests tournent sur serveur Linux propre 
    * Tests automatiques à chaque push 



# Schema du projet et des fichiers

```
holospace/
├── .github/                    ← Configuration GitHub 
│   └── workflows/
│       └── ci.yml              # Tests automatiques à chaque push pour éviter de casser le projet.
│
├── docs/                       ← Documentation et designs
│   └── wireframes/             # Des maquettes Figma exportées 
├── src/                        ← CODE SOURCE PRINCIPAL
│   ├── html                    # FRONTEND 
│   │   ├── index.html          # Page main
│   │   ├── login.html          # Page login
│   │   ├── universe.html       # Page avec universe et IA
│   ├── css/
│   │   |── style.css           # Styles du main page
│   ├── js/
│   │   ├── three/                  # Tout ce qui est 3D 
│   │   │   ├── scene.js            # Setup WebGL: caméra, renderer, lumières
│   │   │   ├── galaxy.js           # Génère planètes, étoiles, clusters
│   │   │   └── interactions.js     # Clics, survols, zoom, drag & drop
│   │   └── main.js                 # Point d'entrée, initialise tout
│   │
│   └── server/                 # BACKEND - Node.js + Express
│       ├── server.js           # démarre le serveur
│       ├── routes/
│       │   └── auth.js         # Connexion/inscription
│       ├── models/
│       │   ├── User.js         # Classe/modèle Utilisateur
│       │   ├── Planet.js       # Modèle Planète
│       │   └── Star.js         # Modèle Étoile/Élément
│       └── config/
│           └── database.js     # Connexion MySQL
│
├── database/
│   └── schema.sql              # Création des tables MySQL
│
├── tests/                      # Tests
│   ├── client.test.js
│   └── server.test.js
│
├── .gitignore                  # Fichiers à ignorer par Git (node_modules, .env)
├── package.json                # Dépendances npm + scripts (start, build, dev)
└── README.md                   # Fichier avec des explications de projet
```


---

## Démarrage Rapide

### Prérequis
- Node.js v18+
- MySQL (Workbench)

### Installation

```bash
# 1. Cloner le repo
git clone https://github.com/Vikkett/HoloSpace
cd holospace

# 2. Installer les dépendances
npm install

# 3. Créer la base de données

# 4. Configurer l'environnement

# Éditer .env avec tes credentials MySQL

# 5. Lancer en mode développement
npm run dev
