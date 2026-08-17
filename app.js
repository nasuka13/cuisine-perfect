const SUPABASE_URL = 'VOTRE_SUPABASE_URL';
const SUPABASE_KEY = 'VOTRE_SUPABASE_ANON_KEY';

let supabaseClient = null;
let currentViewingRecipeId = null;

if (window.supabase && SUPABASE_URL !== 'VOTRE_SUPABASE_URL') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

let appData = {
    recipes: [
        { id: 1, title: "Carbonara Originales", category: "Plat", difficulty: "Facile", ingredients: ["Spaghetti", "Pancetta", "Œufs", "Pecorino"], steps: "1. Cuire les pâtes.\n2. Mélanger le tout." },
        { id: 2, title: "Tiramisu Express", category: "Dessert", difficulty: "Facile", ingredients: ["Mascarpone", "Café", "Biscuits", "Œufs"], steps: "1. Monter la crème.\n2. Alterner les couches." }
    ],
    fridge: [{ id: 1, name: "Lait", qty: "1L", expiry: "2026-06-15" }],
    shopping: [{ id: 1, name: "Tomates", qty: "500g", checked: false }],
    planning: [{ id: 1, day: "Lundi", mealType: "Midi", recipeName: "Carbonara Originales" }]
};

// --- PERSISTANCE ---
function loadLocalStorage() {
    const saved = localStorage.getItem('mes_recettes_mobile_data');
    if (saved) { try { appData = JSON.parse(saved); } catch (e) { console.error(e); } }
}

function saveLocalStorage() { localStorage.setItem('mes_recettes_mobile_data', JSON.stringify(appData)); }

// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    loadLocalStorage();
    initEventListeners();
    renderAll();
});

// --- NAVIGATION & UI ---
function switchTab(tabName) {
    ['recettes', 'frigo', 'courses', 'planning', 'stats', 'outils'].forEach(sec => {
        const el = document.getElementById(`section-${sec}`);
        if (el) el.classList.toggle('hidden', sec !== tabName);
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('text-orange-500', btn.dataset.tab === tabName);
        btn.classList.toggle('text-slate-400', btn.dataset.tab !== tabName);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tabName === 'stats') updateStats();
}

function renderAll() { renderRecipes(); renderFridge(); renderShopping(); renderPlanning(); updateStats(); }

// --- RENDU RECETTES AVEC DÉTAILS ---
function renderRecipes(filter = '') {
    const grid = document.getElementById('recipesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const filtered = appData.recipes.filter(r => r.title.toLowerCase().includes(filter.toLowerCase()));

    filtered.forEach(r => {
        const div = document.createElement('div');
        div.className = "bg-slate-800 p-4 rounded-2xl border border-slate-700/60 flex justify-between items-center active:scale-[0.99] transition cursor-pointer";
        div.onclick = () => openRecipeDetailModal(r.id);
        div.innerHTML = `
            <div class="space-y-1">
                <span class="text-[10px] px-2 py-0.5 bg-orange-500/20 text-orange-400 font-semibold rounded-full">${r.category}</span>
                <h3 class="font-bold text-sm text-slate-100">${r.title}</h3>
                <p class="text-xs text-slate-400">${r.difficulty} • ${r.ingredients.length} ingrédients</p>
            </div>
            <div class="flex items-center space-x-2" onclick="event.stopPropagation()">
                <button onclick="addRecipeToShopping(${r.id})" class="w-9 h-9 bg-slate-700 text-orange-400 rounded-xl"><i class="fa-solid fa-cart-plus text-xs"></i></button>
                <button onclick="deleteRecipe(${r.id})" class="w-9 h-9 bg-slate-700 text-red-400 rounded-xl"><i class="fa-solid fa-trash-can text-xs"></i></button>
            </div>
        `;
        grid.appendChild(div);
    });
}

// --- MODALES DÉTAILS & ÉDITION ---
function openRecipeDetailModal(id) {
    const r = appData.recipes.find(rec => rec.id === id);
    if (!r) return;
    currentViewingRecipeId = id;
    document.getElementById('detailModalTitle').innerText = r.title;
    document.getElementById('viewCategory').innerText = r.category;
    document.getElementById('viewDifficulty').innerText = `${r.difficulty} • ${r.ingredients.length} ingrédients`;
    document.getElementById('viewIngredients').innerHTML = r.ingredients.map(i => `<li class="py-0.5">${i}</li>`).join('');
    document.getElementById('viewSteps').innerText = r.steps;

    document.getElementById('recipeViewMode').classList.remove('hidden');
    document.getElementById('recipeEditForm').classList.add('hidden');
    document.getElementById('recipeDetailModal').classList.remove('hidden');
}

function closeRecipeDetailModal() { document.getElementById('recipeDetailModal').classList.add('hidden'); }

function switchToEditMode() {
    const r = appData.recipes.find(rec => rec.id === currentViewingRecipeId);
    document.getElementById('editRecipeId').value = r.id;
    document.getElementById('editRecipeTitle').value = r.title;
    document.getElementById('editRecipeCategory').value = r.category;
    document.getElementById('editRecipeDifficulty').value = r.difficulty;
    document.getElementById('editRecipeIngredients').value = r.ingredients.join('\n');
    document.getElementById('editRecipeSteps').value = r.steps;
    document.getElementById('recipeViewMode').classList.add('hidden');
    document.getElementById('recipeEditForm').classList.remove('hidden');
}

function cancelEditMode() {
    document.getElementById('recipeViewMode').classList.remove('hidden');
    document.getElementById('recipeEditForm').classList.add('hidden');
}

// --- ÉVÉNEMENTS & FORMULAIRES ---
function initEventListeners() {
    document.getElementById('searchInput').addEventListener('input', e => renderRecipes(e.target.value));

    // Ajout
    document.getElementById('recipeForm').addEventListener('submit', e => {
        e.preventDefault();
        appData.recipes.push({
            id: Date.now(),
            title: document.getElementById('recipeTitle').value,
            category: document.getElementById('recipeCategory').value,
            difficulty: document.getElementById('recipeDifficulty').value,
            ingredients: document.getElementById('recipeIngredients').value.split('\n').filter(i => i.trim()),
            steps: document.getElementById('recipeSteps').value
        });
        saveLocalStorage(); renderRecipes(); closeModal(); e.target.reset(); updateStats();
    });

    // Modification
    document.getElementById('recipeEditForm').addEventListener('submit', e => {
        e.preventDefault();
        const id = Number(document.getElementById('editRecipeId').value);
        const index = appData.recipes.findIndex(r => r.id === id);
        if (index !== -1) {
            appData.recipes[index] = {
                id,
                title: document.getElementById('editRecipeTitle').value,
                category: document.getElementById('editRecipeCategory').value,
                difficulty: document.getElementById('editRecipeDifficulty').value,
                ingredients: document.getElementById('editRecipeIngredients').value.split('\n').filter(i => i.trim()),
                steps: document.getElementById('editRecipeSteps').value
            };
            saveLocalStorage(); renderRecipes(); closeRecipeDetailModal(); updateStats();
        }
    });

    // ... (Ajoute ici tes autres listeners : fridgeForm, shoppingForm, etc.)
}

// --- FONCTIONS EXISTANTES ---
function deleteRecipe(id) { appData.recipes = appData.recipes.filter(r => r.id !== id); saveLocalStorage(); renderRecipes(); updateStats(); }
function openModal() { document.getElementById('recipeModal').classList.remove('hidden'); }
function closeModal() { document.getElementById('recipeModal').classList.add('hidden'); }
// ... (Copie le reste de tes fonctions : renderFridge, renderShopping, renderPlanning, etc.)
