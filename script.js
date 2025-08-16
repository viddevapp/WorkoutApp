// --- 1. GLOBAL STATE AND REFERENCES ---
let currentDate = new Date();
let routineEditingState = { isEditing: false, id: null };
let routineBuilderState = { exercises: [], selectedExerciseId: null };
let countdownIntervalId = null;
let countdownInitialDuration = 0;
let stopwatchIntervalId = null;
let currentStopwatchInstanceId = null;
let routineBuilderSortable = null, dailyWorkoutSortable = null, savedRoutinesSortable = null, routineDetailsSortable = null;
let swipeState = { openCardContent: null, instanceIdToSwap: null, instanceIdToEdit: null };
let exerciseToAdd = { id: null };
let activeRoutineDetails = { id: null };

let allData = {
    exerciseDatabase: [],
    routines: [],
    history: {},
    userGoals: { volume: 10000, sets: 25 }
};

// --- REFERENCES TO HTML ELEMENTS ---
const appContainer = document.getElementById('app-container');
const navWorkout = document.getElementById('nav-workout'), navRoutines = document.getElementById('nav-routines'), navExercises = document.getElementById('nav-exercises');
const workoutPage = document.getElementById('workout-page'), routinesPage = document.getElementById('routines-page'), exercisesPage = document.getElementById('exercises-page');
const dbExerciseListDiv = document.getElementById('db-exercise-list');
const createRoutineForm = document.getElementById('create-routine-form'), routineEditingIdInput = document.getElementById('routine-editing-id'), routineNameInput = document.getElementById('routine-name-input'), routineExerciseInput = document.getElementById('routine-exercise-input'), autocompleteResults = document.getElementById('autocomplete-results'), routineSetsInput = document.getElementById('routine-sets-input'), routineRepsInput = document.getElementById('routine-reps-input'), addExerciseToBuilderBtn = document.getElementById('add-exercise-to-builder-btn'), routineBuilderList = document.getElementById('routine-builder-list'), saveRoutineBtn = document.getElementById('save-routine-btn'), savedRoutinesList = document.getElementById('saved-routines-list');
const cancelEditRoutineBtn = document.getElementById('cancel-edit-routine-btn'); // New button reference
const repsBasedInputs = document.getElementById('reps-based-inputs'), timeBasedInputs = document.getElementById('time-based-inputs'), routineTimeSetsInput = document.getElementById('routine-time-sets-input'), routineDurationInput = document.getElementById('routine-duration-input');
const dailyRoutineSelect = document.getElementById('daily-routine-select'), startRoutineBtn = document.getElementById('start-routine-btn'), activeRoutineDisplay = document.getElementById('active-routine-display'), routineSelectionArea = document.getElementById('routine-selection-area'), activeRoutineInfo = document.getElementById('active-routine-info'), activeRoutineName = document.getElementById('active-routine-name');
const allModals = document.querySelectorAll('.modal');
const dateDisplayBtn = document.getElementById('date-display-btn'), prevDayBtn = document.getElementById('prev-day-btn'), nextDayBtn = document.getElementById('next-day-btn');
const actionsMenuBtn = document.getElementById('actions-menu-btn'), actionsDropdown = document.getElementById('actions-dropdown'), importDataBtn = document.getElementById('import-data-btn'), exportDataBtn = document.getElementById('export-data-btn'), fileLoaderInput = document.getElementById('file-loader');
const stopwatchModal = document.getElementById('stopwatch-modal'), stopwatchExerciseName = document.getElementById('stopwatch-exercise-name'), stopwatchTimerDisplay = document.getElementById('stopwatch-timer-display'), stopwatchActionBtn = document.getElementById('stopwatch-action-btn'), stopwatchCancelBtn = document.getElementById('stopwatch-cancel-btn');
const countdownModal = document.getElementById('countdown-modal'), countdownTimerDisplay = document.getElementById('countdown-timer-display'), countdownLabel = document.getElementById('countdown-label'), countdownNextExerciseInfo = document.getElementById('countdown-next-exercise-info'), countdownNextExerciseName = document.getElementById('countdown-next-exercise-name'), countdownNextExerciseDetails = document.getElementById('countdown-next-exercise-details'), countdownProgressCircle = document.querySelector('.timer-progress');
const workoutCompleteModal = document.getElementById('workout-complete-modal'), workoutTotalTimeDisplay = document.getElementById('workout-total-time'), closeCompleteModalBtn = document.getElementById('close-complete-modal-btn');
const swapExerciseModal = document.getElementById('swap-exercise-modal'), swapExerciseForm = document.getElementById('swap-exercise-form'), swapExerciseSelect = document.getElementById('swap-exercise-select'), cancelSwapBtn = document.getElementById('cancel-swap-btn');
const editWorkoutExerciseModal = document.getElementById('edit-workout-exercise-modal'), editWorkoutExerciseForm = document.getElementById('edit-workout-exercise-form'), editModalTitle = document.getElementById('edit-modal-title'), editRepsBasedInputs = document.getElementById('edit-reps-based-inputs'), editTimeBasedInputs = document.getElementById('edit-time-based-inputs'), editSetsInput = document.getElementById('edit-sets-input'), editRepsInput = document.getElementById('edit-reps-input'), editTimeSetsInput = document.getElementById('edit-time-sets-input'), editDurationInput = document.getElementById('edit-duration-input'), cancelEditBtn = document.getElementById('cancel-edit-btn');
const filterCategorySelect = document.getElementById('filter-category'), filterMuscleSelect = document.getElementById('filter-muscle'), filterTypeSelect = document.getElementById('filter-type'), sortExercisesSelect = document.getElementById('sort-exercises');
const exerciseDetailsModal = document.getElementById('exercise-details-modal'), detailsVideoContainer = document.getElementById('details-video-container'), detailsExerciseName = document.getElementById('details-exercise-name'), detailsTabContent = document.getElementById('details-tab-content'), detailsModalCloseBtn = document.getElementById('details-modal-close-btn');
const addToRoutineModal = document.getElementById('add-to-routine-modal'), addToRoutineForm = document.getElementById('add-to-routine-form'), addToRoutineTitle = document.getElementById('add-to-routine-title'), addToRoutineSelect = document.getElementById('add-to-routine-select'), addToRoutineSetsInput = document.getElementById('add-to-routine-sets'), addToRoutineRepsInput = document.getElementById('add-to-routine-reps'), cancelAddToRoutineBtn = document.getElementById('cancel-add-to-routine-btn');
const routineDetailsModal = document.getElementById('routine-details-modal'), routineDetailsTitle = document.getElementById('routine-details-title'), routineDetailsList = document.getElementById('routine-details-list'), closeRoutineDetailsBtn = document.getElementById('close-routine-details-btn');
const modalTrackTypeToggle = document.getElementById('modal-track-type-toggle');
const modalRepsBasedInputs = document.getElementById('modal-reps-based-inputs');
const modalTimeBasedInputs = document.getElementById('modal-time-based-inputs');
const addToRoutineTimeSetsInput = document.getElementById('add-to-routine-time-sets');
const addToRoutineDurationInput = document.getElementById('add-to-routine-duration');

const circleCircumference = 2 * Math.PI * 54;
const SWIPE_ACTION_WIDTH = 160; // 2 buttons
const SWIPE_ACTION_WIDTH_WORKOUT = 240; // 3 buttons

// --- 2. CORE LOGIC & HELPER FUNCTIONS ---
function showPage(pageId) { document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active')); document.getElementById(pageId).classList.add('active'); document.getElementById(`nav-${pageId.split('-')[0]}`).classList.add('active'); closeStopwatchModal(true); renderCurrentPage(); }
function saveDataToLocalStorage() { try { const dataToSave = { ...allData, exerciseDatabase: [] }; localStorage.setItem('workoutTrackerData', JSON.stringify(dataToSave)); } catch (error) { console.error("Could not save data", error); alert("Error saving data. Storage might be full."); } }
function loadDataFromLocalStorage() {
    const d = localStorage.getItem('workoutTrackerData');
    if (d) {
        try {
            const p = JSON.parse(d);
            if (p.history && p.userGoals) {
                allData.routines = p.routines || [];
                allData.history = p.history;
                allData.userGoals = p.userGoals;
            }
        } catch (e) { console.error("Could not parse data", e); }
    }
}
function saveRoutineBuilderState() {
    const stateToSave = {
        builder: routineBuilderState,
        editing: routineEditingState,
        name: routineNameInput.value
    };
    localStorage.setItem('workoutBuilderProgress', JSON.stringify(stateToSave));
}

function loadRoutineBuilderState() {
    const savedProgress = localStorage.getItem('workoutBuilderProgress');
    if (savedProgress) {
        try {
            const { builder, editing, name } = JSON.parse(savedProgress);
            if (builder && Array.isArray(builder.exercises) && editing) {
                routineBuilderState = builder;
                routineEditingState = editing;
                routineNameInput.value = name || '';
                if (editing.isEditing) {
                    saveRoutineBtn.textContent = 'Update Routine';
                    routineEditingIdInput.value = editing.id;
                }
            }
        } catch (e) {
            console.error("Could not parse routine builder progress", e);
            localStorage.removeItem('workoutBuilderProgress');
        }
    }
}

function clearRoutineBuilderState() {
    localStorage.removeItem('workoutBuilderProgress');
}

async function loadExercisesFromCSV() {
    try {
        const response = await fetch('Data.csv');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const csvText = await response.text();
        const lines = csvText.trim().split('\n');
        const headers = lines.shift().split(',').map(h => h.trim());

        const data = lines.map(line => {
            const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            const obj = {};
            headers.forEach((header, i) => {
                let value = values[i] || '';
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                obj[header] = value.trim();
            });
            return obj;
        });

        allData.exerciseDatabase = data.map((row, index) => ({
            id: index,
            name: row['Exercise'],
            videoUrl: row['Video URL'],
            type: row['Type'],
            primaryMuscles: row['Primary Muscles'],
            secondaryMuscles: row['Secondary Muscles'],
            category: row['Workout Category'],
            instructions: row['Instructions for Proper Form'],
            trackType: 'reps'
        }));
    } catch (error) {
        console.error('Failed to load or parse exercises from CSV:', error);
        if (!allData.exerciseDatabase) allData.exerciseDatabase = [];
    }
}
function openModal(modalElement) { modalElement.classList.remove('hidden'); }
function closeModal(modalElement) { modalElement.classList.add('hidden'); if (modalElement.id === 'exercise-details-modal') { detailsVideoContainer.innerHTML = ''; } }
function getFormattedDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }

