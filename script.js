// --- 1. GLOBAL STATE AND REFERENCES ---
let currentDate = new Date(), currentExerciseImages = [];
let dbEditingState = { isEditing: false, id: null };
let routineEditingState = { isEditing: false, id: null };
let routineBuilderState = { exercises: [] };
let countdownIntervalId = null, stopwatchIntervalId = null;
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
const addExerciseDbForm = document.getElementById('add-exercise-db-form'), dbEditingIdInput = document.getElementById('db-editing-id'), dbExerciseNameInput = document.getElementById('db-exercise-name'), dbExerciseTypeSelect = document.getElementById('db-exercise-type'), dbExerciseTrackType = document.getElementById('db-exercise-track-type'), dbExerciseImageInput = document.getElementById('db-exercise-image-input'), dbSubmitBtn = document.getElementById('db-submit-btn'), dbExerciseInstructionsInput = document.getElementById('db-exercise-instructions'), dbImagePreviewContainer = document.getElementById('db-image-preview-container');
const createRoutineForm = document.getElementById('create-routine-form'), routineEditingIdInput = document.getElementById('routine-editing-id'), routineNameInput = document.getElementById('routine-name-input'), routineExerciseSelect = document.getElementById('routine-exercise-select'), routineSetsInput = document.getElementById('routine-sets-input'), routineRepsInput = document.getElementById('routine-reps-input'), addExerciseToBuilderBtn = document.getElementById('add-exercise-to-builder-btn'), routineBuilderList = document.getElementById('routine-builder-list'), saveRoutineBtn = document.getElementById('save-routine-btn'), savedRoutinesList = document.getElementById('saved-routines-list');
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
const instructionsModal = document.getElementById('instructions-modal'), instructionsModalTitle = document.getElementById('instructions-modal-title'), instructionsModalContent = document.getElementById('instructions-modal-content'), closeInstructionsModalBtn = document.getElementById('close-instructions-modal-btn');

const circleCircumference = 2 * Math.PI * 54;
const SWIPE_ACTION_WIDTH = 160; 
const SWIPE_ACTION_WIDTH_WORKOUT = 240;

// --- 2. CORE LOGIC & HELPER FUNCTIONS ---
function showPage(pageId) { document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active')); document.getElementById(pageId).classList.add('active'); document.getElementById(`nav-${pageId.split('-')[0]}`).classList.add('active'); closeStopwatchModal(true); renderCurrentPage(); }
function validateDbForm() { const name = dbExerciseNameInput.value.trim(), type = dbExerciseTypeSelect.value, trackType = dbExerciseTrackType.value; dbSubmitBtn.disabled = !(name && type && trackType); }
function resetDbForm() { addExerciseDbForm.reset(); currentExerciseImages = []; dbEditingIdInput.value = ''; dbImagePreviewContainer.innerHTML = ''; dbSubmitBtn.textContent = 'Save to Exercise List'; dbEditingState = { isEditing: false, id: null }; validateDbForm(); }
function saveDataToLocalStorage() { try { localStorage.setItem('workoutTrackerData', JSON.stringify(allData)); } catch (error) { console.error("Could not save data", error); alert("Error saving data. Storage might be full."); } }
function loadDataFromLocalStorage() { const d = localStorage.getItem('workoutTrackerData'); if (d) { try { const p = JSON.parse(d); if (p.exerciseDatabase && p.history && p.userGoals) { allData = p; if (!allData.routines) allData.routines = []; } } catch (e) { console.error("Could not parse data", e); } } }
function openModal(modalElement) { modalElement.classList.remove('hidden'); }
function closeModal(modalElement) { modalElement.classList.add('hidden'); }
function getFormattedDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function compressImage(file, maxWidth = 600, maxHeight = 600, quality = 0.7) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = event => { const img = new Image(); img.src = event.target.result; img.onload = () => { const canvas = document.createElement('canvas'); let width = img.width; let height = img.height; if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } } else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } } canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', quality)); }; img.onerror = error => reject(error); }; reader.onerror = error => reject(error); }); }

