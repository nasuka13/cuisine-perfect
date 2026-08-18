// ==========================================
// CONFIGURATION SUPABASE (À configurer si besoin)
// ==========================================
const SUPABASE_URL = 'VOTRE_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'VOTRE_SUPABASE_ANON_KEY';
let supabaseClient = null;

if (window.supabase && SUPABASE_URL !== 'VOTRE_SUPABASE_URL') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ==========================================
// ÉTAT DE L'APPLICATION (Local / Mémoire)
// ==========================================
let state = {
    recipes: [
        { id: 1, title: 'Pâtes Carbonara', category: 'Plat', difficulty: 'Facile', ingredients: ['Pâtes (400g)', 'Lardons (200g)', 'Œufs (3)', 'Parmesan'], steps: '1. Cuire les pâtes.\n2. Faire revenir les lardons.\n3. Mélanger les œufs et le parmesan, puis lier le tout hors du feu.' },
        { id: 2, title: 'Salade César', category: 'Entrée', difficulty: 'Facile', ingredients: ['Salade romaine', 'Blancs de poulet', 'Croûtons', 'Sauce César'], steps: '1. Griller le poulet.\n2. Couper la salade.\n3. Assembler avec les croûtons et la sauce.' }
    ],
    fridge: [
        { id: 1, name: 'Lait', qty: '1L', expiry: '2026-06-10' },
        { id: 2, name: 'Œufs', qty: '6', expiry: '2026-06-15' }
    ],
    shopping: [
        { id: 1, name: 'Tomates', qty: '1 kg', checked: false },
        { id: 2, name: 'Pain de mie', qty: '1 paquet', checked: false }
    ],
    planning: [
        { id: 1, day: 'Lundi', mealType: 'Midi', recipeName: 'Pâtes Carbonara' },
        { id: 2, day: 'Lundi', mealType: 'Soir', recipeName: 'Salade César' }
    ],
    currentRecipeId: null
};

// ==========================================
// INITIALISATION AU CHARGEMENT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    renderAll();
    setupEventListeners();
});

function renderAll() {
    renderRecipes();
    renderFridge();
    renderShopping();
    renderPlanning();
    updateStats();
}

// ==========================================
// GESTION DES ONGLES (NAVIGATION)
// ==========================================
function switchTab(tabName) {
    // Masquer toutes les sections
    const sections = ['recettes', 'frigo', 'courses', 'planning', 'stats', 'outils'];
    sections.forEach(sec => {
        const el = document.getElementById(`section-${sec}`);
        if (el) el.classList.add('hidden');
    });

    // Afficher la section active
    const activeSec = document.getElementById(`section-${tabName}`);
    if (activeSec) activeSec.classList.remove('hidden');

    // Mettre à jour le style des boutons de la barre de navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('text-orange-500');
            btn.classList.remove('text-slate-400');
        } else {
            btn.classList.remove('text-orange-500');
            btn.classList.add('text-slate-400');
        }
    });
}

// ==========================================
// MODE SOMBRE (DARK MODE)
// ==========================================
function initDarkMode() {
    const toggleBtn = document.getElementById('darkModeToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
        });
    }
}

// ==========================================
// GESTION DES RECETTES
// ==========================================
function renderRecipes(filter = '') {
    const grid = document.getElementById('recipesGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const filtered = state.recipes.filter(r => r.title.toLowerCase().includes(filter.toLowerCase()));

    if (filtered.length === 0) {
        grid.innerHTML = `<p class="text-center text-slate-500 text-sm py-6">Aucune recette trouvée.</p>`;
        return;
    }

    filtered.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'bg-slate-800 p-3.5 rounded-2xl border border-slate-700/60 flex justify-between items-center active:scale-[0.99] transition cursor-pointer';
        card.onclick = () => openRecipeDetail(recipe.id);
        
        card.innerHTML = `
            <div class="space-y-1">
                <div class="flex items-center space-x-2">
                    <span class="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 font-semibold rounded-full">${recipe.category}</span>
                    <span class="text-xs text-slate-400">${recipe.difficulty}</span>
                </div>
                <h3 class="font-bold text-sm text-slate-100">${recipe.title}</h3>
            </div>
            <button onclick="event.stopPropagation(); deleteRecipe(${recipe.id})" class="text-slate-500 hover:text-red-400 p-2">
                <i class="fa-solid fa-trash text-xs"></i>
            </button>
        `;
        grid.appendChild(card);
    });
}

