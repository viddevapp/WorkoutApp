// --- 1. GLOBAL STATE AND REFERENCES ---
let currentDate = new Date(), currentExerciseImage = null;
let dbEditingState = { isEditing: false, id: null };
let routineEditingState = { isEditing: false, id: null };
let currentDbSort = 'name-asc';
let routineBuilderState = { exercises: [] };
let countdownIntervalId = null; 
let stopwatchIntervalId = null;
let currentStopwatchInstanceId = null;

let allData = {
    exerciseDatabase: [],
    routines: [],
    history: {},
    userGoals: { volume: 10000, sets: 25 }
};

// --- REFERENCES TO HTML ELEMENTS ---
const navWorkout = document.getElementById('nav-workout'), navRoutines = document.getElementById('nav-routines'), navExercises = document.getElementById('nav-exercises');
const workoutPage = document.getElementById('workout-page'), routinesPage = document.getElementById('routines-page'), exercisesPage = document.getElementById('exercises-page');
const addExerciseDbForm = document.getElementById('add-exercise-db-form'), dbEditingIdInput = document.getElementById('db-editing-id'), dbExerciseNameInput = document.getElementById('db-exercise-name'), dbExerciseTypeSelect = document.getElementById('db-exercise-type'), dbExerciseTrackType = document.getElementById('db-exercise-track-type'), dbExerciseImageInput = document.getElementById('db-exercise-image-input'), dbExerciseThumbnail = document.getElementById('db-exercise-thumbnail'), removeDbImageBtn = document.getElementById('remove-db-image-btn'), dbSubmitBtn = document.getElementById('db-submit-btn'), dbExerciseListDiv = document.getElementById('db-exercise-list'), dbSortSelect = document.getElementById('db-sort-select');
const createRoutineForm = document.getElementById('create-routine-form'), routineEditingIdInput = document.getElementById('routine-editing-id'), routineNameInput = document.getElementById('routine-name-input'), routineExerciseSelect = document.getElementById('routine-exercise-select'), routineSetsInput = document.getElementById('routine-sets-input'), routineRepsInput = document.getElementById('routine-reps-input'), addExerciseToBuilderBtn = document.getElementById('add-exercise-to-builder-btn'), routineBuilderList = document.getElementById('routine-builder-list'), saveRoutineBtn = document.getElementById('save-routine-btn'), savedRoutinesList = document.getElementById('saved-routines-list');
const routineTrackTypeToggle = document.getElementById('routine-track-type-toggle'), repsBasedInputs = document.getElementById('reps-based-inputs'), timeBasedInputs = document.getElementById('time-based-inputs'), routineTimeSetsInput = document.getElementById('routine-time-sets-input'), routineDurationInput = document.getElementById('routine-duration-input');
const dailyRoutineSelect = document.getElementById('daily-routine-select'), startRoutineBtn = document.getElementById('start-routine-btn'), activeRoutineDisplay = document.getElementById('active-routine-display'), routineSelectionArea = document.getElementById('routine-selection-area'), activeRoutineInfo = document.getElementById('active-routine-info'), activeRoutineName = document.getElementById('active-routine-name');
const imageViewerModal = document.getElementById('image-viewer-modal'), fullSizeImage = document.getElementById('full-size-image'), allModals = document.querySelectorAll('.modal');
const dateDisplayBtn = document.getElementById('date-display-btn'), prevDayBtn = document.getElementById('prev-day-btn'), nextDayBtn = document.getElementById('next-day-btn');
const actionsMenuBtn = document.getElementById('actions-menu-btn'), actionsDropdown = document.getElementById('actions-dropdown'), importDataBtn = document.getElementById('import-data-btn'), exportDataBtn = document.getElementById('export-data-btn'), fileLoaderInput = document.getElementById('file-loader');
const countdownModal = document.getElementById('countdown-modal'), countdownTimerDisplay = document.getElementById('countdown-timer-display');
const stopwatchModal = document.getElementById('stopwatch-modal'), stopwatchExerciseName = document.getElementById('stopwatch-exercise-name'), stopwatchTimerDisplay = document.getElementById('stopwatch-timer-display'), stopwatchActionBtn = document.getElementById('stopwatch-action-btn'), stopwatchCancelBtn = document.getElementById('stopwatch-cancel-btn');