function startCountdown(duration, nextExercise = null) {
    clearInterval(countdownIntervalId);
    countdownInitialDuration = duration;
    countdownProgressCircle.style.transition = 'none';
    countdownProgressCircle.style.strokeDasharray = circleCircumference;
    countdownProgressCircle.style.strokeDashoffset = 0;
    setTimeout(() => { countdownProgressCircle.style.transition = 'stroke-dashoffset 1s linear'; }, 50);

    if (nextExercise) {
        countdownLabel.textContent = "Next Exercise";
        countdownNextExerciseName.textContent = nextExercise.name;
        const details = nextExercise.trackType === 'time' ? `${nextExercise.sets} sets × ${nextExercise.duration} sec` : `${nextExercise.sets} sets × ${nextExercise.reps} reps`;
        countdownNextExerciseDetails.textContent = details;
        countdownNextExerciseInfo.classList.remove('hidden');
    } else {
        countdownLabel.textContent = "Break Time";
        countdownNextExerciseInfo.classList.add('hidden');
    }

    let remaining = duration;
    countdownTimerDisplay.textContent = remaining;
    openModal(countdownModal);

    countdownIntervalId = setInterval(() => {
        remaining--;
        const progress = Math.max(0, remaining / countdownInitialDuration);
        countdownProgressCircle.style.strokeDashoffset = circleCircumference * (1 - progress);
        if (remaining >= 0) {
            countdownTimerDisplay.textContent = remaining;
        } else {
            closeCountdownModal();
        }
    }, 1000);
}

function closeCountdownModal() { clearInterval(countdownIntervalId); countdownIntervalId = null; closeModal(countdownModal); }
function formatStopwatchTime(ms) { const totalSeconds = Math.floor(ms / 1000); const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0'); const seconds = (totalSeconds % 60).toString().padStart(2, '0'); const milliseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, '0'); return `${minutes}:${seconds}.${milliseconds}`; }
function formatTotalTime(ms) {
    if (ms === null || isNaN(ms) || ms < 0) return 'N/A';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    let parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds >= 0 && parts.length < 2) parts.push(`${seconds}s`);
    if (parts.length === 0) return '0s';
    return parts.join(' ');
}


// --- 3. RENDERING FUNCTIONS ---
function renderCurrentPage() {
    const id = document.querySelector('.page.active').id;
    if (id === 'exercises-page') {
        handleFilterChange();
    }
    if (id === 'routines-page') {
        renderSavedRoutines();
        initRoutineBuilderSortable();
        initSavedRoutinesSortable();
    }
    if (id === 'workout-page') {
        populateDailyRoutineDropdown();
        renderWorkoutPage();
        initDailyWorkoutSortable();
    }
    renderDateControls();
}
function renderDateControls() { const today = new Date(); today.setHours(0, 0, 0, 0); currentDate.setHours(0, 0, 0, 0); const isToday = currentDate.getTime() === today.getTime(); dateDisplayBtn.textContent = isToday ? 'Today' : currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); nextDayBtn.disabled = currentDate >= today; }

function renderExerciseDatabase(filters = {}, sortBy = 'az') {
    dbExerciseListDiv.innerHTML = '';
    let filteredData = [...allData.exerciseDatabase];

    if (filters.category) filteredData = filteredData.filter(ex => ex.category === filters.category);
    if (filters.muscle) filteredData = filteredData.filter(ex => ex.primaryMuscles === filters.muscle);
    if (filters.type) filteredData = filteredData.filter(ex => ex.type === filters.type);

    if (sortBy === 'az') filteredData.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'za') filteredData.sort((a, b) => b.name.localeCompare(a.name));

    if (filteredData.length === 0) {
        dbExerciseListDiv.innerHTML = `<div class="placeholder-card">No exercises match your filters.</div>`;
        return;
    }

    const exercisesByGroup = filteredData.reduce((acc, ex) => {
        const group = ex.category || 'Uncategorized';
        if (!acc[group]) acc[group] = [];
        acc[group].push(ex);
        return acc;
    }, {});

    Object.keys(exercisesByGroup).sort().forEach(group => {
        const groupCard = document.createElement('div');
        groupCard.className = 'card exercise-group-card';
        const header = document.createElement('h3');
        header.textContent = group;
        groupCard.appendChild(header);
        const listContainer = document.createElement('div');
        listContainer.className = 'exercise-group-list';

        exercisesByGroup[group].forEach(ex => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'exercise-list-item';
            itemDiv.innerHTML = `
                <div class="exercise-item-main">
                    <span class="exercise-item-name">${ex.name}</span>
                    <small class="exercise-item-stats">${ex.primaryMuscles} • ${ex.type}</small>
                </div>
                <div class="exercise-list-actions">
                    <button class="exercise-list-btn add-to-routine-btn" data-id="${ex.id}" aria-label="Add to Routine">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                    </button>
                    <button class="exercise-list-btn details-btn" data-id="${ex.id}" aria-label="More Details">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" /></svg>
                    </button>
                </div>`;
            listContainer.appendChild(itemDiv);
        });
        groupCard.appendChild(listContainer);
        dbExerciseListDiv.appendChild(groupCard);
    });
}

function populateDailyRoutineDropdown() {
    dailyRoutineSelect.innerHTML = `<option value="" disabled selected>Select a routine to begin...</option>`;
    const sortedRoutines = [...allData.routines].sort((a, b) => a.name.localeCompare(b.name));
    sortedRoutines.forEach(r => {
        const o = document.createElement('option');
        o.value = r.id;
        o.textContent = r.name;
        dailyRoutineSelect.appendChild(o);
    });
}

function renderSavedRoutines() {
    savedRoutinesList.innerHTML = '';
    if (allData.routines.length === 0) {
        savedRoutinesList.innerHTML = `<div class="placeholder-card" style="margin-top: 16px;">You haven't created any routines yet.</div>`;
        return;
    }
    const sortedRoutines = [...allData.routines];
    sortedRoutines.forEach(r => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'swipe-item-container sortable-item';
        itemDiv.dataset.id = r.id;
        const sets = r.exercises.reduce((s, ex) => s + parseInt(ex.sets), 0);
        itemDiv.innerHTML = `
            <div class="swipe-content">
                <div class="exercise-item-main" style="text-align:center;">
                    <span class="exercise-item-name">${r.name}</span>
                    <small class="exercise-item-stats">${r.exercises.length} exercises • ${sets} total sets</small>
                </div>
            </div>
            <div class="swipe-actions">
                 <button class="swipe-action-btn swipe-edit-btn" data-id="${r.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>
                    <span>Edit</span>
                </button>
                <button class="swipe-action-btn swipe-delete-btn" data-id="${r.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1H8.75zM10 4.5a.75.75 0 01.75.75v8.5a.75.75 0 01-1.5 0v-8.5A.75.75 0 0110 4.5z" clip-rule="evenodd" /></svg>
                    <span>Delete</span>
                </button>
            </div>`;
        savedRoutinesList.appendChild(itemDiv);
    });
}

