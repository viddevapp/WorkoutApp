// --- 1. GLOBAL STATE AND REFERENCES ---
let currentDate = new Date(), doughnutChart = null, barChart = null, currentExerciseImage = null;
let dbEditingState = { isEditing: false, id: null };
let routineEditingState = { isEditing: false, id: null };
let currentDbSort = 'name-asc';
let routineBuilderState = { exercises: [] };

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
const createRoutineForm = document.getElementById('create-routine-form'), routineEditingIdInput = document.getElementById('routine-editing-id'), routineNameInput = document.getElementById('routine-name-input'), routineExerciseSelect = document.getElementById('routine-exercise-select'), routineSetsInput = document.getElementById('routine-sets-input'), routineRepsInput = document.getElementById('routine-reps-input'), routineBreakInput = document.getElementById('routine-break-input'), addExerciseToBuilderBtn = document.getElementById('add-exercise-to-builder-btn'), routineBuilderList = document.getElementById('routine-builder-list'), saveRoutineBtn = document.getElementById('save-routine-btn'), savedRoutinesList = document.getElementById('saved-routines-list');
const imageViewerModal = document.getElementById('image-viewer-modal'), fullSizeImage = document.getElementById('full-size-image'), allModals = document.querySelectorAll('.modal');

// --- 2. CORE LOGIC & HELPER FUNCTIONS ---
function showPage(pageId) { document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active')); document.getElementById(pageId).classList.add('active'); document.getElementById(`nav-${pageId.split('-')[0]}`).classList.add('active'); renderCurrentPage(); }
function validateDbForm() { const name = dbExerciseNameInput.value.trim(), type = dbExerciseTypeSelect.value; dbSubmitBtn.disabled = !(name && type); }
function resetDbForm() { addExerciseDbForm.reset(); currentExerciseImage = null; dbEditingIdInput.value = ''; dbExerciseThumbnail.classList.add('hidden'); removeDbImageBtn.classList.add('hidden'); dbExerciseThumbnail.src = ''; dbSubmitBtn.textContent = 'Save to Exercise List'; dbEditingState = { isEditing: false, id: null }; validateDbForm(); }
function saveDataToLocalStorage() { try { localStorage.setItem('workoutTrackerData', JSON.stringify(allData)); } catch (error) { console.error("Could not save data", error); } }
function loadDataFromLocalStorage() { const d = localStorage.getItem('workoutTrackerData'); if (d) { try { const p = JSON.parse(d); if (p.exerciseDatabase && p.history && p.userGoals) { allData = p; if (!allData.routines) allData.routines = []; } } catch (e) { console.error("Could not parse data", e); } } }
function openModal(modalElement) { modalElement.classList.remove('hidden'); }
function closeModal(modalElement) { modalElement.classList.add('hidden'); }

// --- 3. RENDERING FUNCTIONS ---
function renderCurrentPage() {
    const activePageId = document.querySelector('.page.active').id;
    if (activePageId === 'exercises-page') { renderExerciseDatabase(); }
    if (activePageId === 'routines-page') { populateExerciseDropdown(); renderSavedRoutines(); }
}

function renderExerciseDatabase() {
    dbExerciseListDiv.innerHTML = ''; if (allData.exerciseDatabase.length === 0) { dbExerciseListDiv.innerHTML = `<div class="db-exercise-item" style="justify-content: center; color: var(--color-text-tertiary);">Your exercise list is empty.</div>`; return; }
    const sortedDb = [...allData.exerciseDatabase];
    switch (currentDbSort) { case 'name-desc': sortedDb.sort((a, b) => b.name.localeCompare(a.name)); break; case 'type-asc': sortedDb.sort((a, b) => a.type.localeCompare(b.type)); break; default: sortedDb.sort((a, b) => a.name.localeCompare(a.name)); break; }
    sortedDb.forEach(ex => { const i = document.createElement('div'); i.className = 'db-exercise-item'; i.innerHTML = `${ex.image ? `<img src="${ex.image}" alt="${ex.name}" class="db-item-thumbnail" data-id="${ex.id}">` : '<div class="db-item-thumbnail" style="background-color: var(--color-background);"></div>'}<div class="exercise-item-main"><span class="exercise-item-name">${ex.name}</span><small class="exercise-item-stats">${ex.type}</small></div><div class="item-actions"><button class="item-action-btn edit-btn" data-id="${ex.id}">Edit</button><button class="item-action-btn delete-btn" data-id="${ex.id}">Delete</button></div>`; dbExerciseListDiv.appendChild(i); });
}

function populateExerciseDropdown() {
    routineExerciseSelect.innerHTML = `<option value="" disabled selected>Choose an exercise...</option>`;
    allData.exerciseDatabase.forEach(ex => {
        const option = document.createElement('option');
        option.value = ex.id;
        option.textContent = ex.name;
        routineExerciseSelect.appendChild(option);
    });
}

function renderSavedRoutines() {
    savedRoutinesList.innerHTML = ''; if (allData.routines.length === 0) { savedRoutinesList.innerHTML = `<div class="db-exercise-item" style="justify-content: center; color: var(--color-text-tertiary);">You haven't created any routines yet.</div>`; return; }
    allData.routines.forEach(routine => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'db-exercise-item'; const totalSets = routine.exercises.reduce((sum, ex) => sum + parseInt(ex.sets), 0);
        itemDiv.innerHTML = `<div class="exercise-item-main"><span class="exercise-item-name">${routine.name}</span><small class="exercise-item-stats">${routine.exercises.length} exercises • ${totalSets} total sets</small></div><div class="item-actions"><button class="item-action-btn edit-btn" data-id="${routine.id}">Edit</button><button class="item-action-btn delete-btn" data-id="${routine.id}">Delete</button></div>`;
        savedRoutinesList.appendChild(itemDiv);
    });
}