// Recherche dynamique
document.getElementById('searchInput')?.addEventListener('input', (e) => {
    renderRecipes(e.target.value);
});

function openModal() {
    document.getElementById('recipeModal')?.classList.remove('hidden');
}
function closeModal() {
    document.getElementById('recipeModal')?.classList.add('hidden');
    document.getElementById('recipeForm')?.reset();
}

document.getElementById('recipeForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const newRecipe = {
        id: Date.now(),
        title: document.getElementById('recipeTitle').value,
        category: document.getElementById('recipeCategory').value,
        difficulty: document.getElementById('recipeDifficulty').value,
        ingredients: document.getElementById('recipeIngredients').value.split('\n').filter(i => i.trim() !== ''),
        steps: document.getElementById('recipeSteps').value
    };
    state.recipes.push(newRecipe);
    closeModal();
    renderAll();
});

function deleteRecipe(id) {
    state.recipes = state.recipes.filter(r => r.id !== id);
    renderAll();
}

// Détails & Modification de recette
function openRecipeDetail(id) {
    const recipe = state.recipes.find(r => r.id === id);
    if (!recipe) return;

    state.currentRecipeId = id;
    document.getElementById('detailModalTitle').innerText = recipe.title;
    document.getElementById('viewCategory').innerText = recipe.category;
    document.getElementById('viewDifficulty').innerText = recipe.difficulty;
    
    const ingList = document.getElementById('viewIngredients');
    ingList.innerHTML = recipe.ingredients.map(i => `<li>${i}</li>`).join('');
    
    document.getElementById('viewSteps').innerText = recipe.steps;

    // S'assurer d'afficher le mode vue et cacher le mode édition
    document.getElementById('recipeViewMode').classList.remove('hidden');
    document.getElementById('recipeEditForm').classList.add('hidden');

    document.getElementById('recipeDetailModal')?.classList.remove('hidden');
}

function closeRecipeDetailModal() {
    document.getElementById('recipeDetailModal')?.classList.add('hidden');
    state.currentRecipeId = null;
}

function switchToEditMode() {
    const recipe = state.recipes.find(r => r.id === state.currentRecipeId);
    if (!recipe) return;

    document.getElementById('editRecipeId').value = recipe.id;
    document.getElementById('editRecipeTitle').value = recipe.title;
    document.getElementById('editRecipeCategory').value = recipe.category;
    document.getElementById('editRecipeDifficulty').value = recipe.difficulty;
    document.getElementById('editRecipeIngredients').value = recipe.ingredients.join('\n');
    document.getElementById('editRecipeSteps').value = recipe.steps;

    document.getElementById('recipeViewMode').classList.add('hidden');
    document.getElementById('recipeEditForm').classList.remove('hidden');
}

function cancelEditMode() {
    document.getElementById('recipeViewMode').classList.remove('hidden');
    document.getElementById('recipeEditForm').classList.add('hidden');
}

document.getElementById('recipeEditForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = Number(document.getElementById('editRecipeId').value);
    const index = state.recipes.findIndex(r => r.id === id);
    if (index !== -1) {
        state.recipes[index] = {
            id,
            title: document.getElementById('editRecipeTitle').value,
            category: document.getElementById('editRecipeCategory').value,
            difficulty: document.getElementById('editRecipeDifficulty').value,
            ingredients: document.getElementById('editRecipeIngredients').value.split('\n').filter(i => i.trim() !== ''),
            steps: document.getElementById('editRecipeSteps').value
        };
    }
    closeRecipeDetailModal();
    renderAll();
});

