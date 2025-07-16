// --- 1. GLOBAL STATE AND REFERENCES ---
let currentDate = new Date();
let doughnutChart = null;
let barChart = null;
let currentExerciseImage = null;
let dbEditingState = { isEditing: false, id: null };
let currentDbSort = 'name-asc';

let allData = {
    exerciseDatabase: [],
    routines: [],
    history: {},
    userGoals: { volume: 10000, sets: 25 }
};

// --- REFERENCES TO HTML ELEMENTS ---
const navLog = document.getElementById('nav-log'), navRoutines = document.getElementById('nav-routines'), navExercises = document.getElementById('nav-exercises'), navReports = document.getElementById('nav-reports');
const logPage = document.getElementById('log-page'), routinesPage = document.getElementById('routines-page'), exercisesPage = document.getElementById('exercises-page'), reportsPage = document.getElementById('reports-page');
const addExerciseDbForm = document.getElementById('add-exercise-db-form'), dbEditingIdInput = document.getElementById('db-editing-id'), dbExerciseNameInput = document.getElementById('db-exercise-name'), dbExerciseTypeSelect = document.getElementById('db-exercise-type'), dbExerciseImageInput = document.getElementById('db-exercise-image-input'), dbExerciseThumbnail = document.getElementById('db-exercise-thumbnail'), removeDbImageBtn = document.getElementById('remove-db-image-btn'), dbSubmitBtn = document.getElementById('db-submit-btn'), dbExerciseListDiv = document.getElementById('db-exercise-list'), dbSortSelect = document.getElementById('db-sort-select');
const imageViewerModal = document.getElementById('image-viewer-modal'), fullSizeImage = document.getElementById('full-size-image'), allModals = document.querySelectorAll('.modal');


// --- 2. CORE LOGIC & HELPER FUNCTIONS ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.getElementById(`nav-${pageId.split('-')[0]}`).classList.add('active');
    renderCurrentPage();
}

function validateDbForm() {
    const name = dbExerciseNameInput.value.trim();
    const type = dbExerciseTypeSelect.value;
    dbSubmitBtn.disabled = !(name && type);
}

function resetDbForm() {
    addExerciseDbForm.reset();
    currentExerciseImage = null;
    dbEditingIdInput.value = '';
    dbExerciseThumbnail.classList.add('hidden');
    removeDbImageBtn.classList.add('hidden'); // Hide remove button
    dbExerciseThumbnail.src = '';
    dbSubmitBtn.textContent = 'Save to Exercise List';
    dbEditingState = { isEditing: false, id: null };
    validateDbForm();
}

function saveDataToLocalStorage() {
    try { localStorage.setItem('workoutTrackerData', JSON.stringify(allData)); }
    catch (error) { console.error("Could not save data to localStorage", error); }
}

function loadDataFromLocalStorage() {
    const savedData = localStorage.getItem('workoutTrackerData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            if (parsedData.exerciseDatabase && parsedData.history && parsedData.userGoals) { allData = parsedData; }
        } catch (error) { console.error("Could not parse data from localStorage", error); }
    }
}

// --- 3. RENDERING FUNCTIONS ---
function renderCurrentPage() {
    const activePageId = document.querySelector('.page.active').id;
    if (activePageId === 'exercises-page') {
        renderExerciseDatabase();
    }
}

