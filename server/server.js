require('dotenv').config();
console.log(`Load API Key: ${process.env.OPENAI_API_KEY}`);
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// SSE Endpoint
app.post("/recipe", async (req, res) => {

  const { ingredients, mealType, cuisine, cookingTime, complexity } = req.body;

  console.log("Received request with parameters:", req.body);

  const prompt = [
    "Generate a recipe that incorporates the following details:",
    `[Ingredients: ${ingredients}]`,
    `[Meal Type: ${mealType}]`,
    `[Cuisine Preference: ${cuisine}]`,
    `[Cooking Time: ${cookingTime}]`,
    `[Complexity: ${complexity}]`,
    "Please provide a detailed recipe, including steps for preparation and cooking. Only use the ingredients provided. If extra items are needed, please mention them.",
    "The recipe should highlight the fresh and vibrant flavors of the ingredients.",
    "Also give the recipe a suitable name in its local language based on cuisine preference.",
  ].join(" ");

  const messages = [{ role: "system", content: prompt }];

  try
  {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const openai = new OpenAI();
    const aiModel = "gpt-3.5-turbo";

    const completion = await openai.chat.completions.create({
        model: aiModel,
        messages: messages,
        temperature: 1,
    });

    console.log("OpenAI API response:", JSON.stringify(completion, null, 2)); // Log the entire response
    
    const choices = completion.choices;

    if (!choices || choices.length === 0) {
      throw new Error("No choices returned from OpenAI API.");
    }

    const messageContent = choices[0].message.content;
    if (!messageContent) {
      throw new Error("No content returned from OpenAI API.");
    }

    res.json({ recipe: messageContent });
  }
  catch (error) {
    console.error("Error fetching data from OpenAI API:", error);
    res.status(500).json({ error: "Failed to generate recipe" }); // Send error response
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});