// ==========================================
// GESTION DU FRIGO
// ==========================================
function renderFridge() {
    const container = document.getElementById('fridgeListContainer');
    if (!container) return;
    container.innerHTML = '';

    if (state.fridge.length === 0) {
        container.innerHTML = `<p class="text-center text-slate-500 text-sm py-4">Votre frigo est vide.</p>`;
        return;
    }

    state.fridge.forEach(item => {
        const div = document.createElement('div');
        div.className = 'bg-slate-800 p-3 rounded-xl border border-slate-700/60 flex justify-between items-center text-sm';
        div.innerHTML = `
            <div>
                <span class="font-bold text-slate-200">${item.name}</span>
                <span class="text-xs text-slate-400 ml-2">(${item.qty})</span>
                <div class="text-[10px] text-slate-500">Exp: ${item.expiry}</div>
            </div>
            <button onclick="deleteFridge(${item.id})" class="text-slate-500 hover:text-red-400 p-1"><i class="fa-solid fa-trash text-xs"></i></button>
        `;
        container.appendChild(div);
    });
}

function openFridgeModal() { document.getElementById('fridgeModal')?.classList.remove('hidden'); }
function closeFridgeModal() { 
    document.getElementById('fridgeModal')?.classList.add('hidden');
    document.getElementById('fridgeForm')?.reset();
}

document.getElementById('fridgeForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    state.fridge.push({
        id: Date.now(),
        name: document.getElementById('fridgeItemName').value,
        qty: document.getElementById('fridgeItemQty').value,
        expiry: document.getElementById('fridgeItemExpiry').value
    });
    closeFridgeModal();
    renderAll();
});

function deleteFridge(id) {
    state.fridge = state.fridge.filter(i => i.id !== id);
    renderAll();
}

// ==========================================
// GESTION DES COURSES
// ==========================================
function renderShopping() {
    const container = document.getElementById('shoppingListContainer');
    if (!container) return;
    container.innerHTML = '';

    if (state.shopping.length === 0) {
        container.innerHTML = `<p class="text-center text-slate-500 text-sm py-4">Liste de courses vide.</p>`;
        return;
    }

    state.shopping.forEach(item => {
        const div = document.createElement('div');
        div.className = 'bg-slate-800 p-3 rounded-xl border border-slate-700/60 flex justify-between items-center text-sm';
        div.innerHTML = `
            <div class="flex items-center space-x-2">
                <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleShopping(${item.id})" class="accent-orange-500 w-4 h-4">
                <span class="${item.checked ? 'line-through text-slate-500' : 'text-slate-200'} font-medium">${item.name} ${item.qty ? '('+item.qty+')' : ''}</span>
            </div>
            <button onclick="deleteShopping(${item.id})" class="text-slate-500 hover:text-red-400 p-1"><i class="fa-solid fa-trash text-xs"></i></button>
        `;
        container.appendChild(div);
    });
}

function openShoppingModal() { document.getElementById('shoppingModal')?.classList.remove('hidden'); }
function closeShoppingModal() { 
    document.getElementById('shoppingModal')?.classList.add('hidden');
    document.getElementById('shoppingForm')?.reset();
}

document.getElementById('shoppingForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    state.shopping.push({
        id: Date.now(),
        name: document.getElementById('shoppingItemName').value,
        qty: document.getElementById('shoppingItemQty').value,
        checked: false
    });
    closeShoppingModal();
    renderAll();
});

function toggleShopping(id) {
    const item = state.shopping.find(i => i.id === id);
    if (item) {
        item.checked = !item.checked;
        renderShopping();
    }
}

function deleteShopping(id) {
    state.shopping = state.shopping.filter(i => i.id !== id);
    renderAll();
}

