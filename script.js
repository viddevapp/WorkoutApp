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
const navWorkout = document.getElementById('nav-workout'), navRoutines = document.getElementById('nav-routines'), navExercises = document.getElementById('nav-exercises');
const workoutPage = document.getElementById('workout-page'), routinesPage = document.getElementById('routines-page'), exercisesPage = document.getElementById('exercises-page');
const addExerciseDbForm = document.getElementById('add-exercise-db-form'), dbEditingIdInput = document.getElementById('db-editing-id'), dbExerciseNameInput = document.getElementById('db-exercise-name'), dbExerciseTypeSelect = document.getElementById('db-exercise-type'), dbExerciseImageInput = document.getElementById('db-exercise-image-input'), dbExerciseThumbnail = document.getElementById('db-exercise-thumbnail'), removeDbImageBtn = document.getElementById('remove-db-image-btn'), dbSubmitBtn = document.getElementById('db-submit-btn'), dbExerciseListDiv = document.getElementById('db-exercise-list'), dbSortSelect = document.getElementById('db-sort-select');
const createRoutineForm = document.getElementById('create-routine-form'), routineEditingIdInput = document.getElementById('routine-editing-id'), routineNameInput = document.getElementById('routine-name-input'), routineExerciseSelect = document.getElementById('routine-exercise-select'), routineSetsInput = document.getElementById('routine-sets-input'), routineRepsInput = document.getElementById('routine-reps-input'), routineBreakInput = document.getElementById('routine-break-input'), addExerciseToBuilderBtn = document.getElementById('add-exercise-to-builder-btn'), routineBuilderList = document.getElementById('routine-builder-list'), saveRoutineBtn = document.getElementById('save-routine-btn'), savedRoutinesList = document.getElementById('saved-routines-list');
const dailyRoutineSelect = document.getElementById('daily-routine-select'), startRoutineBtn = document.getElementById('start-routine-btn'), activeRoutineDisplay = document.getElementById('active-routine-display'), routineSelectionArea = document.getElementById('routine-selection-area'), activeRoutineInfo = document.getElementById('active-routine-info'), activeRoutineName = document.getElementById('active-routine-name'), finishWorkoutBtn = document.getElementById('finish-workout-btn');
const imageViewerModal = document.getElementById('image-viewer-modal'), fullSizeImage = document.getElementById('full-size-image'), allModals = document.querySelectorAll('.modal');
const dateDisplayBtn = document.getElementById('date-display-btn'), prevDayBtn = document.getElementById('prev-day-btn'), nextDayBtn = document.getElementById('next-day-btn');


// --- 2. CORE LOGIC & HELPER FUNCTIONS ---
function showPage(pageId) { document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active')); document.getElementById(pageId).classList.add('active'); document.getElementById(`nav-${pageId.split('-')[0]}`).classList.add('active'); renderCurrentPage(); }
function validateDbForm() { const name = dbExerciseNameInput.value.trim(), type = dbExerciseTypeSelect.value; dbSubmitBtn.disabled = !(name && type); }
function resetDbForm() { addExerciseDbForm.reset(); currentExerciseImage = null; dbEditingIdInput.value = ''; dbExerciseThumbnail.classList.add('hidden'); removeDbImageBtn.classList.add('hidden'); dbExerciseThumbnail.src = ''; dbSubmitBtn.textContent = 'Save to Exercise List'; dbEditingState = { isEditing: false, id: null }; validateDbForm(); }
function saveDataToLocalStorage() { try { localStorage.setItem('workoutTrackerData', JSON.stringify(allData)); } catch (error) { console.error("Could not save data", error); } }
function loadDataFromLocalStorage() { const d = localStorage.getItem('workoutTrackerData'); if (d) { try { const p = JSON.parse(d); if (p.exerciseDatabase && p.history && p.userGoals) { allData = p; if (!allData.routines) allData.routines = []; } } catch (e) { console.error("Could not parse data", e); } } }
function openModal(modalElement) { modalElement.classList.remove('hidden'); }
function closeModal(modalElement) { modalElement.classList.add('hidden'); }
function getFormattedDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }

// --- 3. RENDERING FUNCTIONS ---
function renderCurrentPage() {
    const activePageId = document.querySelector('.page.active').id;
    if (activePageId === 'exercises-page') { renderExerciseDatabase(); }
    if (activePageId === 'routines-page') { populateExerciseDropdown(); renderSavedRoutines(); }
    if (activePageId === 'workout-page') { populateDailyRoutineDropdown(); renderActiveWorkout(); renderDateControls(); }
}

function renderDateControls() {
    const today = new Date(); today.setHours(0,0,0,0); currentDate.setHours(0,0,0,0);
    const isToday = currentDate.getTime() === today.getTime();
    dateDisplayBtn.textContent = isToday ? 'Today' : currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    nextDayBtn.disabled = currentDate >= today;
}

function renderExerciseDatabase() {
    dbExerciseListDiv.innerHTML = ''; if (allData.exerciseDatabase.length === 0) { dbExerciseListDiv.innerHTML = `<div class="db-exercise-item" style="justify-content: center; color: var(--color-text-tertiary);">Your exercise list is empty.</div>`; return; }
    const sortedDb = [...allData.exerciseDatabase];
    switch (currentDbSort) { case 'name-desc': sortedDb.sort((a, b) => b.name.localeCompare(a.name)); break; case 'type-asc': sortedDb.sort((a, b) => a.type.localeCompare(b.type)); break; default: sortedDb.sort((a, b) => a.name.localeCompare(a.name)); break; }
    sortedDb.forEach(ex => { const i = document.createElement('div'); i.className = 'db-exercise-item'; i.innerHTML = `${ex.image ? `<img src="${ex.image}" alt="${ex.name}" class="db-item-thumbnail" data-id="${ex.id}">` : '<div class="db-item-thumbnail" style="background-color: var(--color-background);"></div>'}<div class="exercise-item-main"><span class="exercise-item-name">${ex.name}</span><small class="exercise-item-stats">${ex.type}</small></div><div class="item-actions"><button class="item-action-btn edit-btn" data-id="${ex.id}">Edit</button><button class="item-action-btn delete-btn" data-id="${ex.id}">Delete</button></div>`; dbExerciseListDiv.appendChild(i); });
}

function populateExerciseDropdown() { routineExerciseSelect.innerHTML = `<option value="" disabled selected>Choose an exercise...</option>`; allData.exerciseDatabase.forEach(ex => { const o = document.createElement('option'); o.value = ex.id; o.textContent = ex.name; routineExerciseSelect.appendChild(o); }); }
function populateDailyRoutineDropdown() { dailyRoutineSelect.innerHTML = `<option value="" disabled selected>Select a routine to begin...</option>`; allData.routines.forEach(r => { const o = document.createElement('option'); o.value = r.id; o.textContent = r.name; dailyRoutineSelect.appendChild(o); }); }

function renderSavedRoutines() {
    savedRoutinesList.innerHTML = ''; if (allData.routines.length === 0) { savedRoutinesList.innerHTML = `<div class="db-exercise-item" style="justify-content: center; color: var(--color-text-tertiary);">You haven't created any routines yet.</div>`; return; }
    allData.routines.forEach(r => { const i = document.createElement('div'); i.className = 'db-exercise-item'; const sets = r.exercises.reduce((s, ex) => s + parseInt(ex.sets), 0); i.innerHTML = `<div class="exercise-item-main"><span class="exercise-item-name">${r.name}</span><small class="exercise-item-stats">${r.exercises.length} exercises • ${sets} total sets</small></div><div class="item-actions"><button class="item-action-btn edit-btn" data-id="${r.id}">Edit</button><button class="item-action-btn delete-btn" data-id="${r.id}">Delete</button></div>`; savedRoutinesList.appendChild(i); });
}

