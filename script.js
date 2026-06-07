// Recipe Alchemist - Main Application

const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your OpenAI or Hugging Face API key
const ingredients = [];

// DOM Elements
const ingredientInput = document.getElementById('ingredientInput');
const addIngredientBtn = document.getElementById('addIngredientBtn');
const ingredientsList = document.getElementById('ingredientsList');
const generateBtn = document.getElementById('generateBtn');
const recipeSection = document.getElementById('recipeSection');
const recipeContent = document.getElementById('recipeContent');
const stepsSection = document.getElementById('stepsSection');
const stepsList = document.getElementById('stepsList');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');

// Event Listeners
addIngredientBtn.addEventListener('click', addIngredient);
ingredientInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addIngredient();
});
generateBtn.addEventListener('click', generateRecipe);

// Add ingredient to list
function addIngredient() {
    const value = ingredientInput.value.trim();
    
    if (!value) {
        showError('Please enter an ingredient');
        return;
    }
    
    if (ingredients.includes(value.toLowerCase())) {
        showError('This ingredient is already added');
        return;
    }
    
    ingredients.push(value.toLowerCase());
    ingredientInput.value = '';
    renderIngredients();
    clearError();
    ingredientInput.focus();
}

// Render ingredients
function renderIngredients() {
    ingredientsList.innerHTML = ingredients.map((ingredient, index) => `
        <div class="ingredient-tag">
            <span>${ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}</span>
            <button onclick="removeIngredient(${index})" title="Remove">×</button>
        </div>
    `).join('');
    
    generateBtn.disabled = ingredients.length === 0;
}

// Remove ingredient
function removeIngredient(index) {
    ingredients.splice(index, 1);
    renderIngredients();
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('active');
    setTimeout(clearError, 3000);
}

// Clear error message
function clearError() {
    errorMessage.classList.remove('active');
}

// Generate recipe using mock data (replace with actual API call)
async function generateRecipe() {
    if (ingredients.length === 0) {
        showError('Please add at least one ingredient');
        return;
    }
    
    // Validate API key
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showError('⚠️ Please configure your API key in script.js to use AI recipe generation. Using example recipe instead.');
        displayMockRecipe();
        return;
    }
    
    showLoading(true);
    clearError();
    
    try {
        const prepTime = document.getElementById('prepTimeFilter').value;
        const skill = document.getElementById('skillFilter').value;
        const dietary = document.getElementById('dietaryFilter').value;
        
        const prompt = buildPrompt(ingredients, prepTime, skill, dietary);
        
        // Call your AI API here
        const recipe = await callRecipeAPI(prompt);
        
        displayRecipe(recipe);
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to generate recipe. Please try again.');
        displayMockRecipe(); // Fallback to mock recipe
    } finally {
        showLoading(false);
    }
}

// Build prompt for AI
function buildPrompt(ingredientList, prepTime, skill, dietary) {
    let prompt = `Create a recipe using these ingredients: ${ingredientList.join(', ')}.\n\n`;
    
    if (prepTime !== 'any') {
        prompt += `Prep time should be ${prepTime} minutes or less.\n`;
    }
    
    if (skill !== 'any') {
        prompt += `Difficulty level: ${skill}.\n`;
    }
    
    if (dietary !== 'none') {
        prompt += `Dietary restriction: ${dietary}.\n`;
    }
    
    prompt += `\nProvide the response in this exact JSON format:
    {
        "name": "Recipe Name",
        "servings": "number",
        "prepTime": "minutes",
        "cookTime": "minutes",
        "difficulty": "beginner|intermediate|advanced",
        "description": "brief description",
        "ingredients": ["ingredient 1", "ingredient 2"],
        "steps": ["step 1", "step 2"],
        "tips": ["tip 1", "tip 2"]
    }`;
    
    return prompt;
}

// Call Recipe API (OpenAI or Hugging Face)
async function callRecipeAPI(prompt) {
    // Example using OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional chef and recipe creator. Respond only with valid JSON.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        })
    });
    
    if (!response.ok) {
        throw new Error('API request failed');
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Invalid response format');
    }
    
    return JSON.parse(jsonMatch[0]);
}