// --- 3. RENDERING FUNCTIONS ---
function renderCurrentPage() {
    const id = document.querySelector('.page.active').id;
    if (id === 'exercises-page') { renderExerciseDatabase(); }
    if (id === 'routines-page') { populateExerciseDropdown(); renderSavedRoutines(); handleRoutineExerciseChange(); initRoutineBuilderSortable(); initSavedRoutinesSortable(); }
    if (id === 'workout-page') { populateDailyRoutineDropdown(); renderWorkoutPage(); initDailyWorkoutSortable(); }
    renderDateControls();
}
function renderDateControls() { const today = new Date(); today.setHours(0, 0, 0, 0); currentDate.setHours(0, 0, 0, 0); const isToday = currentDate.getTime() === today.getTime(); dateDisplayBtn.textContent = isToday ? 'Today' : currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); nextDayBtn.disabled = currentDate >= today; }

function renderExerciseDatabase() {
    dbExerciseListDiv.innerHTML = '';
    if (allData.exerciseDatabase.length === 0) { dbExerciseListDiv.innerHTML = `<div class="placeholder-card">Your exercise list is empty. Add one above to get started.</div>`; return; }
    const exercisesByType = allData.exerciseDatabase.reduce((acc, ex) => { (acc[ex.type] = acc[ex.type] || []).push(ex); return acc; }, {});
    Object.keys(exercisesByType).sort().forEach(type => {
        const groupCard = document.createElement('div');
        groupCard.className = 'card exercise-group-card';
        groupCard.innerHTML = `<h3>${type}</h3>`;
        const listContainer = document.createElement('div');
        listContainer.className = 'exercise-group-list';
        exercisesByType[type].sort((a, b) => a.name.localeCompare(b.name)).forEach(ex => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'swipe-item-container';
            const imageSource = (ex.images && ex.images.length > 0) ? ex.images[0] : '';
            itemDiv.innerHTML = `
                <div class="swipe-content">
                    <img src="${imageSource}" class="db-item-thumbnail" style="${!imageSource ? 'background-color: var(--color-background);' : ''}">
                    <div class="exercise-item-main"><span class="exercise-item-name">${ex.name}</span><small class="exercise-item-stats">${ex.trackType || 'reps'}</small></div>
                </div>
                <div class="swipe-actions">
                    <button class="swipe-action-btn swipe-edit-btn" data-id="${ex.id}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13.854 2.146a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.708 0l-2.5-2.5a.5.5 0 1 1 .708-.708L3.5 11.293l9.646-9.647a.5.5 0 0 1 .708 0zM12.5 4.5a.5.5 0 0 0-1 0v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 0-1h-1z"/></svg><span>Edit</span></button>
                    <button class="swipe-action-btn swipe-delete-btn" data-id="${ex.id}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M6 2a2 2 0 0 0-2 2v1H2.5a.5.5 0 0 0 0 1h1V15a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V6h1a.5.5 0 0 0 0-1H14V4a2 2 0 0 0-2-2H6zm1 2h4v1H7V4zM5 6h8v9H5V6z"/></svg><span>Delete</span></button>
                </div>`;
            listContainer.appendChild(itemDiv);
        });
        groupCard.appendChild(listContainer);
        dbExerciseListDiv.appendChild(groupCard);
    });
}

function populateExerciseDropdown(selectElement = routineExerciseSelect) { /* ... */ }
function populateDailyRoutineDropdown() { /* ... */ }

function renderSavedRoutines() {
    savedRoutinesList.innerHTML = '';
    if (allData.routines.length === 0) { savedRoutinesList.innerHTML = `<div class="placeholder-card" style="margin-top: 16px;">You haven't created any routines yet.</div>`; return; }
    allData.routines.forEach(r => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'swipe-item-container sortable-item';
        itemDiv.dataset.id = r.id;
        const sets = r.exercises.reduce((s, ex) => s + parseInt(ex.sets), 0);
        itemDiv.innerHTML = `
            <div class="swipe-content">
                <div class="exercise-item-main" style="text-align:center;"><span class="exercise-item-name">${r.name}</span><small class="exercise-item-stats">${r.exercises.length} exercises • ${sets} total sets</small></div>
            </div>
            <div class="swipe-actions">
                 <button class="swipe-action-btn swipe-edit-btn" data-id="${r.id}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13.854 2.146a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.708 0l-2.5-2.5a.5.5 0 1 1 .708-.708L3.5 11.293l9.646-9.647a.5.5 0 0 1 .708 0zM12.5 4.5a.5.5 0 0 0-1 0v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 0-1h-1z"/></svg><span>Edit</span></button>
                <button class="swipe-action-btn swipe-delete-btn" data-id="${r.id}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M6 2a2 2 0 0 0-2 2v1H2.5a.5.5 0 0 0 0 1h1V15a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V6h1a.5.5 0 0 0 0-1H14V4a2 2 0 0 0-2-2H6zm1 2h4v1H7V4zM5 6h8v9H5V6z"/></svg><span>Delete</span></button>
            </div>`;
        savedRoutinesList.appendChild(itemDiv);
    });
}

