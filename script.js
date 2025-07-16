document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENT REFERENCES ---
    const allViews = [ document.getElementById('workouts-section'), document.getElementById('add-workout-form-container'), document.getElementById('routines-section'), document.getElementById('routine-builder-section'), document.getElementById('active-workout-section'), document.getElementById('history-section') ];
    const [workoutsSection, addWorkoutFormContainer, routinesSection, routineBuilderSection, activeWorkoutSection, historySection] = allViews;
    const addWorkoutBtn = document.getElementById('add-workout-btn'), workoutList = document.getElementById('workout-list'),
        addWorkoutForm = document.getElementById('add-workout-form'), cancelBtn = document.getElementById('cancel-btn'),
        formTitle = document.getElementById('form-title'), hiddenWorkoutId = document.getElementById('workout-id'),
        routineList = document.getElementById('routine-list'), buildNewRoutineBtn = document.getElementById('build-new-routine-btn'),
        builderWorkoutList = document.getElementById('builder-workout-list'), builderCurrentRoutine = document.getElementById('builder-current-routine'),
        routineNameInput = document.getElementById('routine-name'), saveRoutineBtn = document.getElementById('save-routine-btn'),
        cancelRoutineBuilderBtn = document.getElementById('cancel-routine-builder-btn'), goToRoutinesBtn = document.getElementById('go-to-routines-btn'),
        goToWorkoutsBtn = document.getElementById('go-to-workouts-btn'), activeWorkoutDetails = document.getElementById('active-workout-details'),
        timerDisplay = document.getElementById('timer-display'), nextExerciseBtn = document.getElementById('next-exercise-btn'),
        endWorkoutBtn = document.getElementById('end-workout-btn'), timerAlert = document.getElementById('timer-alert'),
        goToHistoryBtn = document.getElementById('go-to-history-btn'), backToRoutinesFromHistoryBtn = document.getElementById('back-to-routines-from-history-btn'),
        historyList = document.getElementById('history-list'), clearHistoryBtn = document.getElementById('clear-history-btn');

    // --- STATE MANAGEMENT ---
    let currentRoutine = [], activeRoutine = null, currentExerciseIndex = 0, timerInterval = null;

    // --- VIEW MANAGEMENT ---
    const showView = (viewToShow) => allViews.forEach(v => v.style.display = v === viewToShow ? 'block' : 'none');

    // --- DATA FUNCTIONS ---
    const getWorkouts = () => JSON.parse(localStorage.getItem('workouts')) || [];
    const saveWorkouts = (workouts) => localStorage.setItem('workouts', JSON.stringify(workouts));
    const getRoutines = () => JSON.parse(localStorage.getItem('routines')) || [];
    const saveRoutines = (routines) => localStorage.setItem('routines', JSON.stringify(routines));
    const getHistory = () => JSON.parse(localStorage.getItem('workoutHistory')) || [];
    const saveHistory = (history) => localStorage.setItem('workoutHistory', JSON.stringify(history));

    // --- TIMER FUNCTIONS ---
    const stopTimer = () => { clearInterval(timerInterval); timerInterval = null; }
    function startTimer(duration) {
        stopTimer(); let timeLeft = duration;
        const updateDisplay = () => { timerDisplay.textContent = `${String(Math.floor(timeLeft/60)).padStart(2,'0')}:${String(timeLeft%60).padStart(2,'0')}`; timerDisplay.classList.remove('finished'); };
        updateDisplay();
        timerInterval = setInterval(() => { timeLeft--; updateDisplay(); if (timeLeft <= 0) { stopTimer(); timerDisplay.textContent = "BREAK'S OVER!"; timerDisplay.classList.add('finished'); timerAlert.play(); nextExerciseBtn.disabled = false; } }, 1000);
    }

    // --- RENDER FUNCTIONS ---
    const renderWorkouts = () => { workoutList.innerHTML = ''; const workouts = getWorkouts(); if (workouts.length === 0) { workoutList.innerHTML = '<p>No workouts added yet.</p>'; return; } workouts.forEach(w => { const el = document.createElement('div'); el.className = 'workout-item'; el.dataset.id = w.id; el.innerHTML = `<h3>${w.name}</h3><p><strong>Type:</strong> ${w.type}</p><p><strong>Sets:</strong> ${w.sets} | <strong>Reps:</strong> ${w.reps}</p><p><strong>Break:</strong> ${w.breakTime} seconds</p>${w.media ? `<img src="${w.media}" alt="${w.name}" style="max-width: 100%; border-radius: 5px; margin-top: 10px;">` : ''}<div class="workout-item-actions"><button class="action-btn edit-btn">Edit</button><button class="action-btn delete-btn">Delete</button></div>`; workoutList.appendChild(el); }); };
    const renderSavedRoutines = () => { routineList.innerHTML = ''; const routines = getRoutines(); if(routines.length === 0) { routineList.innerHTML = "<p>You have not created any routines yet.</p>"; return; } routines.forEach(r => { const el = document.createElement('div'); el.className = 'routine-item'; el.innerHTML = `<h3>${r.name}</h3><ul>${r.workouts.map(w => `<li>${w.name}</li>`).join('')}</ul><div class="workout-item-actions"><button class="action-btn delete-routine-btn" data-id="${r.id}">Delete</button><button class="action-btn start-routine-btn" data-id="${r.id}">Start Workout</button></div>`; routineList.appendChild(el); }); };
    const renderRoutineBuilder = () => {
        builderWorkoutList.innerHTML = ''; getWorkouts().forEach(w => { const i = document.createElement('div'); i.className = 'builder-item'; i.innerHTML = `<p>${w.name}</p><button class="builder-item-btn add-to-routine-btn" data-id="${w.id}">+</button>`; builderWorkoutList.appendChild(i); });
        builderCurrentRoutine.innerHTML = '';
        if (currentRoutine.length === 0) { builderCurrentRoutine.innerHTML = '<p class="empty-list-placeholder">Drag or add workouts here.</p>'; }
        else { currentRoutine.forEach(w => { const i = document.createElement('div'); i.className = 'builder-item'; i.draggable = true; i.dataset.instanceId = w.instanceId; i.innerHTML = `<p>${w.name}</p><button class="builder-item-btn remove-from-routine-btn" data-instance-id="${w.instanceId}">-</button>`; builderCurrentRoutine.appendChild(i); }); }
    };
    function renderActiveWorkout() { if (!activeRoutine || currentExerciseIndex >= activeRoutine.workouts.length) { activeWorkoutDetails.innerHTML = `<h3>Workout Complete!</h3>`; timerDisplay.textContent = "🎉"; nextExerciseBtn.style.display = 'none'; endWorkoutBtn.textContent = 'Finish & Log'; return; } const ex = activeRoutine.workouts[currentExerciseIndex]; activeWorkoutDetails.innerHTML = `<h3>${ex.name}</h3><h4>Sets: ${ex.sets} | Reps: ${ex.reps}</h4>${ex.media ? `<img src="${ex.media}" alt="${ex.name}">` : ''}`; nextExerciseBtn.style.display = 'block'; endWorkoutBtn.textContent = 'End Workout'; nextExerciseBtn.disabled = true; startTimer(parseInt(ex.breakTime, 10) || 30); }
    function renderHistory() { historyList.innerHTML = ''; const history = getHistory(); if (history.length === 0) { historyList.innerHTML = "<p>No workouts have been completed yet.</p>"; return; } history.slice().reverse().forEach(entry => { const el = document.createElement('div'); el.className = 'history-item'; const d = new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); el.innerHTML = `<h3>${entry.routineName}</h3><p class="history-date">Completed on: ${d}</p><ul>${entry.workouts.map(w => `<li>${w.name}</li>`).join('')}</ul>`; historyList.appendChild(el); }); }

    // --- EVENT LISTENERS ---
    // Navigation
    goToRoutinesBtn.addEventListener('click', () => { renderSavedRoutines(); showView(routinesSection); });
    goToWorkoutsBtn.addEventListener('click', () => showView(workoutsSection));
    buildNewRoutineBtn.addEventListener('click', () => { currentRoutine = []; routineNameInput.value = ''; renderRoutineBuilder(); showView(routineBuilderSection); });
    cancelRoutineBuilderBtn.addEventListener('click', () => showView(routinesSection));
    goToHistoryBtn.addEventListener('click', () => { renderHistory(); showView(historySection); });
    backToRoutinesFromHistoryBtn.addEventListener('click', () => showView(routinesSection));
    clearHistoryBtn.addEventListener('click', () => { if(confirm("Are you sure you want to permanently delete all workout history?")) { saveHistory([]); renderHistory(); } });

    // Workout Form
    addWorkoutBtn.addEventListener('click', () => { formTitle.textContent = 'Add New Workout'; hiddenWorkoutId.value = ''; addWorkoutForm.reset(); showView(addWorkoutFormContainer); });
    const hideForm = () => { addWorkoutForm.reset(); hiddenWorkoutId.value = ''; showView(workoutsSection); }
    cancelBtn.addEventListener('click', hideForm);

    // Routine Builder
    builderWorkoutList.addEventListener('click', e => { if (e.target.matches('.add-to-routine-btn')) { const w = getWorkouts().find(w => w.id == e.target.dataset.id); if(w) { currentRoutine.push({ ...w, instanceId: Date.now() }); renderRoutineBuilder(); } } });
    builderCurrentRoutine.addEventListener('click', e => { if (e.target.matches('.remove-from-routine-btn')) { currentRoutine = currentRoutine.filter(w => w.instanceId != e.target.dataset.instanceId); renderRoutineBuilder(); } });
    saveRoutineBtn.addEventListener('click', () => { const n = routineNameInput.value.trim(); if (!n || currentRoutine.length === 0) { alert('Please provide a name and add workouts.'); return; } const r = getRoutines(); r.push({ id: Date.now(), name: n, workouts: currentRoutine }); saveRoutines(r); renderSavedRoutines(); showView(routinesSection); });

    // Drag and Drop Logic
    let draggedItem = null;
    builderCurrentRoutine.addEventListener('dragstart', e => { if(e.target.matches('.builder-item')) { draggedItem = e.target; setTimeout(() => e.target.classList.add('dragging'), 0); } });
    builderCurrentRoutine.addEventListener('dragend', e => { if(e.target.matches('.builder-item')) { e.target.classList.remove('dragging'); draggedItem = null; } });
    builderCurrentRoutine.addEventListener('dragover', e => { e.preventDefault(); const afterElement = getDragAfterElement(builderCurrentRoutine, e.clientY); const currentDragged = document.querySelector('.dragging'); if (afterElement == null) { builderCurrentRoutine.appendChild(currentDragged); } else { builderCurrentRoutine.insertBefore(currentDragged, afterElement); } });
    builderCurrentRoutine.addEventListener('drop', () => { const newOrder = [...builderCurrentRoutine.querySelectorAll('.builder-item')].map(item => { return currentRoutine.find(w => w.instanceId == item.dataset.instanceId); }); currentRoutine = newOrder; });
    function getDragAfterElement(container, y) { const draggableElements = [...container.querySelectorAll('.builder-item:not(.dragging)')]; return draggableElements.reduce((closest, child) => { const box = child.getBoundingClientRect(); const offset = y - box.top - box.height / 2; if (offset < 0 && offset > closest.offset) { return { offset: offset, element: child }; } else { return closest; } }, { offset: Number.NEGATIVE_INFINITY }).element; }

    // Routine List
    routineList.addEventListener('click', e => { const id = e.target.dataset.id; if (e.target.matches('.delete-routine-btn')) { if (confirm('Delete this routine?')) { saveRoutines(getRoutines().filter(r => r.id != id)); renderSavedRoutines(); } } if (e.target.matches('.start-routine-btn')) { activeRoutine = getRoutines().find(r => r.id == id); currentExerciseIndex = 0; renderActiveWorkout(); showView(activeWorkoutSection); } });
    
    // Active Workout
    nextExerciseBtn.addEventListener('click', () => { currentExerciseIndex++; renderActiveWorkout(); });
    endWorkoutBtn.addEventListener('click', () => { if (!activeRoutine || currentExerciseIndex >= activeRoutine.workouts.length) { const h = getHistory(); h.push({ date: Date.now(), routineName: activeRoutine.name, workouts: activeRoutine.workouts }); saveHistory(h); alert(`${activeRoutine.name} completed and logged!`); } else if (!confirm('Are you sure you want to end this workout?')) { return; } stopTimer(); activeRoutine = null; renderSavedRoutines(); showView(routinesSection); });

    // CRUD for Individual Workouts
    workoutList.addEventListener('click', e => { const i = e.target.closest('.workout-item'); if (!i) return; const id = i.dataset.id; if (e.target.matches('.delete-btn')) { if (confirm('Delete this workout?')) { saveWorkouts(getWorkouts().filter(w => w.id != id)); renderWorkouts(); } } if (e.target.matches('.edit-btn')) { showView(addWorkoutFormContainer); formTitle.textContent = 'Edit Workout'; const w = getWorkouts().find(w => w.id == id); if(w) { document.getElementById('workout-name').value = w.name; document.getElementById('workout-type').value = w.type; document.getElementById('sets').value = w.sets; document.getElementById('reps').value = w.reps; document.getElementById('break-time').value = w.breakTime; hiddenWorkoutId.value = w.id; } } });
    addWorkoutForm.addEventListener('submit', e => { e.preventDefault(); const d = { name: document.getElementById('workout-name').value, type: document.getElementById('workout-type').value, sets: document.getElementById('sets').value, reps: document.getElementById('reps').value, breakTime: document.getElementById('break-time').value }; const f = document.getElementById('workout-media').files[0]; const onFileRead = (m) => { let ws = getWorkouts(); const id = hiddenWorkoutId.value; if(id){ const i=ws.findIndex(w=>w.id==id); if(i>-1){const ex=ws[i]; ws[i]={...ex,...d}; if(m){ws[i].media=m;}}}else{ws.push({...d,id:Date.now(),media:m});} saveWorkouts(ws); hideForm(); renderWorkouts(); }; if(f){const r=new FileReader(); r.onload=e=>onFileRead(e.target.result); r.readAsDataURL(f);}else{onFileRead(null);} });
    
    // --- INITIAL PAGE LOAD ---
    renderWorkouts();
    showView(workoutsSection);
});