// --- 1. GLOBAL STATE AND REFERENCES ---
let currentDate = new Date();
let routineEditingState = { isEditing: false, id: null };
let routineBuilderState = { exercises: [], selectedExerciseId: null };
let countdownIntervalId = null;
let countdownInitialDuration = 0;
let stopwatchIntervalId = null;
let currentStopwatchInstanceId = null;
let routineBuilderSortable = null, dailyWorkoutSortable = null, savedRoutinesSortable = null;
let swipeState = { openCardContent: null, instanceIdToSwap: null, instanceIdToEdit: null };

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
const routineTrackTypeToggle = document.getElementById('routine-track-type-toggle'), repsBasedInputs = document.getElementById('reps-based-inputs'), timeBasedInputs = document.getElementById('time-based-inputs'), routineTimeSetsInput = document.getElementById('routine-time-sets-input'), routineDurationInput = document.getElementById('routine-duration-input');
const dailyRoutineSelect = document.getElementById('daily-routine-select'), startRoutineBtn = document.getElementById('start-routine-btn'), activeRoutineDisplay = document.getElementById('active-routine-display'), routineSelectionArea = document.getElementById('routine-selection-area'), activeRoutineInfo = document.getElementById('active-routine-info'), activeRoutineName = document.getElementById('active-routine-name');
const imageViewerModal = document.getElementById('image-viewer-modal'), fullSizeImage = document.getElementById('full-size-image'), allModals = document.querySelectorAll('.modal');
const dateDisplayBtn = document.getElementById('date-display-btn'), prevDayBtn = document.getElementById('prev-day-btn'), nextDayBtn = document.getElementById('next-day-btn');
const actionsMenuBtn = document.getElementById('actions-menu-btn'), actionsDropdown = document.getElementById('actions-dropdown'), importDataBtn = document.getElementById('import-data-btn'), exportDataBtn = document.getElementById('export-data-btn'), fileLoaderInput = document.getElementById('file-loader');
const stopwatchModal = document.getElementById('stopwatch-modal'), stopwatchExerciseName = document.getElementById('stopwatch-exercise-name'), stopwatchTimerDisplay = document.getElementById('stopwatch-timer-display'), stopwatchActionBtn = document.getElementById('stopwatch-action-btn'), stopwatchCancelBtn = document.getElementById('stopwatch-cancel-btn');
const countdownModal = document.getElementById('countdown-modal'), countdownTimerDisplay = document.getElementById('countdown-timer-display'), countdownLabel = document.getElementById('countdown-label'), countdownNextExerciseInfo = document.getElementById('countdown-next-exercise-info'), countdownNextExerciseName = document.getElementById('countdown-next-exercise-name'), countdownNextExerciseDetails = document.getElementById('countdown-next-exercise-details'), countdownProgressCircle = document.querySelector('.timer-progress');
const workoutCompleteModal = document.getElementById('workout-complete-modal'), workoutTotalTimeDisplay = document.getElementById('workout-total-time'), closeCompleteModalBtn = document.getElementById('close-complete-modal-btn');
const swapExerciseModal = document.getElementById('swap-exercise-modal'), swapExerciseForm = document.getElementById('swap-exercise-form'), swapExerciseSelect = document.getElementById('swap-exercise-select'), cancelSwapBtn = document.getElementById('cancel-swap-btn');
const editWorkoutExerciseModal = document.getElementById('edit-workout-exercise-modal'), editWorkoutExerciseForm = document.getElementById('edit-workout-exercise-form'), editModalTitle = document.getElementById('edit-modal-title'), editRepsBasedInputs = document.getElementById('edit-reps-based-inputs'), editTimeBasedInputs = document.getElementById('edit-time-based-inputs'), editSetsInput = document.getElementById('edit-sets-input'), editRepsInput = document.getElementById('edit-reps-input'), editTimeSetsInput = document.getElementById('edit-time-sets-input'), editDurationInput = document.getElementById('edit-duration-input'), cancelEditBtn = document.getElementById('cancel-edit-btn');
const filterCategorySelect = document.getElementById('filter-category'), filterMuscleSelect = document.getElementById('filter-muscle'), filterTypeSelect = document.getElementById('filter-type'), sortExercisesSelect = document.getElementById('sort-exercises');

