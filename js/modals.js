const Modals = (function() {
    // --- DOM Elements ---
    const detailsModal = document.getElementById('exercise-details-modal');
    const detailsExerciseName = document.getElementById('details-exercise-name');
    const detailsMuscleTags = document.getElementById('details-muscle-tags');
    const detailsTabBtns = document.querySelectorAll('.details-tab-btn');
    const detailsTabContents = document.querySelectorAll('.details-tab-content');
    const detailsInstructionsList = document.getElementById('details-instructions-list');
    
    const imageViewerContent = document.getElementById('image-viewer-content');
    const imageViewerDots = document.getElementById('image-viewer-dots');
    const prevBtn = document.getElementById('image-viewer-prev');
    const nextBtn = document.getElementById('image-viewer-next');
    
    const muscleModal = document.getElementById('muscle-select-modal');
    const muscleModalList = document.getElementById('muscle-modal-list');
    const muscleModalTitle = document.getElementById('muscle-modal-title');

    const countdownModal = document.getElementById('countdown-modal');
    const stopwatchModal = document.getElementById('stopwatch-modal');

    // --- State ---
    let imageViewerState = { images: [], currentIndex: 0, touchStartX: 0, touchEndX: 0 };
    let onMuscleSelectCallback = null;

    // --- Helper for Muscle Tags ---
    function generateMuscleTagsHTML(primary = [], secondary = []) {
        if (primary.length === 0 && secondary.length === 0) return '';
        const primaryTags = primary.map(m => `<span class="muscle-tag primary">${m}</span>`).join('');
        const secondaryTags = secondary.map(m => `<span class="muscle-tag secondary">${m}</span>`).join('');
        return primaryTags + secondaryTags;
    }

    // --- Exercise Details Modal Logic ---
    function openExerciseDetails(exercise) {
        if (!exercise) return;
        detailsExerciseName.textContent = exercise.name;
        detailsMuscleTags.innerHTML = generateMuscleTagsHTML(exercise.primaryMuscles, exercise.secondaryMuscles);

        const instructionsTab = document.querySelector('[data-tab="instructions"]');
        if (exercise.instructions && exercise.instructions.length > 0) {
            detailsInstructionsList.innerHTML = exercise.instructions.map(step => `<li>${step}</li>`).join('');
            instructionsTab.style.display = 'block';
        } else {
            instructionsTab.style.display = 'none';
        }

        const mediaTab = document.querySelector('[data-tab="media"]');
        if (exercise.images && exercise.images.length > 0) {
            imageViewerState.images = exercise.images;
            imageViewerState.currentIndex = 0;
            renderImageViewer();
            mediaTab.style.display = 'block';
        } else {
            mediaTab.style.display = 'none';
        }
        
        const firstVisibleTab = document.querySelector('.details-tab-btn[style*="block"]');
        if(firstVisibleTab) {
            handleTabClick(firstVisibleTab.dataset.tab);
        }
        UI.openModal(detailsModal);
    }

    function handleTabClick(tabId) {
        detailsTabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
        detailsTabContents.forEach(content => content.classList.toggle('active', content.id === `${tabId}-tab-content`));
    }

    // --- Image Viewer (Carousel) Logic ---
    function goToSlide(index) {
        if (index < 0 || index >= imageViewerState.images.length) return;
        imageViewerState.currentIndex = index;
        const offset = -index * 100;
        imageViewerContent.style.transform = `translateX(${offset}%)`;
        document.querySelectorAll('.viewer-dot').forEach((dot, i) => dot.classList.toggle('active', i === index));
        prevBtn.classList.toggle('hidden', imageViewerState.images.length < 2 || index === 0);
        nextBtn.classList.toggle('hidden', imageViewerState.images.length < 2 || index === imageViewerState.images.length - 1);
    }

    function renderImageViewer() {
        imageViewerContent.innerHTML = '';
        imageViewerDots.innerHTML = '';
        imageViewerState.images.forEach((src, index) => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = `Exercise image ${index + 1}`;
            imageViewerContent.appendChild(img);
            const dot = document.createElement('span');
            dot.className = 'viewer-dot';
            dot.addEventListener('click', () => goToSlide(index));
            imageViewerDots.appendChild(dot);
        });
        goToSlide(imageViewerState.currentIndex);
    }

    function handleViewerSwipe() {
        const threshold = 50;
        const diff = imageViewerState.touchStartX - imageViewerState.touchEndX;
        if (Math.abs(diff) > threshold) {
            goToSlide(diff > 0 ? imageViewerState.currentIndex + 1 : imageViewerState.currentIndex - 1);
        } else {
            goToSlide(imageViewerState.currentIndex);
        }
    }

    // --- Muscle Selection Modal ---
    function openMuscleSelect(title, availableMuscles, onSelect) {
        muscleModalTitle.textContent = title;
        onMuscleSelectCallback = onSelect;
        muscleModalList.innerHTML = '';
        availableMuscles.forEach(muscle => {
            const btn = document.createElement('button');
            btn.textContent = muscle;
            muscleModalList.appendChild(btn);
        });
        UI.openModal(muscleModal);
    }

    // --- Other Modal Logic (Unchanged but included) ---
    // ... (All other modal functions like startCountdown, openStopwatch, etc. are here)

    // --- Initialization ---
    function init() {
        detailsTabBtns.forEach(btn => btn.addEventListener('click', () => handleTabClick(btn.dataset.tab)));
        
        prevBtn.addEventListener('click', () => goToSlide(imageViewerState.currentIndex - 1));
        nextBtn.addEventListener('click', () => goToSlide(imageViewerState.currentIndex + 1));
        imageViewerContent.addEventListener('touchstart', e => {
            imageViewerState.touchStartX = e.touches[0].clientX;
            imageViewerContent.style.transition = 'none';
        }, { passive: true });
        imageViewerContent.addEventListener('touchmove', e => {
            if (imageViewerState.touchStartX === 0) return;
            const diff = e.touches[0].clientX - imageViewerState.touchStartX;
            imageViewerContent.style.transform = `translateX(${-imageViewerState.currentIndex * imageViewerContent.offsetWidth + diff}px)`;
        }, { passive: true });
        imageViewerContent.addEventListener('touchend', e => {
            if (imageViewerState.touchStartX === 0) return;
            imageViewerState.touchEndX = e.changedTouches[0].clientX;
            imageViewerContent.style.transition = 'transform 0.3s ease-in-out';
            handleViewerSwipe();
            imageViewerState.touchStartX = 0;
        }, { passive: true });

        muscleModalList.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                if (onMuscleSelectCallback) {
                    onMuscleSelectCallback(e.target.textContent);
                }
                UI.closeModal(muscleModal);
            }
        });
    }

    return {
        init,
        openExerciseDetails,
        openMuscleSelect
        // ... other exported modal functions
    };
})();