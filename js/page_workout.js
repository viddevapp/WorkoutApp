const WorkoutPage = (function() {
    // --- DOM Elements ---
    const dailyRoutineSelect = document.getElementById('daily-routine-select');
    const startRoutineBtn = document.getElementById('start-routine-btn');
    const activeRoutineDisplay = document.getElementById('active-routine-display');
    const routineSelectionArea = document.getElementById('routine-selection-area');
    const activeRoutineInfo = document.getElementById('active-routine-info');
    const activeRoutineName = document.getElementById('active-routine-name');
    const finishWorkoutBtn = document.getElementById('finish-workout-btn');
    const resetWorkoutBtn = document.getElementById('reset-workout-btn');
    const dateDisplayBtn = document.getElementById('date-display-btn');
    const prevDayBtn = document.getElementById('prev-day-btn');
    const nextDayBtn = document.getElementById('next-day-btn');
    const imageViewerModal = document.getElementById('image-viewer-modal');
    const fullSizeImage = document.getElementById('full-size-image');

    // --- State ---
    let state = {
        currentDate: new Date()
    };
    let workoutSortable = null;

    function renderDateControls() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        state.currentDate.setHours(0, 0, 0, 0);
        const isToday = state.currentDate.getTime() === today.getTime();
        dateDisplayBtn.textContent = isToday ? 'Today' : state.currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        nextDayBtn.disabled = state.currentDate >= today;
    }

    function populateDailyRoutineDropdown() {
        dailyRoutineSelect.innerHTML = `<option value="" disabled selected>Select a routine to begin...</option>`;
        const sortedRoutines = [...DB.getRoutines()].sort((a, b) => a.name.localeCompare(b.name));
        sortedRoutines.forEach(r => {
            const o = document.createElement('option');
            o.value = r.id;
            o.textContent = r.name;
            dailyRoutineSelect.appendChild(o);
        });
    }
    
    function renderSummaryView(workoutData) {
        routineSelectionArea.classList.add('hidden');
        activeRoutineInfo.classList.add('hidden');
        let summaryHTML = `<div class="card workout-summary-card"><div class="summary-header"><div><h2>${workoutData.routine.name} - Summary</h2>${workoutData.completionTime ? `<div class="summary-total-time">${UI.formatTotalTime(workoutData.completionTime)}</div>` : ''}</div><button class="btn-primary" id="start-new-workout-btn">Start New Workout</button></div>`;

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
                (progress.loggedData || []).forEach((time, index) => {
                    setsHTML += `<div class="summary-set-item">
                        <span class="set-label">Set ${index + 1}</span>
                        <span class="summary-logged-time">${UI.formatStopwatchTime(time)}</span>
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
    }

    function renderActiveWorkoutView(workoutData) {
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
                stats = `${progress.setsCompleted} / ${exercise.sets} Sets • ${exercise.reps} reps`;
                const buttonText = isFinished ? "All Sets Complete" : `Log Set ${progress.setsCompleted + 1}`;
                trackingUI = `<div class="exercise-actions"><button class="btn-primary start-reps-set-btn" ${isFinished || !isCurrent ? 'disabled' : ''}>${buttonText}</button></div>`;
            }
            const intervals = [15, 30, 45, 60, 90, 120];
            const intervalButtonsHTML = intervals.map(time => `<button class="timer-interval-btn ${progress.timer.duration === time ? 'selected' : ''}" data-time="${time}" ${!progress.timer.enabled ? 'disabled' : ''}>${time}s</button>`).join('');
            
            itemDiv.innerHTML = `
                <div class="swipe-item-container">
                    <div class="swipe-content">
                        ${exercise.image ? `<img src="${exercise.image}" alt="${exercise.name}" class="db-item-thumbnail" data-id="${exercise.id}">` : '<div class="db-item-thumbnail" style="background-color: var(--color-background);"></div>'}
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
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M5 10a1 1 0 011-1h1V5a1 1 0 112 0v4h1a1 1 0 110 2H9v4a1 1 0 11-2 0v-4H6a1 1 0 01-1-1zM15 10a1 1 0 011-1h1V5a1 1 0 112 0v4h1a1 1 0 110 2h-1v4a1 1 0 11-2 0v-4h-1a1 1 0 01-1-1z"/></svg>
                            <span>Swap</span>
                        </button>
                        <button class="swipe-action-btn swipe-edit-btn" data-instance-id="${exercise.instanceId}">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM5 13V5a2 2 0 00-2-2H2a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-1H5z"/></svg>
                            <span>Edit</span>
                        </button>
                        <button class="swipe-action-btn swipe-delete-btn" data-instance-id="${exercise.instanceId}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd"/></svg>
                            <span>Delete</span>
                        </button>
                    </div>
                </div>`;
            activeRoutineDisplay.appendChild(itemDiv);
        });
    }

    function render() {
        renderDateControls();
        const dateKey = DB.getFormattedDate(state.currentDate);
        const workoutData = DB.getHistory()[dateKey];
        App.resetSwipe();

        if (!workoutData) {
            routineSelectionArea.classList.remove('hidden');
            activeRoutineInfo.classList.add('hidden');
            activeRoutineDisplay.innerHTML = `<div class="placeholder-card">Select a routine and click "Start" to see your exercises.</div>`;
            return;
        }

        if (workoutData.isComplete) {
            renderSummaryView(workoutData);
        } else {
            renderActiveWorkoutView(workoutData);
        }
        initSortable();
    }
    
    function changeDate(days) {
        state.currentDate.setDate(state.currentDate.getDate() + days);
        Modals.closeStopwatch(true);
        render();
    }

    function startRoutine() {
        const id = parseInt(dailyRoutineSelect.value);
        const sourceRoutine = DB.getRoutines().find(r => r.id === id);
        if (sourceRoutine) {
            const dateKey = DB.getFormattedDate(state.currentDate);
            const allExercises = DB.getExercises();

            const hydratedExercises = sourceRoutine.exercises.map(leanEx => {
                const fullEx = allExercises.find(dbEx => dbEx.id === leanEx.exerciseId);
                return { ...fullEx, ...leanEx, instanceId: Date.now() + Math.random() };
            });
            const progress = hydratedExercises.map(ex => ({
                instanceId: ex.instanceId, setsCompleted: 0, loggedData: [], 
                timer: { enabled: true, duration: 30 },
            }));
            
            const workoutToLog = { name: sourceRoutine.name, id: sourceRoutine.id, exercises: hydratedExercises };
            DB.getHistory()[dateKey] = { routine: workoutToLog, progress, isComplete: false, startTime: Date.now(), completionTime: null, notes: '' };
            DB.save();
            render();
        }
    }
    
    function completeWorkout(isAutoFinish = false) {
        const dateKey = DB.getFormattedDate(state.currentDate);
        const workoutData = DB.getHistory()[dateKey];
        if (!workoutData || workoutData.isComplete) return;

        if (!workoutData.completionTime && workoutData.startTime) {
            workoutData.completionTime = Date.now() - workoutData.startTime;
        }
        workoutData.isComplete = true;
        Modals.closeStopwatch(true);
        DB.save();

        if (isAutoFinish) {
            Modals.openWorkoutComplete(workoutData.completionTime, render);
        } else {
            render();
        }
    }

    function handleSetCompletion(instanceId) {
        const dateKey = DB.getFormattedDate(state.currentDate);
        const workoutData = DB.getHistory()[dateKey];
        if (!workoutData) return;
        
        const exerciseData = workoutData.routine.exercises.find(ex => ex.instanceId === instanceId);
        const progress = workoutData.progress.find(p => p.instanceId === instanceId);

        DB.save();
        render(); // Re-render to update the UI immediately

        const isExerciseComplete = progress.setsCompleted >= exerciseData.sets;
        const currentIndex = workoutData.routine.exercises.findIndex(ex => ex.instanceId === instanceId);
        const isLastExerciseInRoutine = currentIndex === workoutData.routine.exercises.length - 1;

        if (isExerciseComplete) {
            if (isLastExerciseInRoutine) {
                setTimeout(() => completeWorkout(true), 250);
            } else {
                const nextExercise = workoutData.routine.exercises[currentIndex + 1];
                Modals.startCountdown(60, nextExercise); // Hardcoded 60s between exercises
            }
        } else {
            if (progress.timer.enabled) {
                Modals.startCountdown(progress.timer.duration);
            }
        }
    }
    
    function handleDisplayClick(e) {
        const t = e.target;
        const card = t.closest('.active-routine-exercise');
        const instanceId = card ? parseFloat(card.dataset.instanceId) : null;
        const dateKey = DB.getFormattedDate(state.currentDate);
        const workoutData = DB.getHistory()[dateKey];
        if(!workoutData && !t.id === 'start-new-workout-btn') return;

        // Active workout actions
        if (card) {
            const progress = workoutData.progress.find(p => p.instanceId === instanceId);

            if (t.matches('.start-reps-set-btn')) {
                if (!progress.loggedData) progress.loggedData = [];
                const exerciseData = workoutData.routine.exercises.find(ex => ex.instanceId === instanceId);
                progress.loggedData.push({ reps: exerciseData.reps, weight: '' });
                progress.setsCompleted++;
                handleSetCompletion(instanceId);
            } else if (t.matches('.start-stopwatch-modal-btn')) {
                const exerciseData = workoutData.routine.exercises.find(ex => ex.instanceId === instanceId);
                Modals.openStopwatch(instanceId, exerciseData.name, (id, elapsedTime) => {
                    if (!progress.loggedData) progress.loggedData = [];
                    progress.loggedData.push(elapsedTime);
                    progress.setsCompleted++;
                    handleSetCompletion(id);
                });
            } else if (t.matches('.timer-toggle')) {
                progress.timer.enabled = t.checked;
                DB.save();
                render();
            } else if (t.matches('.timer-interval-btn')) {
                progress.timer.duration = parseInt(t.dataset.time);
                DB.save();
                render();
            } else if (t.classList.contains('db-item-thumbnail')) {
                const id = parseInt(t.dataset.id);
                const ex = DB.getExercises().find(e => e.id === id);
                if (ex && ex.image) { fullSizeImage.src = ex.image; UI.openModal(imageViewerModal); }
            }
        }
        
        // Swipe actions
        const swapBtn = t.closest('.swipe-swap-btn');
        const deleteBtn = t.closest('.swipe-delete-btn');
        const editBtn = t.closest('.swipe-edit-btn');
        if (swapBtn) {
            const id = parseFloat(swapBtn.dataset.instanceId);
            Modals.openSwap(id, (instanceId, newExerciseId) => {
                const exerciseIndex = workoutData.routine.exercises.findIndex(ex => ex.instanceId === instanceId);
                const progressIndex = workoutData.progress.findIndex(p => p.instanceId === instanceId);
                if (exerciseIndex === -1) return;
                const originalExercise = workoutData.routine.exercises[exerciseIndex];
                const newExerciseDbEntry = DB.getExercises().find(dbEx => dbEx.id === newExerciseId);
                const newWorkoutExercise = { ...newExerciseDbEntry, sets: originalExercise.sets, reps: newExerciseDbEntry.trackType === 'reps' ? (originalExercise.reps || '8-12') : undefined, duration: newExerciseDbEntry.trackType === 'time' ? (originalExercise.duration || 60) : undefined, trackType: newExerciseDbEntry.trackType, instanceId: Date.now() + Math.random(), exerciseId: newExerciseId };
                workoutData.routine.exercises.splice(exerciseIndex, 1, newWorkoutExercise);
                if (progressIndex > -1) { workoutData.progress[progressIndex].instanceId = newWorkoutExercise.instanceId; }
                DB.save();
                render();
                App.resetSwipe();
            });
        } else if (deleteBtn) {
            if (confirm("Delete this exercise from today's workout?")) {
                const id = parseFloat(deleteBtn.dataset.instanceId);
                workoutData.routine.exercises = workoutData.routine.exercises.filter(ex => ex.instanceId !== id);
                workoutData.progress = workoutData.progress.filter(p => p.instanceId !== id);
                DB.save();
                render();
                App.resetSwipe();
            }
        } else if (editBtn) {
            const id = parseFloat(editBtn.dataset.instanceId);
            const exercise = workoutData.routine.exercises.find(ex => ex.instanceId === id);
            Modals.openEdit(id, exercise, (instanceId, newValues) => {
                if (exercise.trackType === 'time') {
                    if (newValues.sets > 0) exercise.sets = newValues.sets;
                    if (newValues.duration > 0) exercise.duration = newValues.duration;
                } else {
                    if (newValues.sets > 0) exercise.sets = newValues.sets;
                    if (newValues.reps) exercise.reps = newValues.reps;
                }
                DB.save();
                render();
                App.resetSwipe();
            });
        }

        // Summary view actions
        if(t.id === 'start-new-workout-btn') {
            if(confirm("This will clear today's completed log. Are you sure?")) {
                delete DB.getHistory()[dateKey];
                DB.save();
                render();
            }
        } else if(t.id === 'save-summary-changes-btn') {
            workoutData.notes = document.getElementById('workout-notes-input').value;
            document.querySelectorAll('.summary-reps-input, .summary-weight-input').forEach(input => {
                const id = parseFloat(input.dataset.instanceId);
                const setIndex = parseInt(input.dataset.setIndex);
                const key = input.classList.contains('summary-reps-input') ? 'reps' : 'weight';
                const progress = workoutData.progress.find(p => p.instanceId === id);
                if (progress && progress.loggedData[setIndex]) { progress.loggedData[setIndex][key] = input.value; }
            });
            DB.save();
            t.textContent = 'Saved!';
            setTimeout(() => { t.textContent = 'Save Changes'; }, 1500);
        }
    }

    function initSortable() {
        if(workoutSortable) workoutSortable.destroy();
        const dateKey = DB.getFormattedDate(state.currentDate);
        const workoutData = DB.getHistory()[dateKey];
        if(!workoutData || workoutData.isComplete) return;

        workoutSortable = new Sortable(activeRoutineDisplay, {
            animation: 150, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen',
            handle: '.swipe-content', delay: 200, delayOnTouchOnly: true,
            onEnd: (evt) => {
                const movedItem = workoutData.routine.exercises.splice(evt.oldIndex, 1)[0];
                workoutData.routine.exercises.splice(evt.newIndex, 0, movedItem);
                const movedProgress = workoutData.progress.splice(evt.oldIndex, 1)[0];
                workoutData.progress.splice(evt.newIndex, 0, movedProgress);
                DB.save();
                render();
            }
        });
    }

    function init() {
        populateDailyRoutineDropdown();
        render();
        initSortable();

        dailyRoutineSelect.addEventListener('change', () => { startRoutineBtn.disabled = !dailyRoutineSelect.value; });
        startRoutineBtn.addEventListener('click', startRoutine);
        finishWorkoutBtn.addEventListener('click', () => { if (confirm("Are you sure you want to finish and log this workout?")) { completeWorkout(false); }});
        resetWorkoutBtn.addEventListener('click', () => { if (confirm("Are you sure you want to reset this workout? Your progress for today will be lost.")) { const dateKey = DB.getFormattedDate(state.currentDate); delete DB.getHistory()[dateKey]; Modals.closeStopwatch(true); DB.save(); render(); }});
        
        prevDayBtn.addEventListener('click', () => changeDate(-1));
        nextDayBtn.addEventListener('click', () => changeDate(1));
        dateDisplayBtn.addEventListener('click', () => { if(dateDisplayBtn.disabled) return; state.currentDate = new Date(); render(); });
        
        activeRoutineDisplay.addEventListener('click', handleDisplayClick);
    }

    return {
        init,
        render,
        getCurrentDate: () => state.currentDate,
    };
})();