function renderActiveWorkout() {
    const dateKey = getFormattedDate(currentDate);
    const workoutData = allData.history[dateKey];

    if (!workoutData || !workoutData.routine) {
        routineSelectionArea.classList.remove('hidden');
        activeRoutineInfo.classList.add('hidden');
        activeRoutineDisplay.innerHTML = `<div class="placeholder-card">Select a routine and click "Start" to see your exercises.</div>`;
    } else {
        routineSelectionArea.classList.add('hidden');
        activeRoutineInfo.classList.remove('hidden');
        activeRoutineName.textContent = workoutData.routine.name;
        activeRoutineDisplay.innerHTML = '';

        let isCurrentExerciseFound = false;
        workoutData.routine.exercises.forEach((exercise, index) => {
            const progress = workoutData.progress[index];
            const isFinished = progress.setsCompleted >= exercise.sets;
            let isCurrent = false;

            if (!isFinished && !isCurrentExerciseFound) {
                isCurrent = true;
                isCurrentExerciseFound = true;
            }

            const itemDiv = document.createElement('div');
            itemDiv.className = `card active-routine-exercise ${isCurrent ? 'current' : ''} ${isFinished ? 'finished' : ''}`;
            itemDiv.dataset.instanceId = exercise.instanceId;
            
            let setIndicatorsHTML = '';
            for (let i = 0; i < exercise.sets; i++) {
                setIndicatorsHTML += `<div class="set-indicator ${i < progress.setsCompleted ? 'completed' : ''}"></div>`;
            }

            itemDiv.innerHTML = `
                <div class="exercise-header">
                    <div class="exercise-item-main">
                        <span class="exercise-item-name">${exercise.name}</span>
                        <small class="exercise-item-stats">${exercise.sets} sets × ${exercise.reps} reps</small>
                    </div>
                    <div class="set-indicators">${setIndicatorsHTML}</div>
                </div>
                <div class="exercise-actions">
                    <button class="btn-secondary start-set-btn" ${isFinished || !isCurrent ? 'disabled' : ''}>Start Set</button>
                    <button class="btn-primary complete-set-btn" ${isFinished || !isCurrent ? 'disabled' : ''}>Complete Set</button>
                </div>
            `;
            activeRoutineDisplay.appendChild(itemDiv);
        });
    }
}


// --- 4. EVENT HANDLER FUNCTIONS ---
function handleAddOrUpdateDbEntry(event) { event.preventDefault(); const name = dbExerciseNameInput.value.trim(), type = dbExerciseTypeSelect.value; if (dbEditingState.isEditing) { const ex = allData.exerciseDatabase.find(e => e.id === dbEditingState.id); if (ex) { ex.name = name; ex.type = type; ex.image = currentExerciseImage; } } else { const newEx = { id: Date.now(), name, type, image: currentExerciseImage }; allData.exerciseDatabase.push(newEx); } saveDataToLocalStorage(); renderExerciseDatabase(); resetDbForm(); }
function handleAddExerciseToBuilder() { const id = parseInt(routineExerciseSelect.value); if (isNaN(id)) { alert("Please select an exercise."); return; } const sets = parseInt(routineSetsInput.value); const reps = routineRepsInput.value.trim(); const breakTime = parseInt(routineBreakInput.value); if (isNaN(sets) || sets <= 0 || !reps) { alert("Please enter valid sets and reps."); return; } const exData = allData.exerciseDatabase.find(ex => ex.id === id); const exForRoutine = { ...exData, sets, reps, breakTime, instanceId: Date.now() }; routineBuilderState.exercises.push(exForRoutine); routineExerciseSelect.value = ''; renderRoutineBuilderList(); }
function renderRoutineBuilderList() { routineBuilderList.innerHTML = ''; routineBuilderState.exercises.forEach(ex => { const i = document.createElement('div'); i.className = 'routine-builder-item'; i.innerHTML = `<div class="routine-builder-item-main"><img src="${ex.image || ''}" class="db-item-thumbnail" style="${!ex.image ? 'background-color: var(--color-background);' : ''}"><div><span class="routine-builder-item-name">${ex.name}</span><small class="routine-builder-item-details">${ex.sets} sets × ${ex.reps} reps • ${ex.breakTime}s break</small></div></div><button type="button" class="item-action-btn delete-btn" data-instance-id="${ex.instanceId}">×</button>`; routineBuilderList.appendChild(i); }); validateRoutineForm(); }
function validateRoutineForm() { const name = routineNameInput.value.trim(); const hasExercises = routineBuilderState.exercises.length > 0; saveRoutineBtn.disabled = !(name && hasExercises); }
function handleSaveRoutine(event) { event.preventDefault(); const name = routineNameInput.value.trim(); if (routineEditingState.isEditing) { const r = allData.routines.find(r => r.id === routineEditingState.id); if (r) { r.name = name; r.exercises = routineBuilderState.exercises; } } else { const newRoutine = { id: Date.now(), name, exercises: routineBuilderState.exercises }; allData.routines.push(newRoutine); } saveDataToLocalStorage(); renderSavedRoutines(); resetRoutineForm(); }
function resetRoutineForm() { createRoutineForm.reset(); routineBuilderState = { exercises: [] }; routineEditingState = { isEditing: false, id: null }; routineEditingIdInput.value = ''; saveRoutineBtn.textContent = 'Save Routine'; renderRoutineBuilderList(); }
function changeDate(days) { currentDate.setDate(currentDate.getDate() + days); renderCurrentPage(); }

