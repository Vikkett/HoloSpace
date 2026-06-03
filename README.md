# HoloSpace

> Transformez votre essence en galaxie — Transform your emotions into an immersive 3D universe.

HoloSpace is an interactive web application that transforms emotional states described in natural language into personalized 3D universes generated in real time. Authenticated users describe their mood and visual style, then converse with an AI (Groq) that guides the creation of each planet through a structured dialogue. The scene is rendered entirely in the browser using Three.js with no installation required.

A demo mode is available without an account, featuring an animated solar system with all 8 planets.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend runtime | Vite | 7.x |
| 3D rendering | Three.js | 0.184.0 |
| CSS processing | PostCSS | 8.5.12 |
| Backend runtime | Node.js + Express | 24.12.0 |
| AI engine | Groq SDK (llama-3.3-70b-versatile) | 1.1.2 |
| Authentication | Google OAuth 2.0 + JWT | — |
| Package manager | npm | 9+ |
| Browser | Chrome / Firefox / Safari / Edge (WebGL 2.0) | — |

---

## Prerequisites

Before installing, make sure you have:

- [Node.js v18+](https://nodejs.org/en/download) with npm 9+
- [VS Code 1.95+](https://code.visualstudio.com/download) (recommended)
- A [Groq account](https://console.groq.com) to generate an API key
- A [Google Cloud project](https://console.cloud.google.com) with OAuth 2.0 configured

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Vikkett/HoloSpace.git
cd HoloSpace
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `server/` folder:

```
GROQ_API_KEY=your_groq_key_here
JWT_SECRET=a_long_random_secret_string
GOOGLE_CLIENT_ID=your_google_client_id_here
```

Where to find these values:
- **GROQ_API_KEY** — [console.groq.com](https://console.groq.com) → API Keys → Create new key
- **JWT_SECRET** — any long random string (e.g. `holospace_secret_2026_xyz`)
- **GOOGLE_CLIENT_ID** — Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID (Web application). Add `http://localhost:5173` as an authorized origin.

### 4. Start the backend

```bash
cd server
node server.mjs
# Server running on http://localhost:3000
```

### 5. Start the frontend

```bash
# From the project root
npm run dev
# http://localhost:5173
```

---

## Available Scripts

```bash
npm run dev      # Start Vite dev server (frontend, port 5173)
npm run build    # Build for production → dist/
npm test         # Run Jest unit and integration tests
node server/server.mjs   # Start Express backend (port 3000)
```

---

## Directory Structure

```
holospace/
├── .github/
│   └── workflows/
│       └── ci.yml
├── server/
│   ├── app.mjs                      # Express app, routes, AI logic, session management
│   └── server.mjs                   # Entry point — starts server on port 3000
├── src/
│   ├── css/
│   │   ├── style.css
│   │   ├── login.css
│   │   ├── ai-universe.css
│   │   └── universe.css
│   ├── js/
│   │   ├── ai-universe-domain.js        # Business logic (no DOM, no Three.js)
│   │   ├── ai-universe-persistance.js   # Three.js scene state
│   │   ├── ai-universe-presentation.js  # UI interactions and DOM
│   │   ├── index-domain.js              # Auth logic
│   │   ├── index-persistance.js         # Local storage layer
│   │   └── universe.js                  # Solar system demo (Three.js)
│   ├── index.html                   # Landing page
│   ├── ai-universe.html             # AI universe creation page
│   └── universe.html                # Demo mode (no account required)
├── tests/
│   ├── basic.test.js
│   ├── frontend.test.js
│   ├── ai-universe.test.js
│   └── server.test.js
├── .gitignore
├── babel.config.js
├── jest.config.js
├── jest.setup.js
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

## Architecture

HoloSpace uses a **three-layer frontend architecture**:

- **Domain** (`-domain.js`) — pure business logic, no DOM access
- **Persistance** (`-persistance.js`) — state and storage management
- **Presentation** (`-presentation.js`) — UI, DOM interactions, event handlers

The backend is a single Express server (`app.mjs`) with in-memory session management (`Map`). Each session stores the conversation history, planet answers, environment state, and user preferences. The Groq AI receives the full session state in every system prompt and has access to six tools:

`createPlanet` · `updatePlanetColor` · `changeSky` · `changeSun` · `setVibe` · `completeUniverse`

A **Hard Guard** on the server blocks `createPlanet` calls until exactly 5 answers have been collected for the current planet, regardless of what the AI model decides.

---

## How It Works

1. User logs in via Google OAuth and fills in a **vibe** (free text) and **visual style** (Mystique, Realistic, Neon, Abstract, Low-Poly)
2. The AI opens a guided conversation and asks **5 questions per planet**: name, color, atmosphere, element, and secret trait
3. Once 5 answers are collected, the Hard Guard lifts and the server calls `createPlanet`
4. Three.js instantly renders the planet in the 3D scene with its colors, rings, and orbit
5. The sky, nebula, and ambient light update automatically to match the overall vibe
6. The user can add more planets, modify the environment via chat, or re-open the customization form at any time

---

## Known Limitations

- Session data is stored **in memory** (Node.js `Map`) and is lost on server restart — database persistence is not yet implemented
- After login, authenticated users are not automatically redirected to their universe (modal re-opens instead)
- Universe preferences are not persisted between visits — the setup form reappears on each reload
- Audio ambiance toggle is implemented in the UI but non-functional (no audio files included)

---

## Contribution

1. Open an [issue](https://github.com/Vikkett/HoloSpace/issues) describing the bug or feature
2. Wait for feedback or validation
3. Create a branch `feature/feature-name` and submit a Pull Request against `develop`

```
main       # Stable, deployable code
develop    # Feature integration branch
```

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Contact

Viktoriia Varennyk — varennikvika@gmail.com  
Supervisor: Nicolas Glassey — EPCL Sainte-Croix, 2026  
Issues: [github.com/Vikkett/HoloSpace/issues](https://github.com/Vikkett/HoloSpace/issues)