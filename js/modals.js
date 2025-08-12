const Modals = (function() {
    // --- DOM Elements ---
    const stopwatchModal = document.getElementById('stopwatch-modal');
    const stopwatchExerciseName = document.getElementById('stopwatch-exercise-name');
    const stopwatchTimerDisplay = document.getElementById('stopwatch-timer-display');
    const stopwatchActionBtn = document.getElementById('stopwatch-action-btn');
    const stopwatchCancelBtn = document.getElementById('stopwatch-cancel-btn');

    const countdownModal = document.getElementById('countdown-modal');
    const countdownTimerDisplay = document.getElementById('countdown-timer-display');
    const countdownLabel = document.getElementById('countdown-label');
    const countdownNextExerciseInfo = document.getElementById('countdown-next-exercise-info');
    const countdownNextExerciseName = document.getElementById('countdown-next-exercise-name');
    const countdownNextExerciseDetails = document.getElementById('countdown-next-exercise-details');
    const countdownProgressCircle = document.querySelector('.timer-progress');
    const circleCircumference = 2 * Math.PI * 54;

    const workoutCompleteModal = document.getElementById('workout-complete-modal');
    const workoutTotalTimeDisplay = document.getElementById('workout-total-time');
    const closeCompleteModalBtn = document.getElementById('close-complete-modal-btn');

    const swapExerciseModal = document.getElementById('swap-exercise-modal');
    const swapExerciseForm = document.getElementById('swap-exercise-form');
    const swapExerciseSelect = document.getElementById('swap-exercise-select');
    const cancelSwapBtn = document.getElementById('cancel-swap-btn');

    const editWorkoutExerciseModal = document.getElementById('edit-workout-exercise-modal');
    const editWorkoutExerciseForm = document.getElementById('edit-workout-exercise-form');
    const editModalTitle = document.getElementById('edit-modal-title');
    const editRepsBasedInputs = document.getElementById('edit-reps-based-inputs');
    const editTimeBasedInputs = document.getElementById('edit-time-based-inputs');
    const editSetsInput = document.getElementById('edit-sets-input');
    const editRepsInput = document.getElementById('edit-reps-input');
    const editTimeSetsInput = document.getElementById('edit-time-sets-input');
    const editDurationInput = document.getElementById('edit-duration-input');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    
    // --- State ---
    let countdownState = { intervalId: null, initialDuration: 0 };
    let stopwatchState = { animationFrameId: null, startTime: 0, isRunning: false, isStopped: false, elapsedTime: 0, instanceId: null };
    let editState = { instanceId: null };
    let swapState = { instanceId: null };

    // --- Countdown Timer ---
    function startCountdown(duration, nextExercise = null) {
        clearInterval(countdownState.intervalId);
        countdownState.initialDuration = duration;
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
        UI.openModal(countdownModal);

        countdownState.intervalId = setInterval(() => {
            remaining--;
            const progress = Math.max(0, remaining / countdownState.initialDuration);
            countdownProgressCircle.style.strokeDashoffset = circleCircumference * (1 - progress);
            if (remaining >= 0) {
                countdownTimerDisplay.textContent = remaining;
            } else {
                closeCountdownModal();
            }
        }, 1000);
    }
    
    function closeCountdownModal() {
        clearInterval(countdownState.intervalId);
        countdownState.intervalId = null;
        UI.closeModal(countdownModal);
    }
    
    // --- Stopwatch Timer (Optimized) ---
    function stopwatchLoop(timestamp) {
        if (!stopwatchState.isRunning) return;
        stopwatchState.elapsedTime = performance.now() - stopwatchState.startTime;
        stopwatchTimerDisplay.textContent = UI.formatStopwatchTime(stopwatchState.elapsedTime);
        stopwatchState.animationFrameId = requestAnimationFrame(stopwatchLoop);
    }

    function openStopwatch(instanceId, exerciseName, onLogCallback) {
        stopwatchState = { animationFrameId: null, startTime: performance.now(), isRunning: true, isStopped: false, elapsedTime: 0, instanceId };
        stopwatchExerciseName.textContent = exerciseName;
        stopwatchTimerDisplay.textContent = UI.formatStopwatchTime(0);
        stopwatchActionBtn.textContent = 'Stop';
        stopwatchActionBtn.classList.remove('log-state');
        stopwatchActionBtn.onclick = () => stopStopwatch(onLogCallback);
        stopwatchCancelBtn.onclick = () => closeStopwatch(true);
        UI.openModal(stopwatchModal);
        stopwatchState.animationFrameId = requestAnimationFrame(stopwatchLoop);
    }

    function stopStopwatch(onLogCallback) {
        if (!stopwatchState.isRunning) return;
        stopwatchState.isRunning = false;
        stopwatchState.isStopped = true;
        cancelAnimationFrame(stopwatchState.animationFrameId);
        stopwatchState.elapsedTime = performance.now() - stopwatchState.startTime;
        stopwatchTimerDisplay.textContent = UI.formatStopwatchTime(stopwatchState.elapsedTime);
        stopwatchActionBtn.textContent = 'Log Set';
        stopwatchActionBtn.classList.add('log-state');
        stopwatchActionBtn.onclick = () => {
            if (onLogCallback) onLogCallback(stopwatchState.instanceId, stopwatchState.elapsedTime);
            closeStopwatch();
        };
    }
    
    function closeStopwatch(force = false) {
        if (stopwatchState.animationFrameId) cancelAnimationFrame(stopwatchState.animationFrameId);
        stopwatchState = { animationFrameId: null, startTime: 0, isRunning: false, isStopped: false, elapsedTime: 0, instanceId: null };
        UI.closeModal(stopwatchModal);
    }

    // --- Other Modals ---
    function openWorkoutComplete(totalTime, onDoneCallback) {
        workoutTotalTimeDisplay.textContent = UI.formatTotalTime(totalTime);
        closeCompleteModalBtn.onclick = () => {
            UI.closeModal(workoutCompleteModal);
            if(onDoneCallback) onDoneCallback();
        };
        UI.openModal(workoutCompleteModal);
    }

    function openSwap(instanceId, onConfirmCallback) {
        swapState.instanceId = instanceId;
        UI.populateExerciseDropdown(swapExerciseSelect, 'Choose replacement...');
        UI.openModal(swapExerciseModal);
        swapExerciseForm.onsubmit = (e) => {
            e.preventDefault();
            const newExerciseId = parseInt(swapExerciseSelect.value);
            if (isNaN(newExerciseId)) return;
            if (onConfirmCallback) onConfirmCallback(swapState.instanceId, newExerciseId);
            UI.closeModal(swapExerciseModal);
        };
    }

    function openEdit(instanceId, exercise, onConfirmCallback) {
        editState.instanceId = instanceId;
        editModalTitle.textContent = `Edit ${exercise.name}`;
        if (exercise.trackType === 'time') {
            editTimeBasedInputs.classList.remove('hidden'); editRepsBasedInputs.classList.add('hidden');
            editTimeSetsInput.value = exercise.sets; editDurationInput.value = exercise.duration;
        } else {
            editRepsBasedInputs.classList.remove('hidden'); editTimeBasedInputs.classList.add('hidden');
            editSetsInput.value = exercise.sets; editRepsInput.value = exercise.reps;
        }
        UI.openModal(editWorkoutExerciseModal);

        editWorkoutExerciseForm.onsubmit = (e) => {
            e.preventDefault();
            let newValues = {};
            if (exercise.trackType === 'time') {
                newValues = { sets: parseInt(editTimeSetsInput.value), duration: parseInt(editDurationInput.value) };
            } else {
                newValues = { sets: parseInt(editSetsInput.value), reps: editRepsInput.value.trim() };
            }
            if(onConfirmCallback) onConfirmCallback(editState.instanceId, newValues);
            UI.closeModal(editWorkoutExerciseModal);
        };
    }

    function init() {
        countdownModal.addEventListener('click', e => {
            if (e.target.classList.contains('modal-content') || e.target.classList.contains('countdown-timer-wrapper')) closeCountdownModal();
        });
        closeCompleteModalBtn.addEventListener('click', () => UI.closeModal(workoutCompleteModal));
        cancelSwapBtn.addEventListener('click', () => UI.closeModal(swapExerciseModal));
        cancelEditBtn.addEventListener('click', () => UI.closeModal(editWorkoutExerciseModal));
    }
    
    // Public API
    return {
        init,
        startCountdown,
        closeCountdownModal,
        openStopwatch,
        closeStopwatch,
        openWorkoutComplete,
        openSwap,
        openEdit,
    };
})();