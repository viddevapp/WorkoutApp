document.addEventListener('DOMContentLoaded', () => {
    // --- 1. STATE MANAGEMENT ---
    const allData = {
        exerciseDatabase: [],
        routines: [],
        history: {},
        userGoals: { volume: 10000, sets: 25 }
    };

    const appState = {
        currentDate: new Date(),
        currentPage: 'workout-page',
        currentExerciseImage: null,
        dbEditingState: { isEditing: false, id: null },
        routineEditingState: { isEditing: false, id: null },
        routineBuilderState: { exercises: [] },
        timers: {
            countdown: { id: null, initialDuration: 0 },
            stopwatch: { id: null, instanceId: null }
        },
        sortables: {
            routineBuilder: null,
            dailyWorkout: null,
            savedRoutines: null
        },
        swipeState: {
            openCardContent: null,
            instanceIdToSwap: null,
            instanceIdToEdit: null,
            isSwiping: false,
            touchStartX: 0,
            touchCurrentX: 0,
            touchStartY: 0,
            swipeTarget: null,
            swipeDirection: null,
        }
    };

    // --- 2. DOM ELEMENT REFERENCES ---
    const DOMElements = {
        appContainer: document.getElementById('app-container'),
        pages: document.querySelectorAll('.page'),
        navButtons: document.querySelectorAll('.nav-btn'),
        // ... (other frequently accessed elements)
    };

    // Helper to get element by ID
    const getEl = (id) => document.getElementById(id);

    // --- 3. CORE HELPER & UTILITY FUNCTIONS ---
    const getFormattedDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const saveData = () => localStorage.setItem('workoutTrackerData', JSON.stringify(allData));
    const loadData = () => {
        const data = localStorage.getItem('workoutTrackerData');
        if (!data) return;
        try {
            const parsed = JSON.parse(data);
            if (parsed.exerciseDatabase && parsed.history && parsed.userGoals) {
                Object.assign(allData, parsed);
                if (!allData.routines) allData.routines = [];
            }
        } catch (e) {
            console.error("Could not parse stored data", e);
        }
    };

    // --- 4. PAGE & MODAL MANAGEMENT ---
    const showPage = (pageId) => {
        appState.currentPage = pageId;
        DOMElements.pages.forEach(p => p.classList.toggle('active', p.id === pageId));
        DOMElements.navButtons.forEach(b => b.classList.toggle('active', b.dataset.page === pageId));
        closeStopwatchModal(true); // Close stopwatch when changing pages
        renderCurrentPage();
    };

    const openModal = (modalId) => getEl(modalId).classList.remove('hidden');
    const closeModal = (modalIdOrElement) => {
        const modal = typeof modalIdOrElement === 'string' ? getEl(modalIdOrElement) : modalIdOrElement;
        if(modal) modal.classList.add('hidden');
    };

    // --- 5. RENDERING ---
    // This section would contain all the `render...` functions.
    // They should be refactored to create DOM elements instead of using innerHTML strings.
    // Example refactor for one function:
    const renderExerciseDatabase = () => {
        const listDiv = getEl('db-exercise-list');
        listDiv.innerHTML = ''; // Clear existing list

        if (allData.exerciseDatabase.length === 0) {
            listDiv.innerHTML = `<div class="placeholder-card">Your exercise list is empty. Add one above to get started.</div>`;
            return;
        }

        const exercisesByType = allData.exerciseDatabase.reduce((acc, ex) => {
            const type = ex.type || 'Uncategorized';
            if (!acc[type]) acc[type] = [];
            acc[type].push(ex);
            return acc;
        }, {});

        Object.keys(exercisesByType).sort().forEach(type => {
            const groupCard = document.createElement('div');
            groupCard.className = 'card exercise-group-card';
            
            const header = document.createElement('h3');
            header.textContent = type;
            groupCard.appendChild(header);

            const listContainer = document.createElement('div');
            listContainer.className = 'exercise-group-list';

            exercisesByType[type].sort((a, b) => a.name.localeCompare(b.name)).forEach(ex => {
                listContainer.appendChild(createExerciseDBItem(ex));
            });
            
            groupCard.appendChild(listContainer);
            listDiv.appendChild(groupCard);
        });
    };
    
    // Element Creation Helper
    const createExerciseDBItem = (ex) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'swipe-item-container';
        itemDiv.innerHTML = `
            <div class="swipe-content" data-id="${ex.id}">
                ${ex.image ? `<img src="${ex.image}" alt="${ex.name}" class="db-item-thumbnail" data-action="view-image" data-id="${ex.id}">` : '<div class="db-item-thumbnail" style="background-color: var(--color-background);"></div>'}
                <div class="exercise-item-main">
                    <span class="exercise-item-name">${ex.name}</span>
                    <small class="exercise-item-stats">${ex.trackType || 'reps'}</small>
                </div>
            </div>
            <div class="swipe-actions">
                <button class="swipe-action-btn edit" data-action="edit-db-exercise" data-id="${ex.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"/><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"/></svg>
                    <span>Edit</span>
                </button>
                <button class="swipe-action-btn delete" data-action="delete-db-exercise" data-id="${ex.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd"/></svg>
                    <span>Delete</span>
                </button>
            </div>`;
        return itemDiv;
    };
    
    // Note: All other render functions would be similarly refactored.
    // This is a partial example to show the pattern.
    const renderCurrentPage = () => {
        // A simplified version of the original function
        // The full implementation would be here
        if (appState.currentPage === 'exercises-page') {
            renderExerciseDatabase();
        }
        // ... and so on for other pages
    };


    // --- 6. EVENT HANDLERS & ACTIONS ---
    const actionHandlers = {
        'show-page': (target) => showPage(target.dataset.page),
        'change-date': (target) => {
            const days = parseInt(target.dataset.days, 10);
            appState.currentDate.setDate(appState.currentDate.getDate() + days);
            // Must re-render the workout page
            renderCurrentPage();
        },
        'go-to-today': () => {
            appState.currentDate = new Date();
            renderCurrentPage();
        },
        'delete-db-exercise': (target) => {
             if (!confirm('Are you sure you want to permanently delete this item?')) return;
             const id = parseInt(target.dataset.id);
             allData.exerciseDatabase = allData.exerciseDatabase.filter(ex => ex.id !== id);
             if (appState.dbEditingState.id === id) { /* resetDbForm(); */ }
             saveData();
             renderExerciseDatabase();
        },
        // Add all other actions here...
        'close-modal': (target) => {
            const modal = target.closest('.modal');
            if (modal) closeModal(modal);
        },
    };

    DOMElements.appContainer.addEventListener('click', (e) => {
        const actionTarget = e.target.closest('[data-action]');
        if (!actionTarget) return;

        const action = actionTarget.dataset.action;
        if (actionHandlers[action]) {
            e.preventDefault();
            actionHandlers[action](actionTarget);
        }
    });

    // --- 7. SWIPE LOGIC ---
    // The swipe handling logic would be placed here, refactored to use appState.swipeState
    // instead of global variables. The logic itself is complex and remains largely the same.
    const resetSwipeState = () => {
        if (appState.swipeState.openCardContent) {
            appState.swipeState.openCardContent.style.transform = 'translateX(0px)';
        }
        Object.assign(appState.swipeState, {
            openCardContent: null, isSwiping: false, touchStartX: 0,
            touchCurrentX: 0, touchStartY: 0, swipeTarget: null, swipeDirection: null,
        });
    };
    // The rest of the touchstart, touchmove, touchend listeners would follow...
    
    // --- 8. INITIALIZATION ---
    const initializeApp = () => {
        loadData();
        showPage('workout-page');
        // Initialize sortableJS, forms, etc.
        // validateDbForm();
        // validateRoutineForm();
        // initSortables();
    };

    initializeApp();
});