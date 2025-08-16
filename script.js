// --- APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// --- MAIN APP OBJECT ---
const App = {
    // --- 1. STATE MANAGEMENT ---
    state: {
        currentDate: new Date(),
        routineEditingState: { isEditing: false, id: null },
        routineBuilderState: { exercises: [], selectedExerciseId: null },
        swipeState: { openCardContent: null, instanceIdToSwap: null, instanceIdToEdit: null },
        exerciseToAdd: { id: null },
        activeRoutineDetails: { id: null },
        countdown: { intervalId: null, initialDuration: 0 },
        stopwatch: { intervalId: null, currentInstanceId: null },
        sortableInstances: {
            routineBuilder: null,
            dailyWorkout: null,
            savedRoutines: null,
            routineDetails: null
        },
        allData: {
            exerciseDatabase: [],
            routines: [],
            history: {},
            userGoals: { volume: 10000, sets: 25 }
        }
    },

    // --- 2. DOM ELEMENT REFERENCES ---
    elements: {},

    // --- 3. CONSTANTS ---
    constants: {
        CIRCLE_CIRCUMFERENCE: 2 * Math.PI * 54,
        SWIPE_ACTION_WIDTH: 160, // 2 buttons * 80px
        SWIPE_ACTION_WIDTH_WORKOUT: 240, // 3 buttons * 80px
        LOCAL_STORAGE_KEY: 'workoutTrackerData'
    },

    // --- 4. INITIALIZATION ---
    async init() {
        // Cache all DOM elements
        this.elements = {
            appContainer: document.getElementById('app-container'),
            nav: {
                workout: document.getElementById('nav-workout'),
                routines: document.getElementById('nav-routines'),
                exercises: document.getElementById('nav-exercises')
            },
            pages: {
                workout: document.getElementById('workout-page'),
                routines: document.getElementById('routines-page'),
                exercises: document.getElementById('exercises-page')
            },
            exerciseDb: {
                list: document.getElementById('db-exercise-list'),
                filterCategory: document.getElementById('filter-category'),
                filterMuscle: document.getElementById('filter-muscle'),
                filterType: document.getElementById('filter-type'),
                sort: document.getElementById('sort-exercises')
            },
            routineBuilder: {
                form: document.getElementById('create-routine-form'),
                editingIdInput: document.getElementById('routine-editing-id'),
                nameInput: document.getElementById('routine-name-input'),
                exerciseInput: document.getElementById('routine-exercise-input'),
                autocompleteResults: document.getElementById('autocomplete-results'),
                repsSetsInput: document.getElementById('routine-sets-input'),
                repsInput: document.getElementById('routine-reps-input'),
                timeSetsInput: document.getElementById('routine-time-sets-input'),
                durationInput: document.getElementById('routine-duration-input'),
                addExerciseBtn: document.getElementById('add-exercise-to-builder-btn'),
                list: document.getElementById('routine-builder-list'),
                saveBtn: document.getElementById('save-routine-btn'),
                repsInputs: document.getElementById('reps-based-inputs'),
                timeInputs: document.getElementById('time-based-inputs'),
                trackTypeToggle: document.querySelector('.track-type-toggle')
            },
            savedRoutines: {
                list: document.getElementById('saved-routines-list')
            },
            dailyWorkout: {
                routineSelect: document.getElementById('daily-routine-select'),
                startBtn: document.getElementById('start-routine-btn'),
                display: document.getElementById('active-routine-display'),
                selectionArea: document.getElementById('routine-selection-area'),
                activeInfo: document.getElementById('active-routine-info'),
                activeName: document.getElementById('active-routine-name'),
                resetBtn: document.getElementById('reset-workout-btn'),
                finishBtn: document.getElementById('finish-workout-btn')
            },
            footer: {
                dateDisplay: document.getElementById('date-display-btn'),
                prevDay: document.getElementById('prev-day-btn'),
                nextDay: document.getElementById('next-day-btn')
            },
            actionsMenu: {
                btn: document.getElementById('actions-menu-btn'),
                dropdown: document.getElementById('actions-dropdown'),
                importBtn: document.getElementById('import-data-btn'),
                exportBtn: document.getElementById('export-data-btn'),
                fileLoader: document.getElementById('file-loader')
            },
            modals: {
                all: document.querySelectorAll('.modal'),
                stopwatch: {
                    modal: document.getElementById('stopwatch-modal'),
                    name: document.getElementById('stopwatch-exercise-name'),
                    display: document.getElementById('stopwatch-timer-display'),
                    actionBtn: document.getElementById('stopwatch-action-btn'),
                    cancelBtn: document.getElementById('stopwatch-cancel-btn')
                },
                countdown: {
                    modal: document.getElementById('countdown-modal'),
                    display: document.getElementById('countdown-timer-display'),
                    label: document.getElementById('countdown-label'),
                    nextInfo: document.getElementById('countdown-next-exercise-info'),
                    nextName: document.getElementById('countdown-next-exercise-name'),
                    nextDetails: document.getElementById('countdown-next-exercise-details'),
                    progressCircle: document.querySelector('.timer-progress')
                },
                workoutComplete: {
                    modal: document.getElementById('workout-complete-modal'),
                    timeDisplay: document.getElementById('workout-total-time'),
                    closeBtn: document.getElementById('close-complete-modal-btn')
                },
                swapExercise: {
                    modal: document.getElementById('swap-exercise-modal'),
                    form: document.getElementById('swap-exercise-form'),
                    select: document.getElementById('swap-exercise-select'),
                    cancelBtn: document.getElementById('cancel-swap-btn')
                },
                editWorkoutExercise: {
                    modal: document.getElementById('edit-workout-exercise-modal'),
                    form: document.getElementById('edit-workout-exercise-form'),
                    title: document.getElementById('edit-modal-title'),
                    repsInputs: document.getElementById('edit-reps-based-inputs'),
                    timeInputs: document.getElementById('edit-time-based-inputs'),
                    setsInput: document.getElementById('edit-sets-input'),
                    repsInput: document.getElementById('edit-reps-input'),
                    timeSetsInput: document.getElementById('edit-time-sets-input'),
                    durationInput: document.getElementById('edit-duration-input'),
                    cancelBtn: document.getElementById('cancel-edit-btn')
                },
                exerciseDetails: {
                    modal: document.getElementById('exercise-details-modal'),
                    videoContainer: document.getElementById('details-video-container'),
                    name: document.getElementById('details-exercise-name'),
                    tabContent: document.getElementById('details-tab-content'),
                    closeBtn: document.getElementById('details-modal-close-btn')
                },
                addToRoutine: {
                    modal: document.getElementById('add-to-routine-modal'),
                    form: document.getElementById('add-to-routine-form'),
                    title: document.getElementById('add-to-routine-title'),
                    select: document.getElementById('add-to-routine-select'),
                    setsInput: document.getElementById('add-to-routine-sets'),
                    repsInput: document.getElementById('add-to-routine-reps'),
                    cancelBtn: document.getElementById('cancel-add-to-routine-btn')
                },
                routineDetails: {
                    modal: document.getElementById('routine-details-modal'),
                    title: document.getElementById('routine-details-title'),
                    list: document.getElementById('routine-details-list'),
                    closeBtn: document.getElementById('close-routine-details-btn')
                }
            }
        };

        this.utils.loadData();
        await this.utils.loadExercisesFromCSV();
        this.render.populateFilterControls();
        this.handlers.attachAllEventListeners();
        this.utils.showPage('workout-page');
        this.handlers.validateRoutineForm();
        this.utils.initSortable('routineBuilder', this.elements.routineBuilder.list, { handle: '.routine-builder-item', onEnd: this.handlers.onRoutineBuilderSortEnd });
    },

    // --- 5. UTILITY & HELPER FUNCTIONS ---
    utils: {
        showPage(pageId) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
            document.getElementById(`nav-${pageId.split('-')[0]}`).classList.add('active');
            App.handlers.closeStopwatchModal(true);
            App.render.currentPage();
        },
        saveData() {
            try {
                const dataToSave = { ...App.state.allData, exerciseDatabase: [] };
                localStorage.setItem(App.constants.LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
            } catch (error) {
                console.error("Could not save data", error);
                alert("Error saving data. Storage might be full.");
            }
        },
        loadData() {
            const d = localStorage.getItem(App.constants.LOCAL_STORAGE_KEY);
            if (!d) return;
            try {
                const p = JSON.parse(d);
                if (p.history && p.userGoals) {
                    App.state.allData.routines = p.routines || [];
                    App.state.allData.history = p.history;
                    App.state.allData.userGoals = p.userGoals;
                }
            } catch (e) { console.error("Could not parse data", e); }
        },
        async loadExercisesFromCSV() {
            try {
                const response = await fetch('Data.csv');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const csvText = await response.text();
                const lines = csvText.trim().split('\n');
                const headers = lines.shift().split(',').map(h => h.trim());
                App.state.allData.exerciseDatabase = lines.map((line, index) => {
                    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                    const obj = {};
                    headers.forEach((header, i) => {
                        let value = (values[i] || '').trim();
                        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                        obj[header] = value;
                    });
                    return {
                        id: Date.now() + index,
                        name: obj['Exercise'],
                        videoUrl: obj['Video URL'],
                        type: obj['Type'],
                        primaryMuscles: obj['Primary Muscles'],
                        secondaryMuscles: obj['Secondary Muscles'],
                        category: obj['Workout Category'],
                        instructions: obj['Instructions for Proper Form'],
                        trackType: 'reps'
                    };
                });
            } catch (error) {
                console.error('Failed to load or parse exercises from CSV:', error);
                if (!App.state.allData.exerciseDatabase) App.state.allData.exerciseDatabase = [];
            }
        },
        openModal(modalElement) { modalElement.classList.remove('hidden'); },
        closeModal(modalElement) {
            modalElement.classList.add('hidden');
            if (modalElement.id === 'exercise-details-modal') {
                App.elements.modals.exerciseDetails.videoContainer.innerHTML = '';
            }
        },
        getFormattedDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; },
        formatStopwatchTime(ms) {
            const totalSeconds = Math.floor(ms / 1000);
            const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
            const seconds = (totalSeconds % 60).toString().padStart(2, '0');
            const milliseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
            return `${minutes}:${seconds}.${milliseconds}`;
        },
        formatTotalTime(ms) {
            if (ms === null || isNaN(ms) || ms < 0) return 'N/A';
            const totalSeconds = Math.floor(ms / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            let parts = [];
            if (hours > 0) parts.push(`${hours}h`);
            if (minutes > 0) parts.push(`${minutes}m`);
            if (seconds >= 0 && parts.length < 2) parts.push(`${seconds}s`);
            return parts.length === 0 ? '0s' : parts.join(' ');
        },
        createElement(tag, options = {}) {
            const el = document.createElement(tag);
            if (options.className) el.className = options.className;
            if (options.textContent) el.textContent = options.textContent;
            if (options.innerHTML) el.innerHTML = options.innerHTML;
            if (options.id) el.id = options.id;
            if (options.attributes) {
                for (const [key, value] of Object.entries(options.attributes)) {
                    el.setAttribute(key, value);
                }
            }
            if (options.dataset) {
                for (const [key, value] of Object.entries(options.dataset)) {
                    el.dataset[key] = value;
                }
            }
            if (options.children) {
                options.children.forEach(child => child && el.appendChild(child));
            }
            return el;
        },
        initSortable(name, element, options) {
            const { sortableInstances } = App.state;
            if (sortableInstances[name]) sortableInstances[name].destroy();
            if (!element) return;
            sortableInstances[name] = new Sortable(element, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                delay: 200,
                delayOnTouchOnly: true,
                ...options
            });
        }
    },

    // --- 6. RENDERING FUNCTIONS ---
    render: {
        currentPage() {
            const id = document.querySelector('.page.active').id;
            if (id === 'exercises-page') {
                this.exerciseDatabase();
            } else if (id === 'routines-page') {
                this.savedRoutines();
                App.utils.initSortable('savedRoutines', App.elements.savedRoutines.list, { handle: '.swipe-content', onEnd: App.handlers.onSavedRoutinesSortEnd });
            } else if (id === 'workout-page') {
                this.populateDailyRoutineDropdown();
                this.workoutPage();
            }
            this.dateControls();
        },
        dateControls() {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            App.state.currentDate.setHours(0, 0, 0, 0);
            const isToday = App.state.currentDate.getTime() === today.getTime();
            App.elements.footer.dateDisplay.textContent = isToday ? 'Today' : App.state.currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            App.elements.footer.nextDay.disabled = App.state.currentDate >= today;
        },
        exerciseDatabase() {
            const { list, filterCategory, filterMuscle, filterType, sort } = App.elements.exerciseDb;
            list.innerHTML = '';
            const filters = { category: filterCategory.value, muscle: filterMuscle.value, type: filterType.value };
            const sortBy = sort.value;

            let filteredData = App.state.allData.exerciseDatabase.filter(ex =>
                (!filters.category || ex.category === filters.category) &&
                (!filters.muscle || ex.primaryMuscles === filters.muscle) &&
                (!filters.type || ex.type === filters.type)
            );

            filteredData.sort((a, b) => sortBy === 'az' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

            if (filteredData.length === 0) {
                list.innerHTML = `<div class="placeholder-card">No exercises match your filters.</div>`;
                return;
            }

            const exercisesByGroup = filteredData.reduce((acc, ex) => {
                const group = ex.category || 'Uncategorized';
                if (!acc[group]) acc[group] = [];
                acc[group].push(ex);
                return acc;
            }, {});

            Object.keys(exercisesByGroup).sort().forEach(group => {
                const groupCard = App.utils.createElement('div', {
                    className: 'card exercise-group-card',
                    children: [
                        App.utils.createElement('h3', { textContent: group }),
                        App.utils.createElement('div', {
                            className: 'exercise-group-list',
                            children: exercisesByGroup[group].map(ex =>
                                App.utils.createElement('div', {
                                    className: 'exercise-list-item list-item-base',
                                    children: [
                                        App.utils.createElement('div', {
                                            className: 'exercise-item-main',
                                            innerHTML: `<span class="exercise-item-name">${ex.name}</span><small class="exercise-item-stats">${ex.primaryMuscles} • ${ex.type}</small>`
                                        }),
                                        App.utils.createElement('div', {
                                            className: 'exercise-list-actions',
                                            children: [
                                                App.utils.createElement('button', { className: 'exercise-list-btn add-to-routine-btn', dataset: { id: ex.id }, attributes: { 'aria-label': 'Add to Routine' }, innerHTML: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>` }),
                                                App.utils.createElement('button', { className: 'exercise-list-btn details-btn', dataset: { id: ex.id }, attributes: { 'aria-label': 'More Details' }, innerHTML: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" /></svg>` })
                                            ]
                                        })
                                    ]
                                })
                            )
                        })
                    ]
                });
                list.appendChild(groupCard);
            });
        },
        populateDailyRoutineDropdown() {
            const { routineSelect } = App.elements.dailyWorkout;
            routineSelect.innerHTML = `<option value="" disabled selected>Select a routine to begin...</option>`;
            [...App.state.allData.routines].sort((a, b) => a.name.localeCompare(b.name)).forEach(r => {
                routineSelect.appendChild(App.utils.createElement('option', { textContent: r.name, attributes: { value: r.id } }));
            });
        },
        savedRoutines() {
            const { list } = App.elements.savedRoutines;
            list.innerHTML = '';
            if (App.state.allData.routines.length === 0) {
                list.innerHTML = `<div class="placeholder-card">You haven't created any routines yet.</div>`;
                return;
            }
            App.state.allData.routines.forEach(r => {
                const sets = r.exercises.reduce((s, ex) => s + parseInt(ex.sets), 0);
                const itemDiv = App.utils.createElement('div', {
                    className: 'swipe-item-container sortable-item',
                    dataset: { id: r.id },
                    innerHTML: `
                        <div class="swipe-content">
                            <div class="exercise-item-main">
                                <span class="exercise-item-name">${r.name}</span>
                                <small class="exercise-item-stats">${r.exercises.length} exercises • ${sets} total sets</small>
                            </div>
                        </div>
                        <div class="swipe-actions">
                             <button class="swipe-action-btn swipe-edit-btn" data-id="${r.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>
                                <span>Edit</span>
                            </button>
                            <button class="swipe-action-btn swipe-delete-btn" data-id="${r.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1H8.75zM10 4.5a.75.75 0 01.75.75v8.5a.75.75 0 01-1.5 0v-8.5A.75.75 0 0110 4.5z" clip-rule="evenodd" /></svg>
                                <span>Delete</span>
                            </button>
                        </div>`
                });
                list.appendChild(itemDiv);
            });
        },
        workoutPage() {
            const dateKey = App.utils.getFormattedDate(App.state.currentDate);
            const workoutData = App.state.allData.history[dateKey];
            const { selectionArea, activeInfo, display } = App.elements.dailyWorkout;
            App.handlers.resetSwipeState();

            if (!workoutData) {
                selectionArea.classList.remove('hidden');
                activeInfo.classList.add('hidden');
                display.innerHTML = `<div class="placeholder-card">Select a routine and click "Start" to see your exercises.</div>`;
                return;
            }

            if (workoutData.isComplete) {
                this.workoutSummary(workoutData);
            } else {
                this.activeWorkout(workoutData);
            }
            App.utils.initSortable('dailyWorkout', display, { handle: '.swipe-content', onEnd: App.handlers.onDailyWorkoutSortEnd });
        },
        activeWorkout(workoutData) {
            const { selectionArea, activeInfo, activeName, display } = App.elements.dailyWorkout;
            selectionArea.classList.add('hidden');
            activeInfo.classList.remove('hidden');
            activeName.textContent = workoutData.routine.name;
            display.innerHTML = '';
            let isCurrentExerciseFound = false;

            workoutData.routine.exercises.forEach(exercise => {
                const progress = workoutData.progress.find(p => p.instanceId === exercise.instanceId);
                if (!progress) return;
                if (!progress.timer) progress.timer = { enabled: false, duration: 30 };
                const isFinished = progress.setsCompleted >= exercise.sets;
                let isCurrent = false;
                if (!isFinished && !isCurrentExerciseFound) { isCurrent = true; isCurrentExerciseFound = true; }
                const itemDiv = App.utils.createElement('div', {
                    className: `active-routine-exercise sortable-item ${isCurrent ? 'current' : ''} ${isFinished ? 'finished' : ''}`,
                    dataset: { instanceId: exercise.instanceId }
                });

                let stats, trackingUI;
                if (exercise.trackType === 'time') {
                    stats = `${progress.setsCompleted} / ${exercise.sets} Sets • ${exercise.duration} sec Target`;
                    trackingUI = `<div class="exercise-actions"><button class="btn-primary start-stopwatch-modal-btn" ${isFinished || !isCurrent ? 'disabled' : ''}>Start Set ${progress.setsCompleted + 1}</button></div>`;
                } else {
                    stats = `${exercise.sets} sets × ${exercise.reps} reps`;
                    trackingUI = `<div class="exercise-actions"><div class="set-progress-display">${progress.setsCompleted} / ${exercise.sets} Sets Completed</div><button class="btn-primary start-reps-set-btn" ${isFinished || !isCurrent ? 'disabled' : ''}>${isFinished ? "All Sets Complete" : `Log Set ${progress.setsCompleted + 1}`}</button></div>`;
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
                            <button class="swipe-action-btn swipe-swap-btn" data-instance-id="${exercise.instanceId}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M7.25 2.75a.75.75 0 00-1.5 0v11.5a.75.75 0 001.5 0V2.75zM12.75 2.75a.75.75 0 00-1.5 0v11.5a.75.75 0 001.5 0V2.75zM4 6.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75a.75.75 0 01-.75-.75zM4 13.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75a.75.75 0 01-.75-.75z" /></svg><span>Swap</span></button>
                            <button class="swipe-action-btn swipe-edit-btn" data-instance-id="${exercise.instanceId}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg><span>Edit</span></button>
                            <button class="swipe-action-btn swipe-delete-btn" data-instance-id="${exercise.instanceId}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1H8.75zM10 4.5a.75.75 0 01.75.75v8.5a.75.75 0 01-1.5 0v-8.5A.75.75 0 0110 4.5z" clip-rule="evenodd" /></svg><span>Delete</span></button>
                        </div>
                    </div>`;
                display.appendChild(itemDiv);
            });
        },
        workoutSummary(workoutData) {
            const { selectionArea, activeInfo, display } = App.elements.dailyWorkout;
            selectionArea.classList.add('hidden');
            activeInfo.classList.add('hidden');
            let summaryHTML = `<div class="card workout-summary-card"><div class="summary-header"><div><h2>${workoutData.routine.name} - Summary</h2>${workoutData.completionTime ? `<div class="summary-total-time">${App.utils.formatTotalTime(workoutData.completionTime)}</div>` : ''}</div><button class="btn-primary" id="start-new-workout-btn">Start New Workout</button></div>`;

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
                            <span class="summary-logged-time">${App.utils.formatStopwatchTime(time)}</span>
                        </div>`;
                    });
                }

                summaryHTML += `<div class="summary-exercise-card">
                    <div class="summary-exercise-header"><div class="exercise-item-main"><span class="exercise-item-name">${exercise.name}</span><small class="exercise-item-stats">${stats}</small></div></div>
                    <div class="summary-sets-list">${setsHTML}</div>
                </div>`;
            });

            summaryHTML += `<div class="summary-notes-section"><h3>Workout Notes</h3><textarea id="workout-notes-input" placeholder="How was the workout? Any PRs?">${workoutData.notes || ''}</textarea></div>`;
            summaryHTML += `<div class="summary-actions"><button class="btn-primary" id="save-summary-changes-btn">Save Changes</button></div></div>`;
            display.innerHTML = summaryHTML;
        },
        routineBuilderList() {
            const { list } = App.elements.routineBuilder;
            list.innerHTML = '';
            if (App.state.routineBuilderState.exercises.length === 0) {
                list.innerHTML = `<div class="placeholder-card" style="padding: 20px; margin-top: 0;">Search for an exercise above to add it to this routine.</div>`;
                return;
            }
            App.state.routineBuilderState.exercises.forEach(exRef => {
                const ex = App.state.allData.exerciseDatabase.find(dbEx => dbEx.id === exRef.exerciseId);
                if (ex) {
                    const details = exRef.trackType === 'time' ? `${exRef.sets} sets × ${exRef.duration} sec` : `${exRef.sets} sets × ${exRef.reps} reps`;
                    const item = App.utils.createElement('div', {
                        className: 'routine-builder-item sortable-item list-item-base',
                        dataset: { instanceId: exRef.instanceId },
                        children: [
                            App.utils.createElement('div', { className: 'exercise-item-main', innerHTML: `<span class="exercise-item-name">${ex.name}</span><small class="exercise-item-stats">${details}</small>` }),
                            App.utils.createElement('button', { type: 'button', className: 'item-action-btn delete-btn', dataset: { instanceId: exRef.instanceId }, textContent: '×' })
                        ]
                    });
                    list.appendChild(item);
                }
            });
            App.handlers.validateRoutineForm();
        },
        populateFilterControls() {
            const { exerciseDatabase } = App.state.allData;
            const { filterCategory, filterMuscle, filterType } = App.elements.exerciseDb;
            const populate = (select, key) => {
                const options = [...new Set(exerciseDatabase.map(ex => ex[key]))].sort();
                select.innerHTML = `<option value="">All ${key.charAt(0).toUpperCase() + key.slice(1)}</option>`;
                options.forEach(o => select.innerHTML += `<option value="${o}">${o}</option>`);
            };
            populate(filterCategory, 'category');
            populate(filterMuscle, 'primaryMuscles');
            populate(filterType, 'type');
        },
        // ... other render functions
    },

    // --- 7. EVENT HANDLERS & WORKFLOWS ---
    handlers: {
        attachAllEventListeners() {
            const { elements, handlers } = App;
            // Navigation
            elements.nav.workout.addEventListener('click', () => App.utils.showPage('workout-page'));
            elements.nav.routines.addEventListener('click', () => App.utils.showPage('routines-page'));
            elements.nav.exercises.addEventListener('click', () => App.utils.showPage('exercises-page'));

            // Routine Builder
            elements.routineBuilder.form.addEventListener('submit', handlers.saveRoutine);
            elements.routineBuilder.addExerciseBtn.addEventListener('click', handlers.addExerciseToBuilder);
            elements.routineBuilder.nameInput.addEventListener('input', handlers.validateRoutineForm);
            elements.routineBuilder.list.addEventListener('click', e => {
                if (e.target.matches('.delete-btn')) {
                    const instanceId = parseFloat(e.target.dataset.instanceId);
                    App.state.routineBuilderState.exercises = App.state.routineBuilderState.exercises.filter(ex => ex.instanceId !== instanceId);
                    App.render.routineBuilderList();
                }
            });
            elements.routineBuilder.trackTypeToggle.addEventListener('click', handlers.onTrackTypeToggle);
            elements.routineBuilder.exerciseInput.addEventListener('input', handlers.onAutocompleteSearch);
            elements.routineBuilder.autocompleteResults.addEventListener('click', handlers.onAutocompleteSelect);

            // Daily Workout
            elements.dailyWorkout.startBtn.addEventListener('click', handlers.startRoutine);
            elements.dailyWorkout.routineSelect.addEventListener('change', () => { elements.dailyWorkout.startBtn.disabled = !elements.dailyWorkout.routineSelect.value; });
            elements.dailyWorkout.resetBtn.addEventListener('click', handlers.resetWorkout);
            elements.dailyWorkout.finishBtn.addEventListener('click', () => { if (confirm("Are you sure you want to finish and log this workout?")) handlers.completeWorkout(false); });

            // Footer Date Controls
            elements.footer.prevDay.addEventListener('click', () => handlers.changeDate(-1));
            elements.footer.nextDay.addEventListener('click', () => handlers.changeDate(1));
            elements.footer.dateDisplay.addEventListener('click', () => { if (!elements.footer.dateDisplay.disabled) { App.state.currentDate = new Date(); App.render.currentPage(); } });

            // Actions Menu
            elements.actionsMenu.btn.addEventListener('click', () => elements.actionsMenu.dropdown.classList.toggle('hidden'));
            elements.actionsMenu.exportBtn.addEventListener('click', handlers.exportData);
            elements.actionsMenu.importBtn.addEventListener('click', () => elements.actionsMenu.fileLoader.click());
            elements.actionsMenu.fileLoader.addEventListener('change', handlers.importData);

            // Exercise DB Filters
            elements.exerciseDb.filterCategory.addEventListener('change', App.render.exerciseDatabase);
            elements.exerciseDb.filterMuscle.addEventListener('change', App.render.exerciseDatabase);
            elements.exerciseDb.filterType.addEventListener('change', App.render.exerciseDatabase);
            elements.exerciseDb.sort.addEventListener('change', App.render.exerciseDatabase);

            // Modals
            elements.modals.stopwatch.actionBtn.addEventListener('click', handlers.onStopwatchAction);
            elements.modals.stopwatch.cancelBtn.addEventListener('click', () => handlers.closeStopwatchModal());
            elements.modals.workoutComplete.closeBtn.addEventListener('click', () => { App.utils.closeModal(elements.modals.workoutComplete.modal); App.render.workoutPage(); });
            elements.modals.countdown.modal.addEventListener('click', e => { if (e.target.classList.contains('modal-content') || e.target.classList.contains('countdown-timer-wrapper')) handlers.closeCountdownModal(); });
            elements.modals.swapExercise.form.addEventListener('submit', handlers.onSwapExerciseSubmit);
            elements.modals.swapExercise.cancelBtn.addEventListener('click', () => App.utils.closeModal(elements.modals.swapExercise.modal));
            elements.modals.editWorkoutExercise.form.addEventListener('submit', handlers.onEditExerciseSubmit);
            elements.modals.editWorkoutExercise.cancelBtn.addEventListener('click', () => App.utils.closeModal(elements.modals.editWorkoutExercise.modal));
            elements.modals.exerciseDetails.closeBtn.addEventListener('click', () => App.utils.closeModal(elements.modals.exerciseDetails.modal));
            elements.modals.exerciseDetails.modal.addEventListener('click', handlers.onDetailsTabClick);
            elements.modals.addToRoutine.form.addEventListener('submit', handlers.onAddToRoutineSubmit);
            elements.modals.addToRoutine.cancelBtn.addEventListener('click', () => App.utils.closeModal(elements.modals.addToRoutine.modal));
            elements.modals.routineDetails.closeBtn.addEventListener('click', () => App.utils.closeModal(elements.modals.routineDetails.modal));
            elements.modals.routineDetails.list.addEventListener('click', handlers.onRoutineDetailsAction);

            // Global Click & Touch Handlers
            document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) { elements.modals.all.forEach(m => App.utils.closeModal(m)); handlers.closeCountdownModal(); handlers.closeStopwatchModal(true); } });
            elements.appContainer.addEventListener('click', handlers.onAppContainerClick);
            elements.appContainer.addEventListener('touchstart', handlers.onTouchStart, { passive: true });
            elements.appContainer.addEventListener('touchmove', handlers.onTouchMove, { passive: false });
            elements.appContainer.addEventListener('touchend', handlers.onTouchEnd);
        },

        // Click Dispatcher
        onAppContainerClick(e) {
            const { handlers } = App;
            if (handlers.isSwiping || (handlers.touchStartX !== 0 && handlers.touchStartX !== handlers.touchCurrentX)) {
                handlers.touchStartX = 0;
                handlers.touchCurrentX = 0;
                if (e.target.closest('.swipe-content')) e.stopPropagation();
                return;
            }
            if (App.state.swipeState.openCardContent && !e.target.closest('.swipe-actions')) {
                handlers.resetSwipeState();
            }

            const page = e.target.closest('.page');
            if (!page) return;

            switch (page.id) {
                case 'routines-page': handlers.handleRoutinesPageClick(e); break;
                case 'exercises-page': handlers.handleExercisesPageClick(e); break;
                case 'workout-page': handlers.handleWorkoutPageClick(e); break;
            }
        },

        // Page-specific Click Handlers
        handleRoutinesPageClick(e) {
            const { target } = e;
            const deleteBtn = target.closest('.swipe-delete-btn');
            const editBtn = target.closest('.swipe-edit-btn');
            const routineCard = target.closest('.swipe-content');

            if (deleteBtn) {
                const id = parseInt(deleteBtn.dataset.id);
                if (confirm('Are you sure you want to permanently delete this routine?')) {
                    App.state.allData.routines = App.state.allData.routines.filter(r => r.id !== id);
                    if (App.state.routineEditingState.id === id) App.handlers.resetRoutineForm();
                    App.utils.saveData();
                    App.render.savedRoutines();
                }
            } else if (editBtn) {
                const id = parseInt(editBtn.dataset.id);
                const r = App.state.allData.routines.find(r => r.id === id);
                if (r) {
                    App.handlers.resetRoutineForm();
                    App.state.routineEditingState = { isEditing: true, id };
                    App.elements.routineBuilder.editingIdInput.value = id;
                    App.elements.routineBuilder.nameInput.value = r.name;
                    App.state.routineBuilderState.exercises = r.exercises.map(leanEx => ({ ...leanEx, instanceId: Date.now() + Math.random() }));
                    App.render.routineBuilderList();
                    App.elements.routineBuilder.saveBtn.textContent = 'Update Routine';
                    App.elements.pages.routines.querySelector('main').scrollTo({ top: 0, behavior: 'smooth' });
                }
                App.handlers.resetSwipeState();
            } else if (routineCard && !target.closest('.swipe-actions')) {
                const id = parseInt(routineCard.closest('.sortable-item').dataset.id);
                App.handlers.openRoutineDetailsModal(id);
            }
        },
        handleExercisesPageClick(e) {
            const detailsBtn = e.target.closest('.details-btn');
            const addToRoutineBtn = e.target.closest('.add-to-routine-btn');
            if (detailsBtn) {
                App.handlers.openDetailsModal(parseInt(detailsBtn.dataset.id));
            } else if (addToRoutineBtn) {
                App.handlers.openAddToRoutineModal(parseInt(addToRoutineBtn.dataset.id));
            }
        },
        handleWorkoutPageClick(e) {
            const { target } = e;
            if (target.id === 'start-new-workout-btn') {
                if (confirm("This will clear today's completed log. Are you sure?")) {
                    delete App.state.allData.history[App.utils.getFormattedDate(App.state.currentDate)];
                    App.utils.saveData();
                    App.render.workoutPage();
                }
                return;
            }
            if (target.id === 'save-summary-changes-btn') {
                App.handlers.saveSummaryChanges(target);
                return;
            }

            const swapBtn = target.closest('.swipe-swap-btn');
            const deleteBtn = target.closest('.swipe-delete-btn');
            const editBtn = target.closest('.swipe-edit-btn');
            if (deleteBtn) {
                if (confirm("Delete this exercise from today's workout?")) {
                    const instanceId = parseFloat(deleteBtn.dataset.instanceId);
                    const dateKey = App.utils.getFormattedDate(App.state.currentDate);
                    const workoutData = App.state.allData.history[dateKey];
                    workoutData.routine.exercises = workoutData.routine.exercises.filter(ex => ex.instanceId !== instanceId);
                    workoutData.progress = workoutData.progress.filter(p => p.instanceId !== instanceId);
                    App.utils.saveData();
                    App.render.workoutPage();
                }
            } else if (swapBtn) {
                App.state.swipeState.instanceIdToSwap = parseFloat(swapBtn.dataset.instanceId);
                App.handlers.populateExerciseDropdown(App.elements.modals.swapExercise.select, true);
                App.utils.openModal(App.elements.modals.swapExercise.modal);
            } else if (editBtn) {
                App.handlers.openEditWorkoutExerciseModal(parseFloat(editBtn.dataset.instanceId));
            }

            const card = target.closest('.active-routine-exercise');
            if (!card) return;
            const instanceId = parseFloat(card.dataset.instanceId);
            if (target.matches('.start-reps-set-btn')) {
                App.handlers.logRepsSet(instanceId);
            } else if (target.matches('.start-stopwatch-modal-btn')) {
                App.handlers.openStopwatchModal(instanceId);
            } else if (target.matches('.timer-toggle, .timer-interval-btn')) {
                App.handlers.updateTimerSettings(instanceId, target);
            }
        },

        // ... other handlers
    }
};

