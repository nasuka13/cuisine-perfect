const SUPABASE_URL = 'VOTRE_SUPABASE_URL';
const SUPABASE_KEY = 'VOTRE_SUPABASE_ANON_KEY';

let supabaseClient = null;
let currentUser = null;

if (window.supabase && SUPABASE_URL !== 'VOTRE_SUPABASE_URL') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

let appData = {
    recipes: [
        { id: 1, title: "Carbonara Originales", category: "Plat", difficulty: "Facile", ingredients: ["Spaghetti", "Pancetta", "Œufs", "Pecorino"], steps: "1. Cuire les pâtes.\n2. Mélanger le tout." },
        { id: 2, title: "Tiramisu Express", category: "Dessert", difficulty: "Facile", ingredients: ["Mascarpone", "Café", "Biscuits", "Œufs"], steps: "1. Monter la crème.\n2. Alterner les couches." }
    ],
    fridge: [
        { id: 1, name: "Lait", qty: "1L", expiry: "2026-06-15" }
    ],
    shopping: [
        { id: 1, name: "Tomates", qty: "500g", checked: false }
    ],
    planning: [
        { id: 1, day: "Lundi", mealType: "Midi", recipeName: "Carbonara Originales" }
    ]
};

function loadLocalStorage() {
    const saved = localStorage.getItem('mes_recettes_mobile_data');
    if (saved) {
        try { appData = JSON.parse(saved); } catch (e) { console.error(e); }
    }
}

function saveLocalStorage() {
    localStorage.setItem('mes_recettes_mobile_data', JSON.stringify(appData));
}

document.addEventListener('DOMContentLoaded', () => {
    loadLocalStorage();
    initEventListeners();
    renderAll();
});

function switchTab(tabName) {
    ['recettes', 'frigo', 'courses', 'planning', 'stats', 'outils'].forEach(sec => {
        const el = document.getElementById(`section-${sec}`);
        if (el) el.classList.toggle('hidden', sec !== tabName);
    });

    // Style de la barre de navigation active
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('text-orange-500');
            btn.classList.remove('text-slate-400');
        } else {
            btn.classList.remove('text-orange-500');
            btn.classList.add('text-slate-400');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tabName === 'stats') updateStats();
}

function renderAll() {
    renderRecipes();
    renderFridge();
    renderShopping();
    renderPlanning();
    updateStats();
}

function renderRecipes(filter = '') {
    const grid = document.getElementById('recipesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = appData.recipes.filter(r => r.title.toLowerCase().includes(filter.toLowerCase()));

    if (filtered.length === 0) {
        grid.innerHTML = `<p class="text-center text-slate-500 py-6 text-sm">Aucune recette trouvée</p>`;
        return;
    }

    filtered.forEach(r => {
        const div = document.createElement('div');
        div.className = "bg-slate-800 p-4 rounded-2xl border border-slate-700/60 flex justify-between items-center active:scale-[0.99] transition";
        div.innerHTML = `
            <div class="space-y-1">
                <span class="text-[10px] px-2 py-0.5 bg-orange-500/20 text-orange-400 font-semibold rounded-full">${r.category}</span>
                <h3 class="font-bold text-sm text-slate-100">${r.title}</h3>
                <p class="text-xs text-slate-400">${r.difficulty} • ${r.ingredients.length} ingrédients</p>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="addRecipeToShopping(${r.id})" class="w-9 h-9 bg-slate-700 text-orange-400 rounded-xl flex items-center justify-center"><i class="fa-solid fa-cart-plus text-xs"></i></button>
                <button onclick="deleteRecipe(${r.id})" class="w-9 h-9 bg-slate-700 text-red-400 rounded-xl flex items-center justify-center"><i class="fa-solid fa-trash-can text-xs"></i></button>
            </div>
        `;
        grid.appendChild(div);
    });
}

function renderFridge() {
    const container = document.getElementById('fridgeListContainer');
    if (!container) return;
    container.innerHTML = '';

    if (appData.fridge.length === 0) {
        container.innerHTML = `<p class="text-center text-slate-500 py-6 text-sm">Frigo vide</p>`;
        return;
    }

    appData.fridge.forEach(item => {
        const div = document.createElement('div');
        div.className = "bg-slate-800 p-3.5 rounded-xl border border-slate-700/60 flex justify-between items-center text-sm";
        div.innerHTML = `
            <div>
                <p class="font-medium">${item.name} <span class="text-xs text-slate-400">(${item.qty})</span></p>
                <p class="text-[10px] text-slate-500">Péremption : ${item.expiry}</p>
            </div>
            <button onclick="deleteFridge(${item.id})" class="text-red-400 p-2"><i class="fa-solid fa-trash-can text-xs"></i></button>
        `;
        container.appendChild(div);
    });
}

function renderShopping() {
    const container = document.getElementById('shoppingListContainer');
    if (!container) return;
    container.innerHTML = '';

    if (appData.shopping.length === 0) {
        container.innerHTML = `<p class="text-center text-slate-500 py-6 text-sm">Rien à acheter</p>`;
        return;
    }

    appData.shopping.forEach(item => {
        const div = document.createElement('div');
        div.className = "bg-slate-800 p-3.5 rounded-xl border border-slate-700/60 flex justify-between items-center text-sm";
        div.innerHTML = `
            <label class="flex items-center space-x-3 flex-grow">
                <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleShopping(${item.id})" class="w-4 h-4 accent-orange-500 rounded">
                <span class="${item.checked ? 'line-through text-slate-500' : 'font-medium'}">${item.name} <span class="text-xs text-slate-500">(${item.qty || ''})</span></span>
            </label>
            <button onclick="deleteShopping(${item.id})" class="text-red-400 p-2"><i class="fa-solid fa-xmark"></i></button>
        `;
        container.appendChild(div);
    });
}

function renderPlanning() {
    const grid = document.getElementById('planningGrid');
    if (!grid) return;
    grid.innerHTML = '';

    ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].forEach(day => {
        const meals = appData.planning.filter(p => p.day === day);
        if (meals.length === 0) return;

        const div = document.createElement('div');
        div.className = "bg-slate-800 p-3.5 rounded-xl border border-slate-700/60 space-y-2 text-sm";
        let html = `<p class="font-bold text-orange-400 text-xs uppercase">${day}</p>`;
        meals.forEach(m => {
            html += `<div class="flex justify-between items-center bg-slate-900 p-2 rounded-lg text-xs">
                <span><strong>${m.mealType} :</strong> ${m.recipeName}</span>
                <button onclick="deletePlanning(${m.id})" class="text-red-400"><i class="fa-solid fa-trash-can"></i></button>
            </div>`;
        });
        div.innerHTML = html;
        grid.appendChild(div);
    });
}