function renderWorkoutPage() {
    const dateKey = getFormattedDate(currentDate);
    const workoutData = allData.history[dateKey];
    resetSwipeState();
    if (!workoutData) { /* ... placeholder ... */ return; }
    if (workoutData.isComplete) { /* ... summary view ... */ return; }

    routineSelectionArea.classList.add('hidden');
    activeRoutineInfo.classList.remove('hidden');
    activeRoutineName.textContent = workoutData.routine.name;
    activeRoutineDisplay.innerHTML = '';
    let isCurrentExerciseFound = false;

    workoutData.routine.exercises.forEach((exercise) => {
        const progress = workoutData.progress.find(p => p.instanceId === exercise.instanceId);
        if (!progress) return;
        const isFinished = progress.setsCompleted >= exercise.sets;
        let isCurrent = false;
        if (!isFinished && !isCurrentExerciseFound) { isCurrent = true; isCurrentExerciseFound = true; }
        
        const images = (exercise.images && exercise.images.length > 0) ? exercise.images : (exercise.image ? [exercise.image] : []);
        let imageHTML = '<div class="single-image-container"><div class="db-item-thumbnail" style="width:100%; height:100%; background-color: var(--color-background);"></div></div>';
        if (images.length > 0) {
            if (images.length > 1) {
                const slides = images.map(img => `<div class="carousel-slide"><img src="${img}" alt="${exercise.name}"></div>`).join('');
                const dots = images.map((_, i) => `<div class="carousel-dot ${i === 0 ? 'active' : ''}" data-slide-index="${i}"></div>`).join('');
                imageHTML = `<div class="exercise-image-carousel" data-instance-id="${exercise.instanceId}" data-current-slide="0"><div class="carousel-track" style="width: ${images.length * 100}%">${slides}</div><div class="carousel-dots">${dots}</div></div>`;
            } else {
                imageHTML = `<div class="single-image-container"><img src="${images[0]}" alt="${exercise.name}"></div>`;
            }
        }
        
        const itemDiv = document.createElement('div');
        itemDiv.className = `active-routine-exercise sortable-item ${isCurrent ? 'current' : ''} ${isFinished ? 'finished' : ''}`;
        itemDiv.dataset.instanceId = exercise.instanceId;
        // ... stats and tracking UI logic ...
        itemDiv.innerHTML = `
            <div class="swipe-item-container">
                <div class="swipe-content">
                    <div class="exercise-content">
                        ${imageHTML}
                        <!-- ... rest of content ... -->
                    </div>
                </div>
                <div class="swipe-actions"><!-- ... --></div>
            </div>`;
        activeRoutineDisplay.appendChild(itemDiv);
    });
}

