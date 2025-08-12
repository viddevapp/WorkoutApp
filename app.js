document.addEventListener('DOMContentLoaded', () => {
    const drumMachine = document.querySelector('.drum-machine');
    const pads = document.querySelectorAll('.pad');
    const fileInput = document.getElementById('sound-file-input');
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const padSounds = new Map();

    // --- NEW: The Fix for Browser UI ---
    const setAppHeight = () => {
        // Measure the actual inner height of the window (excluding browser UI)
        // and set it as the height of our drum machine container.
        drumMachine.style.height = `${window.innerHeight}px`;
    };

    // Set the height initially on load
    setAppHeight();

    // Reset the height whenever the window is resized (e.g., orientation change, address bar appears/hides)
    window.addEventListener('resize', setAppHeight);
    // --- End of New Code ---

    pads.forEach(pad => {
        let pressTimer = null;

        const handlePressStart = (event) => {
            event.preventDefault();
            pressTimer = setTimeout(() => {
                fileInput.onchange = (e) => handleFileSelection(e, pad);
                fileInput.click();
                pressTimer = null;
            }, 500);
        };

        const handlePressEnd = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                playSound(pad);
            }
        };

        pad.addEventListener('mousedown', handlePressStart);
        pad.addEventListener('mouseup', handlePressEnd);
        pad.addEventListener('mouseleave', () => clearTimeout(pressTimer));
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
                    selectedPad.textContent = '●';
                })
                .catch(err => console.error("Error decoding audio file", err));
        };
        reader.readAsArrayBuffer(file);
        event.target.value = null;
    };

    function playSound(pad) {
        const soundBuffer = padSounds.get(pad);
        if (soundBuffer) {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            const source = audioContext.createBufferSource();
            source.buffer = soundBuffer;
            source.connect(audioContext.destination);
            source.start(0);

            pad.classList.add('active');
            source.onended = () => {
                pad.classList.remove('active');
            };
        }
    }
});