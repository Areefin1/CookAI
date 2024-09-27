import React, { useState } from "react";
import "./App.css";

const RecipeCard = ({ onSubmit }) => {
  const [ingredientsInput, setIngredientsInput] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [mealType, setMealType] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [complexity, setComplexity] = useState("");

  const handleAddIngredient = (e) => {
    e.preventDefault();
    if(ingredientsInput.trim())
    {
      setIngredients([...ingredients, ingredientsInput.trim()]);
      setIngredientsInput("");
    }
  };

  const handleRemoveIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  const handleSubmit = () => {
    const recipeData = {
      ingredients: ingredients.join(", "),
      mealType,
      cuisine,
      cookingTime,
      complexity,
    };
    onSubmit(recipeData);

    setIngredients([]);
    setMealType("");
    setCuisine("");
    setCookingTime("");
    setComplexity("");
  };

  return (
    <div className="w-[400px] border rounded-lg overflow-hidden shadow-lg">
      <div className="px-6 py-4 bg-white">
        <div className="font-bold text-xl mb-2">CookAI Recipe Generator</div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="ingredients"
          >
            Ingredients
          </label>
          {/* Input to add a new ingredient */}
          <div className="bg-slate-800 p-4 rounded-lg">
            <form className="grid grid-cols-6 items-center text-black" onSubmit={handleAddIngredient}>
              <input className="col-span-5 p-2 border" type="text" placeholder="Enter Ingredient" value={ingredientsInput} onChange={(e) => setIngredientsInput(e.target.value)}/>
              <button className="text-white bg-slate-950 hover:bg-slate-900 p-2 text-xl" type="submit">+</button>
            </form>
            {/* Display list of ingredients */}
            <ul>
             {ingredients.map((item, index) =>(
                <li key={index} className="my-4 w-full flex justify-between bg-slate-950 text-white">
                  <div className="p-4 w-full flex justify-between">
                    <span className="capitalize">{item}</span>
                  </div>
                  <button className="ml-8 p-4 border-l-2 border-slate-900 hover:bg-slate-900 w-16" type="button" onClick={() => handleRemoveIngredient(index)}>X</button>
                </li>
             ))} 
            </ul>
          </div>
        </div> 
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="mealType"
          >
            Meal Type
          </label>
          <select
            className="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
            id="mealType"
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
          >
            <option value="" disabled hidden>Select Meal Type</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snack">Snack</option>
          </select>
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="cuisine"
          >
            Cuisine Preference
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="cuisine"
            type="text"
            placeholder="e.g., Italian, Mexican, French"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="cookingTime"
          >
            Cooking Time
          </label>
          <select
            className="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
            id="cookingTime"
            value={cookingTime}
            onChange={(e) => setCookingTime(e.target.value)}
          >
            <option value="" disabled hidden>Select Cooking Time Range</option>
            <option value="Less than 30 minutes">Less than 30 minutes</option>
            <option value="30-60 minutes">30-60 minutes</option>
            <option value="More than 1 hour">More than 1 hour</option>
          </select>
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="complexity"
          >
            Complexity
          </label>
          <select
            className="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
            id="complexity"
            value={complexity}
            onChange={(e) => setComplexity(e.target.value)}
          >
            <option value="" disabled hidden>Select Complexity</option>
            <option value="Beginner">Beginner-friendly</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
        <div className="px-6 py-4">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={handleSubmit}
          >
            Generate Recipe
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [recipeText, setRecipeText] = useState("");
  const [loading, setLoading] = useState(false); // State for loading indicator

  async function onSubmit(data) {
    // Update state
    setRecipeText("");
    setLoading(true); // Set loading state to true

    // Send the data to the backend
    try {
      const response = await fetch("http://localhost:3001/recipe", {
        method: "POST", // Use POST method
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data), // Send data in JSON format
      });

      // Check if response is ok
      if (!response.ok) {
        throw new Error("Failed to fetch recipe.");
      }

      const result = await response.json(); // Parse the JSON response
      setRecipeText(result.recipe); // Set the recipe text
    } catch (error) {
      console.error("Error fetching recipe:", error);
    } finally {
      setLoading(false); // Set loading state to false
    }
  }
  return (
    <div className="App bg-slate-900 min-h-screen flex items-center justify-center">
      <div className="flex flex-row h-full my-4 gap-2 justify-center">
        <RecipeCard onSubmit={onSubmit} />
        <div className="w-[400px] h-[565px] text-xs text-gray-600 p-4 border rounded-lg shadow-xl whitespace-pre-line overflow-y-auto bg-white">
          {recipeText}
        </div>
      </div>
    </div>
  );
}

export default App;