// --- 6. EVENT LISTENERS ---
navWorkout.addEventListener('click', () => showPage('workout-page'));
navRoutines.addEventListener('click', () => showPage('routines-page'));
navExercises.addEventListener('click', () => showPage('exercises-page'));
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
savedRoutinesList.addEventListener('click', e => { const t = e.target.closest('.item-action-btn'); if (!t) return; const id = parseInt(t.dataset.id); if (t.classList.contains('delete-btn')) { if (confirm('Are you sure you want to delete this routine?')) { allData.routines = allData.routines.filter(r => r.id !== id); saveDataToLocalStorage(); renderSavedRoutines(); if (routineEditingState.id === id) resetRoutineForm(); } } else if (t.classList.contains('edit-btn')) { const r = allData.routines.find(r => r.id === id); if (r) { resetRoutineForm(); routineEditingState = { isEditing: true, id }; routineEditingIdInput.value = id; routineNameInput.value = r.name; routineBuilderState.exercises = JSON.parse(JSON.stringify(r.exercises)); renderRoutineBuilderList(); saveRoutineBtn.textContent = 'Update Routine'; window.scrollTo(0, 0); } } });

dailyRoutineSelect.addEventListener('change', () => { startRoutineBtn.disabled = !dailyRoutineSelect.value; });
startRoutineBtn.addEventListener('click', () => {
    const routineId = parseInt(dailyRoutineSelect.value);
    const routine = allData.routines.find(r => r.id === routineId);
    if (routine) {
        const dateKey = getFormattedDate(currentDate);
        allData.history[dateKey] = {
            routine: JSON.parse(JSON.stringify(routine)),
            progress: routine.exercises.map(ex => ({ instanceId: ex.instanceId, setsCompleted: 0 }))
        };
        saveDataToLocalStorage();
        renderActiveWorkout();
    }
});

activeRoutineDisplay.addEventListener('click', e => {
    if(e.target.classList.contains('complete-set-btn')) {
        const instanceId = parseInt(e.target.closest('.active-routine-exercise').dataset.instanceId);
        const dateKey = getFormattedDate(currentDate);
        const workoutData = allData.history[dateKey];
        const progress = workoutData.progress.find(p => p.instanceId === instanceId);
        if(progress) {
            progress.setsCompleted++;
            saveDataToLocalStorage();
            renderActiveWorkout();
        }
    }
});
finishWorkoutBtn.addEventListener('click', () => {
    if(confirm("Are you sure you want to finish and log this workout?")) {
        const dateKey = getFormattedDate(currentDate);
        delete allData.history[dateKey]; // Or mark as complete, for now we just remove the active state
        saveDataToLocalStorage();
        renderActiveWorkout();
    }
});

prevDayBtn.addEventListener('click', () => changeDate(-1));
nextDayBtn.addEventListener('click', () => changeDate(1));
dateDisplayBtn.addEventListener('click', () => { if (dateDisplayBtn.disabled) return; currentDate = new Date(); renderCurrentPage(); });
document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) { allModals.forEach(closeModal); } });

// --- 7. INITIALIZE APP ---
function initializeApp() { loadDataFromLocalStorage(); showPage('workout-page'); validateDbForm(); validateRoutineForm(); }
initializeApp();