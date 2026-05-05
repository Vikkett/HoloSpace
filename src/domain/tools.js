
// This array defines all "functions" the AI is allowed to call
// Each tool acts like an API function the AI can trigger
export const TOOLS = [

    // TOOL 1: Create a new planet in the user's universe
    {
        type: "function",
        function: {

            // Name used by AI when calling this tool
            name: "createPlanet",

            // Description helps the AI understand when to use it
            description: "Create a planet once you have collected all 5 answers from the user for this planet",

            // Defines the expected input format (JSON schema)
            parameters: {
                type: "object",

                // Inputs required from the AI
                properties: {

                    // Name of the planet
                    name: { type: "string", description: "Planet name given by user" },

                    // Color of the planet (string like 'rouge', 'blue')
                    color: { type: "string", description: "Color given by user (e.g. rouge, bleu, violet)" },

                    // Atmosphere description (foggy, volcanic, etc.)
                    atmosphere: { type: "string", description: "Atmosphere or ambiance described by user" },

                    // Element type of the planet (fire, water, etc.)
                    element: { type: "string", description: "Dominant element: fire, water, rock, air, ice, lightning" },

                    // Special trait or unique feature
                    trait: { type: "string", description: "Special trait or unique feature of this planet" }
                },

                // All fields required for this tool to work correctly
                required: ["name", "color", "atmosphere", "element", "trait"]
            }
        }
    },


    // TOOL 2: Change sky appearance (colors, mood of universe sky)
    {
        type: "function",
        function: {

            name: "changeSky",
            description: "Change the sky and star color of the universe",

            parameters: {
                type: "object",
                properties: {

                    // Main sky color
                    primaryColor: { type: "string", description: "Main sky color (e.g. rouge, violet, cyan)" },

                    // Optional secondary color for gradients
                    secondaryColor: { type: "string", description: "Secondary color (optional)" },

                    // Intensity of sky effect
                    intensity: { type: "string", enum: ["low", "medium", "high"] }
                },

                // Only primaryColor is required
                required: ["primaryColor"]
            }
        }
    },


    // TOOL 3: Change the central sun color
    {
        type: "function",
        function: {

            name: "changeSun",
            description: "Change the color of the central sun",

            parameters: {
                type: "object",
                properties: {

                    // Color of the sun
                    color: { type: "string", description: "Sun color (e.g. orange, rouge, blanc, or)" }
                },

                // Color is required
                required: ["color"]
            }
        }
    },


    // TOOL 4: Set emotional tone of the universe
    {
        type: "function",
        function: {

            name: "setVibe",
            description: "Set the overall vibe and energy of the universe",

            parameters: {
                type: "object",
                properties: {

                    // Emotional vibe (mood of universe)
                    vibe: { type: "string", description: "One of: lonely, energetic, mystique, chaotic, neutral" },

                    // Energy level of the universe
                    energy: { type: "string", description: "One of: low, medium, high" }
                },

                // Only vibe is required
                required: ["vibe"]
            }
        }
    },


    // TOOL 5: Finish the universe creation process
    {
        type: "function",
        function: {

            name: "completeUniverse",
            description: "Call this only when all planets are created and sky/sun/vibe have been set",

            parameters: {
                type: "object",

                // No input required
                properties: {},

                // Prevents AI from sending extra unexpected fields
                additionalProperties: false
            }
        }
    }
];