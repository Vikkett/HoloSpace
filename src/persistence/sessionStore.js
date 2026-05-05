// Create an in-memory storage for all sessions (key = sessionId, value = session object)
const sessions = new Map();


// Function to create a new session object with default values
export function createSession() {

    // Return a fresh session structure
    return {

        // Stores conversation history (user + assistant messages)
        history: [],

        // Stores all created planets in this session
        allPlanets: [],

        // Temporarily stores answers while building a planet (max 5 answers)
        currentPlanetAnswers: [],

        // Stores sky configuration (colors, intensity)
        skyTheme: null,

        // Stores sun color of the universe
        sunColor: null,

        // Overall vibe of the universe (e.g. neutral, chaotic, mystique)
        vibe: "neutral",

        // Energy level of the universe (low, medium, high)
        energy: "medium",

        // Indicates if the universe creation is complete
        isComplete: false
    };
}


// Function to get an existing session OR create a new one if it doesn't exist
export function getOrCreateSession(sessionId) {

    // Check if a session with this ID already exists
    if (!sessions.has(sessionId)) {

        // If not, create a new session and store it in the Map
        sessions.set(sessionId, createSession());
    }

    // Return the existing or newly created session
    return sessions.get(sessionId);
}


// Function to clear ALL sessions (reset memory)
export function resetSessions() {

    // Remove all session data from memory
    sessions.clear();
}