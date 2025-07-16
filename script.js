// --- 1. GLOBAL STATE AND REFERENCES ---
let currentDate = new Date();
let doughnutChart = null;
let barChart = null;
let currentExerciseImage = null;

let allData = {
    exerciseDatabase: [],
    routines: [],
    history: {},
    userGoals: { volume: 10000, sets: 25 }
};

// --- REFERENCES TO HTML ELEMENTS ---
const navLog = document.getElementById('nav-log'), navRoutines = document.getElementById('nav-routines'), navExercises = document.getElementById('nav-exercises'), navReports = document.getElementById('nav-reports');
const logPage = document.getElementById('log-page'), routinesPage = document.getElementById('routines-page'), exercisesPage = document.getElementById('exercises-page'), reportsPage = document.getElementById('reports-page');
const addExerciseDbForm = document.getElementById('add-exercise-db-form'), dbExerciseNameInput = document.getElementById('db-exercise-name'), dbExerciseTypeSelect = document.getElementById('db-exercise-type'), dbExerciseImageInput = document.getElementById('db-exercise-image-input'), dbExerciseThumbnail = document.getElementById('db-exercise-thumbnail'), dbSubmitBtn = document.getElementById('db-submit-btn'), dbExerciseListDiv = document.getElementById('db-exercise-list');
const imageViewerModal = document.getElementById('image-viewer-modal'), fullSizeImage = document.getElementById('full-size-image'), allModals = document.querySelectorAll('.modal');


// --- 2. CORE LOGIC & HELPER FUNCTIONS ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.getElementById(`nav-${pageId.split('-')[0]}`).classList.add('active');
    renderCurrentPage(); // Render content when page is shown
}

function validateDbForm() {
    const name = dbExerciseNameInput.value.trim();
    const type = dbExerciseTypeSelect.value;
    dbSubmitBtn.disabled = !(name && type);
}

function resetDbForm() {
    addExerciseDbForm.reset();
    currentExerciseImage = null;
    dbExerciseThumbnail.classList.add('hidden');
    dbExerciseThumbnail.src = '';
    validateDbForm();
}

// --- NEW: DATA PERSISTENCE ---
function saveDataToLocalStorage() {
    try {
        localStorage.setItem('workoutTrackerData', JSON.stringify(allData));
    } catch (error) {
        console.error("Could not save data to localStorage", error);
    }
}

function loadDataFromLocalStorage() {
    const savedData = localStorage.getItem('workoutTrackerData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            if (parsedData.exerciseDatabase && parsedData.history && parsedData.userGoals) {
                allData = parsedData;
            }
        } catch (error) { console.error("Could not parse data from localStorage", error); }
    }
}


// --- 3. RENDERING FUNCTIONS ---
function renderCurrentPage() {
    const activePageId = document.querySelector('.page.active').id;
    switch (activePageId) {
        case 'exercises-page':
            renderExerciseDatabase();
            break;
        // Other cases will be added here later
    }
}

// --- NEW: RENDER THE EXERCISE LIST ---
function renderExerciseDatabase() {
    dbExerciseListDiv.innerHTML = ''; // Clear previous list
    if (allData.exerciseDatabase.length === 0) {
        dbExerciseListDiv.innerHTML = `<div class="db-exercise-item" style="justify-content: center; color: var(--color-text-tertiary);">Your exercise list is empty.</div>`;
        return;
    }

    allData.exerciseDatabase.forEach(exercise => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'db-exercise-item';
        itemDiv.innerHTML = `
            ${exercise.image ? `<img src="${exercise.image}" alt="${exercise.name}" class="db-item-thumbnail" data-id="${exercise.id}">` : '<div style="width: 40px; height: 40px; flex-shrink: 0;"></div>'}
            <div class="exercise-item-main">
                <span class="exercise-item-name">${exercise.name}</span>
                <small class="exercise-item-stats">${exercise.type}</small>
            </div>
            <div class="item-actions">
                <button class="item-action-btn edit-btn" data-id="${exercise.id}">Edit</button>
                <button class="item-action-btn delete-btn" data-id="${exercise.id}">Delete</button>
            </div>
        `;
        dbExerciseListDiv.appendChild(itemDiv);
    });
}


// --- MODAL HANDLERS ---
function openModal(modalElement) { modalElement.classList.remove('hidden'); }
function closeModal(modalElement) { modalElement.classList.add('hidden'); }


// --- 4. EVENT HANDLER FUNCTIONS ---
function handleAddOrUpdateDbEntry(event) {
    event.preventDefault();
    const name = dbExerciseNameInput.value.trim();
    const type = dbExerciseTypeSelect.value;
    
    const newExercise = { id: Date.now(), name, type, image: currentExerciseImage };
    allData.exerciseDatabase.push(newExercise);
    
    saveDataToLocalStorage();
    renderExerciseDatabase(); // Re-render the list to show the new item
    resetDbForm();
}


// --- 6. EVENT LISTENERS ---
navLog.addEventListener('click', () => showPage('log-page'));
navRoutines.addEventListener('click', () => showPage('routines-page'));
navExercises.addEventListener('click', () => showPage('exercises-page'));
navReports.addEventListener('click', () => showPage('reports-page'));

addExerciseDbForm.addEventListener('submit', handleAddOrUpdateDbEntry);
addExerciseDbForm.addEventListener('input', validateDbForm);

dbExerciseImageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            currentExerciseImage = e.target.result;
            dbExerciseThumbnail.src = e.target.result;
            dbExerciseThumbnail.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

dbExerciseThumbnail.addEventListener('click', () => {
    if (dbExerciseThumbnail.src) {
        fullSizeImage.src = dbExerciseThumbnail.src;
        openModal(imageViewerModal);
    }
});

// --- NEW: EVENT LISTENER FOR THE EXERCISE LIST ---
dbExerciseListDiv.addEventListener('click', (event) => {
    // Handle clicking on a thumbnail in the list
    if (event.target.classList.contains('db-item-thumbnail')) {
        const exerciseId = parseInt(event.target.dataset.id);
        const exercise = allData.exerciseDatabase.find(ex => ex.id === exerciseId);
        if (exercise && exercise.image) {
            fullSizeImage.src = exercise.image;
            openModal(imageViewerModal);
        }
    }
    // We will add Edit/Delete logic here later
});

document.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal-overlay')) {
        allModals.forEach(closeModal);
    }
});


// --- 7. INITIALIZE APP ---
function initializeApp() {
    loadDataFromLocalStorage();
    showPage('log-page');
    validateDbForm();
}

initializeApp();