// --- 2. CORE LOGIC & HELPER FUNCTIONS ---
function showPage(pageId) { document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active')); document.getElementById(pageId).classList.add('active'); document.getElementById(`nav-${pageId.split('-')[0]}`).classList.add('active'); closeStopwatchModal(true); renderCurrentPage(); }
function validateDbForm() { const name = dbExerciseNameInput.value.trim(), type = dbExerciseTypeSelect.value, trackType = dbExerciseTrackType.value; dbSubmitBtn.disabled = !(name && type && trackType); }
function resetDbForm() { addExerciseDbForm.reset(); currentExerciseImage = null; dbEditingIdInput.value = ''; dbExerciseThumbnail.classList.add('hidden'); removeDbImageBtn.classList.add('hidden'); dbExerciseThumbnail.src = ''; dbSubmitBtn.textContent = 'Save to Exercise List'; dbEditingState = { isEditing: false, id: null }; validateDbForm(); }
function saveDataToLocalStorage() { try { localStorage.setItem('workoutTrackerData', JSON.stringify(allData)); } catch (error) { console.error("Could not save data", error); alert("Error saving data. Storage might be full.");} }
function loadDataFromLocalStorage() { const d = localStorage.getItem('workoutTrackerData'); if (d) { try { const p = JSON.parse(d); if (p.exerciseDatabase && p.history && p.userGoals) { allData = p; if (!allData.routines) allData.routines = []; } } catch (e) { console.error("Could not parse data", e); } } }
function openModal(modalElement) { modalElement.classList.remove('hidden'); }
function closeModal(modalElement) { modalElement.classList.add('hidden'); }
function getFormattedDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function compressImage(file, maxWidth = 600, maxHeight = 600, quality = 0.7) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = event => { const img = new Image(); img.src = event.target.result; img.onload = () => { const canvas = document.createElement('canvas'); let width = img.width; let height = img.height; if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } } else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } } canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', quality)); }; img.onerror = error => reject(error); }; reader.onerror = error => reject(error); }); }
function startCountdown(duration) { clearInterval(countdownIntervalId); let remaining = duration; countdownTimerDisplay.textContent = remaining; openModal(countdownModal); countdownIntervalId = setInterval(() => { remaining--; if (remaining >= 0) { countdownTimerDisplay.textContent = remaining; } else { closeCountdownModal(); } }, 1000); }
function closeCountdownModal() { clearInterval(countdownIntervalId); countdownIntervalId = null; closeModal(countdownModal); }
function formatStopwatchTime(ms) { const totalSeconds = Math.floor(ms / 1000); const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0'); const seconds = (totalSeconds % 60).toString().padStart(2, '0'); const milliseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, '0'); return `${minutes}:${seconds}.${milliseconds}`; }

// --- 3. RENDERING FUNCTIONS ---
function renderCurrentPage() { const id = document.querySelector('.page.active').id; if (id === 'exercises-page') renderExerciseDatabase(); if (id === 'routines-page') { populateExerciseDropdown(); renderSavedRoutines(); handleRoutineExerciseChange(); } if (id === 'workout-page') { populateDailyRoutineDropdown(); renderWorkoutPage(); } renderDateControls(); }
function renderDateControls() { const today = new Date(); today.setHours(0,0,0,0); currentDate.setHours(0,0,0,0); const isToday = currentDate.getTime() === today.getTime(); dateDisplayBtn.textContent = isToday ? 'Today' : currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); nextDayBtn.disabled = currentDate >= today; }
function renderExerciseDatabase() { dbExerciseListDiv.innerHTML = ''; if (allData.exerciseDatabase.length === 0) { dbExerciseListDiv.innerHTML = `<div class="db-exercise-item" style="justify-content: center; color: var(--color-text-tertiary);">Your exercise list is empty.</div>`; return; } const sortedDb = [...allData.exerciseDatabase]; switch (currentDbSort) { case 'name-desc': sortedDb.sort((a, b) => b.name.localeCompare(a.name)); break; case 'type-asc': sortedDb.sort((a, b) => a.type.localeCompare(b.type)); break; default: sortedDb.sort((a, b) => a.name.localeCompare(a.name)); break; } sortedDb.forEach(ex => { const i = document.createElement('div'); i.className = 'db-exercise-item'; i.innerHTML = `${ex.image ? `<img src="${ex.image}" alt="${ex.name}" class="db-item-thumbnail" data-id="${ex.id}">` : '<div class="db-item-thumbnail" style="background-color: var(--color-background);"></div>'}<div class="exercise-item-main"><span class="exercise-item-name">${ex.name}</span><small class="exercise-item-stats">${ex.type} • ${ex.trackType || 'reps'}</small></div><div class="item-actions"><button class="item-action-btn edit-btn" data-id="${ex.id}">Edit</button><button class="item-action-btn delete-btn" data-id="${ex.id}">Delete</button></div>`; dbExerciseListDiv.appendChild(i); }); }
function populateExerciseDropdown() { routineExerciseSelect.innerHTML = `<option value="" disabled selected>Choose an exercise...</option>`; allData.exerciseDatabase.forEach(ex => { const o = document.createElement('option'); o.value = ex.id; o.textContent = ex.name; routineExerciseSelect.appendChild(o); }); }
function populateDailyRoutineDropdown() { dailyRoutineSelect.innerHTML = `<option value="" disabled selected>Select a routine to begin...</option>`; allData.routines.forEach(r => { const o = document.createElement('option'); o.value = r.id; o.textContent = r.name; dailyRoutineSelect.appendChild(o); }); }
function renderSavedRoutines() { savedRoutinesList.innerHTML = ''; if (allData.routines.length === 0) { savedRoutinesList.innerHTML = `<div class="db-exercise-item" style="justify-content: center; color: var(--color-text-tertiary);">You haven't created any routines yet.</div>`; return; } allData.routines.forEach(r => { const i = document.createElement('div'); i.className = 'db-exercise-item'; const sets = r.exercises.reduce((s, ex) => s + parseInt(ex.sets), 0); i.innerHTML = `<div class="exercise-item-main"><span class="exercise-item-name">${r.name}</span><small class="exercise-item-stats">${r.exercises.length} exercises • ${sets} total sets</small></div><div class="item-actions"><button class="item-action-btn edit-btn" data-id="${r.id}">Edit</button><button class="item-action-btn delete-btn" data-id="${r.id}">Delete</button></div>`; savedRoutinesList.appendChild(i); }); }
function renderWorkoutPage() {
    const dateKey = getFormattedDate(currentDate);
    const workoutData = allData.history[dateKey];
    if (!workoutData) { routineSelectionArea.classList.remove('hidden'); activeRoutineInfo.classList.add('hidden'); activeRoutineDisplay.innerHTML = `<div class="placeholder-card">Select a routine and click "Start" to see your exercises.</div>`; return; }
    
    if (workoutData.isComplete) {
        routineSelectionArea.classList.add('hidden');
        activeRoutineInfo.classList.add('hidden');
        let summaryHTML = `<div class="card workout-summary-card"><div class="summary-header"><h2>${workoutData.routine.name} - Completed!</h2><button class="btn-primary" id="start-new-workout-btn">Start New Workout</button></div><div class="summary-exercise-list">`;
        
        workoutData.routine.exercises.forEach(exercise => {
            const progress = workoutData.progress.find(p => p.instanceId === exercise.instanceId);
            if (!progress.loggedData) progress.loggedData = [];

            const stats = exercise.trackType === 'time' ? `${exercise.sets} sets × ${exercise.duration} sec` : `${exercise.sets} sets × ${exercise.reps} reps`;
            let loggedDataHTML = '';

            if (exercise.trackType === 'time' && progress.loggedData.length > 0) {
                const loggedItems = progress.loggedData.map((time, index) => `<li class="logged-time-item">Set ${index + 1}: ${formatStopwatchTime(time)}</li>`).join('');
                loggedDataHTML = `<ul class="summary-logged-times">${loggedItems}</ul>`;
            }

            summaryHTML += `<div class="summary-exercise-item">
                <div>
                    <span class="exercise-item-name">${exercise.name}</span>
                    <small class="exercise-item-stats">${stats}</small>
                </div>
                ${loggedDataHTML}
            </div>`;
        });
        summaryHTML += `</div></div>`;
        activeRoutineDisplay.innerHTML = summaryHTML;
        return;
    }
    
    routineSelectionArea.classList.add('hidden');
    activeRoutineInfo.classList.remove('hidden');
    activeRoutineName.textContent = workoutData.routine.name;
    activeRoutineDisplay.innerHTML = '';
    let isCurrentExerciseFound = false;

    workoutData.routine.exercises.forEach(exercise => {
        const progress = workoutData.progress.find(p => p.instanceId === exercise.instanceId);
        if (!progress) return;
        if (!progress.timer) progress.timer = { enabled: false, duration: 30 };
        
        const isFinished = progress.setsCompleted >= exercise.sets;
        let isCurrent = false;
        if (!isFinished && !isCurrentExerciseFound) { isCurrent = true; isCurrentExerciseFound = true; }
        
        const itemDiv = document.createElement('div');
        itemDiv.className = `card active-routine-exercise ${isCurrent ? 'current' : ''} ${isFinished ? 'finished' : ''}`;
        itemDiv.dataset.instanceId = exercise.instanceId;
        
        let stats, trackingUI;
        if (exercise.trackType === 'time') {
            stats = `${progress.setsCompleted} / ${exercise.sets} Sets • ${exercise.duration} sec Target`;
            trackingUI = `<div class="exercise-actions"><button class="btn-primary start-stopwatch-modal-btn" ${isFinished || !isCurrent ? 'disabled' : ''}>Start Set ${progress.setsCompleted + 1}</button></div>`;
        } else {
            stats = `${exercise.sets} sets × ${exercise.reps} reps`;
            const buttonText = isFinished ? "All Sets Complete" : `Log Set ${progress.setsCompleted + 1}`;
            trackingUI = `<div class="exercise-actions">
                <div class="set-progress-display">${progress.setsCompleted} / ${exercise.sets} Sets Completed</div>
                <button class="btn-primary start-reps-set-btn" ${isFinished || !isCurrent ? 'disabled' : ''}>${buttonText}</button>
            </div>`;
        }
        
        const intervals = [15, 30, 45];
        const intervalButtonsHTML = intervals.map(time => `<button class="timer-interval-btn ${progress.timer.duration === time ? 'selected' : ''}" data-time="${time}" ${!progress.timer.enabled ? 'disabled' : ''}>${time}s</button>`).join('');
        
        itemDiv.innerHTML = `${exercise.image ? `<img src="${exercise.image}" alt="${exercise.name}" class="db-item-thumbnail" data-id="${exercise.id}">` : '<div class="db-item-thumbnail" style="background-color: var(--color-background);"></div>'}<div class="exercise-content"><div class="exercise-header"><div class="exercise-item-main"><span class="exercise-item-name">${exercise.name}</span><small class="exercise-item-stats">${stats}</small></div></div>${trackingUI}<div class="timer-controls"><div class="timer-toggle-area"><label for="timer-toggle-${exercise.instanceId}">Break Timer</label><label class="toggle-switch"><input type="checkbox" class="timer-toggle" id="timer-toggle-${exercise.instanceId}" ${progress.timer.enabled ? 'checked' : ''}><span class="toggle-slider"></span></label></div><div class="timer-intervals">${intervalButtonsHTML}</div></div></div>`;
        activeRoutineDisplay.appendChild(itemDiv);
    });
}


