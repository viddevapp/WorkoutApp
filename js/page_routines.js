const RoutinesPage = (function() {
    // --- DOM Elements ---
    const page = document.getElementById('routines-page');
    const createForm = document.getElementById('create-routine-form');
    const editingIdInput = document.getElementById('routine-editing-id');
    const nameInput = document.getElementById('routine-name-input');
    const exerciseSelect = document.getElementById('routine-exercise-select');
    const setsInput = document.getElementById('routine-sets-input');
    const repsInput = document.getElementById('routine-reps-input');
    const timeSetsInput = document.getElementById('routine-time-sets-input');
    const durationInput = document.getElementById('routine-duration-input');
    const addExerciseBtn = document.getElementById('add-exercise-to-builder-btn');
    const builderList = document.getElementById('routine-builder-list');
    const saveBtn = document.getElementById('save-routine-btn');
    const savedList = document.getElementById('saved-routines-list');
    const repsBasedInputs = document.getElementById('reps-based-inputs');
    const timeBasedInputs = document.getElementById('time-based-inputs');

    // --- State ---
    let state = {
        isEditing: false,
        id: null,
        builderExercises: []
    };
    let builderSortable = null;
    let savedRoutinesSortable = null;

    function validateForm() {
        const name = nameInput.value.trim();
        const hasExercises = state.builderExercises.length > 0;
        saveBtn.disabled = !(name && hasExercises);
    }
    
    function handleExerciseSelectChange() {
        const selectedId = parseInt(exerciseSelect.value);
        if(isNaN(selectedId)) return;
        const exercise = DB.getExercises().find(ex => ex.id === selectedId);
        if (!exercise) {
            repsBasedInputs.classList.add('hidden');
            timeBasedInputs.classList.add('hidden');
            return;
        }
        if (exercise.trackType === 'time') {
            repsBasedInputs.classList.add('hidden');
            timeBasedInputs.classList.remove('hidden');
        } else {
            repsBasedInputs.classList.remove('hidden');
            timeBasedInputs.classList.add('hidden');
        }
    }

    function renderBuilderList() {
        builderList.innerHTML = '';
        state.builderExercises.forEach(exRef => {
            const ex = DB.getExercises().find(dbEx => dbEx.id === exRef.exerciseId);
            if (ex) {
                const i = document.createElement('div');
                i.className = 'routine-builder-item sortable-item';
                i.dataset.instanceId = exRef.instanceId;
                const details = exRef.trackType === 'time' ? `${exRef.sets} sets × ${exRef.duration} sec` : `${exRef.sets} sets × ${exRef.reps} reps`;
                i.innerHTML = `
                    <div class="routine-builder-item-main">
                        <img src="${ex.image || ''}" class="db-item-thumbnail" style="${!ex.image ? 'background-color: var(--color-background);' : ''}">
                        <div>
                            <span class="exercise-item-name">${ex.name}</span>
                            <small class="exercise-item-stats">${details}</small>
                        </div>
                    </div>
                    <button type="button" class="item-action-btn delete-btn" data-instance-id="${exRef.instanceId}">×</button>
                `;
                builderList.appendChild(i);
            }
        });
        validateForm();
    }
    
    function renderSavedList() {
        savedList.innerHTML = '';
        const routines = DB.getRoutines();
        if (routines.length === 0) {
            savedList.innerHTML = `<div class="placeholder-card" style="margin-top: 16px;">You haven't created any routines yet.</div>`;
            return;
        }
        routines.forEach(r => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'swipe-item-container sortable-item';
            itemDiv.dataset.id = r.id;
            const totalSets = r.exercises.reduce((s, ex) => s + parseInt(ex.sets || 0), 0);
            itemDiv.innerHTML = `
                <div class="swipe-content">
                    <div class="exercise-item-main" style="text-align:center;">
                        <span class="exercise-item-name">${r.name}</span>
                        <small class="exercise-item-stats">${r.exercises.length} exercises • ${totalSets} total sets</small>
                    </div>
                </div>
                <div class="swipe-actions">
                     <button class="swipe-action-btn swipe-edit-btn" data-id="${r.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM5 13V5a2 2 0 00-2-2H2a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-1H5z"/></svg>
                        <span>Edit</span>
                    </button>
                    <button class="swipe-action-btn swipe-delete-btn" data-id="${r.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd"/></svg>
                        <span>Delete</span>
                    </button>
                </div>`;
            savedList.appendChild(itemDiv);
        });
    }
    
    function handleAddExercise() {
        const id = parseInt(exerciseSelect.value);
        if (isNaN(id)) { alert("Please select an exercise."); return; }
        const exercise = DB.getExercises().find(ex => ex.id === id);
        if (!exercise) return;

        let exForRoutine;
        if (exercise.trackType === 'time') {
            const sets = parseInt(timeSetsInput.value);
            const duration = parseInt(durationInput.value);
            if (isNaN(sets) || sets <= 0 || isNaN(duration) || duration <= 0) { alert("Please enter valid sets and duration."); return; }
            exForRoutine = { exerciseId: id, sets, duration, trackType: 'time', instanceId: Date.now() + Math.random() };
        } else {
            const sets = parseInt(setsInput.value);
            const reps = repsInput.value.trim();
            if (isNaN(sets) || sets <= 0 || !reps) { alert("Please enter valid sets and reps."); return; }
            exForRoutine = { exerciseId: id, sets, reps, trackType: 'reps', instanceId: Date.now() + Math.random() };
        }
        state.builderExercises.push(exForRoutine);
        exerciseSelect.value = '';
        renderBuilderList();
    }
    
    function resetForm() {
        createForm.reset();
        state = { isEditing: false, id: null, builderExercises: [] };
        editingIdInput.value = '';
        saveBtn.textContent = 'Save Routine';
        handleExerciseSelectChange();
        renderBuilderList();
    }

    function handleSaveRoutine(event) {
        event.preventDefault();
        const name = nameInput.value.trim();
        const exercisesToSave = state.builderExercises.map(ex => {
            const { exerciseId, sets, reps, duration, trackType } = ex;
            return trackType === 'time' ? { exerciseId, sets, duration, trackType } : { exerciseId, sets, reps, trackType };
        });
        const allRoutines = DB.getRoutines();

        if (state.isEditing) {
            const r = allRoutines.find(r => r.id === state.id);
            if (r) { r.name = name; r.exercises = exercisesToSave; }
        } else {
            const newRoutine = { id: Date.now(), name, exercises: exercisesToSave };
            allRoutines.push(newRoutine);
        }
        DB.save();
        renderSavedList();
        resetForm();
    }
    
    function handleListClick(e) {
        const deleteBtn = e.target.closest('.swipe-delete-btn');
        const editBtn = e.target.closest('.swipe-edit-btn');
        
        if (deleteBtn) {
            const id = parseInt(deleteBtn.dataset.id);
            if (confirm('Are you sure you want to permanently delete this routine?')) {
                const allRoutines = DB.getRoutines();
                DB.getData().routines = allRoutines.filter(r => r.id !== id);
                if (state.id === id) resetForm();
                DB.save();
                renderSavedList();
                App.resetSwipe();
            }
        } else if (editBtn) {
            const id = parseInt(editBtn.dataset.id);
            const r = DB.getRoutines().find(r => r.id === id);
            if (r) {
                resetForm();
                state.isEditing = true;
                state.id = id;
                editingIdInput.value = id;
                nameInput.value = r.name;
                state.builderExercises = r.exercises.map(leanEx => ({ ...leanEx, instanceId: Date.now() + Math.random() }));
                renderBuilderList();
                saveBtn.textContent = 'Update Routine';
                page.querySelector('main').scrollTo(0, 0);
                App.resetSwipe();
            }
        }
    }
    
    function initSortable() {
        const sortableOptions = { animation: 150, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', delay: 200, delayOnTouchOnly: true };
        
        if (builderSortable) builderSortable.destroy();
        builderSortable = new Sortable(builderList, { ...sortableOptions, handle: '.routine-builder-item', onEnd: (evt) => {
            const movedItem = state.builderExercises.splice(evt.oldIndex, 1)[0];
            state.builderExercises.splice(evt.newIndex, 0, movedItem);
            validateForm();
        }});

        if (savedRoutinesSortable) savedRoutinesSortable.destroy();
        savedRoutinesSortable = new Sortable(savedList, { ...sortableOptions, handle: '.swipe-content', onEnd: (evt) => {
            const allRoutines = DB.getRoutines();
            const movedItem = allRoutines.splice(evt.oldIndex, 1)[0];
            allRoutines.splice(evt.newIndex, 0, movedItem);
            DB.save();
            renderSavedList();
        }});
    }

    function init() {
        UI.populateExerciseDropdown(exerciseSelect, 'Choose an exercise...');
        renderSavedList();
        renderBuilderList();
        initSortable();
        validateForm();

        exerciseSelect.addEventListener('change', handleExerciseSelectChange);
        addExerciseBtn.addEventListener('click', handleAddExercise);
        createForm.addEventListener('submit', handleSaveRoutine);
        nameInput.addEventListener('input', validateForm);
        builderList.addEventListener('click', e => {
            if (e.target.matches('.delete-btn')) {
                const instanceId = parseFloat(e.target.dataset.instanceId);
                state.builderExercises = state.builderExercises.filter(ex => ex.instanceId !== instanceId);
                renderBuilderList();
            }
        });
        savedList.addEventListener('click', handleListClick);
    }

    // Public API
    return {
        init
    };
})();