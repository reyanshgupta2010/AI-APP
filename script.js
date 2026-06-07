const ingredients = [];

const pantryBasics = ["salt", "pepper", "oil", "water"];
const ingredientInput = document.getElementById("ingredientInput");
const addIngredientBtn = document.getElementById("addIngredientBtn");
const clearBtn = document.getElementById("clearBtn");
const ingredientsList = document.getElementById("ingredientsList");
const generateBtn = document.getElementById("generateBtn");
const recipeSection = document.getElementById("recipeSection");
const emptyState = document.getElementById("emptyState");
const recipeContent = document.getElementById("recipeContent");
const stepsSection = document.getElementById("stepsSection");
const stepsList = document.getElementById("stepsList");
const loadingSpinner = document.getElementById("loadingSpinner");
const errorMessage = document.getElementById("errorMessage");
const progressText = document.getElementById("progressText");

const recipeStyles = {
    vegetarian: {
        title: "Garden Skillet",
        method: "saute into a bright, satisfying skillet meal",
        sauce: "lemon, cracked pepper, and a spoon of yogurt or chutney",
        avoid: ["chicken", "fish", "beef", "pork", "mutton"],
        fallback: "paneer or mushrooms"
    },
    vegan: {
        title: "Plant-Powered Toss",
        method: "pan-roast into a hearty plant-based bowl",
        sauce: "lime, toasted spices, and a splash of coconut milk or olive oil",
        avoid: ["chicken", "fish", "egg", "eggs", "paneer", "cheese", "milk", "yogurt", "beef", "pork"],
        fallback: "tofu or chickpeas"
    },
    "gluten-free": {
        title: "No-Wheat Comfort Bowl",
        method: "simmer into a naturally gluten-free bowl",
        sauce: "herbs, lemon, and warm spices",
        avoid: ["bread", "pasta", "noodles", "wheat", "roti"],
        fallback: "rice or potatoes"
    },
    "high-protein": {
        title: "Protein Plate",
        method: "sear and fold into a filling protein-forward plate",
        sauce: "garlic, chili, and a cooling yogurt-style finish",
        avoid: [],
        fallback: "eggs, paneer, tofu, or beans"
    },
    flexible: {
        title: "Fridge Rescue",
        method: "transform into a balanced one-pan dinner",
        sauce: "garlic, lemon, herbs, and a little heat",
        avoid: [],
        fallback: "your main ingredient"
    }
};

const skillNotes = {
    beginner: "Keep the heat medium, taste often, and use one pan.",
    intermediate: "Build flavor in layers, then finish with acid for lift.",
    advanced: "Char one ingredient deeply, deglaze the pan, and plate with contrast."
};

addIngredientBtn.addEventListener("click", addIngredient);
clearBtn.addEventListener("click", clearAll);
generateBtn.addEventListener("click", generateRecipe);
ingredientInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addIngredient();
    }
});

function addIngredient() {
    const value = cleanIngredient(ingredientInput.value);

    if (!value) {
        showError("Add an ingredient first.");
        return;
    }

    if (ingredients.includes(value)) {
        showError("That ingredient is already in the mix.");
        return;
    }

    ingredients.push(value);
    ingredientInput.value = "";
    renderIngredients();
    clearError();
    ingredientInput.focus();
}