function renderExerciseDatabase() {
    dbExerciseListDiv.innerHTML = '';
    if (allData.exerciseDatabase.length === 0) {
        dbExerciseListDiv.innerHTML = `<div class="db-exercise-item" style="justify-content: center; color: var(--color-text-tertiary);">Your exercise list is empty.</div>`;
        return;
    }

    const sortedDb = [...allData.exerciseDatabase];
    switch (currentDbSort) {
        case 'name-desc': sortedDb.sort((a, b) => b.name.localeCompare(a.name)); break;
        case 'type-asc': sortedDb.sort((a, b) => a.type.localeCompare(b.type)); break;
        default: sortedDb.sort((a, b) => a.name.localeCompare(a.name)); break;
    }

    sortedDb.forEach(exercise => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'db-exercise-item';
        itemDiv.innerHTML = `
            ${exercise.image ? `<img src="${exercise.image}" alt="${exercise.name}" class="db-item-thumbnail" data-id="${exercise.id}">` : '<div class="db-item-thumbnail" style="background-color: var(--color-background);"></div>'}
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
    
    if (dbEditingState.isEditing) {
        const exerciseToUpdate = allData.exerciseDatabase.find(ex => ex.id === dbEditingState.id);
        if (exerciseToUpdate) {
            exerciseToUpdate.name = name;
            exerciseToUpdate.type = type;
            exerciseToUpdate.image = currentExerciseImage; // This will be null if removed, or the new/old image
        }
    } else {
        const newExercise = { id: Date.now(), name, type, image: currentExerciseImage };
        allData.exerciseDatabase.push(newExercise);
    }
    
    saveDataToLocalStorage();
    renderExerciseDatabase();
    resetDbForm();
}

// --- 6. EVENT LISTENERS ---
navLog.addEventListener('click', () => showPage('log-page'));
navRoutines.addEventListener('click', () => showPage('routines-page'));
navExercises.addEventListener('click', () => showPage('exercises-page'));
navReports.addEventListener('click', () => showPage('reports-page'));

addExerciseDbForm.addEventListener('submit', handleAddOrUpdateDbEntry);
addExerciseDbForm.addEventListener('input', validateDbForm);

dbSortSelect.addEventListener('change', (event) => {
    currentDbSort = event.target.value;
    renderExerciseDatabase();
});

dbExerciseImageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            currentExerciseImage = e.target.result;
            dbExerciseThumbnail.src = e.target.result;
            dbExerciseThumbnail.classList.remove('hidden');
            removeDbImageBtn.classList.remove('hidden'); // Show remove button when new image is chosen
        };
        reader.readAsDataURL(file);
    }
});

removeDbImageBtn.addEventListener('click', () => {
    currentExerciseImage = null; // Clear the image data
    dbExerciseImageInput.value = ''; // Clear the file input
    dbExerciseThumbnail.classList.add('hidden'); // Hide the thumbnail
    removeDbImageBtn.classList.add('hidden'); // Hide itself
});

dbExerciseThumbnail.addEventListener('click', () => {
    if (dbExerciseThumbnail.src) {
        fullSizeImage.src = dbExerciseThumbnail.src;
        openModal(imageViewerModal);
    }
});

dbExerciseListDiv.addEventListener('click', (event) => {
    const target = event.target;
    if (target.closest('.item-action-btn')) { // Check if a button inside actions was clicked
        const exerciseId = parseInt(target.dataset.id);

        if (target.classList.contains('edit-btn')) {
            const exerciseToEdit = allData.exerciseDatabase.find(ex => ex.id === exerciseId);
            if (exerciseToEdit) {
                resetDbForm(); // Clear form before populating
                dbEditingIdInput.value = exerciseToEdit.id;
                dbExerciseNameInput.value = exerciseToEdit.name;
                dbExerciseTypeSelect.value = exerciseToEdit.type;
                if (exerciseToEdit.image) {
                    dbExerciseThumbnail.src = exerciseToEdit.image;
                    dbExerciseThumbnail.classList.remove('hidden');
                    removeDbImageBtn.classList.remove('hidden'); // Show remove button
                    currentExerciseImage = exerciseToEdit.image;
                }
                dbSubmitBtn.textContent = 'Update Exercise';
                dbEditingState = { isEditing: true, id: exerciseId };
                validateDbForm();
                window.scrollTo(0, 0); // Scroll to top of page
                dbExerciseNameInput.focus();
            }
        } else if (target.classList.contains('delete-btn')) {
            if (confirm(`Are you sure you want to delete this exercise? This cannot be undone.`)) {
                allData.exerciseDatabase = allData.exerciseDatabase.filter(ex => ex.id !== exerciseId);
                saveDataToLocalStorage();
                renderExerciseDatabase();
                if (dbEditingState.id === exerciseId) { resetDbForm(); }
            }
        }
    } else if (target.classList.contains('db-item-thumbnail')) { // Handle thumbnail click for modal
        const exerciseId = parseInt(target.dataset.id);
        const exercise = allData.exerciseDatabase.find(ex => ex.id === exerciseId);
        if (exercise && exercise.image) {
            fullSizeImage.src = exercise.image;
            openModal(imageViewerModal);
        }
    }
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