const circleCircumference = 2 * Math.PI * 54;
const SWIPE_ACTION_WIDTH = 160; // 2 buttons * 80px
const SWIPE_ACTION_WIDTH_WORKOUT = 240; // 3 buttons * 80px

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
            id: Date.now() + index,
            name: row['Exercise'],
            videoUrl: row['Video URL'],
            type: row['Type'],
            primaryMuscles: row['Primary Muscles'],
            secondaryMuscles: row['Secondary Muscles'],
            category: row['Workout Category'],
            trackType: 'reps' // Default all exercises to 'reps'
        }));
    } catch (error) {
        console.error('Failed to load or parse exercises from CSV:', error);
        if (!allData.exerciseDatabase) allData.exerciseDatabase = [];
    }
}
function openModal(modalElement) { modalElement.classList.remove('hidden'); }
function closeModal(modalElement) { modalElement.classList.add('hidden'); }
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
        populateExerciseDropdown();
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

    if (filters.category) {
        filteredData = filteredData.filter(ex => ex.category === filters.category);
    }
    if (filters.muscle) {
        filteredData = filteredData.filter(ex => ex.primaryMuscles === filters.muscle);
    }
    if (filters.type) {
        filteredData = filteredData.filter(ex => ex.type === filters.type);
    }

    if (sortBy === 'az') {
        filteredData.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'za') {
        filteredData.sort((a, b) => b.name.localeCompare(a.name));
    }

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
            itemDiv.className = 'swipe-item-container';
            itemDiv.innerHTML = `
                <div class="swipe-content">
                    <div class="db-item-thumbnail" style="background-color: var(--color-background);"></div>
                    <div class="exercise-item-main">
                        <span class="exercise-item-name">${ex.name}</span>
                        <small class="exercise-item-stats">${ex.primaryMuscles} • ${ex.type}</small>
                    </div>
                </div>`;
            listContainer.appendChild(itemDiv);
        });
        groupCard.appendChild(listContainer);
        dbExerciseListDiv.appendChild(groupCard);
    });
}

function populateExerciseDropdown(selectElement = swapExerciseSelect) {
    const currentValue = selectElement.value;
    selectElement.innerHTML = `<option value="" disabled selected>Choose replacement...</option>`;
    
    const exercisesByType = allData.exerciseDatabase.reduce((acc, ex) => {
        const type = ex.category || 'Uncategorized';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(ex);
        return acc;
    }, {});

    Object.keys(exercisesByType).sort().forEach(type => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = type;
        
        const sortedExercises = exercisesByType[type].sort((a, b) => a.name.localeCompare(b.name));
        
        sortedExercises.forEach(ex => {
            const o = document.createElement('option');
            o.value = ex.id;
            o.textContent = ex.name;
            optgroup.appendChild(o);
        });
        selectElement.appendChild(optgroup);
    });
    selectElement.value = currentValue;
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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13.854 2.146a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.708 0l-2.5-2.5a.5.5 0 1 1 .708-.708L3.5 11.293l9.646-9.647a.5.5 0 0 1 .708 0zM12.5 4.5a.5.5 0 0 0-1 0v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 0-1h-1z"/></svg>
                    <span>Edit</span>
                </button>
                <button class="swipe-action-btn swipe-delete-btn" data-id="${r.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M6 2a2 2 0 0 0-2 2v1H2.5a.5.5 0 0 0 0 1h1V15a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V6h1a.5.5 0 0 0 0-1H14V4a2 2 0 0 0-2-2H6zm1 2h4v1H7V4zM5 6h8v9H5V6z"/></svg>
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
                    <div class="db-item-thumbnail" style="background-color: var(--color-background);"></div>
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
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M14.5 1.5a.5.5 0 0 1 .5.5v11.5a.5.5 0 0 1-1 0V2.707l-2.646 2.647a.5.5 0 0 1-.708-.708l3.5-3.5a.5.5 0 0 1 .708 0zM5.5 18.5a.5.5 0 0 1-.5-.5V6.5a.5.5 0 0 1 1 0v11.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0z"/></svg>
                        <span>Swap</span>
                    </button>
                    <button class="swipe-action-btn swipe-edit-btn" data-instance-id="${exercise.instanceId}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13.854 2.146a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.708 0l-2.5-2.5a.5.5 0 1 1 .708-.708L3.5 11.293l9.646-9.647a.5.5 0 0 1 .708 0zM12.5 4.5a.5.5 0 0 0-1 0v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 0-1h-1z"/></svg>
                        <span>Edit</span>
                    </button>
                    <button class="swipe-action-btn swipe-delete-btn" data-instance-id="${exercise.instanceId}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M6 2a2 2 0 0 0-2 2v1H2.5a.5.5 0 0 0 0 1h1V15a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V6h1a.5.5 0 0 0 0-1H14V4a2 2 0 0 0-2-2H6zm1 2h4v1H7V4zM5 6h8v9H5V6z"/></svg>
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
    handle: '.swipe-content',
    delay: 200, // Delay on drag to allow for scrolling
    delayOnTouchOnly: true
};