// ==========================================
// GESTION DU PLANNING
// ==========================================
function renderPlanning() {
    const grid = document.getElementById('planningGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    days.forEach(day => {
        const mealsOfDay = state.planning.filter(p => p.day === day);
        const div = document.createElement('div');
        div.className = 'bg-slate-800 p-3 rounded-xl border border-slate-700/60 text-sm space-y-1';
        
        let mealsHtml = mealsOfDay.length === 0 
            ? '<span class="text-xs text-slate-500">Aucun repas prévu</span>' 
            : mealsOfDay.map(m => `<div class="flex justify-between items-center text-xs bg-slate-900/50 p-1.5 rounded-lg"><span class="font-semibold text-orange-400">${m.mealType}:</span> <span class="text-slate-200">${m.recipeName}</span> <button onclick="deletePlanning(${m.id})" class="text-slate-500 hover:text-red-400"><i class="fa-solid fa-xmark"></i></button></div>`).join('');

        div.innerHTML = `
            <h4 class="font-bold text-xs text-slate-400 uppercase tracking-wider">${day}</h4>
            <div class="space-y-1">${mealsHtml}</div>
        `;
        grid.appendChild(div);
    });
}

function openPlanningModal() { document.getElementById('planningModal')?.classList.remove('hidden'); }
function closePlanningModal() { 
    document.getElementById('planningModal')?.classList.add('hidden');
    document.getElementById('planningForm')?.reset();
}

document.getElementById('planningForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    state.planning.push({
        id: Date.now(),
        day: document.getElementById('planningDay').value,
        mealType: document.getElementById('planningMealType').value,
        recipeName: document.getElementById('planningRecipeName').value
    });
    closePlanningModal();
    renderAll();
});

function deletePlanning(id) {
    state.planning = state.planning.filter(p => p.id !== id);
    renderAll();
}

// ==========================================
// STATISTIQUES
// ==========================================
function updateStats() {
    document.getElementById('statTotalRecipes').innerText = state.recipes.length;
    document.getElementById('statTotalFridge').innerText = state.fridge.length;
    document.getElementById('statTotalShopping').innerText = state.shopping.filter(s => !s.checked).length;
    document.getElementById('statTotalPlanning').innerText = state.planning.length;
}

// ==========================================
// OUTILS : MINUTEUR
// ==========================================
let timerInterval = null;

function startTimer(seconds) {
    stopTimer();
    let timeLeft = seconds;
    updateTimerDisplay(timeLeft);

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timeLeft);
        if (timeLeft <= 0) {
            stopTimer();
            alert("Minuteur terminé !");
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    updateTimerDisplay(0);
}

function updateTimerDisplay(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    const display = document.getElementById('timerDisplay');
    if (display) display.innerText = `${mins}:${secs}`;
}

// ==========================================
// AUTHENTIFICATION (Simulée / Modale)
// ==========================================
function openAuthModal() { document.getElementById('authModal')?.classList.remove('hidden'); }
function closeAuthModal() { document.getElementById('authModal')?.classList.add('hidden'); }

let isSignUp = false;
function toggleAuthMode() {
    isSignUp = !isSignUp;
    document.getElementById('authModalTitle').innerText = isSignUp ? "Créer un compte" : "Connexion";
    document.getElementById('authSubmitBtn').innerText = isSignUp ? "S'inscrire" : "Se connecter";
    document.getElementById('authSwitchBtn').innerText = isSignUp ? "Déjà un compte ? Se connecter" : "Créer un compte";
}

document.getElementById('authForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    // Simulation de connexion réussie
    document.getElementById('authForm').classList.add('hidden');
    const loggedArea = document.getElementById('loggedInArea');
    loggedArea.classList.remove('hidden');
    document.getElementById('currentEmail').innerText = email;
});

function handleLogout() {
    document.getElementById('authForm').reset();
    document.getElementById('authForm').classList.remove('hidden');
    document.getElementById('loggedInArea').classList.add('hidden');
}

function setupEventListeners() {
    // Écouteurs globaux supplémentaires si nécessaire
}