// --- 4. EVENT HANDLER FUNCTIONS ---
function handleAddOrUpdateDbEntry(event) {
    event.preventDefault(); const name = dbExerciseNameInput.value.trim(), type = dbExerciseTypeSelect.value;
    if (dbEditingState.isEditing) { const ex = allData.exerciseDatabase.find(e => e.id === dbEditingState.id); if (ex) { ex.name = name; ex.type = type; ex.image = currentExerciseImage; }
    } else { const newEx = { id: Date.now(), name, type, image: currentExerciseImage }; allData.exerciseDatabase.push(newEx); }
    saveDataToLocalStorage(); renderExerciseDatabase(); resetDbForm();
}

function handleAddExerciseToBuilder() {
    const selectedId = parseInt(routineExerciseSelect.value);
    if (isNaN(selectedId)) { alert("Please select an exercise from the dropdown."); return; }
    const sets = parseInt(routineSetsInput.value); const reps = routineRepsInput.value.trim(); const breakTime = parseInt(routineBreakInput.value);
    if (isNaN(sets) || sets <= 0 || !reps) { alert("Please enter valid sets and reps."); return; }
    const exerciseData = allData.exerciseDatabase.find(ex => ex.id === selectedId);
    const exerciseForRoutine = { ...exerciseData, sets, reps, breakTime, instanceId: Date.now() };
    routineBuilderState.exercises.push(exerciseForRoutine);
    routineExerciseSelect.value = '';
    renderRoutineBuilderList();
}

function renderRoutineBuilderList() {
    routineBuilderList.innerHTML = '';
    routineBuilderState.exercises.forEach(ex => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'routine-builder-item';
        itemDiv.innerHTML = `<div class="routine-builder-item-main"><img src="${ex.image || ''}" class="db-item-thumbnail" style="${!ex.image ? 'background-color: var(--color-background);' : ''}"><div<span class="routine-builder-item-name">${ex.name}</span><small class="routine-builder-item-details">${ex.sets} sets × ${ex.reps} reps • ${ex.breakTime}s break</small></div></div><button type="button" class="item-action-btn delete-btn" data-instance-id="${ex.instanceId}">×</button>`;
        routineBuilderList.appendChild(itemDiv);
    });
    validateRoutineForm();
}

function validateRoutineForm() { const name = routineNameInput.value.trim(); const hasExercises = routineBuilderState.exercises.length > 0; saveRoutineBtn.disabled = !(name && hasExercises); }

function handleSaveRoutine(event) {
    event.preventDefault(); const name = routineNameInput.value.trim();
    if (routineEditingState.isEditing) {
        const routineToUpdate = allData.routines.find(r => r.id === routineEditingState.id);
        if (routineToUpdate) { routineToUpdate.name = name; routineToUpdate.exercises = routineBuilderState.exercises; }
    } else {
        const newRoutine = { id: Date.now(), name, exercises: routineBuilderState.exercises };
        allData.routines.push(newRoutine);
    }
    saveDataToLocalStorage(); renderSavedRoutines(); resetRoutineForm();
}

function resetRoutineForm() { createRoutineForm.reset(); routineBuilderState = { exercises: [] }; routineEditingState = { isEditing: false, id: null }; routineEditingIdInput.value = ''; saveRoutineBtn.textContent = 'Save Routine'; renderRoutineBuilderList(); }

