const ExercisesPage = (function() {
    // --- DOM Elements ---
    const page = document.getElementById('exercises-page');
    const form = document.getElementById('add-exercise-db-form');
    const editingIdInput = document.getElementById('db-editing-id');
    const nameInput = document.getElementById('db-exercise-name');
    const typeSelect = document.getElementById('db-exercise-type');
    const trackTypeSelect = document.getElementById('db-exercise-track-type');
    const imageInput = document.getElementById('db-exercise-image-input');
    const thumbnail = document.getElementById('db-exercise-thumbnail');
    const removeImageBtn = document.getElementById('remove-db-image-btn');
    const submitBtn = document.getElementById('db-submit-btn');
    const exerciseListDiv = document.getElementById('db-exercise-list');
    const imageViewerModal = document.getElementById('image-viewer-modal');
    const fullSizeImage = document.getElementById('full-size-image');

    // --- State ---
    let state = {
        isEditing: false,
        id: null,
        currentImage: null
    };

    function validateForm() {
        const name = nameInput.value.trim();
        const type = typeSelect.value;
        const trackType = trackTypeSelect.value;
        submitBtn.disabled = !(name && type && trackType);
    }

    function resetForm() {
        form.reset();
        state = { isEditing: false, id: null, currentImage: null };
        editingIdInput.value = '';
        thumbnail.classList.add('hidden');
        removeImageBtn.classList.add('hidden');
        thumbnail.src = '';
        submitBtn.textContent = 'Save to Exercise List';
        validateForm();
    }
    
    function render() {
        const exercises = DB.getExercises();
        exerciseListDiv.innerHTML = '';
        if (exercises.length === 0) {
            exerciseListDiv.innerHTML = `<div class="placeholder-card">Your exercise list is empty. Add one above to get started.</div>`;
            return;
        }

        const exercisesByType = exercises.reduce((acc, ex) => {
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

            const sortedDb = exercisesByType[type].sort((a, b) => a.name.localeCompare(b.name));

            sortedDb.forEach(ex => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'swipe-item-container';
                itemDiv.innerHTML = `
                    <div class="swipe-content">
                        ${ex.image ? `<img src="${ex.image}" alt="${ex.name}" class="db-item-thumbnail" data-id="${ex.id}">` : '<div class="db-item-thumbnail" style="background-color: var(--color-background);"></div>'}
                        <div class="exercise-item-main">
                            <span class="exercise-item-name">${ex.name}</span>
                            <small class="exercise-item-stats">${ex.trackType || 'reps'}</small>
                        </div>
                    </div>
                    <div class="swipe-actions">
                        <button class="swipe-action-btn swipe-edit-btn" data-id="${ex.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM5 13V5a2 2 0 00-2-2H2a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-1H5z"/></svg>
                            <span>Edit</span>
                        </button>
                        <button class="swipe-action-btn swipe-delete-btn" data-id="${ex.id}">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd"/></svg>
                            <span>Delete</span>
                        </button>
                    </div>`;
                listContainer.appendChild(itemDiv);
            });
            groupCard.appendChild(listContainer);
            exerciseListDiv.appendChild(groupCard);
        });
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        const name = nameInput.value.trim();
        const type = typeSelect.value;
        const trackType = trackTypeSelect.value;
        const allExercises = DB.getExercises();

        if (state.isEditing) {
            const ex = allExercises.find(e => e.id === state.id);
            if (ex) {
                ex.name = name;
                ex.type = type;
                ex.image = state.currentImage;
                ex.trackType = trackType;
            }
        } else {
            const newEx = { id: Date.now(), name, type, image: state.currentImage, trackType };
            allExercises.push(newEx);
        }
        DB.save();
        render();
        resetForm();
    }
    
    function handleListClick(e) {
        const deleteBtn = e.target.closest('.swipe-delete-btn');
        const editBtn = e.target.closest('.swipe-edit-btn');
        const thumbnail = e.target.closest('.db-item-thumbnail');
        
        if (deleteBtn) {
            const id = parseInt(deleteBtn.dataset.id);
            if (confirm('Are you sure you want to permanently delete this item?')) {
                const allExercises = DB.getExercises();
                const updatedExercises = allExercises.filter(ex => ex.id !== id);
                DB.getData().exerciseDatabase = updatedExercises;
                if (state.id === id) resetForm();
                DB.save();
                render();
                App.resetSwipe();
            }
        } else if (editBtn) {
            const id = parseInt(editBtn.dataset.id);
            const ex = DB.getExercises().find(e => e.id === id);
            if (ex) {
                resetForm();
                state = { isEditing: true, id: id, currentImage: ex.image };
                editingIdInput.value = ex.id;
                nameInput.value = ex.name;
                typeSelect.value = ex.type;
                trackTypeSelect.value = ex.trackType || 'reps';
                if (ex.image) {
                    thumbnail.src = ex.image;
                    thumbnail.classList.remove('hidden');
                    removeImageBtn.classList.remove('hidden');
                }
                submitBtn.textContent = 'Update Exercise';
                validateForm();
                page.querySelector('main').scrollTo(0, 0);
                nameInput.focus();
                App.resetSwipe();
            }
        } else if (thumbnail) {
            const id = parseInt(thumbnail.dataset.id);
            const ex = DB.getExercises().find(e => e.id === id);
            if (ex && ex.image) {
                fullSizeImage.src = ex.image;
                UI.openModal(imageViewerModal);
            }
        }
    }

    async function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            try {
                const compressedDataUrl = await UI.compressImage(file);
                state.currentImage = compressedDataUrl;
                thumbnail.src = compressedDataUrl;
                thumbnail.classList.remove('hidden');
                removeImageBtn.classList.remove('hidden');
            } catch (error) {
                console.error("Image compression failed:", error);
                alert("Could not process image.");
            }
        }
    }

    function init() {
        render();
        validateForm();
        form.addEventListener('submit', handleFormSubmit);
        form.addEventListener('input', validateForm);
        imageInput.addEventListener('change', handleImageUpload);
        removeImageBtn.addEventListener('click', () => {
            state.currentImage = null;
            imageInput.value = '';
            thumbnail.classList.add('hidden');
            removeImageBtn.classList.add('hidden');
        });
        exerciseListDiv.addEventListener('click', handleListClick);
        fullSizeImage.addEventListener('click', () => UI.closeModal(imageViewerModal));
    }

    // Public API
    return {
        init,
        render,
        resetForm
    };
})();