// --- 4. SORTABLE & DRAG/DROP ---
const sortableOptions = { animation: 150, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', delay: 200, delayOnTouchOnly: true };
function initRoutineBuilderSortable() { if (routineBuilderSortable) routineBuilderSortable.destroy(); routineBuilderSortable = new Sortable(routineBuilderList, { ...sortableOptions, handle:'.routine-builder-item', onEnd: (evt) => { const movedItem = routineBuilderState.exercises.splice(evt.oldIndex, 1)[0]; routineBuilderState.exercises.splice(evt.newIndex, 0, movedItem); validateRoutineForm(); } }); }
function initDailyWorkoutSortable() { if (dailyWorkoutSortable) dailyWorkoutSortable.destroy(); const workoutData = allData.history[getFormattedDate(currentDate)]; if (!workoutData) return; dailyWorkoutSortable = new Sortable(activeRoutineDisplay, { ...sortableOptions, handle:'.swipe-content', onEnd: (evt) => { const movedItem = workoutData.routine.exercises.splice(evt.oldIndex, 1)[0]; workoutData.routine.exercises.splice(evt.newIndex, 0, movedItem); const movedProgress = workoutData.progress.splice(evt.oldIndex, 1)[0]; workoutData.progress.splice(evt.newIndex, 0, movedProgress); saveDataToLocalStorage(); renderWorkoutPage(); } }); }
function initSavedRoutinesSortable() { if (savedRoutinesSortable) savedRoutinesSortable.destroy(); savedRoutinesSortable = new Sortable(savedRoutinesList, { ...sortableOptions, handle:'.swipe-content', onEnd: (evt) => { const movedItem = allData.routines.splice(evt.oldIndex, 1)[0]; allData.routines.splice(evt.newIndex, 0, movedItem); saveDataToLocalStorage(); renderSavedRoutines(); } }); }

// --- 5. EVENT HANDLER & WORKFLOW FUNCTIONS ---
function handleAddOrUpdateDbEntry(event) {
    event.preventDefault();
    const name = dbExerciseNameInput.value.trim();
    const type = dbExerciseTypeSelect.value;
    const trackType = dbExerciseTrackType.value;
    const instructions = dbExerciseInstructionsInput.value.trim();
    const images = [...currentExerciseImages];

    if (dbEditingState.isEditing) {
        const ex = allData.exerciseDatabase.find(e => e.id === dbEditingState.id);
        if (ex) {
            ex.name = name; ex.type = type; ex.trackType = trackType;
            ex.instructions = instructions; ex.images = images;
            delete ex.image; 
        }
    } else {
        const newEx = { id: Date.now(), name, type, trackType, instructions, images };
        allData.exerciseDatabase.push(newEx);
    }
    saveDataToLocalStorage();
    renderExerciseDatabase();
    resetDbForm();
}
// ... other functions ...

// --- 6. EVENT LISTENERS ---
navWorkout.addEventListener('click', () => showPage('workout-page'));
navRoutines.addEventListener('click', () => showPage('routines-page'));
navExercises.addEventListener('click', () => showPage('exercises-page'));

addExerciseDbForm.addEventListener('submit', handleAddOrUpdateDbEntry);
addExerciseDbForm.addEventListener('input', validateDbForm);
dbExerciseImageInput.addEventListener('change', async (event) => { /* ... */ });
dbImagePreviewContainer.addEventListener('click', e => { /* ... */ });
// ... other form listeners ...

let touchStartX = 0, touchStartY = 0, touchCurrentX = 0;
let swipeTarget = null, isSwiping = false, swipeDirection = null;
function resetSwipeState() { if (swipeState.openCardContent) { swipeState.openCardContent.style.transform = 'translateX(0px)'; } touchStartX = 0; touchStartY = 0; touchCurrentX = 0; swipeTarget = null; isSwiping = false; swipeDirection = null; document.body.style.overflow = ''; }

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
        document.body.style.overflow = 'hidden';
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
}, { passive: true });


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
    setTimeout(() => { document.body.style.overflow = ''; }, 300);
});

// [DELEGATED CLICK LISTENERS]
document.addEventListener('click', e => {
    if (swipeState.openCardContent && !e.target.closest('.swipe-actions')) { resetSwipeState(); }
    if (e.target.classList.contains('modal-overlay')) { allModals.forEach(closeModal); }
    if(e.target.closest('#actions-menu-btn')) { actionsDropdown.classList.toggle('hidden'); }
});

activeRoutineDisplay.addEventListener('click', e => { /* ... */ });
dbExerciseListDiv.addEventListener('click', e => { /* ... */ });
savedRoutinesList.addEventListener('click', e => { /* ... */ });

// --- 7. INITIALIZE APP ---
function migrateData() {
    let dataUpdated = false;
    if(allData.exerciseDatabase && Array.isArray(allData.exerciseDatabase)) {
        allData.exerciseDatabase.forEach(ex => {
            if (ex.image && typeof ex.image === 'string' && !Array.isArray(ex.images)) {
                ex.images = [ex.image];
                delete ex.image;
                dataUpdated = true;
            }
        });
    }
    if (dataUpdated) {
        saveDataToLocalStorage();
    }
}

function initializeApp() {
    loadDataFromLocalStorage();
    migrateData();
    showPage('workout-page');
    validateDbForm();
    validateRoutineForm();
    initRoutineBuilderSortable();
}
initializeApp();