document.addEventListener('DOMContentLoaded', () => {

    // ======================================================
    // 1. HELPER FUNCTIONS
    
    // Function to update the profile picture
    function updateAvatarImage(seed) {
        const img = document.getElementById('user-avatar-img');
        if(img) img.src = `https://api.dicebear.com/9.x/micah/svg?seed=${seed}`;
    }

    // Function to update score and badge
    function updateSidebarStats(score, quizzes) {
        if(document.getElementById('user-score')) document.getElementById('user-score').innerText = score;
        if(document.getElementById('user-quizzes')) document.getElementById('user-quizzes').innerText = quizzes;
        
        // Badge Logic
        const badgeEl = document.getElementById('user-badge');
        if(badgeEl) {
            let badgeName = "🐣 Novice";
            if (score > 100) badgeName = "🐛 Bookworm";
            if (score > 300) badgeName = "🎓 Scholar";
            if (score > 600) badgeName = "🧠 Mastermind";
            if (score > 1000) badgeName = "👑 Lexicon Legend";
            badgeEl.innerText = badgeName;
        }

        // Leaderboard Update
        const leaderboardList = document.getElementById('leaderboard-list');
        if(leaderboardList && leaderboardList.lastElementChild) {
            leaderboardList.lastElementChild.innerHTML = `3. You - <span style="color: #D5BB93">${score}</span>`;
        }
    }

    // Function to Open Avatar Modal
    function openAvatarModal() {
        const avatarModal = document.getElementById('avatar-modal');
        const avatarGrid = document.getElementById('avatar-grid');
        
        if(avatarModal) {
            avatarModal.classList.remove('hidden');
            avatarModal.style.display = 'flex'; // Force visible
            
            // Generate Grid
            const seeds = ["Felix", "Aneka", "Midnight", "Jack", "Bella", "Coco", "Max", "Luna", "Zoey", "Boots", "Oliver", "Gizmo"];
            if(avatarGrid) {
                avatarGrid.innerHTML = '';
                seeds.forEach(seed => {
                    const img = document.createElement('img');
                    img.src = `https://api.dicebear.com/9.x/micah/svg?seed=${seed}`;
                    img.className = "avatar-option";
                    img.style.cssText = "width: 70px; height: 70px; margin: 8px; cursor: pointer; border-radius: 50%; border: 2px solid #2a3b5a; transition: transform 0.2s;";
                    
                    img.onmouseover = () => img.style.transform = "scale(1.1)";
                    img.onmouseout = () => img.style.transform = "scale(1)";
                    
                    img.onclick = (e) => {
                        e.stopPropagation();
                        // Update Data
                        let user = JSON.parse(localStorage.getItem('user')) || {};
                        user.avatarSeed = seed;
                        localStorage.setItem('user', JSON.stringify(user));
                        
                        // Update UI
                        updateAvatarImage(seed);
                        
                        // Close Modal
                        avatarModal.classList.add('hidden');
                        avatarModal.style.display = 'none';
                    };
                    avatarGrid.appendChild(img);
                });
            }
        }
    }

    // ======================================================
    // 2. INITIALIZATION & AUTO-LOGIN
    // ======================================================
    
    const authOverlay = document.getElementById('auth-overlay');
    let currentUser = JSON.parse(localStorage.getItem('user'));

    // CHECK: Is the user already logged in?
    if (currentUser && authOverlay) {
        // YES: Hide login screen immediately
        authOverlay.style.display = 'none';
        
        // Update UI with saved data
        if(document.getElementById('username-display')) 
            document.getElementById('username-display').innerText = currentUser.username;
        
        updateAvatarImage(currentUser.avatarSeed || "Felix");
        updateSidebarStats(currentUser.totalScore || 0, currentUser.quizzesTaken || 0);
    } else {
        // NO: Initialize default
        currentUser = { username: "Guest", totalScore: 0, quizzesTaken: 0, avatarSeed: "Felix" };
    }

    // ======================================================
    // 3. EVENT LISTENERS 
    // ======================================================

    // --- A. Login Logic ---
    const guestBtn = document.getElementById('guest-btn');
    const authSubmitBtn = document.getElementById('auth-submit-btn');

    if (guestBtn && authOverlay) {
        guestBtn.addEventListener('click', () => {
            // Save "Guest" status
            const guestUser = { username: "Guest", totalScore: 0, quizzesTaken: 0, avatarSeed: "Felix" };
            localStorage.setItem('user', JSON.stringify(guestUser));
            authOverlay.style.display = 'none';
        });
    }

    if (authSubmitBtn && authOverlay) {
        authSubmitBtn.addEventListener('click', () => {
            const emailInput = document.getElementById('auth-email');
            const username = emailInput.value ? emailInput.value.split('@')[0] : "User"; 
            
            const newUser = { username: username, totalScore: 0, quizzesTaken: 0, avatarSeed: "Felix" };
            localStorage.setItem('user', JSON.stringify(newUser));
            
            if(document.getElementById('username-display'))
                document.getElementById('username-display').innerText = username;
            
            authOverlay.style.display = 'none';
        });
    }

    // --- B. Avatar Click Logic (Event Delegation) ---
    document.body.addEventListener('click', (e) => {
        // Did user click the Avatar, the Pencil, or the Username?
        if (e.target.closest('#current-avatar-btn') || 
            e.target.closest('.edit-icon') || 
            e.target.id === 'username-display') {
            openAvatarModal();
        }
    });
    
    const closeAvatarBtn = document.getElementById('close-avatar-btn');
    if(closeAvatarBtn) {
        closeAvatarBtn.addEventListener('click', () => {
            const modal = document.getElementById('avatar-modal');
            if(modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        });
    }

    // --- C. Smart Input Toggle ---
    const topicInput = document.getElementById('topic-input');
    const fileInput = document.getElementById('file-upload');
    const fileLabel = document.getElementById('file-label');

    if(topicInput && fileInput) {
        topicInput.addEventListener('input', (e) => {
            if(e.target.value.length > 0) {
                fileInput.value = ""; 
                if(fileLabel) fileLabel.innerText = "📂 Choose File...";
            }
        });
        fileInput.addEventListener('change', (e) => {
            if(e.target.files.length > 0) {
                topicInput.value = ""; 
                if(fileLabel) fileLabel.innerText = "📄 " + e.target.files[0].name;
            }
        });
    }

    // ======================================================
    // 4. GAME VARIABLES
    // ======================================================
    let currentQuizData = [];
    let userAnswers = [];
    let currentQuestionIndex = 0;
    let timerInterval;
    let timeLeft = 30;
    let currentGameScore = 0; 

    // ======================================================
    // 5. QUIZ GENERATION LOGIC
    // ======================================================
    const generateBtn = document.getElementById('generate-btn');
    const difficultySelect = document.getElementById('difficulty-select');
    const countSelect = document.getElementById('question-count');
    const quizInterface = document.getElementById('quiz-interface');
    const loadingIndicator = document.getElementById('loading');
    const resultsSection = document.getElementById('results-section');

    if(generateBtn) {
        generateBtn.addEventListener('click', async () => {
            let topic = topicInput.value;
            if(!topic && fileInput && fileInput.files.length > 0) topic = "The uploaded document content";

            if (!topic) {
                alert("Please enter a topic or select a file!");
                return;
            }

            // --- UI RESET & SQUISH FIX ---
            const welcomePanel = document.getElementById('welcome-panel');
            if(welcomePanel) {
                welcomePanel.style.setProperty('display', 'none', 'important');
                welcomePanel.classList.add('hidden');
            }
            if(resultsSection) resultsSection.classList.add('hidden');
            if(quizInterface) quizInterface.classList.add('hidden');
            
            // --- LOADING STATE ---
            generateBtn.disabled = true;
            generateBtn.innerText = "Generating...";
            if(loadingIndicator) loadingIndicator.classList.remove('hidden');

            try {
                const response = await fetch('http://localhost:5000/api/quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        topic, 
                        difficulty: difficultySelect.value, 
                        count: countSelect.value 
                    })
                });

                const data = await response.json();
                if (data.error) throw new Error(data.error);

                currentQuizData = data;
                userAnswers = new Array(currentQuizData.length).fill(null);
                currentQuestionIndex = 0;
                currentGameScore = 0;

                if(document.getElementById('game-score')) 
                    document.getElementById('game-score').innerText = "Score: 0";

                if(loadingIndicator) loadingIndicator.classList.add('hidden');
                if(quizInterface) quizInterface.classList.remove('hidden');
                
                loadQuestion(0);

            } catch (error) {
                console.error(error);
                alert("Failed: " + error.message);
                if(welcomePanel) welcomePanel.style.display = "flex";
            } finally {
                generateBtn.disabled = false;
                generateBtn.innerText = "✨ Generate Quiz";
                if(loadingIndicator) loadingIndicator.classList.add('hidden');
            }
        });
    }

    // ======================================================
    // 6. GAMEPLAY FUNCTIONS
    // ======================================================
    
    function updateTimerDisplay() {
        const timerEl = document.getElementById('timer-display');
        if(timerEl) {
            timerEl.innerText = `⏱ ${timeLeft}s`;
            timerEl.style.color = timeLeft <= 5 ? "#E63946" : ""; 
        }
    }

    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = 30; 
        updateTimerDisplay();

        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                if (!userAnswers[currentQuestionIndex]) userAnswers[currentQuestionIndex] = "Skipped";
                
                if (currentQuestionIndex < currentQuizData.length - 1) {
                    currentQuestionIndex++;
                    loadQuestion(currentQuestionIndex);
                } else {
                    showResults();
                }
            }
        }, 1000);
    }

    function loadQuestion(index) {
        startTimer();
        const qData = currentQuizData[index];
        const questionText = document.getElementById('question-text');
        const optionsContainer = document.getElementById('options-container');
        const progressText = document.getElementById('progress-text');

        if(questionText) questionText.innerText = qData.question;
        if(progressText) progressText.innerText = `Question ${index + 1} / ${currentQuizData.length}`;
        
        if(optionsContainer) {
            optionsContainer.innerHTML = '';
            qData.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerText = opt;
                btn.onclick = () => selectOption(index, opt, btn);
                optionsContainer.appendChild(btn);
            });
        }
    }

    function selectOption(qIndex, answer, clickedBtn) {
        const allBtns = document.querySelectorAll('.option-btn');
        allBtns.forEach(btn => btn.disabled = true);
        clearInterval(timerInterval);

        userAnswers[qIndex] = answer;
        const correctAnswer = currentQuizData[qIndex].answer;

        if (answer === correctAnswer) {
            clickedBtn.classList.add('correct');
            currentGameScore += 10;
            const scoreEl = document.getElementById('game-score');
            if(scoreEl) {
                scoreEl.innerText = `Score: ${currentGameScore}`;
                scoreEl.style.transform = "scale(1.2)"; 
                setTimeout(() => scoreEl.style.transform = "scale(1)", 200);
            }
        } else {
            clickedBtn.classList.add('wrong');
            allBtns.forEach(btn => {
                if (btn.innerText === correctAnswer) btn.classList.add('correct');
            });
        }

        setTimeout(() => {
            if (currentQuestionIndex < currentQuizData.length - 1) {
                currentQuestionIndex++;
                loadQuestion(currentQuestionIndex);
            } else {
                showResults();
            }
        }, 1500);
    }

    function showResults() {
        if(quizInterface) quizInterface.classList.add('hidden');
        if(resultsSection) resultsSection.classList.remove('hidden');
        
        const welcomePanel = document.getElementById('welcome-panel');
        if(welcomePanel) welcomePanel.style.setProperty('display', 'none', 'important');

        const maxScore = currentQuizData.length * 10;
        const score = currentGameScore;

        const percentage = (score / maxScore) * 100;
        let message = "Good effort!";
        if (percentage === 100) message = "Perfection! 🌟";
        else if (percentage >= 80) message = "Amazing Job! 🚀";
        else if (percentage >= 50) message = "Not bad! 📚";
        else message = "Keep practicing! 💪";

        if(document.getElementById('result-message')) 
            document.getElementById('result-message').innerText = message;
        if(document.getElementById('score-display')) 
            document.getElementById('score-display').innerText = `You scored ${score} / ${maxScore}`;

        // Save Progress
        let user = JSON.parse(localStorage.getItem('user')) || {};
        user.totalScore = (user.totalScore || 0) + score;
        user.quizzesTaken = (user.quizzesTaken || 0) + 1;
        localStorage.setItem('user', JSON.stringify(user));
        
        updateSidebarStats(user.totalScore, user.quizzesTaken);

        // Show Review
        const reviewList = document.getElementById('review-list');
        if(reviewList) {
            reviewList.innerHTML = '';
            currentQuizData.forEach((q, index) => {
                const isCorrect = userAnswers[index] === q.answer;
                const item = document.createElement('div');
                item.style.padding = "15px";
                item.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                item.style.textAlign = "left";
                
                item.innerHTML = `
                    <p style="color:#F1FAEE; font-weight:bold; margin-bottom:5px;">Q: ${q.question}</p>
                    <p style="color:${isCorrect ? '#2A9D8F' : '#E63946'}">Your Answer: ${userAnswers[index] || "Skipped"}</p>
                    ${!isCorrect ? `<p style="color:#2A9D8F">Correct: ${q.answer}</p>` : ''}
                `;
                reviewList.appendChild(item);
            });
        }
    }
});