function renderWorkoutPage() {
    const dateKey = getFormattedDate(currentDate);
    const workoutData = allData.history[dateKey];
    resetSwipeState();

    if (!workoutData) {
        routineSelectionArea.classList.remove('hidden');
        activeRoutineInfo.classList.add('hidden');
        activeRoutineDisplay.innerHTML = `<div class="placeholder-card">Select a routine and click "Start" to see your exercises.</div>`;
        return;
    }

    if (workoutData.isComplete) {
        routineSelectionArea.classList.add('hidden');
        activeRoutineInfo.classList.add('hidden');
        let summaryHTML = `<div class="card workout-summary-card"><div class="summary-header"><div><h2>${workoutData.routine.name} - Summary</h2>${workoutData.completionTime ? `<div class="summary-total-time">${formatTotalTime(workoutData.completionTime)}</div>` : ''}</div><button class="btn-primary" id="start-new-workout-btn">Start New Workout</button></div>`;

        workoutData.routine.exercises.forEach(exercise => {
            const progress = workoutData.progress.find(p => p.instanceId === exercise.instanceId);
            const stats = exercise.trackType === 'time' ? `${exercise.sets} sets × ${exercise.duration} sec` : `${exercise.sets} sets × ${exercise.reps} reps`;
            let setsHTML = '';

            if (exercise.trackType === 'reps') {
                for (let i = 0; i < progress.loggedData.length; i++) {
                    const setData = progress.loggedData[i];
                    setsHTML += `<div class="summary-set-item">
                        <span class="set-label">Set ${i + 1}</span>
                        <input type="text" class="summary-reps-input" value="${setData.reps}" data-instance-id="${progress.instanceId}" data-set-index="${i}">
                        <input type="number" class="summary-weight-input" placeholder="Weight" value="${setData.weight || ''}" data-instance-id="${progress.instanceId}" data-set-index="${i}">
                    </div>`;
                }
            } else { // Time-based
                progress.loggedData.forEach((time, index) => {
                    setsHTML += `<div class="summary-set-item">
                        <span class="set-label">Set ${index + 1}</span>
                        <span class="summary-logged-time">${formatStopwatchTime(time)}</span>
                    </div>`;
                });
            }

            summaryHTML += `<div class="summary-exercise-card">
                <div class="summary-exercise-header">
                    <div class="exercise-item-main" style="text-align:center;">
                        <span class="exercise-item-name">${exercise.name}</span>
                        <small class="exercise-item-stats">${stats}</small>
                    </div>
                </div>
                <div class="summary-sets-list">${setsHTML}</div>
            </div>`;
        });
        
        summaryHTML += `<div class="summary-notes-section"><h3>Workout Notes</h3><textarea id="workout-notes-input" placeholder="How was the workout? Any PRs?">${workoutData.notes || ''}</textarea></div>`;
        summaryHTML += `<div class="summary-actions"><button class="btn-primary" id="save-summary-changes-btn">Save Changes</button></div></div>`;
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
        itemDiv.className = `active-routine-exercise sortable-item ${isCurrent ? 'current' : ''} ${isFinished ? 'finished' : ''}`;
        itemDiv.dataset.instanceId = exercise.instanceId;
        let stats, trackingUI;
        if (exercise.trackType === 'time') {
            stats = `${progress.setsCompleted} / ${exercise.sets} Sets • ${exercise.duration} sec Target`;
            trackingUI = `<div class="exercise-actions"><button class="btn-primary start-stopwatch-modal-btn" ${isFinished || !isCurrent ? 'disabled' : ''}>Start Set ${progress.setsCompleted + 1}</button></div>`;
        } else {
            stats = `${exercise.sets} sets × ${exercise.reps} reps`;
            const buttonText = isFinished ? "All Sets Complete" : `Log Set ${progress.setsCompleted + 1}`;
            trackingUI = `<div class="exercise-actions"><div class="set-progress-display">${progress.setsCompleted} / ${exercise.sets} Sets Completed</div><button class="btn-primary start-reps-set-btn" ${isFinished || !isCurrent ? 'disabled' : ''}>${buttonText}</button></div>`;
        }
        const intervals = [15, 30, 45];
        const intervalButtonsHTML = intervals.map(time => `<button class="timer-interval-btn ${progress.timer.duration === time ? 'selected' : ''}" data-time="${time}" ${!progress.timer.enabled ? 'disabled' : ''}>${time}s</button>`).join('');
        
        itemDiv.innerHTML = `
            <div class="swipe-item-container">
                <div class="swipe-content">
                    <div class="exercise-content">
                        <div class="exercise-header">
                            <div class="exercise-item-main">
                                <span class="exercise-item-name">${exercise.name}</span>
                                <small class="exercise-item-stats">${stats}</small>
                            </div>
                        </div>
                        ${trackingUI}
                        <div class="timer-controls">
                            <div class="timer-toggle-area">
                                <label for="timer-toggle-${exercise.instanceId}">Break Timer</label>
                                <label class="toggle-switch">
                                    <input type="checkbox" class="timer-toggle" id="timer-toggle-${exercise.instanceId}" ${progress.timer.enabled ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            <div class="timer-intervals">${intervalButtonsHTML}</div>
                        </div>
                    </div>
                </div>
                <div class="swipe-actions">
                    <button class="swipe-action-btn swipe-swap-btn" data-instance-id="${exercise.instanceId}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M7.25 2.75a.75.75 0 00-1.5 0v11.5a.75.75 0 001.5 0V2.75zM12.75 2.75a.75.75 0 00-1.5 0v11.5a.75.75 0 001.5 0V2.75zM4 6.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75a.75.75 0 01-.75-.75zM4 13.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75a.75.75 0 01-.75-.75z" /></svg>
                        <span>Swap</span>
                    </button>
                    <button class="swipe-action-btn swipe-edit-btn" data-instance-id="${exercise.instanceId}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>
                        <span>Edit</span>
                    </button>
                    <button class="swipe-action-btn swipe-delete-btn" data-instance-id="${exercise.instanceId}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1H8.75zM10 4.5a.75.75 0 01.75.75v8.5a.75.75 0 01-1.5 0v-8.5A.75.75 0 0110 4.5z" clip-rule="evenodd" /></svg>
                        <span>Delete</span>
                    </button>
                </div>
            </div>`;
        activeRoutineDisplay.appendChild(itemDiv);
    });
}

// --- 4. SORTABLE & DRAG/DROP ---
const sortableOptions = {
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    delay: 200,
    delayOnTouchOnly: true
};

function initRoutineBuilderSortable() { if (routineBuilderSortable) routineBuilderSortable.destroy(); routineBuilderSortable = new Sortable(routineBuilderList, { ...sortableOptions, handle:'.routine-builder-item', onEnd: (evt) => { const movedItem = routineBuilderState.exercises.splice(evt.oldIndex, 1)[0]; routineBuilderState.exercises.splice(evt.newIndex, 0, movedItem); validateRoutineForm(); saveRoutineBuilderState(); } }); }
function initDailyWorkoutSortable() { if (dailyWorkoutSortable) dailyWorkoutSortable.destroy(); const dateKey = getFormattedDate(currentDate); const workoutData = allData.history[dateKey]; if (!workoutData) return; dailyWorkoutSortable = new Sortable(activeRoutineDisplay, { ...sortableOptions, handle: '.swipe-content', onEnd: (evt) => { const movedItem = workoutData.routine.exercises.splice(evt.oldIndex, 1)[0]; workoutData.routine.exercises.splice(evt.newIndex, 0, movedItem); const movedProgress = workoutData.progress.splice(evt.oldIndex, 1)[0]; workoutData.progress.splice(evt.newIndex, 0, movedProgress); saveDataToLocalStorage(); renderWorkoutPage(); } }); }
function initSavedRoutinesSortable() { if (savedRoutinesSortable) savedRoutinesSortable.destroy(); savedRoutinesSortable = new Sortable(savedRoutinesList, { ...sortableOptions, handle: '.swipe-content', onEnd: (evt) => { const movedItem = allData.routines.splice(evt.oldIndex, 1)[0]; allData.routines.splice(evt.newIndex, 0, movedItem); saveDataToLocalStorage(); renderSavedRoutines(); } }); }
function initRoutineDetailsSortable(routineId) { if (routineDetailsSortable) routineDetailsSortable.destroy(); routineDetailsSortable = new Sortable(routineDetailsList, { ...sortableOptions, handle: '.routine-details-item-main', onEnd: (evt) => { const routine = allData.routines.find(r => r.id === routineId); if (routine) { const movedItem = routine.exercises.splice(evt.oldIndex, 1)[0]; routine.exercises.splice(evt.newIndex, 0, movedItem); saveDataToLocalStorage(); renderSavedRoutines(); } } }); }