function updateStats() {
    document.getElementById('statTotalRecipes').innerText = appData.recipes.length;
    document.getElementById('statTotalFridge').innerText = appData.fridge.length;
    document.getElementById('statTotalShopping').innerText = appData.shopping.filter(s => !s.checked).length;
    document.getElementById('statTotalPlanning').innerText = appData.planning.length;
}

// Modales Contrôles
function openModal() { document.getElementById('recipeModal').classList.remove('hidden'); }
function closeModal() { document.getElementById('recipeModal').classList.add('hidden'); }
function openFridgeModal() { document.getElementById('fridgeModal').classList.remove('hidden'); }
function closeFridgeModal() { document.getElementById('fridgeModal').classList.add('hidden'); }
function openShoppingModal() { document.getElementById('shoppingModal').classList.remove('hidden'); }
function closeShoppingModal() { document.getElementById('shoppingModal').classList.add('hidden'); }
function openPlanningModal() { document.getElementById('planningModal').classList.remove('hidden'); }
function closePlanningModal() { document.getElementById('planningModal').classList.add('hidden'); }
function openAuthModal() { document.getElementById('authModal').classList.remove('hidden'); }
function closeAuthModal() { document.getElementById('authModal').classList.add('hidden'); }

function initEventListeners() {
    document.getElementById('searchInput').addEventListener('input', e => renderRecipes(e.target.value));

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
        saveLocalStorage();
        renderRecipes();
        updateStats();
        closeModal();
        e.target.reset();
    });

    document.getElementById('fridgeForm').addEventListener('submit', e => {
        e.preventDefault();
        appData.fridge.push({
            id: Date.now(),
            name: document.getElementById('fridgeItemName').value,
            qty: document.getElementById('fridgeItemQty').value,
            expiry: document.getElementById('fridgeItemExpiry').value
        });
        saveLocalStorage();
        renderFridge();
        updateStats();
        closeFridgeModal();
        e.target.reset();
    });

    document.getElementById('shoppingForm').addEventListener('submit', e => {
        e.preventDefault();
        appData.shopping.push({
            id: Date.now(),
            name: document.getElementById('shoppingItemName').value,
            qty: document.getElementById('shoppingItemQty').value,
            checked: false
        });
        saveLocalStorage();
        renderShopping();
        updateStats();
        closeShoppingModal();
        e.target.reset();
    });

    document.getElementById('planningForm').addEventListener('submit', e => {
        e.preventDefault();
        appData.planning.push({
            id: Date.now(),
            day: document.getElementById('planningDay').value,
            mealType: document.getElementById('planningMealType').value,
            recipeName: document.getElementById('planningRecipeName').value
        });
        saveLocalStorage();
        renderPlanning();
        updateStats();
        closePlanningModal();
        e.target.reset();
    });
}

function deleteRecipe(id) { appData.recipes = appData.recipes.filter(r => r.id !== id); saveLocalStorage(); renderRecipes(); updateStats(); }
function deleteFridge(id) { appData.fridge = appData.fridge.filter(f => f.id !== id); saveLocalStorage(); renderFridge(); updateStats(); }
function deleteShopping(id) { appData.shopping = appData.shopping.filter(s => s.id !== id); saveLocalStorage(); renderShopping(); updateStats(); }
function toggleShopping(id) { const item = appData.shopping.find(s => s.id === id); if (item) { item.checked = !item.checked; saveLocalStorage(); renderShopping(); } }
function deletePlanning(id) { appData.planning = appData.planning.filter(p => p.id !== id); saveLocalStorage(); renderPlanning(); updateStats(); }

function addRecipeToShopping(recipeId) {
    const r = appData.recipes.find(rec => rec.id === recipeId);
    if (!r) return;
    r.ingredients.forEach(ing => {
        appData.shopping.push({ id: Date.now() + Math.random(), name: ing, qty: '1', checked: false });
    });
    saveLocalStorage();
    renderShopping();
    updateStats();
    alert("Ingrédients ajoutés aux courses !");
}

let timerInterval = null;
function startTimer(secs) {
    clearInterval(timerInterval);
    let remaining = secs;
    const display = document.getElementById('timerDisplay');
    timerInterval = setInterval(() => {
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        display.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        if (remaining <= 0) { clearInterval(timerInterval); alert("Temps écoulé !"); }
        remaining--;
    }, 1000);
}
function stopTimer() { clearInterval(timerInterval); document.getElementById('timerDisplay').innerText = "00:00"; }