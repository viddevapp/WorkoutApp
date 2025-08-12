document.addEventListener('DOMContentLoaded', () => {
    const pads = document.querySelectorAll('.pad');
    const fileInput = document.getElementById('sound-file-input');
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const padSounds = new Map(); // Stores the audio buffer for each pad

    pads.forEach(pad => {
        // Each pad gets its own timer variable. This is the key to the fix.
        let pressTimer = null;

        const handlePressStart = (event) => {
            // Prevent default actions, especially on touch screens (like scrolling)
            event.preventDefault();
            
            // Start a timer for this specific pad
            pressTimer = setTimeout(() => {
                // If timer completes, it's a long press.
                // Open the file chooser for this pad.
                fileInput.onchange = (e) => handleFileSelection(e, pad);
                fileInput.click();
                pressTimer = null; // Clear timer after firing
            }, 500); // 500ms threshold for a long press
        };

        const handlePressEnd = () => {
            // If the timer is still active when the user releases, it's a tap.
            if (pressTimer) {
                clearTimeout(pressTimer);
                playSound(pad);
            }
        };

        // Assign events for both mouse and touch input
        pad.addEventListener('mousedown', handlePressStart);
        pad.addEventListener('mouseup', handlePressEnd);
        pad.addEventListener('mouseleave', () => clearTimeout(pressTimer)); // Cancel if mouse leaves pad

        pad.addEventListener('touchstart', handlePressStart);
        pad.addEventListener('touchend', handlePressEnd);
    });

    const handleFileSelection = (event, selectedPad) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            audioContext.decodeAudioData(e.target.result)
                .then(buffer => {
                    padSounds.set(selectedPad, buffer);
                    selectedPad.textContent = '●'; // Indicate a sound is loaded
                })
                .catch(err => console.error("Error decoding audio file", err));
        };
        reader.readAsArrayBuffer(file);
        
        // Reset the input to allow selecting the same file again
        event.target.value = null;
    };

    function playSound(pad) {
        const soundBuffer = padSounds.get(pad);
        if (soundBuffer) {
            // Ensure audio context is running (required by modern browsers)
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            const source = audioContext.createBufferSource();
            source.buffer = soundBuffer;
            source.connect(audioContext.destination);
            source.start(0);

            // Add a visual effect for feedback
            pad.classList.add('active');
            source.onended = () => {
                pad.classList.remove('active');
            };
        }
    }
});