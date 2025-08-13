const DB = (function() {
    let allData = {
        exerciseDatabase: [],
        routines: [],
        history: {},
        userGoals: { volume: 10000, sets: 25 }
    };

    const getFormattedDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    function saveDataToLocalStorage() {
        try {
            localStorage.setItem('workoutTrackerData', JSON.stringify(allData));
        } catch (error) {
            console.error("Could not save data", error);
            alert("Error saving data. Storage might be full.");
        }
    }

    // --- DATA MIGRATION ---
    function migrateData(data) {
        // Migration from single 'image' string to 'images' array
        if (data.exerciseDatabase && data.exerciseDatabase.length > 0) {
            let migrationNeeded = false;
            data.exerciseDatabase.forEach(ex => {
                if (typeof ex.image !== 'undefined' && ex.image !== null) {
                    if (!ex.images) {
                        ex.images = [];
                    }
                    if (ex.image) {
                        ex.images.push(ex.image);
                    }
                    delete ex.image;
                    migrationNeeded = true;
                } else if (!ex.images) {
                    ex.images = [];
                }
            });
            if (migrationNeeded) console.log("Data migration performed: 'image' property converted to 'images' array.");
        }
        
        // Hydrate old workout history with images array if missing
        if (data.history) {
             Object.values(data.history).forEach(day => {
                if(day.routine && day.routine.exercises) {
                    day.routine.exercises.forEach(ex => {
                        if (typeof ex.image !== 'undefined' && ex.image !== null) {
                            if (!ex.images) ex.images = [ex.image];
                            delete ex.image;
                        } else if (!ex.images) {
                            const dbEx = data.exerciseDatabase.find(db => db.id === ex.id);
                            ex.images = dbEx ? dbEx.images : [];
                        }
                    });
                }
            });
        }
        return data;
    }

    function loadDataFromLocalStorage() {
        const d = localStorage.getItem('workoutTrackerData');
        if (d) {
            try {
                let p = JSON.parse(d);
                if (p.exerciseDatabase && p.history && p.userGoals) {
                    allData = migrateData(p); // Apply migration
                    if (!allData.routines) allData.routines = [];
                }
            } catch (e) {
                console.error("Could not parse data", e);
            }
        }
    }

    function exportDataToFile() {
        try {
            const dataAsString = JSON.stringify(allData, null, 2);
            const blob = new Blob([dataAsString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `workout-tracker-backup-${getFormattedDate(new Date())}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Could not export data.");
        }
    }

    function importDataFromFile(event, callback) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (!importedData.exerciseDatabase || !importedData.history || !importedData.userGoals) {
                    throw new Error("Invalid data file format.");
                }
                if (confirm("This will overwrite all current data. Are you sure you want to proceed?")) {
                    allData = importedData;
                    saveDataToLocalStorage();
                    alert("Data imported successfully!");
                    if(callback) callback();
                }
            } catch (error) {
                alert('Error reading or parsing file. Please make sure you selected a valid backup file.');
                console.error(error);
            } finally {
                event.target.value = "";
            }
        };
        reader.readAsText(file);
    }

    // Public API
    return {
        load: loadDataFromLocalStorage,
        save: saveDataToLocalStorage,
        getData: () => allData,
        getExercises: () => allData.exerciseDatabase,
        getRoutines: () => allData.routines,
        getHistory: () => allData.history,
        exportData: exportDataToFile,
        importData: importDataFromFile,
        getFormattedDate: getFormattedDate,
    };
})();