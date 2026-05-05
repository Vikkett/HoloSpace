
// Import utility function to convert color names (e.g. "rouge") into numeric values
import { parseColor } from "./color.js";


// Object that contains all AI-triggered actions (function tools)
export const ACTIONS = {

    // Create a new planet in the current session
    createPlanet(session, args) {

        // Determine planet number based on how many already exist
        const planetNum = session.allPlanets.length + 1;

        // Build planet object from AI-provided arguments
        const planet = {

            // Planet name (fallback if AI/user doesn't provide one)
            name: args.name || `Planète ${planetNum}`,

            // Convert color string into numeric format
            color: parseColor(args.color),

            // Atmospheric description (e.g. foggy, volcanic)
            atmosphere: args.atmosphere,

            // Element type (fire, water, air, etc.)
            element: args.element,

            // Special trait or unique feature of the planet
            trait: args.trait
        };

        // Add the new planet to session memory
        session.allPlanets.push(planet);

        // Reset answers for next planet creation cycle
        session.currentPlanetAnswers = [];

        // Return created planet (used by AI tool system)
        return planet;
    },


    // Change sky appearance of the universe
    changeSky(session, args) {

        // Update sky theme in session state
        session.skyTheme = {

            // Main sky color
            primaryColor: parseColor(args.primaryColor),

            // Secondary color or fallback to primary
            secondaryColor: parseColor(args.secondaryColor || args.primaryColor),

            // Intensity level (low, medium, high)
            intensity: args.intensity || "medium"
        };

        // Return updated sky configuration
        return session.skyTheme;
    },


    // Change sun color in the universe
    changeSun(session, args) {

        // Convert and store sun color
        session.sunColor = parseColor(args.color);

        // Return updated sun state
        return { sunColor: session.sunColor };
    },


    // Set emotional tone of the universe
    setVibe(session, args) {

        // Set vibe (e.g. chaotic, neutral, mystical)
        session.vibe = args.vibe;

        // Set energy level (default medium)
        session.energy = args.energy || "medium";

        // Return updated vibe state
        return {
            vibe: session.vibe,
            energy: session.energy
        };
    },


    // Mark the universe creation process as complete
    completeUniverse(session) {

        // Flag session as completed
        session.isComplete = true;

        // Return confirmation
        return { done: true };
    }
};