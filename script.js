// --- 1. GLOBAL STATE AND REFERENCES ---
let currentDate = new Date();
let doughnutChart = null;
let barChart = null;

// This will be the main data object, structured for the workout app
let allData = {
    exerciseDatabase: [], // Master list of all created exercises
    routines: [],         // Saved routines, which are collections of exercises
    history: {},          // Daily logs, keyed by date
    userGoals: { volume: 10000, sets: 25 } // Default goals
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


// --- 2. CORE LOGIC & HELPER FUNCTIONS ---

// This function handles switching between the visible pages
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Deactivate all nav buttons
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    // Show the target page
    document.getElementById(pageId).classList.add('active');

    // Activate the corresponding nav button
    // e.g., for 'log-page', it activates 'nav-log'
    const navButtonId = `nav-${pageId.split('-')[0]}`;
    document.getElementById(navButtonId).classList.add('active');

    // We will call rendering functions here later
    // renderCurrentPage();
}


// --- 6. EVENT LISTENERS ---
// Page Navigation
navLog.addEventListener('click', () => showPage('log-page'));
navRoutines.addEventListener('click', () => showPage('routines-page'));
navExercises.addEventListener('click', () => showPage('exercises-page'));
navReports.addEventListener('click', () => showPage('reports-page'));


// --- 7. INITIALIZE APP ---
function initializeApp() {
    // We will load data from localStorage here later
    // loadDataFromLocalStorage();
    
    // Start on the "Daily Log" page
    showPage('log-page');
}

initializeApp();