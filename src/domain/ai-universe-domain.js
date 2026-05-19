// ============================================================
// DOMAIN LAYER — Pure business logic. No DOM, no storage, no Three.js.
// ============================================================

const API_BASE = 'http://localhost:3000';

// ── Constants ────────────────────────────────────────────────

const STYLE_SKY_COLORS = {
    mystique:   { primary: '#4a0080', secondary: '#00d4ff', vibe: 'mystique',  energy: 'medium' },
    realistic:  { primary: '#1a237e', secondary: '#ff6f00', vibe: 'neutral',   energy: 'medium' },
    neon:       { primary: '#ff00ff', secondary: '#39ff14', vibe: 'energetic', energy: 'high'   },
    abstract:   { primary: '#ff1744', secondary: '#00e5ff', vibe: 'chaotic',   energy: 'high'   },
    'low-poly': { primary: '#ffd700', secondary: '#ff4081', vibe: 'energetic', energy: 'high'   }
};

const DEFAULT_PLANETS = [
    { name: 'Etheria',  size: 8,  dist: 100, color: '0x9B59B6', speed: 0.005, hasRings: false, hasClouds: true  },
    { name: 'Cryon',    size: 6,  dist: 180, color: '0x3498DB', speed: 0.003, hasRings: true,  hasClouds: false },
    { name: 'Pyros',    size: 12, dist: 250, color: '0xE74C3C', speed: 0.007, hasRings: false, hasClouds: true  },
    { name: 'Verdania', size: 10, dist: 320, color: '0x2ECC71', speed: 0.004, hasRings: true,  hasClouds: true  },
    { name: 'Astron',   size: 7,  dist: 380, color: '0xF1C40F', speed: 0.006, hasRings: false, hasClouds: false }
];

// ── Session state ─────────────────────────────────────────────

function createSession() {
    return {
        id:             crypto.randomUUID(),
        phase:          'discuss',
        universeSetup:  null,
        sunColorLocked: false,
    };
}

// ── Inference helpers ─────────────────────────────────────────

function inferVibe(vibeText) {
    const text = vibeText.toLowerCase();
    if (text.includes('sombre') || text.includes('dark')  || text.includes('lonely'))  return 'lonely';
    if (text.includes('energ')  || text.includes('chaos') || text.includes('fort'))    return 'energetic';
    if (text.includes('myst')   || text.includes('dream') || text.includes('oni'))     return 'mystique';
    if (text.includes('chaot')  || text.includes('crazy'))                             return 'chaotic';
    return 'neutral';
}

function inferEnergy(vibeText) {
    const text = vibeText.toLowerCase();
    if (text.includes('calme') || text.includes('soft')    || text.includes('doux'))   return 'low';
    if (text.includes('fort')  || text.includes('intense') || text.includes('energ'))  return 'high';
    return 'medium';
}

// ── Planet data helpers ───────────────────────────────────────

/**
 * Normalises a raw planet object from the API into a consistent shape.
 */
function normalisePlanet(raw, index) {
    let colorNum;
    if (typeof raw.color === 'number') {
        colorNum = raw.color;
    } else if (typeof raw.color === 'string' && raw.color.startsWith('0x')) {
        colorNum = parseInt(raw.color, 16);
    } else if (typeof raw.color === 'string') {
        // Handled by the renderer (THREE.Color); pass through as-is
        colorNum = raw.color;
    } else {
        colorNum = 0x4F86F7;
    }

    return {
        name:      raw.name      || `Planete ${index + 1}`,
        size:      parseFloat(raw.size)  || 8,
        dist:      parseFloat(raw.dist)  || 100 + index * 60,
        speed:     parseFloat(raw.speed) || 0.005,
        color:     colorNum,
        hasRings:  raw.hasRings  || false,
        hasClouds: raw.hasClouds || false,
    };
}

/**
 * Pads a planet list to at least 5 entries using defaults.
 */
function fillMissing(existing) {
    const result = [...existing];
    while (result.length < 5) result.push(DEFAULT_PLANETS[result.length]);
    return result.slice(0, 5);
}

/**
 * Validates and normalises the full planet array from the API.
 */
function processPlanets(raw) {
    if (!Array.isArray(raw) || raw.length === 0) return null;
    return raw.map(normalisePlanet);
}

// ── Environment mapping ───────────────────────────────────────

/**
 * Maps an API `environment` object into a canonical params object
 * understood by the renderer's updateEnvironment().
 */
function mapEnvironmentParams(env) {
    return {
        vibe:           env.vibe          || 'neutral',
        mood:           env.vibe          || 'neutral',
        primaryColor:   env.primaryColor  || 0x00d4ff,
        secondaryColor: env.secondaryColor || env.primaryColor || 0x4a0080,
        energy: env.intensity === 'high' ? 'high'
               : env.intensity === 'low' ? 'low'
               : 'medium',
    };
}

/**
 * Strips planet JSON blobs from the bot message text.
 */
function cleanBotMessage(raw) {
    return raw
        .replace(/\{[\s\S]*?"planets"[\s\S]*?\}/g, '')
        .replace(/\[PLANETS_START\].*?\[PLANETS_END\]/gs, '')
        .trim();
}

// ── API calls ─────────────────────────────────────────────────

/**
 * Sends a chat message to the backend.
 * @returns {Promise<object>} raw API response body
 */
async function sendChatMessage(sessionId, userMessage) {
    const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userMessage }),
    });

    if (!response.ok) {
        throw new Error(`Chat request failed: ${response.status}`);
    }

    return response.json();
}

/**
 * Builds the opening message that carries the user's preferences.
 */
function buildSetupMessage(setup) {
    return `Bonjour! Mes préférences: vibe="${setup.vibe}", style="${setup.style}". Lance la création de mon univers.`;
}

/**
 * Builds the preference-update message for the customise flow.
 */
function buildCustomizeMessage(vibe, style) {
    return `[Mise à jour des préférences: vibe="${vibe}", style="${style}"]. Adapte mon univers selon ces nouvelles préférences.`;
}

/**
 * Validates the setup form values.
 * @returns {{ valid: boolean, error?: string }}
 */
function validateSetup(vibe) {
    if (!vibe || !vibe.trim()) {
        return { valid: false, error: "Tu dois décrire ton vibe avant d'entrer." };
    }
    return { valid: true };
}

/**
 * Validates the customise form values.
 */
function validateCustomize(vibe) {
    if (!vibe || !vibe.trim()) {
        return { valid: false, error: 'Tu dois décrire ton vibe.' };
    }
    return { valid: true };
}