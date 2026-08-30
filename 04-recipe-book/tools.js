// These helper functions fetch the current valid values from MongoDB.
// From the system prompt (e.g. ${JSON.stringify(allTags)})
// so Gemini knows the full universe of valid values to choose from.

async function getAllTags(db) {
    const tags = await db.collection('tags').distinct('name');
    return tags;
}

async function getAllCuisines(db) {
    const cuisines = await db.collection('cuisines').distinct('name');
    return cuisines;
}

async function getAllIngredients(db) {
    const ingredients = await db.collection('recipes').distinct('ingredients.name');
    return ingredients;
}

// This is the response schema for Gemini's structured output mode.
// It tells Gemini the exact JSON shape to return when converting
// a natural language search query into filter criteria.
// No description, Gemini gets that context from the system prompt.
const searchQuerySchema = {
    type: "object",
    properties: {
        cuisines: {
            type: "array",
            items: { type: "string" }
        },
        tags: {
            type: "array",
            items: { type: "string" }
        },
        ingredients: {
            type: "array",
            items: { type: "string" }
        }
    },
    required: ["cuisines", "tags", "ingredients"]
};

module.exports = {
    getAllTags,
    getAllCuisines,
    getAllIngredients,
    searchQuerySchema
};