// --- Add specific handler implementations to the App.handlers object ---
// This keeps the main App object clean while allowing for detailed implementation below.

Object.assign(App.handlers, {
    touchStartX: 0,
    touchStartY: 0,
    touchCurrentX: 0,
    swipeTarget: null,
    isSwiping: false,
    swipeDirection: null,

    resetSwipeState() {
        if (App.state.swipeState.openCardContent) {
            App.state.swipeState.openCardContent.style.transform = 'translateX(0px)';
        }
        this.touchStartX = 0; this.touchStartY = 0; this.touchCurrentX = 0;
        this.swipeTarget = null; this.isSwiping = false; this.swipeDirection = null;
        App.state.swipeState.openCardContent = null;
    },

    onTouchStart(e) {
        const target = e.target.closest('.swipe-content');
        if (!target || e.target.closest('.routine-builder-item')) return;
        if (App.state.swipeState.openCardContent && App.state.swipeState.openCardContent !== target) {
            this.resetSwipeState();
        }
        this.swipeTarget = target;
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.swipeTarget.style.transition = 'none';
    },

    onTouchMove(e) {
        if (!this.swipeTarget) return;
        this.touchCurrentX = e.touches[0].clientX;
        const diffX = this.touchCurrentX - this.touchStartX;
        const diffY = e.touches[0].clientY - this.touchStartY;

        if (!this.swipeDirection) {
            if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) this.swipeDirection = 'horizontal';
            else if (Math.abs(diffY) > 10) this.swipeDirection = 'vertical';
        }

        if (this.swipeDirection === 'horizontal') {
            e.preventDefault();
            this.isSwiping = true;
            const SWIPE_WIDTH = this.swipeTarget.closest('#active-routine-display') ? App.constants.SWIPE_ACTION_WIDTH_WORKOUT : App.constants.SWIPE_ACTION_WIDTH;
            const currentX = App.state.swipeState.openCardContent === this.swipeTarget ? -SWIPE_WIDTH + diffX : diffX;
            const transformX = Math.max(-SWIPE_WIDTH, Math.min(0, currentX));
            this.swipeTarget.style.transform = `translateX(${transformX}px)`;
        }
    },

    onTouchEnd() {
        if (!this.swipeTarget || !this.isSwiping) {
            this.resetSwipeState();
            return;
        }
        const diffX = this.touchCurrentX - this.touchStartX;
        this.swipeTarget.style.transition = 'transform 0.3s ease-out';
        const SWIPE_WIDTH = this.swipeTarget.closest('#active-routine-display') ? App.constants.SWIPE_ACTION_WIDTH_WORKOUT : App.constants.SWIPE_ACTION_WIDTH;
        const wasOpen = App.state.swipeState.openCardContent === this.swipeTarget;

        if (wasOpen) {
            if (diffX > 60) { // Swipe to close
                this.swipeTarget.style.transform = 'translateX(0px)';
                App.state.swipeState.openCardContent = null;
            } else { // Return to open state
                this.swipeTarget.style.transform = `translateX(${-SWIPE_WIDTH}px)`;
            }
        } else {
            if (diffX < -60) { // Swipe to open
                this.swipeTarget.style.transform = `translateX(${-SWIPE_WIDTH}px)`;
                App.state.swipeState.openCardContent = this.swipeTarget;
            } else { // Return to closed state
                this.swipeTarget.style.transform = 'translateX(0px)';
            }
        }
        this.swipeTarget = null; this.isSwiping = false; this.swipeDirection = null;
    },

    onRoutineBuilderSortEnd(evt) {
        const { exercises } = App.state.routineBuilderState;
        const [movedItem] = exercises.splice(evt.oldIndex, 1);
        exercises.splice(evt.newIndex, 0, movedItem);
        App.handlers.validateRoutineForm();
    },

    onDailyWorkoutSortEnd(evt) {
        const dateKey = App.utils.getFormattedDate(App.state.currentDate);
        const workoutData = App.state.allData.history[dateKey];
        if (!workoutData) return;
        const [movedExercise] = workoutData.routine.exercises.splice(evt.oldIndex, 1);
        workoutData.routine.exercises.splice(evt.newIndex, 0, movedExercise);
        const [movedProgress] = workoutData.progress.splice(evt.oldIndex, 1);
        workoutData.progress.splice(evt.newIndex, 0, movedProgress);
        App.utils.saveData();
        App.render.workoutPage();
    },

    onSavedRoutinesSortEnd(evt) {
        const { routines } = App.state.allData;
        const [movedItem] = routines.splice(evt.oldIndex, 1);
        routines.splice(evt.newIndex, 0, movedItem);
        App.utils.saveData();
        App.render.savedRoutines();
    },

    onRoutineDetailsSortEnd(evt) {
        const routine = App.state.allData.routines.find(r => r.id === App.state.activeRoutineDetails.id);
        if (routine) {
            const [movedItem] = routine.exercises.splice(evt.oldIndex, 1);
            routine.exercises.splice(evt.newIndex, 0, movedItem);
            App.utils.saveData();
            App.render.savedRoutines();
        }
    },
    
    // ... continue adding all other handler functions here, refactored to use App.state and App.elements
    // For brevity, only a few more key handlers are shown fully refactored.
    
    saveRoutine(event) {
        event.preventDefault();
        const { nameInput } = App.elements.routineBuilder;
        const { routineBuilderState, routineEditingState, allData } = App.state;
        const name = nameInput.value.trim();
        const exercisesToSave = routineBuilderState.exercises.map(({ exerciseId, sets, reps, duration, trackType }) =>
            trackType === 'time' ? { exerciseId, sets, duration, trackType } : { exerciseId, sets, reps, trackType }
        );

        if (routineEditingState.isEditing) {
            const routine = allData.routines.find(r => r.id === routineEditingState.id);
            if (routine) {
                routine.name = name;
                routine.exercises = exercisesToSave;
            }
        } else {
            allData.routines.push({ id: Date.now(), name, exercises: exercisesToSave });
        }
        App.utils.saveData();
        App.render.savedRoutines();
        App.handlers.resetRoutineForm();
    },

    resetRoutineForm() {
        App.elements.routineBuilder.form.reset();
        App.state.routineBuilderState = { exercises: [], selectedExerciseId: null };
        App.state.routineEditingState = { isEditing: false, id: null };
        App.elements.routineBuilder.editingIdInput.value = '';
        App.elements.routineBuilder.saveBtn.textContent = 'Save Routine';
        App.render.routineBuilderList();
    },

    startRoutine() {
        const id = parseInt(App.elements.dailyWorkout.routineSelect.value);
        const sourceRoutine = App.state.allData.routines.find(r => r.id === id);
        if (sourceRoutine) {
            const dateKey = App.utils.getFormattedDate(App.state.currentDate);
            const hydratedExercises = sourceRoutine.exercises.map(leanEx => {
                const fullEx = App.state.allData.exerciseDatabase.find(dbEx => dbEx.id === leanEx.exerciseId);
                return { ...fullEx, ...leanEx, instanceId: Date.now() + Math.random() };
            });
            const progress = hydratedExercises.map(ex => ({
                instanceId: ex.instanceId,
                setsCompleted: 0,
                loggedData: [],
                timer: { enabled: true, duration: 30 },
                stopwatch: { elapsedTime: 0, isRunning: false, startTime: 0 }
            }));
            const workoutToLog = { name: sourceRoutine.name, id: sourceRoutine.id, exercises: hydratedExercises };
            App.state.allData.history[dateKey] = { routine: workoutToLog, progress, isComplete: false, startTime: Date.now(), completionTime: null, notes: '' };
            App.utils.saveData();
            App.render.workoutPage();
        }
    },

    completeWorkout(isAutoFinish = false) {
        const dateKey = App.utils.getFormattedDate(App.state.currentDate);
        const workoutData = App.state.allData.history[dateKey];
        if (!workoutData || workoutData.isComplete) return;

        if (!workoutData.completionTime && workoutData.startTime) {
            workoutData.completionTime = Date.now() - workoutData.startTime;
        }
        workoutData.isComplete = true;
        this.closeStopwatchModal(true);
        App.utils.saveData();

        if (isAutoFinish) {
            App.elements.modals.workoutComplete.timeDisplay.textContent = App.utils.formatTotalTime(workoutData.completionTime);
            App.utils.openModal(App.elements.modals.workoutComplete.modal);
        } else {
            App.render.workoutPage();
        }
    },

    handleSetCompletion(instanceId) {
        const dateKey = App.utils.getFormattedDate(App.state.currentDate);
        const workoutData = App.state.allData.history[dateKey];
        if (!workoutData) return;

        const exerciseData = workoutData.routine.exercises.find(ex => ex.instanceId === instanceId);
        const progress = workoutData.progress.find(p => p.instanceId === instanceId);

        App.utils.saveData();
        App.render.workoutPage();

        const isExerciseComplete = progress.setsCompleted >= exerciseData.sets;
        const currentIndex = workoutData.routine.exercises.findIndex(ex => ex.instanceId === instanceId);
        const isLastExerciseInRoutine = currentIndex === workoutData.routine.exercises.length - 1;

        if (isExerciseComplete) {
            if (isLastExerciseInRoutine) {
                setTimeout(() => this.completeWorkout(true), 250);
            } else {
                const nextExercise = workoutData.routine.exercises[currentIndex + 1];
                this.startCountdown(60, nextExercise);
            }
        } else if (progress.timer.enabled) {
            this.startCountdown(progress.timer.duration);
        }
    },

    startCountdown(duration, nextExercise = null) {
        clearInterval(App.state.countdown.intervalId);
        App.state.countdown.initialDuration = duration;
        const { progressCircle } = App.elements.modals.countdown;
        progressCircle.style.transition = 'none';
        progressCircle.style.strokeDasharray = App.constants.CIRCLE_CIRCUMFERENCE;
        progressCircle.style.strokeDashoffset = 0;
        setTimeout(() => { progressCircle.style.transition = 'stroke-dashoffset 1s linear'; }, 50);

        const { label, nextName, nextDetails, nextInfo, display, modal } = App.elements.modals.countdown;
        if (nextExercise) {
            label.textContent = "Next Exercise";
            nextName.textContent = nextExercise.name;
            nextDetails.textContent = nextExercise.trackType === 'time' ? `${nextExercise.sets} sets × ${nextExercise.duration} sec` : `${nextExercise.sets} sets × ${nextExercise.reps} reps`;
            nextInfo.classList.remove('hidden');
        } else {
            label.textContent = "Break Time";
            nextInfo.classList.add('hidden');
        }

        let remaining = duration;
        display.textContent = remaining;
        App.utils.openModal(modal);

        App.state.countdown.intervalId = setInterval(() => {
            remaining--;
            const progress = Math.max(0, remaining / App.state.countdown.initialDuration);
            progressCircle.style.strokeDashoffset = App.constants.CIRCLE_CIRCUMFERENCE * (1 - progress);
            if (remaining >= 0) {
                display.textContent = remaining;
            } else {
                this.closeCountdownModal();
            }
        }, 1000);
    },

    closeCountdownModal() {
        clearInterval(App.state.countdown.intervalId);
        App.state.countdown.intervalId = null;
        App.utils.closeModal(App.elements.modals.countdown.modal);
    },
});