console.log("UI Script Loaded! Spawning letters...");

const bgWrap = document.getElementById('bg-wrap');
const chars = ['A', 'Ω', 'あ', '文', 'Ψ', 'ñ', 'ß', '£', 'ç', '¿', 'Ж', 'א', 'b', 'S', 'y', 'x', 'ø', 'µ', 'M', 'z', 'Q', 'R', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

function spawnLetter() {
    if (!bgWrap) return; // Stop if background element is missing

    const letter = document.createElement('div');
    letter.innerText = chars[Math.floor(Math.random() * chars.length)];
    letter.classList.add('falling-letter');

    // Randomize Position, Size, and Speed
    letter.style.left = Math.random() * 95 + 'vw';
    const size = Math.random() * 20 + 20; 
    letter.style.fontSize = size + 'px';
    const duration = Math.random() * 10 + 10; 
    letter.style.animationDuration = duration + 's';

    bgWrap.appendChild(letter);

    // Clean up to keep the browser fast
    setTimeout(() => {
        letter.remove();
    }, duration * 1000);
}

// Spawn a new letter every 2 seconds
setInterval(spawnLetter, 1000);

// Spawn a few immediately
for(let i=0; i<5; i++) spawnLetter();