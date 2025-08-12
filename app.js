document.addEventListener('DOMContentLoaded', () => {
    const pads = document.querySelectorAll('.pad');
    const fileInput = document.getElementById('sound-file-input');
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const padSounds = new Map(); // To store the audio buffer for each pad

    let pressTimer = null;
    let longPress = false;
    let activePad = null;

    pads.forEach((pad, index) => {
        const handlePressStart = () => {
            longPress = false;
            pressTimer = setTimeout(() => {
                longPress = true;
                activePad = pad;
                // On long press, open the file chooser
                fileInput.click();
            }, 500); // 500ms for a long press
        };

        const handlePressEnd = () => {
            clearTimeout(pressTimer);
            if (!longPress) {
                // This is a tap, play the sound
                playSound(pad);
            }
        };

        // For mouse users
        pad.addEventListener('mousedown', handlePressStart);
        pad.addEventListener('mouseup', handlePressEnd);
        pad.addEventListener('mouseleave', () => clearTimeout(pressTimer));

        // For touch screen users
        pad.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevents mouse events from firing
            handlePressStart();
        });
        pad.addEventListener('touchend', handlePressEnd);
    });

    // Handle the file selection
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && activePad) {
            const reader = new FileReader();

            reader.onload = (e) => {
                // Decode the audio file into a buffer
                audioContext.decodeAudioData(e.target.result, (buffer) => {
                    padSounds.set(activePad, buffer);
                    activePad.textContent = '🎵'; // Add an icon to show a sound is loaded
                });
            };

            reader.readAsArrayBuffer(file);
        }
        // Reset the input so the 'change' event fires even if the same file is selected
        event.target.value = null;
    });

    function playSound(pad) {
        const soundBuffer = padSounds.get(pad);
        if (soundBuffer) {
            const source = audioContext.createBufferSource();
            source.buffer = soundBuffer;
            source.connect(audioContext.destination);
            source.start(0);

            // Add a visual effect
            pad.classList.add('active');
            setTimeout(() => {
                pad.classList.remove('active');
            }, 100);
        }
    }
});