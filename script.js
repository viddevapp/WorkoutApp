// --- 1. GLOBAL STATE AND REFERENCES ---
let currentDate = new Date();
let doughnutChart = null;
let barChart = null;
let currentExerciseImage = null; // Holds base64 string for the form image

let allData = {
    exerciseDatabase: [],
    routines: [],
    history: {},
    userGoals: { volume: 10000, sets: 25 }
};

// --- REFERENCES TO HTML ELEMENTS ---
// Navigation
const navLog = document.getElementById('nav-log');
const navRoutines = document.getElementById('nav-routines');
const navExercises = document.getElementById('nav-exercises');
const navReports = document.getElementById('nav-reports');

// Pages
const logPage = document.getElementById('log-page');
const routinesPage = document.getElementById('routines-page');
const exercisesPage = document.getElementById('exercises-page');
const reportsPage = document.getElementById('reports-page');

// Exercise DB Page
const addExerciseDbForm = document.getElementById('add-exercise-db-form');
const dbExerciseNameInput = document.getElementById('db-exercise-name');
const dbExerciseTypeSelect = document.getElementById('db-exercise-type');
const dbExerciseImageInput = document.getElementById('db-exercise-image-input');
const dbExerciseThumbnail = document.getElementById('db-exercise-thumbnail');
const dbSubmitBtn = document.getElementById('db-submit-btn');

// Modals
const imageViewerModal = document.getElementById('image-viewer-modal');
const fullSizeImage = document.getElementById('full-size-image');
const allModals = document.querySelectorAll('.modal');


// --- 2. CORE LOGIC & HELPER FUNCTIONS ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    const navButtonId = `nav-${pageId.split('-')[0]}`;
    document.getElementById(navButtonId).classList.add('active');

    // renderCurrentPage();
}

function validateDbForm() {
    const name = dbExerciseNameInput.value.trim();
    const type = dbExerciseTypeSelect.value;
    dbSubmitBtn.disabled = !(name && type);
}

function resetDbForm() {
    addExerciseDbForm.reset();
    currentExerciseImage = null; // Clear the stored image data
    dbExerciseThumbnail.classList.add('hidden'); // Hide the thumbnail
    dbExerciseThumbnail.src = '';
    validateDbForm();
}

// --- MODAL HANDLERS ---
function openModal(modalElement) {
    modalElement.classList.remove('hidden');
}

function closeModal(modalElement) {
    modalElement.classList.add('hidden');
}

// --- 4. EVENT HANDLER FUNCTIONS ---

// Handler for the Exercise DB form submission
function handleAddOrUpdateDbEntry(event) {
    event.preventDefault();
    const name = dbExerciseNameInput.value.trim();
    const type = dbExerciseTypeSelect.value;
    
    // We will add logic for editing later
    const newExercise = {
        id: Date.now(),
        name: name,
        type: type,
        image: currentExerciseImage // Add the stored image data
    };

    allData.exerciseDatabase.push(newExercise);
    console.log("Updated DB:", allData.exerciseDatabase); // For debugging
    
    // We will add saving and rendering logic later
    // saveDataToLocalStorage();
    // renderExerciseDatabase();
    resetDbForm();
}


// --- 6. EVENT LISTENERS ---
// Page Navigation
navLog.addEventListener('click', () => showPage('log-page'));
navRoutines.addEventListener('click', () => showPage('routines-page'));
navExercises.addEventListener('click', () => showPage('exercises-page'));
navReports.addEventListener('click', () => showPage('reports-page'));

// Exercise List Page
addExerciseDbForm.addEventListener('submit', handleAddOrUpdateDbEntry);
addExerciseDbForm.addEventListener('input', validateDbForm);

// Image Handling Event Listeners
dbExerciseImageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            currentExerciseImage = e.target.result; // Store base64 string
            dbExerciseThumbnail.src = e.target.result; // Show preview
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

// Generic Modal Closing
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal-overlay')) {
        allModals.forEach(closeModal);
    }
});


// --- 7. INITIALIZE APP ---
function initializeApp() {
    // loadDataFromLocalStorage();
    showPage('log-page'); // Start on the first page
    validateDbForm(); // Initial validation check
}

initializeApp();