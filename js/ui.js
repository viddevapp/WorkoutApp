const UI = (function() {

    function openModal(modalElement) {
        modalElement.classList.remove('hidden');
    }

    function closeModal(modalElement) {
        if(modalElement) modalElement.classList.add('hidden');
    }

    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(closeModal);
    }

    function formatStopwatchTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        const milliseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
        return `${minutes}:${seconds}.${milliseconds}`;
    }

    function formatTotalTime(ms) {
        if (ms === null || isNaN(ms) || ms < 0) return 'N/A';
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        let parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds >= 0 && parts.length < 2) parts.push(`${seconds}s`);
        if (parts.length === 0) return '0s';
        return parts.join(' ');
    }
    
    function compressImage(file, maxWidth = 600, maxHeight = 600, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = error => reject(error);
            };
            reader.onerror = error => reject(error);
        });
    }

    function populateExerciseDropdown(selectElement, prompt) {
        const exercises = DB.getExercises();
        const currentValue = selectElement.value;
        selectElement.innerHTML = `<option value="" disabled selected>${prompt}</option>`;
        
        const exercisesByType = exercises.reduce((acc, ex) => {
            const type = ex.type || 'Uncategorized';
            if (!acc[type]) acc[type] = [];
            acc[type].push(ex);
            return acc;
        }, {});
    
        Object.keys(exercisesByType).sort().forEach(type => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = type;
            
            const sortedExercises = exercisesByType[type].sort((a, b) => a.name.localeCompare(b.name));
            
            sortedExercises.forEach(ex => {
                const o = document.createElement('option');
                o.value = ex.id;
                o.textContent = ex.name;
                optgroup.appendChild(o);
            });
            selectElement.appendChild(optgroup);
        });
        selectElement.value = currentValue;
    }


    // Public API
    return {
        openModal,
        closeModal,
        closeAllModals,
        formatStopwatchTime,
        formatTotalTime,
        compressImage,
        populateExerciseDropdown,
    };
})();