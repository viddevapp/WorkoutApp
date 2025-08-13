const ExercisesPage = (function() {
    // --- DOM Elements ---
    const page = document.getElementById('exercises-page');
    const mainScroll = page.querySelector('main');
    const form = document.getElementById('add-exercise-db-form');
    const editingIdInput = document.getElementById('db-editing-id');
    const nameInput = document.getElementById('db-exercise-name');
    const typeSelect = document.getElementById('db-exercise-type');
    const trackTypeSelect = document.getElementById('db-exercise-track-type');
    const imageInput = document.getElementById('db-exercise-image-input');
    const thumbnailContainer = document.getElementById('db-exercise-thumbnail-container');
    const submitBtn = document.getElementById('db-submit-btn');
    const cancelBtn = document.getElementById('db-cancel-edit-btn');
    const exerciseListDiv = document.getElementById('db-exercise-list');

    // --- State ---
    let state = {
        isEditing: false,
        id: null,
        currentImages: []
    };

    function validateForm() {
        const name = nameInput.value.trim();
        const type = typeSelect.value;
        const trackType = trackTypeSelect.value;
        submitBtn.disabled = !(name && type && trackType);
    }

    function renderThumbnails() {
        thumbnailContainer.innerHTML = '';
        state.currentImages.forEach((imgData, index) => {
            const item = document.createElement('div');
            item.className = 'thumbnail-item';
            item.innerHTML = `
                <img src="${imgData}" alt="Exercise thumbnail preview ${index + 1}">
                <button type="button" class="thumbnail-remove-btn" data-index="${index}">&times;</button>
            `;
            thumbnailContainer.appendChild(item);
        });
    }

    function resetForm() {
        form.reset();
        state = { isEditing: false, id: null, currentImages: [] };
        editingIdInput.value = '';
        renderThumbnails();
        submitBtn.textContent = 'Save to Exercise List';
        cancelBtn.classList.add('hidden');
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
                const firstImage = ex.images && ex.images.length > 0 ? ex.images[0] : null;
                const itemDiv = document.createElement('div');
                itemDiv.className = 'swipe-item-container';
                itemDiv.innerHTML = `
                    <div class="swipe-content">
                        ${firstImage ? `<img src="${firstImage}" alt="${ex.name}" class="db-item-thumbnail" data-id="${ex.id}">` : '<div class="db-item-thumbnail" style="background-color: var(--color-background);"></div>'}
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
                ex.images = state.currentImages;
                ex.trackType = trackType;
            }
        } else {
            const newEx = { id: Date.now(), name, type, images: state.currentImages, trackType };
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
                state.isEditing = true;
                state.id = id;
                state.currentImages = [...(ex.images || [])];
                editingIdInput.value = ex.id;
                nameInput.value = ex.name;
                typeSelect.value = ex.type;
                trackTypeSelect.value = ex.trackType || 'reps';
                renderThumbnails();
                submitBtn.textContent = 'Update Exercise';
                cancelBtn.classList.remove('hidden');
                validateForm();
                mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
                nameInput.focus();
                App.resetSwipe();
            }
        } else if (thumbnail) {
            const id = parseInt(thumbnail.dataset.id);
            const ex = DB.getExercises().find(e => e.id === id);
            if (ex && ex.images && ex.images.length > 0) {
                Modals.openImageViewer(ex.images);
            }
        }
    }

    async function handleImageUpload(event) {
        const files = event.target.files;
        if (files.length > 0) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';
            try {
                for (const file of files) {
                    const compressedDataUrl = await UI.compressImage(file);
                    state.currentImages.push(compressedDataUrl);
                }
                renderThumbnails();
            } catch (error) {
                console.error("Image compression failed:", error);
                alert("Could not process one or more images.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = state.isEditing ? 'Update Exercise' : 'Save to Exercise List';
                imageInput.value = '';
            }
        }
    }

    function init() {
        render();
        validateForm();
        form.addEventListener('submit', handleFormSubmit);
        form.addEventListener('input', validateForm);
        imageInput.addEventListener('change', handleImageUpload);
        cancelBtn.addEventListener('click', resetForm);
        
        thumbnailContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('thumbnail-remove-btn')) {
                const index = parseInt(e.target.dataset.index);
                state.currentImages.splice(index, 1);
                renderThumbnails();
            }
        });
        
        exerciseListDiv.addEventListener('click', handleListClick);
    }

    return {
        init
    };
})();