function cleanIngredient(value) {
    return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function renderIngredients() {
    ingredientsList.innerHTML = "";

    ingredients.forEach((ingredient, index) => {
        const tag = document.createElement("div");
        tag.className = "ingredient-tag";

        const label = document.createElement("span");
        label.textContent = titleCase(ingredient);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.setAttribute("aria-label", `Remove ${ingredient}`);
        removeButton.textContent = "x";
        removeButton.addEventListener("click", () => {
            ingredients.splice(index, 1);
            renderIngredients();
        });

        tag.append(label, removeButton);
        ingredientsList.appendChild(tag);
    });

    generateBtn.disabled = ingredients.length === 0;
}

function clearAll() {
    ingredients.splice(0, ingredients.length);
    renderIngredients();
    recipeContent.classList.add("hidden");
    stepsSection.classList.add("hidden");
    emptyState.classList.remove("hidden");
    recipeSection.classList.add("empty");
    progressText.textContent = "0 of 0 done";
    clearError();
    ingredientInput.focus();
}

async function generateRecipe() {
    if (ingredients.length === 0) {
        showError("Add at least one ingredient to generate a recipe.");
        return;
    }

    showLoading(true);
    clearError();

    await new Promise((resolve) => setTimeout(resolve, 550));

    const recipe = createRecipe({
        ingredients: [...ingredients],
        prepTime: document.getElementById("prepTimeFilter").value,
        skill: document.getElementById("skillFilter").value,
        diet: document.getElementById("dietaryFilter").value
    });

    displayRecipe(recipe);
    showLoading(false);
}

function createRecipe({ ingredients: selectedIngredients, prepTime, skill, diet }) {
    const style = recipeStyles[diet];
    const incompatibleIngredients = selectedIngredients.filter((ingredient) => style.avoid.includes(ingredient));
    const usableIngredients = selectedIngredients.filter((ingredient) => !style.avoid.includes(ingredient));
    const coreIngredients = usableIngredients.length ? usableIngredients : [style.fallback];
    const hero = coreIngredients[0];
    const supporting = coreIngredients.slice(1, 4);
    const totalTime = Number(prepTime);
    const cookTime = Math.max(10, totalTime - 10);
    const prepMinutes = totalTime - cookTime;
    const recipeName = `${titleCase(hero)} ${style.title}`;
    const pantryLine = pantryBasics.join(", ");

    return {
        name: recipeName,
        description: `A practical ${dietLabel(diet)} recipe that uses ${listWords(coreIngredients)} and pantry basics without turning dinner into a project.`,
        servings: coreIngredients.length > 3 ? 4 : 2,
        prepTime: prepMinutes,
        cookTime,
        difficulty: titleCase(skill),
        ingredients: [
            ...coreIngredients.map((ingredient) => `${titleCase(ingredient)}, prepped as needed`),
            ...incompatibleIngredients.map((ingredient) => `Skip or swap ${titleCase(ingredient)} for a ${dietLabel(diet)} option`),
            `Pantry basics: ${pantryLine}`,
            style.sauce
        ],
        tips: [
            skillNotes[skill],
            `Use ${titleCase(hero)} as the anchor and add the remaining ingredients in order of firmness.`,
            incompatibleIngredients.length
                ? `Diet filter applied: ${listWords(incompatibleIngredients.map(titleCase))} should be skipped or swapped.`
                : diet === "flexible" ? "Add any leftover sauce, pickle, or fresh herbs at the end." : `Keep it ${dietLabel(diet)} by checking sauces and toppings before adding them.`
        ],
        steps: buildSteps(coreIngredients, supporting, style, totalTime)
    };
}

function buildSteps(coreIngredients, supporting, style, totalTime) {
    const hero = titleCase(coreIngredients[0]);
    const extras = supporting.length ? listWords(supporting.map(titleCase)) : "your remaining ingredients";

    return [
        {
            text: `Wash, trim, and cut ${listWords(coreIngredients.map(titleCase))} into bite-size pieces.`,
            note: "Keep firmer vegetables smaller so everything finishes together."
        },
        {
            text: `Warm a wide pan with oil, then add ${hero} and cook until it picks up color.`,
            note: "Color means flavor; stir less than you think."
        },
        {
            text: `Fold in ${extras}, season with salt and pepper, and ${style.method}.`,
            note: `Aim for a total cook time around ${Math.max(10, totalTime - 10)} minutes.`
        },
        {
            text: `Add ${style.sauce}, then loosen with a splash of water if needed.`,
            note: "The sauce should lightly coat, not drown, the ingredients."
        },
        {
            text: "Taste, adjust seasoning, and serve while warm.",
            note: "A final squeeze of lemon or pinch of herbs makes leftovers feel intentional."
        }
    ];
}

function displayRecipe(recipe) {
    emptyState.classList.add("hidden");
    loadingSpinner.classList.add("hidden");
    recipeSection.classList.remove("empty");
    recipeContent.classList.remove("hidden");
    stepsSection.classList.remove("hidden");

    recipeContent.innerHTML = `
        <div class="recipe-hero">
            <div>
                <p class="eyebrow">Generated recipe</p>
                <h2 class="recipe-title">${escapeHtml(recipe.name)}</h2>
                <p class="recipe-description">${escapeHtml(recipe.description)}</p>
            </div>
            <div class="recipe-meta">
                ${metaItem("Serves", recipe.servings)}
                ${metaItem("Prep", `${recipe.prepTime} min`)}
                ${metaItem("Cook", `${recipe.cookTime} min`)}
                ${metaItem("Skill", recipe.difficulty)}
            </div>
        </div>

        <div class="recipe-columns">
            <div class="recipe-block">
                <h3>Ingredients</h3>
                <ul>${recipe.ingredients.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
            <div class="recipe-block">
                <h3>Alchemist notes</h3>
                <ul>${recipe.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>
            </div>
        </div>
    `;

    displaySteps(recipe.steps);
    recipeSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function metaItem(label, value) {
    return `
        <div class="meta-item">
            <span class="meta-label">${escapeHtml(label)}</span>
            <span class="meta-value">${escapeHtml(String(value))}</span>
        </div>
    `;
}

function displaySteps(steps) {
    stepsList.innerHTML = "";

    steps.forEach((step, index) => {
        const item = document.createElement("label");
        item.className = "step-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "step-checkbox";
        checkbox.addEventListener("change", updateProgress);

        const content = document.createElement("div");
        const text = document.createElement("p");
        text.className = "step-text";
        text.textContent = `${index + 1}. ${step.text}`;

        const note = document.createElement("p");
        note.className = "step-note";
        note.textContent = step.note;

        content.append(text, note);
        item.append(checkbox, content);
        stepsList.appendChild(item);
    });

    updateProgress();
}

function updateProgress() {
    const checkboxes = [...stepsList.querySelectorAll(".step-checkbox")];
    const completed = checkboxes.filter((checkbox) => checkbox.checked).length;

    checkboxes.forEach((checkbox) => {
        checkbox.closest(".step-item").classList.toggle("completed", checkbox.checked);
    });

    progressText.textContent = `${completed} of ${checkboxes.length} done`;
}

function showLoading(show) {
    generateBtn.disabled = show || ingredients.length === 0;

    if (show) {
        emptyState.classList.add("hidden");
        recipeContent.classList.add("hidden");
        stepsSection.classList.add("hidden");
        loadingSpinner.classList.remove("hidden");
    } else {
        loadingSpinner.classList.add("hidden");
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add("active");
}

function clearError() {
    errorMessage.textContent = "";
    errorMessage.classList.remove("active");
}

function titleCase(value) {
    return value
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function dietLabel(diet) {
    return diet === "flexible" ? "flexible" : diet.replace("-", " ");
}

function listWords(items) {
    if (items.length <= 1) {
        return items[0] || "your ingredients";
    }

    if (items.length === 2) {
        return `${items[0]} and ${items[1]}`;
    }

    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };
        return entities[character];
    });
}

renderIngredients();
