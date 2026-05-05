
// Function that generates the system prompt for the AI model
// This defines the AI's personality, rules, and current session state
export function getSystemPrompt(session) {

    // Return a dynamic prompt string (template literal)
    return `

        // Define the AI identity / role
        Tu es HoloSpace.

        // Show how many planets have been created out of the target (2 total)
        Planètes: ${session.allPlanets.length}/2

        // Show how many answers have been collected for the current planet (5 needed)
        Réponses: ${session.currentPlanetAnswers.length}/5
    `;
}