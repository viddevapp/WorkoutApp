document.addEventListener('DOMContentLoaded', () => {
    const addWorkoutBtn = document.getElementById('add-workout-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const addWorkoutFormContainer = document.getElementById('add-workout-form-container');
    const workoutsSection = document.getElementById('workouts-section');

    // Show the form when 'Add New Workout' is clicked
    addWorkoutBtn.addEventListener('click', () => {
        workoutsSection.classList.add('hidden');
        addWorkoutFormContainer.classList.remove('hidden');
    });

    // Hide the form when 'Cancel' is clicked
    cancelBtn.addEventListener('click', () => {
        addWorkoutFormContainer.classList.add('hidden');
        workoutsSection.classList.remove('hidden');
    });

    // We will add more functionality here in the next steps
});