function initRoutineBuilderSortable() { if (routineBuilderSortable) routineBuilderSortable.destroy(); routineBuilderSortable = new Sortable(routineBuilderList, { ...sortableOptions, handle:'.routine-builder-item', onEnd: (evt) => { const movedItem = routineBuilderState.exercises.splice(evt.oldIndex, 1)[0]; routineBuilderState.exercises.splice(evt.newIndex, 0, movedItem); validateRoutineForm(); } }); }
function initDailyWorkoutSortable() { if (dailyWorkoutSortable) dailyWorkoutSortable.destroy(); const dateKey = getFormattedDate(currentDate); const workoutData = allData.history[dateKey]; if (!workoutData) return; dailyWorkoutSortable = new Sortable(activeRoutineDisplay, { ...sortableOptions, onEnd: (evt) => { const movedItem = workoutData.routine.exercises.splice(evt.oldIndex, 1)[0]; workoutData.routine.exercises.splice(evt.newIndex, 0, movedItem); const movedProgress = workoutData.progress.splice(evt.oldIndex, 1)[0]; workoutData.progress.splice(evt.newIndex, 0, movedProgress); saveDataToLocalStorage(); renderWorkoutPage(); } }); }
function initSavedRoutinesSortable() { if (savedRoutinesSortable) savedRoutinesSortable.destroy(); savedRoutinesSortable = new Sortable(savedRoutinesList, { ...sortableOptions, onEnd: (evt) => { const movedItem = allData.routines.splice(evt.oldIndex, 1)[0]; allData.routines.splice(evt.newIndex, 0, movedItem); saveDataToLocalStorage(); renderSavedRoutines(); } }); }

// --- 5. EVENT HANDLER & WORKFLOW FUNCTIONS ---
function handleAddExerciseToBuilder() {
    const id = routineBuilderState.selectedExerciseId;
    if (id === null) { alert("Please select an exercise from the list."); return; }
    const exercise = allData.exerciseDatabase.find(ex => ex.id === id);
    if (!exercise) return;

    let exForRoutine;
    if (exercise.trackType === 'time') {
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
}
function renderRoutineBuilderList() { routineBuilderList.innerHTML = ''; routineBuilderState.exercises.forEach(exRef => { const ex = allData.exerciseDatabase.find(dbEx => dbEx.id === exRef.exerciseId); if (ex) { const i = document.createElement('div'); i.className = 'routine-builder-item sortable-item'; i.dataset.instanceId = exRef.instanceId; const details = exRef.trackType === 'time' ? `${exRef.sets} sets × ${exRef.duration} sec` : `${exRef.sets} sets × ${exRef.reps} reps`; i.innerHTML = `<div class="routine-builder-item-main"><div class="db-item-thumbnail" style="background-color: var(--color-background);"></div><div><span class="exercise-item-name">${ex.name}</span><small class="exercise-item-stats">${details}</small></div></div><button type="button" class="item-action-btn delete-btn" data-instance-id="${exRef.instanceId}">×</button>`; routineBuilderList.appendChild(i); } }); validateRoutineForm(); }
function validateRoutineForm() { const name = routineNameInput.value.trim(); const hasExercises = routineBuilderState.exercises.length > 0; saveRoutineBtn.disabled = !(name && hasExercises); }
function handleSaveRoutine(event) { event.preventDefault(); const name = routineNameInput.value.trim(); const exercisesToSave = routineBuilderState.exercises.map(ex => { const { exerciseId, sets, reps, duration, trackType } = ex; return trackType === 'time' ? { exerciseId, sets, duration, trackType } : { exerciseId, sets, reps, trackType }; }); if (routineEditingState.isEditing) { const r = allData.routines.find(r => r.id === routineEditingState.id); if (r) { r.name = name; r.exercises = exercisesToSave; } } else { const newRoutine = { id: Date.now(), name, exercises: exercisesToSave }; allData.routines.push(newRoutine); } saveDataToLocalStorage(); renderSavedRoutines(); resetRoutineForm(); }
function resetRoutineForm() { createRoutineForm.reset(); routineBuilderState = { exercises: [], selectedExerciseId: null }; routineEditingState = { isEditing: false, id: null }; routineEditingIdInput.value = ''; saveRoutineBtn.textContent = 'Save Routine'; renderRoutineBuilderList(); }
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
routineNameInput.addEventListener('input', validateRoutineForm);
routineBuilderList.addEventListener('click', e => { if (e.target.matches('.delete-btn')) { const instanceId = parseFloat(e.target.dataset.instanceId); routineBuilderState.exercises = routineBuilderState.exercises.filter(ex => ex.instanceId !== instanceId); renderRoutineBuilderList(); } });

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

// --- [REVISED] SWIPE HANDLING ---
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
        e.preventDefault(); // Prevent vertical scroll
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
    if (isSwiping || (touchStartX !== 0 && touchStartX !== touchCurrentX)) { touchStartX = 0; touchCurrentX = 0; if (t.closest('.swipe-content')) { e.stopPropagation(); } }
    if (swipeState.openCardContent && !t.closest('.swipe-actions')) { resetSwipeState(); }

    // SHARED SWIPE ACTIONS
    const deleteBtn = t.closest('.swipe-delete-btn');
    const editBtn = t.closest('.swipe-edit-btn');
    if(deleteBtn) {
        const id = parseInt(deleteBtn.dataset.id);
        const parentList = t.closest('#saved-routines-list');
        if (parentList) {
            if (confirm('Are you sure you want to permanently delete this item?')) {
                allData.routines = allData.routines.filter(r => r.id !== id);
                if (routineEditingState.id === id) resetRoutineForm();
                renderSavedRoutines();
                saveDataToLocalStorage();
            }
        }
    } else if (editBtn) {
        const id = parseInt(editBtn.dataset.id);
        const parentList = t.closest('#saved-routines-list');
         if (parentList) {
            const r = allData.routines.find(r => r.id === id);
            if (r) { resetRoutineForm(); routineEditingState = { isEditing: true, id }; routineEditingIdInput.value = id; routineNameInput.value = r.name; routineBuilderState.exercises = r.exercises.map(leanEx => ({ ...leanEx, instanceId: Date.now() + Math.random() })); renderRoutineBuilderList(); saveRoutineBtn.textContent = 'Update Routine'; routinesPage.querySelector('main').scrollTo(0, 0); }
            resetSwipeState();
        }
    }

    // PAGE-SPECIFIC ACTIONS
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
            populateExerciseDropdown(swapExerciseSelect); openModal(swapExerciseModal);
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
        } else if (t.classList.contains('db-item-thumbnail')) {
            const id = parseInt(t.dataset.id);
            const ex = allData.exerciseDatabase.find(e => e.id === id);
            if (ex && ex.image) { fullSizeImage.src = ex.image; openModal(imageViewerModal); }
        }
    }
});