// --- 5. EVENT HANDLER & WORKFLOW FUNCTIONS ---
function handleAddExerciseToBuilder() {
    const id = routineBuilderState.selectedExerciseId;
    if (id === null) { alert("Please select an exercise from the list."); return; }
    const exercise = allData.exerciseDatabase.find(ex => ex.id === id);
    if (!exercise) return;

    let exForRoutine;
    const trackType = document.querySelector('.track-type-btn.active').dataset.trackType;

    if (trackType === 'time') {
        const sets = parseInt(routineTimeSetsInput.value);
        const duration = parseInt(routineDurationInput.value);
        if (isNaN(sets) || sets <= 0 || isNaN(duration) || duration <= 0) { alert("Please enter valid sets and duration."); return; }
        exForRoutine = { exerciseId: id, sets, duration, trackType: 'time', instanceId: Date.now() + Math.random() };
    } else {
        const sets = parseInt(routineSetsInput.value);
        const reps = routineRepsInput.value.trim();
        if (isNaN(sets) || sets <= 0 || !reps) { alert("Please enter valid sets and reps."); return; }
        exForRoutine = { exerciseId: id, sets, reps, trackType: 'reps', instanceId: Date.now() + Math.random() };
    }
    routineBuilderState.exercises.push(exForRoutine);
    routineBuilderState.selectedExerciseId = null;
    routineExerciseInput.value = '';
    renderRoutineBuilderList();
    saveRoutineBuilderState();
}
function renderRoutineBuilderList() {
    routineBuilderList.innerHTML = '';
    if (routineBuilderState.exercises.length === 0) {
        routineBuilderList.innerHTML = `<div class="placeholder-card" style="padding: 20px; margin-top: 0;">Search for an exercise above to add it to this routine.</div>`;
    }
    routineBuilderState.exercises.forEach(exRef => {
        const ex = allData.exerciseDatabase.find(dbEx => dbEx.id === exRef.exerciseId);
        if (ex) {
            const i = document.createElement('div');
            i.className = 'routine-builder-item sortable-item';
            i.dataset.instanceId = exRef.instanceId;
            const details = exRef.trackType === 'time' ? `${exRef.sets} sets × ${exRef.duration} sec` : `${exRef.sets} sets × ${exRef.reps} reps`;
            i.innerHTML = `<div class="exercise-item-main">
                <span class="exercise-item-name">${ex.name}</span>
                <small class="exercise-item-stats">${details}</small>
            </div>
            <button type="button" class="item-action-btn delete-btn" data-instance-id="${exRef.instanceId}">×</button>`;
            routineBuilderList.appendChild(i);
        }
    });
    validateRoutineForm();
}
function validateRoutineForm() { const name = routineNameInput.value.trim(); const hasExercises = routineBuilderState.exercises.length > 0; saveRoutineBtn.disabled = !(name && hasExercises); }
function handleSaveRoutine(event) { event.preventDefault(); const name = routineNameInput.value.trim(); const exercisesToSave = routineBuilderState.exercises.map(ex => { const { exerciseId, sets, reps, duration, trackType } = ex; return trackType === 'time' ? { exerciseId, sets, duration, trackType } : { exerciseId, sets, reps, trackType }; }); if (routineEditingState.isEditing) { const r = allData.routines.find(r => r.id === routineEditingState.id); if (r) { r.name = name; r.exercises = exercisesToSave; } } else { const newRoutine = { id: Date.now(), name, exercises: exercisesToSave }; allData.routines.push(newRoutine); } saveDataToLocalStorage(); renderSavedRoutines(); resetRoutineForm(); }
function resetRoutineForm() {
    createRoutineForm.reset();
    routineBuilderState = { exercises: [], selectedExerciseId: null };
    routineEditingState = { isEditing: false, id: null };
    routineEditingIdInput.value = '';
    saveRoutineBtn.textContent = 'Save Routine';
    cancelEditRoutineBtn.classList.add('hidden'); // Hide cancel button on reset
    renderRoutineBuilderList();
    clearRoutineBuilderState();
}
function changeDate(days) { currentDate.setDate(currentDate.getDate() + days); closeStopwatchModal(true); renderCurrentPage(); }
function exportDataToFile() { try { const dataAsString = JSON.stringify({ ...allData, exerciseDatabase: [] }, null, 2); const blob = new Blob([dataAsString], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `workout-tracker-backup-${getFormattedDate(new Date())}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); } catch (error) { console.error("Export failed:", error); alert("Could not export data."); } }
function importDataFromFile(event) { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function (e) { try { const importedData = JSON.parse(e.target.result); if (!importedData.history || !importedData.userGoals) { throw new Error("Invalid data file format."); } if (confirm("This will overwrite all current data. Are you sure you want to proceed?")) { allData.routines = importedData.routines || []; allData.history = importedData.history; allData.userGoals = importedData.userGoals; currentDate = new Date(); saveDataToLocalStorage(); renderCurrentPage(); alert("Data imported successfully!"); } } catch (error) { alert('Error reading or parsing file. Please make sure you selected a valid backup file.'); console.error(error); } finally { fileLoaderInput.value = ""; } }; reader.readAsText(file); }

function completeWorkout(isAutoFinish = false) {
    const dateKey = getFormattedDate(currentDate);
    const workoutData = allData.history[dateKey];
    if (!workoutData || workoutData.isComplete) return;

    if (!workoutData.completionTime && workoutData.startTime) {
        workoutData.completionTime = Date.now() - workoutData.startTime;
    }
    workoutData.isComplete = true;
    closeStopwatchModal(true);
    saveDataToLocalStorage();

    if (isAutoFinish) {
        workoutTotalTimeDisplay.textContent = formatTotalTime(workoutData.completionTime);
        openModal(workoutCompleteModal);
    } else {
        renderWorkoutPage();
    }
}

function handleSetCompletion(instanceId) {
    const dateKey = getFormattedDate(currentDate);
    const workoutData = allData.history[dateKey];
    if (!workoutData) return;
    
    const exerciseData = workoutData.routine.exercises.find(ex => ex.instanceId === instanceId);
    const progress = workoutData.progress.find(p => p.instanceId === instanceId);

    saveDataToLocalStorage();
    renderWorkoutPage();

    const isExerciseComplete = progress.setsCompleted >= exerciseData.sets;
    const currentIndex = workoutData.routine.exercises.findIndex(ex => ex.instanceId === instanceId);
    const isLastExerciseInRoutine = currentIndex === workoutData.routine.exercises.length - 1;

    if (isExerciseComplete) {
        if (isLastExerciseInRoutine) {
            setTimeout(() => completeWorkout(true), 250);
        } else {
            const nextExercise = workoutData.routine.exercises[currentIndex + 1];
            startCountdown(60, nextExercise);
        }
    } else {
        if (progress.timer.enabled) {
            startCountdown(progress.timer.duration);
        }
    }
}

// --- 6. STOPWATCH MODAL LOGIC ---
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
    const progress = allData.history[dateKey].progress.find(p => p.instanceId === currentStopwatchInstanceId);
    
    progress.setsCompleted++;
    if (!progress.loggedData) progress.loggedData = [];
    progress.loggedData.push(progress.stopwatch.elapsedTime);
    
    const instanceIdToComplete = currentStopwatchInstanceId;
    closeStopwatchModal();
    handleSetCompletion(instanceIdToComplete);
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

// --- 7. GLOBAL EVENT LISTENERS (NAVIGATION, SWIPE, ACTIONS) ---
navWorkout.addEventListener('click', () => showPage('workout-page'));
navRoutines.addEventListener('click', () => showPage('routines-page'));
navExercises.addEventListener('click', () => showPage('exercises-page'));

addExerciseToBuilderBtn.addEventListener('click', handleAddExerciseToBuilder);
createRoutineForm.addEventListener('submit', handleSaveRoutine);
routineNameInput.addEventListener('input', () => {
    validateRoutineForm();
    saveRoutineBuilderState();
});
routineBuilderList.addEventListener('click', e => {
    if (e.target.matches('.delete-btn')) {
        const instanceId = parseFloat(e.target.dataset.instanceId);
        routineBuilderState.exercises = routineBuilderState.exercises.filter(ex => ex.instanceId !== instanceId);
        renderRoutineBuilderList();
        saveRoutineBuilderState();
    }
});

cancelEditRoutineBtn.addEventListener('click', resetRoutineForm); // New event listener

dailyRoutineSelect.addEventListener('change', () => { startRoutineBtn.disabled = !dailyRoutineSelect.value; });
startRoutineBtn.addEventListener('click', () => {
    const id = parseInt(dailyRoutineSelect.value);
    const sourceRoutine = allData.routines.find(r => r.id === id);
    if (sourceRoutine) {
        const dateKey = getFormattedDate(currentDate);
        const hydratedExercises = sourceRoutine.exercises.map(leanEx => { const fullEx = allData.exerciseDatabase.find(dbEx => dbEx.id === leanEx.exerciseId); return { ...fullEx, ...leanEx, instanceId: Date.now() + Math.random() }; });
        const progress = hydratedExercises.map(ex => ({ instanceId: ex.instanceId, setsCompleted: 0, loggedData: [], timer: { enabled: true, duration: 30 }, stopwatch: { elapsedTime: 0, isRunning: false, startTime: 0 } }));
        const workoutToLog = { name: sourceRoutine.name, id: sourceRoutine.id, exercises: hydratedExercises };
        allData.history[dateKey] = { routine: workoutToLog, progress, isComplete: false, startTime: Date.now(), completionTime: null, notes: '' };
        saveDataToLocalStorage();
        renderWorkoutPage();
        initDailyWorkoutSortable();
    }
});
activeRoutineInfo.addEventListener('click', e => {
    const t = e.target;
    if (t.id === 'finish-workout-btn') { if (confirm("Are you sure you want to finish and log this workout?")) { completeWorkout(false); } }
    if (t.id === 'reset-workout-btn') { if (confirm("Are you sure you want to reset this workout? Your progress for today will be lost.")) { const dateKey = getFormattedDate(currentDate); if (allData.history[dateKey]) { delete allData.history[dateKey]; closeStopwatchModal(true); saveDataToLocalStorage(); renderWorkoutPage(); } } }
});

// --- SWIPE HANDLING ---
let touchStartX = 0, touchStartY = 0, touchCurrentX = 0;
let swipeTarget = null, isSwiping = false, swipeDirection = null;
function resetSwipeState() { if (swipeState.openCardContent) { swipeState.openCardContent.style.transform = 'translateX(0px)'; } touchStartX = 0; touchStartY = 0; touchCurrentX = 0; swipeTarget = null; isSwiping = false; swipeDirection = null; swipeState.openCardContent = null; }

appContainer.addEventListener('touchstart', e => {
    const target = e.target.closest('.swipe-content');
    if (!target || e.target.closest('.routine-builder-item')) return;
    if(swipeState.openCardContent && swipeState.openCardContent !== target) { resetSwipeState(); }
    swipeTarget = target;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    swipeTarget.style.transition = 'none';
}, { passive: true });

appContainer.addEventListener('touchmove', e => {
    if (!swipeTarget) return;
    touchCurrentX = e.touches[0].clientX;
    const diffX = touchCurrentX - touchStartX;
    const diffY = e.touches[0].clientY - touchStartY;
    
    if (!swipeDirection) {
        if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) {
            swipeDirection = 'horizontal';
        } else if (Math.abs(diffY) > 10) {
            swipeDirection = 'vertical';
        }
    }

    if (swipeDirection === 'horizontal') {
        e.preventDefault();
        isSwiping = true;
        const SWIPE_WIDTH = swipeTarget.closest('#active-routine-display') ? SWIPE_ACTION_WIDTH_WORKOUT : SWIPE_ACTION_WIDTH;
        if (swipeState.openCardContent === swipeTarget) {
            const newX = Math.min(0, -SWIPE_WIDTH + diffX);
            swipeTarget.style.transform = `translateX(${newX}px)`;
        } else {
            if (diffX < 0) {
                const transformX = Math.max(-SWIPE_WIDTH, diffX);
                swipeTarget.style.transform = `translateX(${transformX}px)`;
            }
        }
    }
}, { passive: false });


appContainer.addEventListener('touchend', e => {
    if (!swipeTarget || !isSwiping) { resetSwipeState(); return; };
    
    const diffX = touchCurrentX - touchStartX;
    swipeTarget.style.transition = 'transform 0.3s ease-out';
    const SWIPE_WIDTH = swipeTarget.closest('#active-routine-display') ? SWIPE_ACTION_WIDTH_WORKOUT : SWIPE_ACTION_WIDTH;
    
    const wasOpen = swipeState.openCardContent === swipeTarget;
    if (wasOpen) {
        if (diffX > 60) { swipeTarget.style.transform = 'translateX(0px)'; swipeState.openCardContent = null; } 
        else { swipeTarget.style.transform = `translateX(${-SWIPE_WIDTH}px)`; }
    } else {
        if (diffX < -60) { swipeTarget.style.transform = `translateX(${-SWIPE_WIDTH}px)`; swipeState.openCardContent = swipeTarget; } 
        else { swipeTarget.style.transform = 'translateX(0px)'; }
    }
    swipeTarget = null; isSwiping = false; swipeDirection = null;
});


appContainer.addEventListener('click', e => {
    const t = e.target;
    if (isSwiping || (touchStartX !== 0 && touchStartX !== touchCurrentX)) { touchStartX = 0; touchCurrentX = 0; if (t.closest('.swipe-content')) { e.stopPropagation(); } return; }
    if (swipeState.openCardContent && !t.closest('.swipe-actions')) { resetSwipeState(); }

    // Routine Page Actions
    const routinePageActions = t.closest('#routines-page');
    if (routinePageActions) {
        const deleteBtn = t.closest('.swipe-delete-btn');
        const editBtn = t.closest('.swipe-edit-btn');
        const routineCard = t.closest('.swipe-content');

        if (deleteBtn) {
            const id = parseInt(deleteBtn.dataset.id);
            if (confirm('Are you sure you want to permanently delete this routine?')) {
                allData.routines = allData.routines.filter(r => r.id !== id);
                if (routineEditingState.id === id) resetRoutineForm();
                saveDataToLocalStorage();
                renderSavedRoutines();
            }
        } else if (editBtn) {
            const id = parseInt(editBtn.dataset.id);
            const r = allData.routines.find(r => r.id === id);
            if (r) {
                resetRoutineForm();
                routineEditingState = { isEditing: true, id };
                routineEditingIdInput.value = id;
                routineNameInput.value = r.name;
                routineBuilderState.exercises = r.exercises.map(leanEx => ({ ...leanEx, instanceId: Date.now() + Math.random() }));
                renderRoutineBuilderList();
                saveRoutineBtn.textContent = 'Update Routine';
                cancelEditRoutineBtn.classList.remove('hidden'); // Show cancel button
                routinesPage.querySelector('main').scrollTo({ top: 0, behavior: 'smooth' });
                saveRoutineBuilderState();
            }
            resetSwipeState();
        } else if (routineCard && !t.closest('.swipe-actions')) {
            const id = parseInt(routineCard.closest('.sortable-item').dataset.id);
            openRoutineDetailsModal(id);
        }
    }

    // Exercise Page Actions
    const exercisePageActions = t.closest('#exercises-page');
    if (exercisePageActions) {
        const detailsBtn = t.closest('.details-btn');
        const addToRoutineBtn = t.closest('.add-to-routine-btn');
        if (detailsBtn) {
            const id = parseInt(detailsBtn.dataset.id);
            openDetailsModal(id);
        } else if (addToRoutineBtn) {
            const id = parseInt(addToRoutineBtn.dataset.id);
            openAddToRoutineModal(id);
        }
    }

    // Workout Page Actions
    const workoutPageActions = t.closest('#workout-page');
    if(workoutPageActions) {
        if (t.id === 'start-new-workout-btn') { if (confirm("This will clear today's completed log. Are you sure?")) { delete allData.history[getFormattedDate(currentDate)]; saveDataToLocalStorage(); renderWorkoutPage(); } return; }
        if (t.id === 'save-summary-changes-btn') {
            const dateKey = getFormattedDate(currentDate);
            const workoutData = allData.history[dateKey];
            workoutData.notes = document.getElementById('workout-notes-input').value;
            document.querySelectorAll('.summary-reps-input, .summary-weight-input').forEach(input => {
                const instanceId = parseFloat(input.dataset.instanceId);
                const setIndex = parseInt(input.dataset.setIndex);
                const key = input.classList.contains('summary-reps-input') ? 'reps' : 'weight';
                const progress = workoutData.progress.find(p => p.instanceId === instanceId);
                if (progress && progress.loggedData[setIndex]) { progress.loggedData[setIndex][key] = input.value; }
            });
            saveDataToLocalStorage(); t.textContent = 'Saved!'; setTimeout(() => { t.textContent = 'Save Changes'; }, 1500); return;
        }

        const swapBtnWorkout = t.closest('.swipe-swap-btn');
        const deleteBtnWorkout = t.closest('.swipe-delete-btn');
        const editBtnWorkout = t.closest('.swipe-edit-btn');
        if (deleteBtnWorkout) {
             if (confirm("Delete this exercise from today's workout?")) {
                const instanceId = parseFloat(deleteBtnWorkout.dataset.instanceId);
                const dateKey = getFormattedDate(currentDate);
                const workoutData = allData.history[dateKey];
                workoutData.routine.exercises = workoutData.routine.exercises.filter(ex => ex.instanceId !== instanceId);
                workoutData.progress = workoutData.progress.filter(p => p.instanceId !== instanceId);
                saveDataToLocalStorage(); renderWorkoutPage();
            }
        } else if (swapBtnWorkout) {
            swipeState.instanceIdToSwap = parseFloat(swapBtnWorkout.dataset.instanceId);
            populateExerciseDropdown(swapExerciseSelect, true); openModal(swapExerciseModal);
        } else if (editBtnWorkout) {
            const instanceId = parseFloat(editBtnWorkout.dataset.instanceId);
            swipeState.instanceIdToEdit = instanceId;
            const exercise = allData.history[getFormattedDate(currentDate)].routine.exercises.find(ex => ex.instanceId === instanceId);
            if (exercise) {
                editModalTitle.textContent = `Edit ${exercise.name}`;
                if (exercise.trackType === 'time') {
                    editTimeBasedInputs.classList.remove('hidden'); editRepsBasedInputs.classList.add('hidden');
                    editTimeSetsInput.value = exercise.sets; editDurationInput.value = exercise.duration;
                } else {
                    editRepsBasedInputs.classList.remove('hidden'); editTimeBasedInputs.classList.add('hidden');
                    editSetsInput.value = exercise.sets; editRepsInput.value = exercise.reps;
                }
                openModal(editWorkoutExerciseModal);
            }
        }

        const card = t.closest('.active-routine-exercise');
        if (!card) return;
        const instanceId = parseFloat(card.dataset.instanceId);
        if (t.matches('.start-reps-set-btn, .start-stopwatch-modal-btn')) {
            const dateKey = getFormattedDate(currentDate);
            const workoutData = allData.history[dateKey];
            const progress = workoutData.progress.find(p => p.instanceId === instanceId);
            if(t.matches('.start-reps-set-btn')){
                if (!progress.loggedData) progress.loggedData = [];
                const exerciseData = workoutData.routine.exercises.find(ex => ex.instanceId === instanceId);
                progress.loggedData.push({ reps: exerciseData.reps, weight: '' });
                progress.setsCompleted++;
                handleSetCompletion(instanceId);
            } else {
                 openStopwatchModal(instanceId);
            }
        } else if (t.matches('.timer-toggle, .timer-interval-btn')) {
            const progress = allData.history[getFormattedDate(currentDate)].progress.find(p => p.instanceId === instanceId);
            if(t.matches('.timer-toggle')) progress.timer.enabled = t.checked;
            else progress.timer.duration = parseInt(t.dataset.time);
            saveDataToLocalStorage(); renderWorkoutPage();
        }
    }
});

// MODAL LOGIC
swapExerciseForm.addEventListener('submit', e => { e.preventDefault(); const newExerciseId = parseInt(swapExerciseSelect.value); if (isNaN(newExerciseId) || !swipeState.instanceIdToSwap) return; const dateKey = getFormattedDate(currentDate); const workoutData = allData.history[dateKey]; const exerciseIndex = workoutData.routine.exercises.findIndex(ex => ex.instanceId === swipeState.instanceIdToSwap); const progressIndex = workoutData.progress.findIndex(p => p.instanceId === swipeState.instanceIdToSwap); if (exerciseIndex === -1) return; const originalExercise = workoutData.routine.exercises[exerciseIndex]; const newExerciseDbEntry = allData.exerciseDatabase.find(dbEx => dbEx.id === newExerciseId); const newWorkoutExercise = { ...newExerciseDbEntry, sets: originalExercise.sets, reps: newExerciseDbEntry.trackType === 'reps' ? (originalExercise.reps || '8-12') : undefined, duration: newExerciseDbEntry.trackType === 'time' ? (originalExercise.duration || 60) : undefined, trackType: newExerciseDbEntry.trackType, instanceId: Date.now() + Math.random(), exerciseId: newExerciseId }; workoutData.routine.exercises.splice(exerciseIndex, 1, newWorkoutExercise); if (progressIndex > -1) { workoutData.progress[progressIndex].instanceId = newWorkoutExercise.instanceId; } saveDataToLocalStorage(); renderWorkoutPage(); closeModal(swapExerciseModal); swipeState.instanceIdToSwap = null; });
cancelSwapBtn.addEventListener('click', () => closeModal(swapExerciseModal));

editWorkoutExerciseForm.addEventListener('submit', e => { e.preventDefault(); const instanceId = swipeState.instanceIdToEdit; if (!instanceId) return; const workoutData = allData.history[getFormattedDate(currentDate)]; const exercise = workoutData.routine.exercises.find(ex => ex.instanceId === instanceId); if (exercise) { if (exercise.trackType === 'time') { const newSets = parseInt(editTimeSetsInput.value); const newDuration = parseInt(editDurationInput.value); if (newSets > 0) exercise.sets = newSets; if (newDuration > 0) exercise.duration = newDuration; } else { const newSets = parseInt(editSetsInput.value); const newReps = editRepsInput.value.trim(); if (newSets > 0) exercise.sets = newSets; if (newReps) exercise.reps = newReps; } saveDataToLocalStorage(); renderWorkoutPage(); closeModal(editWorkoutExerciseModal); swipeState.instanceIdToEdit = null; } });
cancelEditBtn.addEventListener('click', () => closeModal(editWorkoutExerciseModal));


stopwatchActionBtn.addEventListener('click', () => { if (stopwatchActionBtn.classList.contains('log-state')) { logStopwatchSet(); } else { stopStopwatch(); } });
stopwatchCancelBtn.addEventListener('click', () => closeStopwatchModal());
closeCompleteModalBtn.addEventListener('click', () => { closeModal(workoutCompleteModal); renderWorkoutPage(); });

prevDayBtn.addEventListener('click', () => changeDate(-1));
nextDayBtn.addEventListener('click', () => changeDate(1));
dateDisplayBtn.addEventListener('click', () => { if (dateDisplayBtn.disabled) return; currentDate = new Date(); renderCurrentPage(); });
document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) { allModals.forEach(m => closeModal(m)); closeCountdownModal(); closeStopwatchModal(true); } });
countdownModal.addEventListener('click', e => { if (e.target.classList.contains('modal-content') || e.target.classList.contains('countdown-timer-wrapper')) closeCountdownModal(); });
actionsMenuBtn.addEventListener('click', () => actionsDropdown.classList.toggle('hidden'));
exportDataBtn.addEventListener('click', () => { exportDataToFile(); actionsDropdown.classList.add('hidden'); });
importDataBtn.addEventListener('click', () => { fileLoaderInput.click(); actionsDropdown.classList.add('hidden'); });
fileLoaderInput.addEventListener('change', importDataFromFile);

// --- FILTERING AND DETAILS MODAL ---
function populateFilterControls() {
    const categories = [...new Set(allData.exerciseDatabase.map(ex => ex.category))].sort();
    const muscles = [...new Set(allData.exerciseDatabase.map(ex => ex.primaryMuscles))].sort();
    const types = [...new Set(allData.exerciseDatabase.map(ex => ex.type))].sort();

    filterCategorySelect.innerHTML = '<option value="">All Categories</option>';
    filterMuscleSelect.innerHTML = '<option value="">All Muscles</option>';
    filterTypeSelect.innerHTML = '<option value="">All Types</option>';

    categories.forEach(c => filterCategorySelect.innerHTML += `<option value="${c}">${c}</option>`);
    muscles.forEach(m => filterMuscleSelect.innerHTML += `<option value="${m}">${m}</option>`);
    types.forEach(t => filterTypeSelect.innerHTML += `<option value="${t}">${t}</option>`);
}

function handleFilterChange() {
    const filters = {
        category: filterCategorySelect.value,
        muscle: filterMuscleSelect.value,
        type: filterTypeSelect.value
    };
    const sortBy = sortExercisesSelect.value;
    renderExerciseDatabase(filters, sortBy);
}

function openDetailsModal(exerciseId) {
    const exercise = allData.exerciseDatabase.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    detailsExerciseName.textContent = exercise.name;
    if (exercise.videoUrl) {
        // [MODIFIED] Reverted to simpler embed to remove non-working loop logic
        detailsVideoContainer.innerHTML = `<iframe src="${exercise.videoUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    } else {
        detailsVideoContainer.innerHTML = '<div class="placeholder-card" style="margin:0; border-radius:0;">No video available.</div>';
    }
    
    document.querySelector('.details-tab-btn.active').classList.remove('active');
    document.querySelector('.details-tab-btn[data-tab="instructions"]').classList.add('active');
    renderTabContent('instructions', exercise);
    openModal(exerciseDetailsModal);
}

function renderTabContent(tab, exercise) {
    if (tab === 'instructions') {
        detailsTabContent.innerHTML = `<p>${exercise.instructions || 'No instructions available.'}</p>`;
    } else if (tab === 'muscles') {
        detailsTabContent.innerHTML = `
            <ul class="details-muscle-list">
                <li><strong>Primary:</strong> ${exercise.primaryMuscles}</li>
                <li><strong>Secondary:</strong> ${exercise.secondaryMuscles || 'None'}</li>
                <li><strong>Category:</strong> ${exercise.category}</li>
                <li><strong>Type:</strong> ${exercise.type}</li>
            </ul>`;
    }
}

function openAddToRoutineModal(id) {
    exerciseToAdd.id = id;
    const exercise = allData.exerciseDatabase.find(ex => ex.id === id);
    if (!exercise) return;

    addToRoutineTitle.textContent = `Add "${exercise.name}"`;
    addToRoutineSelect.innerHTML = '<option value="" disabled selected>Choose a routine...</option>';
    if (allData.routines.length === 0) {
        addToRoutineSelect.innerHTML = '<option value="" disabled>No routines created yet.</option>';
    }
    allData.routines.forEach(r => {
        addToRoutineSelect.innerHTML += `<option value="${r.id}">${r.name}</option>`;
    });
    
    modalRepsBasedInputs.classList.remove('hidden');
    modalTimeBasedInputs.classList.add('hidden');
    const activeButton = modalTrackTypeToggle.querySelector('.track-type-btn[data-track-type="reps"]');
    modalTrackTypeToggle.querySelector('.active').classList.remove('active');
    activeButton.classList.add('active');
    
    openModal(addToRoutineModal);
}

filterCategorySelect.addEventListener('change', handleFilterChange);
filterMuscleSelect.addEventListener('change', handleFilterChange);
filterTypeSelect.addEventListener('change', handleFilterChange);
sortExercisesSelect.addEventListener('change', handleFilterChange);
detailsModalCloseBtn.addEventListener('click', () => closeModal(exerciseDetailsModal));
exerciseDetailsModal.addEventListener('click', e => {
    if (e.target.classList.contains('details-tab-btn')) {
        const tab = e.target.dataset.tab;
        const exercise = allData.exerciseDatabase.find(ex => ex.name === detailsExerciseName.textContent);
        document.querySelector('.details-tab-btn.active').classList.remove('active');
        e.target.classList.add('active');
        renderTabContent(tab, exercise);
    }
});

modalTrackTypeToggle.addEventListener('click', e => {
    if (e.target.matches('.track-type-btn')) {
        const type = e.target.dataset.trackType;
        modalTrackTypeToggle.querySelector('.active').classList.remove('active');
        e.target.classList.add('active');
        if (type === 'reps') {
            modalRepsBasedInputs.classList.remove('hidden');
            modalTimeBasedInputs.classList.add('hidden');
        } else {
            modalRepsBasedInputs.classList.add('hidden');
            modalTimeBasedInputs.classList.remove('hidden');
        }
    }
});

addToRoutineForm.addEventListener('submit', e => {
    e.preventDefault();
    const routineId = parseInt(addToRoutineSelect.value);
    if (isNaN(routineId)) {
        alert("Please choose a routine.");
        return;
    }

    const routine = allData.routines.find(r => r.id === routineId);
    if (!routine) return;

    const trackType = modalTrackTypeToggle.querySelector('.active').dataset.trackType;
    let exerciseData;

    if (trackType === 'reps') {
        const sets = parseInt(addToRoutineSetsInput.value);
        const reps = addToRoutineRepsInput.value.trim();
        if (isNaN(sets) || sets <= 0 || !reps) {
            alert("Please enter valid sets and reps.");
            return;
        }
        exerciseData = { exerciseId: exerciseToAdd.id, sets, reps, trackType: 'reps' };
    } else { // trackType is 'time'
        const sets = parseInt(addToRoutineTimeSetsInput.value);
        const duration = parseInt(addToRoutineDurationInput.value);
        if (isNaN(sets) || sets <= 0 || isNaN(duration) || duration <= 0) {
            alert("Please enter valid sets and duration.");
            return;
        }
        exerciseData = { exerciseId: exerciseToAdd.id, sets, duration, trackType: 'time' };
    }

    routine.exercises.push(exerciseData);
    saveDataToLocalStorage();
    alert(`Added to ${routine.name}!`);
    closeModal(addToRoutineModal);
    showPage('routines-page');
    const routineCard = document.querySelector(`.swipe-item-container[data-id="${routineId}"]`);
    if(routineCard) routineCard.scrollIntoView({ behavior: 'smooth' });
});
cancelAddToRoutineBtn.addEventListener('click', () => closeModal(addToRoutineModal));

// --- ROUTINE EDITOR AND DETAILS ---
document.querySelector('.track-type-toggle').addEventListener('click', e => {
    if (e.target.matches('.track-type-btn')) {
        const type = e.target.dataset.trackType;
        document.querySelector('.track-type-btn.active').classList.remove('active');
        e.target.classList.add('active');
        if (type === 'reps') {
            repsBasedInputs.classList.remove('hidden');
            timeBasedInputs.classList.add('hidden');
        } else {
            repsBasedInputs.classList.add('hidden');
            timeBasedInputs.classList.remove('hidden');
        }
    }
});

routineExerciseInput.addEventListener('input', () => {
    const query = routineExerciseInput.value.toLowerCase();
    autocompleteResults.innerHTML = '';
    if (!query) {
        autocompleteResults.classList.add('hidden');
        return;
    }
    const matches = allData.exerciseDatabase.filter(ex => ex.name.toLowerCase().includes(query));
    if (matches.length > 0) {
        matches.slice(0, 5).forEach(ex => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = ex.name;
            item.dataset.id = ex.id;
            autocompleteResults.appendChild(item);
        });
        autocompleteResults.classList.remove('hidden');
    } else {
        autocompleteResults.classList.add('hidden');
    }
});