// Display mock recipe for demo
function displayMockRecipe() {
    const mockRecipe = {
        name: `Pan-Seared ${ingredients[0] || 'Dish'} Delight`,
        servings: 4,
        prepTime: 15,
        cookTime: 20,
        difficulty: 'intermediate',
        description: 'A delicious quick recipe using your available ingredients. This is a demo recipe - configure your API key for real AI-generated recipes!',
        ingredients: [
            `2 portions of ${ingredients[0] || 'main ingredient'}`,
            ...ingredients.slice(1).map(ing => `Fresh ${ing} to taste`),
            'Salt and pepper',
            'Olive oil',
            'Garlic'
        ],
        steps: [
            `Prepare your ${ingredients[0] || 'ingredients'} by cleaning and cutting into appropriate sizes`,
            'Heat olive oil in a large pan over medium-high heat',
            `Add the ${ingredients[0] || 'main ingredient'} and sear until golden brown (3-4 minutes per side)`,
            `Add remaining ingredients: ${ingredients.slice(1).join(', ')} and cook until tender`,
            'Season with salt and pepper to taste',
            'Serve hot and enjoy!'
        ],
        tips: [
            'Don\'t overcrowd the pan - cook in batches if needed',
            'Taste as you go and adjust seasonings',
            'Let ingredients rest for 2 minutes before serving for better flavor'
        ]
    };
    
    displayRecipe(mockRecipe);
}

// Display recipe
function displayRecipe(recipe) {
    recipeSection.classList.remove('hidden');
    recipeSection.classList.add('active');
    
    const recipeHTML = `
        <div class="recipe-header">
            <h2 class="recipe-title">${recipe.name}</h2>
            <p>${recipe.description}</p>
            <div class="recipe-meta">
                <div class="meta-item">👥 <span>${recipe.servings} servings</span></div>
                <div class="meta-item">⏱️ <span>${recipe.prepTime} min prep</span></div>
                <div class="meta-item">🔥 <span>${recipe.cookTime} min cook</span></div>
                <div class="meta-item">📊 <span class="capitalize">${recipe.difficulty}</span> level</div>
            </div>
        </div>
        
        <div class="recipe-ingredients">
            <h4>Ingredients</h4>
            <ul class="ingredients-list-recipe">
                ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
            </ul>
        </div>
        
        ${recipe.tips ? `
            <div class="recipe-tips" style="margin: 20px 0; padding: 15px; background: rgba(139, 92, 246, 0.1); border-radius: 8px; border-left: 4px solid #8b5cf6;">
                <h4 style="margin-bottom: 10px; color: #8b5cf6;">💡 Chef's Tips</h4>
                <ul style="margin-left: 20px; color: #cbd5e1;">
                    ${recipe.tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    `;
    
    recipeContent.innerHTML = recipeHTML;
    
    // Display steps checklist
    displaySteps(recipe.steps);
    
    // Scroll to recipe
    setTimeout(() => {
        recipeSection.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

// Display cooking steps with checklist
function displaySteps(steps) {
    stepsSection.classList.remove('hidden');
    stepsSection.classList.add('active');
    
    stepsList.innerHTML = steps.map((step, index) => `
        <div class="step-item" data-step="${index}">
            <input 
                type="checkbox" 
                class="step-checkbox" 
                onchange="toggleStep(this, ${index})"
            >
            <div class="step-number">${index + 1}</div>
            <div class="step-content">
                <div class="step-text">${step}</div>
            </div>
        </div>
    `).join('');
}

// Toggle step completion
function toggleStep(checkbox, index) {
    const stepItem = document.querySelector(`[data-step="${index}"]`);
    if (checkbox.checked) {
        stepItem.classList.add('completed');
    } else {
        stepItem.classList.remove('completed');
    }
}

// Show/hide loading spinner
function showLoading(show) {
    if (show) {
        loadingSpinner.classList.remove('hidden');
        loadingSpinner.classList.add('active');
        generateBtn.disabled = true;
    } else {
        loadingSpinner.classList.remove('active');
        loadingSpinner.classList.add('hidden');
        generateBtn.disabled = false;
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    generateBtn.disabled = true;
    console.log('🔮 Recipe Alchemist initialized!');
    console.log('📝 To enable AI recipe generation, add your API key to the script.js file');
});