// MODAL LOGIC (SWAP, EDIT)
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
document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) { allModals.forEach(closeModal); closeCountdownModal(); closeStopwatchModal(true); } });
fullSizeImage.addEventListener('click', () => closeModal(imageViewerModal));
countdownModal.addEventListener('click', e => { if (e.target.classList.contains('modal-content') || e.target.classList.contains('countdown-timer-wrapper')) closeCountdownModal(); });
actionsMenuBtn.addEventListener('click', () => actionsDropdown.classList.toggle('hidden'));
exportDataBtn.addEventListener('click', () => { exportDataToFile(); actionsDropdown.classList.add('hidden'); });
importDataBtn.addEventListener('click', () => { fileLoaderInput.click(); actionsDropdown.classList.add('hidden'); });
fileLoaderInput.addEventListener('change', importDataFromFile);

// --- NEW --- FILTERING AND AUTOCOMPLETE ---
function populateFilterControls() {
    const categories = [...new Set(allData.exerciseDatabase.map(ex => ex.category))].sort();
    const muscles = [...new Set(allData.exerciseDatabase.map(ex => ex.primaryMuscles))].sort();
    const types = [...new Set(allData.exerciseDatabase.map(ex => ex.type))].sort();

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

filterCategorySelect.addEventListener('change', handleFilterChange);
filterMuscleSelect.addEventListener('change', handleFilterChange);
filterTypeSelect.addEventListener('change', handleFilterChange);
sortExercisesSelect.addEventListener('change', handleFilterChange);

routineExerciseInput.addEventListener('input', () => {
    const query = routineExerciseInput.value.toLowerCase();
    autocompleteResults.innerHTML = '';
    if (!query) {
        autocompleteResults.classList.add('hidden');
        return;
    }

    const matches = allData.exerciseDatabase.filter(ex => ex.name.toLowerCase().includes(query));
    if (matches.length > 0) {
        matches.slice(0, 10).forEach(ex => { // Limit to 10 results
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
            // You can add logic here to show/hide time vs reps inputs if needed
        }
    }
});

// --- 8. INITIALIZE APP ---
async function initializeApp() {
    loadDataFromLocalStorage();
    await loadExercisesFromCSV();
    populateFilterControls();
    showPage('workout-page');
    validateRoutineForm();
    initRoutineBuilderSortable();
}
initializeApp();