autocompleteResults.addEventListener('click', e => {
    if (e.target.classList.contains('autocomplete-item')) {
        const id = parseInt(e.target.dataset.id);
        const exercise = allData.exerciseDatabase.find(ex => ex.id === id);
        if (exercise) {
            routineExerciseInput.value = exercise.name;
            routineBuilderState.selectedExerciseId = id;
            autocompleteResults.classList.add('hidden');
        }
    }
});

function openRoutineDetailsModal(routineId) {
    const routine = allData.routines.find(r => r.id === routineId);
    if (!routine) return;
    activeRoutineDetails.id = routineId;
    routineDetailsTitle.textContent = routine.name;
    renderRoutineDetailsList(routine);
    openModal(routineDetailsModal);
    initRoutineDetailsSortable(routineId);
}

function renderRoutineDetailsList(routine) {
    routineDetailsList.innerHTML = '';
    if (routine.exercises.length === 0) {
        routineDetailsList.innerHTML = `<div class="placeholder-card">This routine has no exercises.</div>`;
        return;
    }
    routine.exercises.forEach((exRef, index) => {
        const exercise = allData.exerciseDatabase.find(e => e.id === exRef.exerciseId);
        if (exercise) {
            const item = document.createElement('div');
            item.className = 'routine-details-item sortable-item';
            item.dataset.index = index;
            const details = exRef.trackType === 'time' ? `${exRef.sets} sets × ${exRef.duration} sec` : `${exRef.sets} sets × ${exRef.reps} reps`;
            item.innerHTML = `
                <div class="routine-details-item-main">
                    <span class="exercise-item-name">${exercise.name}</span>
                    <small class="exercise-item-stats">${details}</small>
                </div>
                <div class="routine-details-item-actions">
                    <button class="item-action-btn delete-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1H8.75zM10 4.5a.75.75 0 01.75.75v8.5a.75.75 0 01-1.5 0v-8.5A.75.75 0 0110 4.5z" clip-rule="evenodd" /></svg>
                    </button>
                </div>
            `;
            routineDetailsList.appendChild(item);
        }
    });
}

