let currentWord = "";
let score = 0;
let timeLeft = 60;
let timerInterval;

// Start the game
async function initGame() {
    score = 0;
    timeLeft = 60;
    document.getElementById('score-display').innerText = `Score: ${score}`;
    startTimer();
    loadNewQuestion();
}

// Load a new question
async function loadNewQuestion() {
    
    document.getElementById('definition-text').innerText = "Finding a word...";
    document.getElementById('user-input').value = ""; // Clear input box
    document.getElementById('feedback-msg').innerText = ""; // Clear old messages

    const data = await fetchWordData(); // Call function from api.js
    
    if (data) {
        currentWord = data.word;
        document.getElementById('definition-text').innerText = data.definition;
        console.log("Cheater! The answer is: " + currentWord); // For debugging
    } else {
        loadNewQuestion(); // If error, try again immediately
    }
}

// Check the User's Answer
function checkAnswer() {
    const userAns = document.getElementById('user-input').value.toLowerCase().trim();
    const feedback = document.getElementById('feedback-msg');

    if (userAns === currentWord) {
        // CORRECT!
        score += 10;
        document.getElementById('score-display').innerText = `Score: ${score}`;
        feedback.innerText = "Correct! +10 Points";
        feedback.className = "feedback correct"; // Makes it Green
        
        // Wait 1 second, then load next word
        setTimeout(loadNewQuestion, 1000);
    } else {
        // WRONG!
        feedback.innerText = "Try again!";
        feedback.className = "feedback wrong"; // Makes it Red
    }
}

// Simple Timer Logic
function startTimer() {
    clearInterval(timerInterval); // Stop any old timers
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer-display').innerText = `Time: ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}

function endGame() {
    document.getElementById('definition-text').innerText = "GAME OVER!";
    document.getElementById('feedback-msg').innerText = `Final Score: ${score}`;
}