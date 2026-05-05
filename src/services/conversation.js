
// Import Groq client (AI model API handler)
import { getGroq } from "../persistence/groq.js";

// Import system prompt generator (defines AI personality + rules)
import { getSystemPrompt } from "../domain/prompt.js";

// Import available tool actions (createPlanet, changeSky, etc.)
import { ACTIONS } from "../domain/actions.js";


// Main function that handles the full AI conversation cycle
export async function runConversation(session, userMessage, tools) {

    // If user message exists and is not empty
    if (userMessage?.trim()) {

        // If we are still collecting planet answers (max 5)
        if (session.currentPlanetAnswers.length < 5) {

            // Store the user message as part of planet-building process
            session.currentPlanetAnswers.push(userMessage.trim());
        }
    }


    // Build conversation context for the AI model
    const messages = [

        // System prompt (AI personality + rules + session state)
        { role: "system", content: getSystemPrompt(session) },

        // Last 10 messages from history to keep context short
        ...session.history.slice(-10),

        // Current user message
        { role: "user", content: userMessage }
    ];


    // Call Groq AI model with messages + tools
    const response = await getGroq().chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        tools,
        tool_choice: "auto"
    });


    // Extract AI response message
    const msg = response.choices[0].message;


    // If AI used tools (function calling), execute them
    for (const call of msg.tool_calls || []) {

        // Tool function name (e.g. createPlanet, changeSky)
        const name = call.function.name;

        // Parse arguments sent by AI
        const args = JSON.parse(call.function.arguments || "{}");

        // If tool exists in ACTIONS, execute it
        if (ACTIONS[name]) {
            ACTIONS[name](session, args);
        }
    }


    // Return final response to backend
    return {
        message: msg.content,

        // List of tools used by AI during this turn
        toolsUsed: (msg.tool_calls || []).map(t => t.function.name)
    };
}