// --- 4. EVENT HANDLER FUNCTIONS ---
function handleAddOrUpdateDbEntry(event) { event.preventDefault(); const name = dbExerciseNameInput.value.trim(), type = dbExerciseTypeSelect.value, trackType = dbExerciseTrackType.value; if (dbEditingState.isEditing) { const ex = allData.exerciseDatabase.find(e => e.id === dbEditingState.id); if (ex) { ex.name = name; ex.type = type; ex.image = currentExerciseImage; ex.trackType = trackType; } } else { const newEx = { id: Date.now(), name, type, image: currentExerciseImage, trackType }; allData.exerciseDatabase.push(newEx); } saveDataToLocalStorage(); renderExerciseDatabase(); resetDbForm(); }
function handleRoutineExerciseChange() { const selectedId = parseInt(routineExerciseSelect.value); const exercise = allData.exerciseDatabase.find(ex => ex.id === selectedId); if (!exercise) { repsBasedInputs.classList.add('hidden'); timeBasedInputs.classList.add('hidden'); return; } if (exercise.trackType === 'time') { repsBasedInputs.classList.add('hidden'); timeBasedInputs.classList.remove('hidden'); } else { repsBasedInputs.classList.remove('hidden'); timeBasedInputs.classList.add('hidden'); } }
function handleAddExerciseToBuilder() { const id = parseInt(routineExerciseSelect.value); if (isNaN(id)) { alert("Please select an exercise."); return; } const exercise = allData.exerciseDatabase.find(ex => ex.id === id); if (!exercise) return; let exForRoutine; if (exercise.trackType === 'time') { const sets = parseInt(routineTimeSetsInput.value); const duration = parseInt(routineDurationInput.value); if (isNaN(sets) || sets <= 0 || isNaN(duration) || duration <= 0) { alert("Please enter valid sets and duration."); return; } exForRoutine = { exerciseId: id, sets, duration, trackType: 'time', instanceId: Date.now() + Math.random() }; } else { const sets = parseInt(routineSetsInput.value); const reps = routineRepsInput.value.trim(); if (isNaN(sets) || sets <= 0 || !reps) { alert("Please enter valid sets and reps."); return; } exForRoutine = { exerciseId: id, sets, reps, trackType: 'reps', instanceId: Date.now() + Math.random() }; } routineBuilderState.exercises.push(exForRoutine); routineExerciseSelect.value = ''; renderRoutineBuilderList(); }
function renderRoutineBuilderList() { routineBuilderList.innerHTML = ''; routineBuilderState.exercises.forEach(exRef => { const ex = allData.exerciseDatabase.find(dbEx => dbEx.id === exRef.exerciseId); if(ex) { const i = document.createElement('div'); i.className = 'routine-builder-item'; const details = exRef.trackType === 'time' ? `${exRef.sets} sets × ${exRef.duration} sec` : `${exRef.sets} sets × ${exRef.reps} reps`; i.innerHTML = `<div class="routine-builder-item-main"><img src="${ex.image || ''}" class="db-item-thumbnail" style="${!ex.image ? 'background-color: var(--color-background);' : ''}"><div><span class="routine-builder-item-name">${ex.name}</span><small class="routine-builder-item-details">${details}</small></div></div><button type="button" class="item-action-btn delete-btn" data-instance-id="${exRef.instanceId}">×</button>`; routineBuilderList.appendChild(i); } }); validateRoutineForm(); }
function validateRoutineForm() { const name = routineNameInput.value.trim(); const hasExercises = routineBuilderState.exercises.length > 0; saveRoutineBtn.disabled = !(name && hasExercises); }
function handleSaveRoutine(event) { event.preventDefault(); const name = routineNameInput.value.trim(); const exercisesToSave = routineBuilderState.exercises.map(ex => { const { exerciseId, sets, reps, duration, trackType } = ex; return trackType === 'time' ? { exerciseId, sets, duration, trackType } : { exerciseId, sets, reps, trackType }; }); if (routineEditingState.isEditing) { const r = allData.routines.find(r => r.id === routineEditingState.id); if (r) { r.name = name; r.exercises = exercisesToSave; } } else { const newRoutine = { id: Date.now(), name, exercises: exercisesToSave }; allData.routines.push(newRoutine); } saveDataToLocalStorage(); renderSavedRoutines(); resetRoutineForm(); }
function resetRoutineForm() { createRoutineForm.reset(); routineBuilderState = { exercises: [] }; routineEditingState = { isEditing: false, id: null }; routineEditingIdInput.value = ''; saveRoutineBtn.textContent = 'Save Routine'; handleRoutineExerciseChange(); renderRoutineBuilderList(); }
function changeDate(days) { currentDate.setDate(currentDate.getDate() + days); closeStopwatchModal(true); renderCurrentPage(); }
function exportDataToFile() { try { const dataAsString = JSON.stringify(allData, null, 2); const blob = new Blob([dataAsString], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `workout-tracker-backup-${getFormattedDate(new Date())}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); } catch (error) { console.error("Export failed:", error); alert("Could not export data."); } }
function importDataFromFile(event) { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function(e) { try { const importedData = JSON.parse(e.target.result); if (!importedData.exerciseDatabase || !importedData.history || !importedData.userGoals) { throw new Error("Invalid data file format."); } if (confirm("This will overwrite all current data. Are you sure you want to proceed?")) { allData = importedData; currentDate = new Date(); saveDataToLocalStorage(); renderCurrentPage(); alert("Data imported successfully!"); } } catch (error) { alert('Error reading or parsing file. Please make sure you selected a valid backup file.'); console.error(error); } finally { fileLoaderInput.value = ""; } }; reader.readAsText(file); }

// --- 5. STOPWATCH MODAL LOGIC ---
function openStopwatchModal(instanceId) {
    const dateKey = getFormattedDate(currentDate);
    const workoutData = allData.history[dateKey];
    const exercise = workoutData.routine.exercises.find(ex => ex.instanceId === instanceId);
    const progress = workoutData.progress.find(p => p.instanceId === instanceId);
    if (!exercise || !progress) return;

    currentStopwatchInstanceId = instanceId;
    progress.stopwatch.isRunning = true;
    progress.stopwatch.startTime = Date.now();
    
    stopwatchExerciseName.textContent = exercise.name;
    stopwatchTimerDisplay.textContent = formatStopwatchTime(0);
    stopwatchActionBtn.textContent = 'Stop';
    stopwatchActionBtn.classList.remove('log-state');
    openModal(stopwatchModal);

    stopwatchIntervalId = setInterval(() => {
        const elapsedTime = Date.now() - progress.stopwatch.startTime;
        stopwatchTimerDisplay.textContent = formatStopwatchTime(elapsedTime);
    }, 10);
}

function stopStopwatch() {
    const dateKey = getFormattedDate(currentDate);
    const progress = allData.history[dateKey].progress.find(p => p.instanceId === currentStopwatchInstanceId);
    
    clearInterval(stopwatchIntervalId);
    stopwatchIntervalId = null;
    progress.stopwatch.isRunning = false;
    progress.stopwatch.elapsedTime = Date.now() - progress.stopwatch.startTime;
    
    stopwatchTimerDisplay.textContent = formatStopwatchTime(progress.stopwatch.elapsedTime);
    stopwatchActionBtn.textContent = 'Log Set';
    stopwatchActionBtn.classList.add('log-state');
}

function logStopwatchSet() {
    const dateKey = getFormattedDate(currentDate);
    const workoutData = allData.history[dateKey];
    const exercise = workoutData.routine.exercises.find(ex => ex.instanceId === currentStopwatchInstanceId);
    const progress = workoutData.progress.find(p => p.instanceId === currentStopwatchInstanceId);

    progress.setsCompleted++;
    if (!progress.loggedData) progress.loggedData = [];
    progress.loggedData.push(progress.stopwatch.elapsedTime);

    if (progress.timer.enabled && progress.setsCompleted < exercise.sets) {
        startCountdown(progress.timer.duration);
    }
    
    closeStopwatchModal();
    saveDataToLocalStorage();
    renderWorkoutPage();
}

function closeStopwatchModal(force = false) {
    if (stopwatchIntervalId) { clearInterval(stopwatchIntervalId); stopwatchIntervalId = null; }
    if (currentStopwatchInstanceId && !force) {
        const dateKey = getFormattedDate(currentDate);
        const progress = allData.history[dateKey]?.progress.find(p => p.instanceId === currentStopwatchInstanceId);
        if (progress) { progress.stopwatch = { elapsedTime: 0, isRunning: false, startTime: 0 }; }
    }
    closeModal(stopwatchModal);
    currentStopwatchInstanceId = null;
}

// --- 6. EVENT LISTENERS ---
navWorkout.addEventListener('click', () => showPage('workout-page'));
navRoutines.addEventListener('click', () => showPage('routines-page'));
navExercises.addEventListener('click', () => showPage('exercises-page'));
addExerciseDbForm.addEventListener('submit', handleAddOrUpdateDbEntry);
addExerciseDbForm.addEventListener('input', validateDbForm);
dbSortSelect.addEventListener('change', e => { currentDbSort = e.target.value; renderExerciseDatabase(); });
dbExerciseImageInput.addEventListener('change', async (event) => { const file = event.target.files[0]; if (file) { try { const compressedDataUrl = await compressImage(file); currentExerciseImage = compressedDataUrl; dbExerciseThumbnail.src = compressedDataUrl; dbExerciseThumbnail.classList.remove('hidden'); removeDbImageBtn.classList.remove('hidden'); } catch (error) { console.error("Image compression failed:", error); alert("Could not process image."); } } });
removeDbImageBtn.addEventListener('click', () => { currentExerciseImage = null; dbExerciseImageInput.value = ''; dbExerciseThumbnail.classList.add('hidden'); removeDbImageBtn.classList.add('hidden'); });
dbExerciseThumbnail.addEventListener('click', () => { if (dbExerciseThumbnail.src) { fullSizeImage.src = dbExerciseThumbnail.src; openModal(imageViewerModal); }});
dbExerciseListDiv.addEventListener('click', e => { const t = e.target; if (t.closest('.item-action-btn')) { const id = parseInt(t.dataset.id); if (t.classList.contains('edit-btn')) { const ex = allData.exerciseDatabase.find(e => e.id === id); if (ex) { resetDbForm(); dbEditingIdInput.value = ex.id; dbExerciseNameInput.value = ex.name; dbExerciseTypeSelect.value = ex.type; dbExerciseTrackType.value = ex.trackType || 'reps'; if (ex.image) { dbExerciseThumbnail.src = ex.image; dbExerciseThumbnail.classList.remove('hidden'); removeDbImageBtn.classList.remove('hidden'); currentExerciseImage = ex.image; } dbSubmitBtn.textContent = 'Update Exercise'; dbEditingState = { isEditing: true, id }; validateDbForm(); window.scrollTo(0,0); dbExerciseNameInput.focus(); } } else if (t.classList.contains('delete-btn')) { if (confirm('Are you sure?')) { allData.exerciseDatabase = allData.exerciseDatabase.filter(ex => ex.id !== id); saveDataToLocalStorage(); renderExerciseDatabase(); if (dbEditingState.id === id) resetDbForm(); } } } else if (t.classList.contains('db-item-thumbnail')) { const id = parseInt(t.dataset.id); const ex = allData.exerciseDatabase.find(e => e.id === id); if (ex && ex.image) { fullSizeImage.src = ex.image; openModal(imageViewerModal); } } });

routineExerciseSelect.addEventListener('change', handleRoutineExerciseChange);
addExerciseToBuilderBtn.addEventListener('click', handleAddExerciseToBuilder);
createRoutineForm.addEventListener('submit', handleSaveRoutine);
routineNameInput.addEventListener('input', validateRoutineForm);
routineBuilderList.addEventListener('click', e => { if(e.target.matches('.delete-btn')) { const instanceId = parseFloat(e.target.dataset.instanceId); routineBuilderState.exercises = routineBuilderState.exercises.filter(ex => ex.instanceId !== instanceId); renderRoutineBuilderList(); } });
savedRoutinesList.addEventListener('click', e => { const t = e.target.closest('.item-action-btn'); if (!t) return; const id = parseInt(t.dataset.id); if (t.classList.contains('delete-btn')) { if (confirm('Are you sure you want to delete this routine?')) { allData.routines = allData.routines.filter(r => r.id !== id); saveDataToLocalStorage(); renderSavedRoutines(); if (routineEditingState.id === id) resetRoutineForm(); } } else if (t.classList.contains('edit-btn')) { const r = allData.routines.find(r => r.id === id); if (r) { resetRoutineForm(); routineEditingState = { isEditing: true, id }; routineEditingIdInput.value = id; routineNameInput.value = r.name; routineBuilderState.exercises = r.exercises.map(leanEx => ({ ...leanEx, instanceId: Date.now() + Math.random() })); renderRoutineBuilderList(); saveRoutineBtn.textContent = 'Update Routine'; window.scrollTo(0, 0); } } });
dailyRoutineSelect.addEventListener('change', () => { startRoutineBtn.disabled = !dailyRoutineSelect.value; });
startRoutineBtn.addEventListener('click', () => {
    const id = parseInt(dailyRoutineSelect.value);
    const sourceRoutine = allData.routines.find(r => r.id === id);
    if (sourceRoutine) {
        const dateKey = getFormattedDate(currentDate);
        const hydratedExercises = sourceRoutine.exercises.map(leanEx => { const fullEx = allData.exerciseDatabase.find(dbEx => dbEx.id === leanEx.exerciseId); return { ...fullEx, ...leanEx, instanceId: Date.now() + Math.random() }; });
        const progress = hydratedExercises.map(ex => ({ instanceId: ex.instanceId, setsCompleted: 0, loggedData: [], timer: { enabled: false, duration: 30 }, stopwatch: { elapsedTime: 0, isRunning: false, startTime: 0 } }));
        const workoutToLog = { name: sourceRoutine.name, id: sourceRoutine.id, exercises: hydratedExercises };
        allData.history[dateKey] = { routine: workoutToLog, progress, isComplete: false };
        saveDataToLocalStorage();
        renderWorkoutPage();
    }
});

activeRoutineInfo.addEventListener('click', e => {
    const dateKey = getFormattedDate(currentDate);
    if (e.target.id === 'finish-workout-btn') {
        if (confirm("Are you sure you want to finish and log this workout?")) { if (allData.history[dateKey]) { allData.history[dateKey].isComplete = true; closeStopwatchModal(true); saveDataToLocalStorage(); renderWorkoutPage(); } }
    }
    if (e.target.id === 'reset-workout-btn') {
        if (confirm("Are you sure you want to reset this workout? Your progress for today will be lost.")) { if (allData.history[dateKey]) { delete allData.history[dateKey]; closeStopwatchModal(true); saveDataToLocalStorage(); renderWorkoutPage(); } }
    }
});

activeRoutineDisplay.addEventListener('click', e => {
    const t = e.target;
    if (t.id === 'start-new-workout-btn') { if (confirm("This will clear today's completed log. Are you sure you want to start a new workout?")) { delete allData.history[getFormattedDate(currentDate)]; saveDataToLocalStorage(); renderWorkoutPage(); } return; }
    const card = t.closest('.active-routine-exercise');
    if (!card) return;
    const instanceId = parseFloat(card.dataset.instanceId);
    const dateKey = getFormattedDate(currentDate);
    const workoutData = allData.history[dateKey];
    if (!workoutData || !workoutData.progress) return;
    const progress = workoutData.progress.find(p => p.instanceId === instanceId);
    if (!progress) return;
    if (!progress.timer) { progress.timer = { enabled: false, duration: 30 }; }
    
    const exerciseData = workoutData.routine.exercises.find(ex => ex.instanceId === instanceId);
    if (!exerciseData) return;

    if (t.matches('.start-reps-set-btn')) {
        progress.setsCompleted++;
        if (progress.timer.enabled && progress.setsCompleted < exerciseData.sets) { startCountdown(progress.timer.duration); }
        saveDataToLocalStorage();
        renderWorkoutPage();
    } else if (t.matches('.start-stopwatch-modal-btn')) {
        openStopwatchModal(instanceId);
    } else if (t.matches('.timer-toggle')) {
        progress.timer.enabled = t.checked;
        saveDataToLocalStorage();
        renderWorkoutPage();
    } else if (t.matches('.timer-interval-btn')) {
        progress.timer.duration = parseInt(t.dataset.time);
        saveDataToLocalStorage();
        renderWorkoutPage();
    } else if (t.classList.contains('db-item-thumbnail')) {
        const id = parseInt(t.dataset.id);
        const ex = allData.exerciseDatabase.find(e => e.id === id);
        if (ex && ex.image) { fullSizeImage.src = ex.image; openModal(imageViewerModal); }
    }
});

stopwatchActionBtn.addEventListener('click', () => {
    if (stopwatchActionBtn.classList.contains('log-state')) {
        logStopwatchSet();
    } else {
        stopStopwatch();
    }
});
stopwatchCancelBtn.addEventListener('click', () => closeStopwatchModal());

prevDayBtn.addEventListener('click', () => changeDate(-1));
nextDayBtn.addEventListener('click', () => changeDate(1));
dateDisplayBtn.addEventListener('click', () => { if (dateDisplayBtn.disabled) return; currentDate = new Date(); renderCurrentPage(); });
document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) { allModals.forEach(closeModal); closeCountdownModal(); closeStopwatchModal(true); } });
fullSizeImage.addEventListener('click', () => closeModal(imageViewerModal));
countdownModal.addEventListener('click', e => { if (e.target.classList.contains('modal-content')) closeCountdownModal(); });
actionsMenuBtn.addEventListener('click', () => actionsDropdown.classList.toggle('hidden'));
exportDataBtn.addEventListener('click', () => { exportDataToFile(); actionsDropdown.classList.add('hidden'); });
importDataBtn.addEventListener('click', () => { fileLoaderInput.click(); actionsDropdown.classList.add('hidden'); });
fileLoaderInput.addEventListener('change', importDataFromFile);

// --- 7. INITIALIZE APP ---
function initializeApp() {
    loadDataFromLocalStorage();
    showPage('workout-page');
    validateDbForm();
    validateRoutineForm();
}
initializeApp();