// --- 6. EVENT LISTENERS ---
navLog.addEventListener('click', () => showPage('log-page')); navRoutines.addEventListener('click', () => showPage('routines-page')); navExercises.addEventListener('click', () => showPage('exercises-page')); navReports.addEventListener('click', () => showPage('reports-page'));
addExerciseDbForm.addEventListener('submit', handleAddOrUpdateDbEntry); addExerciseDbForm.addEventListener('input', validateDbForm);
dbSortSelect.addEventListener('change', e => { currentDbSort = e.target.value; renderExerciseDatabase(); });
dbExerciseImageInput.addEventListener('change', e => { const f = e.target.files[0]; if(f){ const r = new FileReader(); r.onload = e => { currentExerciseImage = e.target.result; dbExerciseThumbnail.src = e.target.result; dbExerciseThumbnail.classList.remove('hidden'); removeDbImageBtn.classList.remove('hidden'); }; r.readAsDataURL(f); }});
removeDbImageBtn.addEventListener('click', () => { currentExerciseImage = null; dbExerciseImageInput.value = ''; dbExerciseThumbnail.classList.add('hidden'); removeDbImageBtn.classList.add('hidden'); });
dbExerciseThumbnail.addEventListener('click', () => { if (dbExerciseThumbnail.src) { fullSizeImage.src = dbExerciseThumbnail.src; openModal(imageViewerModal); }});
dbExerciseListDiv.addEventListener('click', e => { const t = e.target; if (t.closest('.item-action-btn')) { const id = parseInt(t.dataset.id); if (t.classList.contains('edit-btn')) { const ex = allData.exerciseDatabase.find(e => e.id === id); if (ex) { resetDbForm(); dbEditingIdInput.value = ex.id; dbExerciseNameInput.value = ex.name; dbExerciseTypeSelect.value = ex.type; if (ex.image) { dbExerciseThumbnail.src = ex.image; dbExerciseThumbnail.classList.remove('hidden'); removeDbImageBtn.classList.remove('hidden'); currentExerciseImage = ex.image; } dbSubmitBtn.textContent = 'Update Exercise'; dbEditingState = { isEditing: true, id }; validateDbForm(); window.scrollTo(0,0); dbExerciseNameInput.focus(); } } else if (t.classList.contains('delete-btn')) { if (confirm('Are you sure?')) { allData.exerciseDatabase = allData.exerciseDatabase.filter(ex => ex.id !== id); saveDataToLocalStorage(); renderExerciseDatabase(); if (dbEditingState.id === id) resetDbForm(); } } } else if (t.classList.contains('db-item-thumbnail')) { const id = parseInt(t.dataset.id); const ex = allData.exerciseDatabase.find(e => e.id === id); if (ex && ex.image) { fullSizeImage.src = ex.image; openModal(imageViewerModal); } } });

addExerciseToBuilderBtn.addEventListener('click', handleAddExerciseToBuilder);
createRoutineForm.addEventListener('submit', handleSaveRoutine);
routineNameInput.addEventListener('input', validateRoutineForm);
routineBuilderList.addEventListener('click', e => { if(e.target.matches('.delete-btn')) { const instanceId = parseInt(e.target.dataset.instanceId); routineBuilderState.exercises = routineBuilderState.exercises.filter(ex => ex.instanceId !== instanceId); renderRoutineBuilderList(); } });

savedRoutinesList.addEventListener('click', e => {
    const t = e.target.closest('.item-action-btn'); if (!t) return;
    const id = parseInt(t.dataset.id);
    if (t.classList.contains('delete-btn')) { if (confirm('Are you sure you want to delete this routine?')) { allData.routines = allData.routines.filter(r => r.id !== id); saveDataToLocalStorage(); renderSavedRoutines(); if (routineEditingState.id === id) resetRoutineForm(); } }
    else if (t.classList.contains('edit-btn')) {
        const routine = allData.routines.find(r => r.id === id); if (routine) { resetRoutineForm(); routineEditingState = { isEditing: true, id }; routineEditingIdInput.value = id; routineNameInput.value = routine.name; routineBuilderState.exercises = [...routine.exercises]; renderRoutineBuilderList(); saveRoutineBtn.textContent = 'Update Routine'; window.scrollTo(0, 0); }
    }
});

document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) { allModals.forEach(closeModal); } });

// --- 7. INITIALIZE APP ---
function initializeApp() { loadDataFromLocalStorage(); showPage('log-page'); validateDbForm(); validateRoutineForm(); }
initializeApp();