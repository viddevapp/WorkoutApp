const App = (function() {
    // --- DOM Elements ---
    const appContainer = document.getElementById('app-container');
    const navButtons = document.querySelectorAll('.nav-btn');
    const actionsMenuBtn = document.getElementById('actions-menu-btn');
    const actionsDropdown = document.getElementById('actions-dropdown');
    const importDataBtn = document.getElementById('import-data-btn');
    const exportDataBtn = document.getElementById('export-data-btn');
    const fileLoaderInput = document.getElementById('file-loader');

    // --- Swipe State ---
    let swipeState = {
        touchStartX: 0, touchStartY: 0, touchCurrentX: 0,
        swipeTarget: null, isSwiping: false, openCardContent: null,
        SWIPE_ACTION_WIDTH: 160,
        SWIPE_ACTION_WIDTH_WORKOUT: 240,
    };
    
    function showPage(pageId) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        navButtons.forEach(b => b.classList.remove('active'));
        
        const page = document.getElementById(pageId);
        const navBtn = document.getElementById(`nav-${pageId.split('-')[0]}`);
        if(page) page.classList.add('active');
        if(navBtn) navBtn.classList.add('active');

        resetSwipe();
        Modals.closeStopwatch(true);

        switch (pageId) {
            case 'workout-page':
                WorkoutPage.init();
                break;
            case 'routines-page':
                RoutinesPage.init();
                break;
            case 'exercises-page':
                ExercisesPage.init();
                break;
        }
    }

    function resetSwipe() {
        if (swipeState.openCardContent) {
            swipeState.openCardContent.style.transform = 'translateX(0px)';
        }
        Object.assign(swipeState, {
            touchStartX: 0, touchStartY: 0, touchCurrentX: 0,
            swipeTarget: null, isSwiping: false, openCardContent: null
        });
    }

    function handleTouchStart(e) {
        const target = e.target.closest('.swipe-content');
        if (!target || e.target.closest('.routine-builder-item')) return;
        if (swipeState.openCardContent && swipeState.openCardContent !== target) {
            resetSwipe();
        }
        swipeState.swipeTarget = target;
        swipeState.touchStartX = e.touches[0].clientX;
        swipeState.touchStartY = e.touches[0].clientY;
        swipeState.swipeTarget.style.transition = 'none';
    }

    function handleTouchMove(e) {
        if (!swipeState.swipeTarget) return;

        swipeState.touchCurrentX = e.touches[0].clientX;
        const diffX = swipeState.touchCurrentX - swipeState.touchStartX;
        const diffY = e.touches[0].clientY - swipeState.touchStartY;

        if (!swipeState.isSwiping && Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) {
            swipeState.isSwiping = true;
        }
        
        if (swipeState.isSwiping) {
            e.preventDefault(); // Prevent vertical scroll while swiping
            const SWIPE_WIDTH = swipeState.swipeTarget.closest('#active-routine-display') ? swipeState.SWIPE_ACTION_WIDTH_WORKOUT : swipeState.SWIPE_ACTION_WIDTH;
            let transformX = 0;
            if (swipeState.openCardContent === swipeState.swipeTarget) { // If it was already open
                transformX = Math.min(0, -SWIPE_WIDTH + diffX);
            } else { // If swiping a new card
                if (diffX < 0) transformX = Math.max(-SWIPE_WIDTH, diffX);
            }
            swipeState.swipeTarget.style.transform = `translateX(${transformX}px)`;
        }
    }
    
    function handleTouchEnd(e) {
        if (!swipeState.swipeTarget || !swipeState.isSwiping) {
            resetSwipe();
            return;
        }
        
        const diffX = swipeState.touchCurrentX - swipeState.touchStartX;
        swipeState.swipeTarget.style.transition = 'transform 0.3s ease-out';
        const SWIPE_WIDTH = swipeState.swipeTarget.closest('#active-routine-display') ? swipeState.SWIPE_ACTION_WIDTH_WORKOUT : swipeState.SWIPE_ACTION_WIDTH;
        
        const wasOpen = swipeState.openCardContent === swipeState.swipeTarget;
        if (wasOpen) {
            if (diffX > 60) {
                swipeState.swipeTarget.style.transform = 'translateX(0px)';
                swipeState.openCardContent = null;
            } else {
                swipeState.swipeTarget.style.transform = `translateX(${-SWIPE_WIDTH}px)`;
            }
        } else {
            if (diffX < -60) {
                swipeState.swipeTarget.style.transform = `translateX(${-SWIPE_WIDTH}px)`;
                swipeState.openCardContent = swipeState.swipeTarget;
            } else {
                swipeState.swipeTarget.style.transform = 'translateX(0px)';
            }
        }
        // Reset flags for next interaction
        swipeState.swipeTarget = null;
        swipeState.isSwiping = false;
    }
    
    function init() {
        DB.load();
        Modals.init();

        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const pageId = btn.id.replace('nav-', '') + '-page';
                showPage(pageId);
            });
        });

        // Global event listeners
        actionsMenuBtn.addEventListener('click', () => actionsDropdown.classList.toggle('hidden'));
        document.addEventListener('click', e => {
            if (!actionsMenuBtn.contains(e.target) && !actionsDropdown.contains(e.target)) {
                actionsDropdown.classList.add('hidden');
            }
             if (e.target.classList.contains('modal-overlay')) {
                UI.closeAllModals();
                Modals.closeCountdownModal();
                Modals.closeStopwatch(true);
            }
            // Close swipe card if clicking outside
            if (swipeState.openCardContent && !swipeState.openCardContent.parentElement.contains(e.target)) {
                resetSwipe();
            }
        });

        exportDataBtn.addEventListener('click', () => { DB.exportData(); actionsDropdown.classList.add('hidden'); });
        importDataBtn.addEventListener('click', () => { fileLoaderInput.click(); actionsDropdown.classList.add('hidden'); });
        fileLoaderInput.addEventListener('change', (e) => DB.importData(e, () => {
            showPage('workout-page');
        }));

        // Touch events for swipe
        appContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
        appContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
        appContainer.addEventListener('touchend', handleTouchEnd);

        // Initial page load
        showPage('workout-page');
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        resetSwipe: resetSwipe
    };
})();