routineDetailsList.addEventListener('click', e => {
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
        const item = deleteBtn.closest('.routine-details-item');
        const index = parseInt(item.dataset.index);
        const routine = allData.routines.find(r => r.id === activeRoutineDetails.id);
        if (routine && confirm('Are you sure you want to remove this exercise from the routine?')) {
            routine.exercises.splice(index, 1);
            saveDataToLocalStorage();
            renderRoutineDetailsList(routine);
            renderSavedRoutines();
        }
    }
});
closeRoutineDetailsBtn.addEventListener('click', () => closeModal(routineDetailsModal));

// --- 8. INITIALIZE APP ---
async function initializeApp() {
    loadDataFromLocalStorage();
    loadRoutineBuilderState(); 
    await loadExercisesFromCSV();
    populateFilterControls();
    showPage('workout-page');
    validateRoutineForm();
    initRoutineBuilderSortable();
    renderRoutineBuilderList();
}
initializeApp();
```

---

### `style.css` (Updated)

```css
/* --- Royal Night Theme v1.0 (Adapted for Workout Tracker) --- */
/* 1. CSS Variables & Root Setup */
:root { --font-sans: 'Inter',-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; --color-background: #1A1D2D; --color-surface: #24283B; --color-surface-raised: #363A50; --color-primary: #A78BFA; --color-primary-hover: #C4B5FD; --color-accent: #22C55E; --color-danger: #F87171; --color-danger-hover: #EF4444; --color-border: rgba(255,255,255,0.1); --color-border-focus: var(--color-primary); --color-text-primary: #E5E7EB; --color-text-secondary: #9CA3AF; --color-text-tertiary: #6B7280; --color-text-on-primary: #111827; --radius-sm: 4px; --radius-md: 8px; --radius-lg: 12px; --transition-fast: all 0.15s ease-in-out; }
/* 2. Basic Reset and Global Styles */
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-sans); background-color: var(--color-background); color: var(--color-text-primary); -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
#app-container { width: 100%; height: 100svh; background-color: var(--color-background); display: flex; flex-direction: column; overflow: hidden; }
.card { background-color: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border); margin-bottom: 16px; padding: 16px; position: relative; }
/* 3. Navigation */
nav { display: flex; align-items: center; border-bottom: 1px solid var(--color-border); background-color: var(--color-surface); padding: 0 16px; flex-shrink: 0; }
.nav-tabs { display: flex; }
.nav-btn { padding: 16px; border: none; border-bottom: 3px solid transparent; background-color: transparent; color: var(--color-text-secondary); font-size: 15px; font-weight: 600; cursor: pointer; transition: var(--transition-fast); margin-bottom: -1px; }
.nav-btn:hover { color: var(--color-text-primary); background-color: var(--color-surface-raised); }
.nav-btn.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }
.nav-actions { display: flex; align-items: center; margin-left: auto; }
#actions-menu-container { position: relative; }
#actions-menu-btn { background: none; border: none; color: var(--color-text-secondary); cursor: pointer; padding: 8px; border-radius: 50%; display: flex; align-items: center; transition: var(--transition-fast); }
#actions-menu-btn:hover { background-color: var(--color-surface-raised); color: var(--color-text-primary); }
#actions-dropdown { position: absolute; right: 0; top: calc(100% + 8px); background-color: var(--color-surface-raised); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2); z-index: 20; overflow: hidden; transition: transform 0.1s ease-out, opacity 0.1s ease-out; width: 180px; }
#actions-dropdown.hidden { transform: scale(0.95) translateY(-10px); opacity: 0; pointer-events: none; }
#actions-dropdown button { display: block; width: 100%; padding: 12px 16px; background: none; border: none; color: var(--color-text-primary); text-align: left; cursor: pointer; font-size: 14px; transition: var(--transition-fast); }
#actions-dropdown button:hover { background-color: var(--color-primary); color: var(--color-text-on-primary); }
/* 4. Page Management & Main Layout */
.page { display: none; flex-direction: column; flex-grow: 1; overflow: hidden; }
.page.active { display: flex; }
main { padding: 16px; flex-grow: 1; display: flex; flex-direction: column; overflow-y: auto; }
.hidden { display: none !important; }
/* 5. Forms, Inputs & Buttons */
form { display: flex; flex-direction: column; gap: 16px; }
.inputs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
input[type="text"], input[type="number"], select, textarea { width: 100%; padding: 12px; border: 1px solid var(--color-border); background-color: var(--color-background); color: var(--color-text-primary); border-radius: var(--radius-md); font-size: 15px; transition: var(--transition-fast); font-family: var(--font-sans); }
input:focus, select:focus, textarea:focus { outline: none; border-color: var(--color-border-focus); box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.4); }
input::placeholder, textarea::placeholder { color: var(--color-text-tertiary); }
textarea { resize: vertical; min-height: 80px; }
select { appearance: none; background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="%239CA3AF" viewBox="0 0 16 16"%3E%3Cpath fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"%3E%3C/path%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: right 0.75rem center; background-size: 1em; padding-right: 2.5rem; }
.btn-primary, .btn-secondary, .btn-danger { width: 100%; padding: 12px; border: 1px solid transparent; border-radius: var(--radius-md); font-size: 15px; font-weight: 600; cursor: pointer; transition: var(--transition-fast); }
.btn-primary { background-color: var(--color-primary); color: var(--color-text-on-primary); }
.btn-primary:hover { background-color: var(--color-primary-hover); }
.btn-secondary { background-color: var(--color-surface-raised); color: var(--color-text-primary); border-color: var(--color-border); }
.btn-secondary:hover { background-color: #484d66; }
.btn-danger { background-color: var(--color-danger); color: white; margin: 0; }
.btn-danger:hover { background-color: var(--color-danger-hover); }
.btn-primary:disabled, .btn-secondary:disabled, .btn-danger:disabled { background-color: var(--color-surface); color: var(--color-text-tertiary); cursor: not-allowed; border-color: var(--color-border); }
.text-btn { background: none; border: none; color: var(--color-text-secondary); cursor: pointer; font-size: 14px; font-weight: 600; transition: var(--transition-fast); padding: 0; }
.text-btn:hover { color: var(--color-primary); text-decoration: underline; }

/* 6. Generic List, Swipe & Sortable Styles */
.section-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid var(--color-border); margin-bottom: 16px; }
h2 { color: var(--color-text-primary); font-size: 18px; font-weight: 600; padding:0; margin: 0; }
h3 { margin: 0 0 16px 0; color: var(--color-text-primary); font-size: 16px; font-weight: 500;}
.scrollable-content { flex-grow: 1; overflow-y: auto; }
.sortable-item .swipe-content, .sortable-item .routine-details-item-main { cursor: grab; }
.sortable-ghost { background: var(--color-surface-raised); opacity: 0.5; border-radius: var(--radius-md); }
.sortable-chosen { cursor: grabbing; }
.swipe-item-container { position: relative; overflow: hidden; background-color: var(--color-surface); border-radius: var(--radius-md); }
.swipe-content { position: relative; z-index: 2; display: flex; align-items: center; gap: 16px; width: 100%; background-color: var(--color-surface); transition: transform 0.3s ease-out; padding: 12px 16px; }
.swipe-actions { position: absolute; top: 0; right: 0; height: 100%; z-index: 1; display: flex; }
.swipe-action-btn { width: 80px; border: none; font-weight: 600; font-size: 12px; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
.swipe-action-btn svg { width: 20px; height: 20px; fill: currentColor; }
.swipe-swap-btn { background-color: #3B82F6; }
.swipe-edit-btn { background-color: var(--color-primary); }
.swipe-delete-btn { background-color: var(--color-danger); }

/* 7. Specific Page Overrides */
#exercises-page .card h3, #routines-page .card h3 { text-align: center; }
.exercise-item-main { flex-grow: 1; text-align: left; }
.exercise-item-name { font-size: 15px; font-weight: 500; display: block; margin-bottom: 2px;}
.exercise-item-stats { color: var(--color-text-secondary); font-size: 13px; text-transform: capitalize; }
#add-exercise-to-routine-controls { display: flex; flex-direction: column; gap: 16px; }
.form-section-label { font-size: 14px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: -8px; margin-top: 8px; border-bottom: 1px solid var(--color-border); padding-bottom: 8px; }
#routine-builder-list { margin-top: 0; border-top: 1px solid var(--color-border); padding-top: 16px; display: flex; flex-direction: column; gap: 12px; }
.routine-builder-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px; background-color: var(--color-background); border-radius: var(--radius-md); border: 1px solid var(--color-border); user-select: none; }
.routine-builder-item .exercise-item-main { text-align: left; }
.form-actions { margin-top: 8px; }
#create-routine-form .form-actions { display: flex; gap: 12px; } /* MODIFIED for two buttons */
.placeholder-card { background-color: var(--color-surface); border: 2px dashed var(--color-border); border-radius: var(--radius-lg); padding: 40px; text-align: center; color: var(--color-text-secondary); }
#db-exercise-list, #saved-routines-list { display: flex; flex-direction: column; gap: 16px; }
.exercise-group-card { padding: 0 0 16px; }
.exercise-group-card h3 { padding: 16px 16px 12px; border-bottom: 1px solid var(--color-border); }
.exercise-group-list { display: flex; flex-direction: column; gap: 0; }
.exercise-group-list .exercise-list-item { border-radius: 0; border-bottom: 1px solid var(--color-border); display: flex; align-items: center; padding: 12px 16px; }
.exercise-group-list .exercise-list-item:last-child { border-bottom: none; }
#saved-routines-list .swipe-item-container { border: 1px solid var(--color-border); }

/* Active Workout Page */
#routine-selection-area { display: flex; gap: 16px; align-items: center; }
#active-routine-info .section-header { border: none; padding: 0; margin: 0; }
.header-actions { display: flex; align-items: center; gap: 12px; }
.header-actions .btn-danger { width: auto; }
.header-actions .text-btn { color: var(--color-text-secondary); }
.header-actions .text-btn:hover { color: var(--color-danger); }
#active-routine-display { display: flex; flex-direction: column; gap: 12px; }
.active-routine-exercise { padding: 0; overflow: visible; margin-bottom: 0; border: none; background: none; }
.active-routine-exercise .swipe-item-container { border: 2px solid var(--color-surface); }
.active-routine-exercise.current .swipe-item-container { border-color: var(--color-primary); }
.active-routine-exercise.finished { opacity: 0.6; }
.exercise-content { flex-grow: 1; display: flex; flex-direction: column; }
.exercise-header { display: flex; justify-content: center; align-items: center; margin-bottom: 12px; text-align: center; }
.exercise-actions { margin-top: auto; }
#active-routine-display .workout-summary-card { max-width: 600px; margin-left: auto; margin-right: auto; }
.workout-summary-card { padding: 0; }
.summary-header { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px 16px; border-bottom: 1px solid var(--color-border); text-align: center; }
.summary-header > div { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.summary-header h2 { border: none; font-size: 24px; margin: 0; }
.summary-total-time { font-size: 32px; color: var(--color-primary); font-weight: 700; line-height: 1; }
.summary-total-time::before { content: 'Total Workout Time'; display: block; font-size: 14px; font-weight: 500; color: var(--color-text-secondary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
.summary-header .btn-primary { flex-shrink: 0; width: auto; padding: 8px 24px; }
.summary-exercise-card { background-color: var(--color-background); border: 1px solid var(--color-border); border-radius: var(--radius-md); margin: 0 16px 12px 16px; }
.summary-exercise-header { display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid var(--color-border); justify-content: center; }
.summary-exercise-header .exercise-item-main { flex-grow: 0; text-align: center; }
.summary-exercise-header .exercise-item-name { font-size: 16px; }
.summary-exercise-header .exercise-item-stats { font-size: 12px; }
.summary-sets-list { display: flex; flex-direction: column; gap: 8px; padding: 12px; }
.summary-set-item { display: flex; justify-content: center; align-items: center; gap: 12px; }
.summary-set-item .set-label { font-size: 14px; font-weight: 500; color: var(--color-text-secondary); width: 50px; text-align: right; }
.summary-set-item input { padding: 8px; font-size: 14px; text-align: center; width: 80px; }
.summary-logged-time { font-family: monospace; font-size: 14px; color: var(--color-text-secondary); }
.summary-notes-section { padding: 16px; }
.summary-notes-section h3 { margin: 0 0 12px 0; font-size: 16px; text-align: center; }
.summary-actions { padding: 16px; border-top: 1px solid var(--color-border); }
.set-progress-display { text-align: center; color: var(--color-text-secondary); font-size: 14px; font-weight: 500; margin-bottom: 12px; }
.timer-controls { background-color: var(--color-background); border-radius: var(--radius-md); padding: 12px; margin-top: 16px; border: 1px solid var(--color-border); }
.timer-toggle-area { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.timer-toggle-area label { font-weight: 500; font-size: 14px; }
.timer-intervals { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.timer-interval-btn { background-color: var(--color-surface); color: var(--color-text-secondary); border: 1px solid var(--color-border); padding: 6px 10px; border-radius: var(--radius-sm); font-weight: 500; font-size: 13px; transition: var(--transition-fast); cursor: pointer; }
.timer-interval-btn:disabled { background-color: var(--color-background); color: var(--color-text-tertiary); cursor: not-allowed; }
.timer-interval-btn.selected { background-color: var(--color-primary); color: var(--color-text-on-primary); border-color: var(--color-primary-hover); }
.toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--color-surface-raised); transition: .4s; border-radius: 34px; border: 1px solid var(--color-border); }
.toggle-slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
input:checked + .toggle-slider { background-color: #FBBF24; }
input:checked + .toggle-slider:before { transform: translateX(20px); }
/* 8. Footers */
#tracker-footer { padding: 12px 16px; background-color: var(--color-surface); border-top: 1px solid var(--color-border); padding-bottom: calc(12px + env(safe-area-inset-bottom)); }
#date-nav { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; }
#date-nav button { background: none; border: none; color: var(--color-text-secondary); cursor: pointer; padding: 0; transition: var(--transition-fast); display: flex; align-items: center; justify-content: center; }
#date-nav button:not(.date-display) { padding: 4px; }
#date-nav button svg { width: 24px; height: 24px; }
#date-nav button:hover:not(:disabled) { color: var(--color-primary); }
#date-nav button:disabled { color: var(--color-text-tertiary); cursor: not-allowed; }
.date-display { color: var(--color-text-primary); font-weight: 600; font-size: 16px; text-align: center; border-radius: var(--radius-md); padding: 4px 8px; }
.date-display:disabled { color: var(--color-text-primary); }
.date-display:hover:not(:disabled) { background-color: var(--color-surface-raised); color: var(--color-primary-hover); }
/* 9. Modal & Reports Styles */
.modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal.hidden { display: none; }
.modal-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(18, 18, 29, 0.7); backdrop-filter: blur(4px); }
.modal-content { position: relative; z-index: 101; background-color: var(--color-surface); padding: 24px; border-radius: var(--radius-lg); border: 1px solid var(--color-border); width: 100%; max-width: 400px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2); }
.countdown-content { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; cursor: pointer; background-color: var(--color-surface-raised); }
.countdown-timer-wrapper { position: relative; display: flex; align-items: center; justify-content: center; }
.countdown-svg { width: 200px; height: 200px; }
.timer-bg, .timer-progress { fill: none; stroke-linecap: round; }
.timer-bg { stroke: var(--color-surface); }
.timer-progress { stroke: var(--color-primary); transition: stroke-dashoffset 1s linear; }
.countdown-timer-text { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
#countdown-timer-display { font-size: 64px; font-weight: 700; color: var(--color-text-primary); line-height: 1; }
#countdown-label { font-size: 14px; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
#countdown-next-exercise-info { text-align: center; display: flex; flex-direction: column; gap: 4px; pointer-events: none; }
#countdown-next-exercise-info > small { color: var(--color-text-tertiary); font-size: 13px; font-weight: 500; text-transform: uppercase; }
#countdown-next-exercise-name { font-size: 20px; font-weight: 600; color: var(--color-text-primary); }
#countdown-next-exercise-details { font-size: 15px; color: var(--color-text-secondary); }
.stopwatch-content { padding: 32px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 24px; }
.stopwatch-header { margin-bottom: 8px; }
.stopwatch-header h3 { margin: 0; font-size: 24px; }
.stopwatch-header small { color: var(--color-text-secondary); }
#stopwatch-timer-display { font-family: monospace, sans-serif; font-size: 56px; color: var(--color-primary); font-weight: 600; letter-spacing: 1px; }
.stopwatch-modal-controls { display: flex; flex-direction: column; gap: 12px; width: 100%; }
.stopwatch-modal-controls .btn-danger, .stopwatch-modal-controls .btn-primary { padding-top: 16px; padding-bottom: 16px; font-size: 18px; }
.stopwatch-modal-controls .text-btn { color: var(--color-text-secondary); }
.stopwatch-modal-controls .text-btn:hover { color: var(--color-text-primary); text-decoration: none; }
#stopwatch-action-btn.log-state { background-color: var(--color-accent); }
#stopwatch-action-btn.log-state:hover { background-color: #16A34A; }
.workout-complete-content { text-align: center; padding: 32px; display: flex; flex-direction: column; gap: 24px; }
.workout-complete-title { font-size: 28px; font-weight: 700; color: var(--color-accent); margin: 0; }
.workout-complete-time-info { display: flex; flex-direction: column; gap: 4px; }
.workout-complete-time-info small { color: var(--color-text-secondary); font-size: 14px; text-transform: uppercase; }
.workout-complete-time-info span { color: var(--color-text-primary); font-size: 36px; font-weight: 600; }
.filter-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.filter-controls select { width: 100%; }
.exercise-list-actions { display: flex; gap: 8px; margin-left: auto; }
.exercise-list-btn { background-color: var(--color-surface-raised); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition-fast); }
.exercise-list-btn svg { width: 20px; height: 20px; color: var(--color-text-secondary); }
.exercise-list-btn:hover { background-color: var(--color-primary); }
.exercise-list-btn:hover svg { color: var(--color-text-on-primary); }
.details-modal-content {
    padding: 0;
    overflow: hidden;
    height: 75svh; 
    display: flex; 
    flex-direction: column;
}
#details-video-container {
    width: 100%;
    background-color: #000;
    position: relative;
    padding-top: 56.25%; 
    flex-shrink: 0; 
}
#details-video-container iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
}
.details-modal-content h3 {
    padding: 16px 16px 0;
    margin: 0;
    font-size: 20px;
    flex-shrink: 0;
}
.details-tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border);
    margin: 16px 16px 0 16px; 
    flex-shrink: 0;
}
.details-tab-btn {
    flex: 1;
    padding: 12px;
    border: none;
    background: none;
    color: var(--color-text-secondary);
    font-weight: 600;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    transition: var(--transition-fast);
}
.details-tab-btn.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
}
#details-tab-content {
    padding: 16px;
    line-height: 1.6;
    color: var(--color-text-secondary);
    overflow-y: auto; 
    flex-grow: 1; 
}
.details-muscle-list {
    list-style: none;
    padding: 0;
}
.details-muscle-list li {
    margin-bottom: 8px;
}
.details-muscle-list li strong {
    color: var(--color-text-primary);
    display: inline-block;
    width: 100px;
}
#details-modal-close-btn {
    margin: 16px;
    width: calc(100% - 32px);
    flex-shrink: 0;
}
.autocomplete-container { position: relative; }
#autocomplete-results { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background-color: var(--color-surface-raised); border: 1px solid var(--color-border); border-radius: var(--radius-md); max-height: 200px; overflow-y: auto; z-index: 10; }
.autocomplete-item { padding: 12px; cursor: pointer; border-bottom: 1px solid var(--color-border); }
.autocomplete-item:last-child { border-bottom: none; }
.autocomplete-item:hover { background-color: var(--color-primary); color: var(--color-text-on-primary); }
.track-type-toggle { display: flex; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
.track-type-btn { flex: 1; padding: 10px; background-color: var(--color-surface); color: var(--color-text-secondary); border: none; cursor: pointer; transition: var(--transition-fast); font-weight: 500; }
.track-type-btn.active { background-color: var(--color-primary); color: var(--color-text-on-primary); }
#routine-details-list { display: flex; flex-direction: column; gap: 12px; }
.routine-details-item { display: flex; align-items: center; gap: 12px; background-color: var(--color-background); padding: 12px; border-radius: var(--radius-md); }
.routine-details-item-main { flex-grow: 1; }
.routine-details-item-actions { display: flex; gap: 8px; }
.item-action-btn { background: none; border: none; color: var(--color-text-secondary); cursor: pointer; padding: 4px; }
.item-action-btn svg { width: 20px; height: 20px; }
.item-action-btn:hover { color: var(--color-primary); }
.item-action-btn.delete-btn:hover { color: var(--color-danger); }