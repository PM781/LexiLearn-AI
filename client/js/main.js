document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ Main.js is RUNNING with GAME LOGIC!");

    // ======================================================
    // 1. HELPER FUNCTIONS (UI & Stats)
    // ======================================================
    
    function updateAvatarImage(seed) {
        const img = document.getElementById('user-avatar-img');
        if(img) img.src = `https://api.dicebear.com/9.x/micah/svg?seed=${seed}`;
    }

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

    function openAvatarModal() {
        const avatarModal = document.getElementById('avatar-modal');
        const avatarGrid = document.getElementById('avatar-grid');
        
        if(!avatarModal) return;

        avatarModal.classList.remove('hidden');
        avatarModal.style.display = 'flex';
        
        if(avatarGrid) {
            avatarGrid.innerHTML = '';
            const seeds = ["Felix", "Aneka", "Midnight", "Jack", "Bella", "Coco", "Max", "Luna", "Zoey", "Boots", "Oliver", "Gizmo"];
            seeds.forEach(seed => {
                const img = document.createElement('img');
                img.src = `https://api.dicebear.com/9.x/micah/svg?seed=${seed}`;
                img.style.cssText = "width: 70px; height: 70px; margin: 8px; cursor: pointer; border-radius: 50%; border: 2px solid #2a3b5a; transition: transform 0.2s;";
                
                img.onclick = (e) => {
                    e.stopPropagation();
                    let user = JSON.parse(localStorage.getItem('user')) || {};
                    user.avatarSeed = seed;
                    localStorage.setItem('user', JSON.stringify(user));
                    updateAvatarImage(seed);
                    avatarModal.style.display = 'none';
                };
                avatarGrid.appendChild(img);
            });
        }
    }

    // ======================================================
    // 2. HISTORY & GRAPH LOGIC
    // ======================================================
    function loadHistory() {
        const user = JSON.parse(localStorage.getItem('user')) || {};
        const history = user.history || [];
        const listContainer = document.getElementById('history-list');
        
        // Populate List
        if(listContainer) {
            listContainer.innerHTML = '';
            if (history.length === 0) {
                listContainer.innerHTML = '<p style="color:#ccc;">No quizzes taken yet.</p>';
            } else {
                history.slice().reverse().forEach(item => {
                    const div = document.createElement('div');
                    div.style.cssText = "background: rgba(255,255,255,0.05); padding: 10px; margin-bottom: 5px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1);";
                    div.innerHTML = `
                        <div style="display:flex; justify-content:space-between;">
                            <strong>${item.topic}</strong>
                            <span style="color: #D5BB93">${item.score}/${item.total}</span>
                        </div>
                    `;
                    listContainer.appendChild(div);
                });
            }
        }

        // Draw Graph
        const ctx = document.getElementById('progressChart');
        if(ctx && typeof Chart !== 'undefined') {
            if (window.myChart) window.myChart.destroy(); // Prevent glitches

            const labels = history.map((h, i) => `Quiz ${i + 1}`);
            const dataPoints = history.map(h => (h.score / h.total) * 100);

            window.myChart = new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Performance (%)',
                        data: dataPoints,
                        borderColor: '#D5BB93',
                        backgroundColor: 'rgba(213, 187, 147, 0.2)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.1)' } },
                        x: { grid: { display: false } }
                    },
                    plugins: { legend: { labels: { color: 'white' } } }
                }
            });
        }
    }

    // ======================================================
    // 3. GAME LOGIC (The "Brain")
    // ======================================================
    let currentQuizData = [];
    let userAnswers = [];
    let currentQuestionIndex = 0;
    let timerInterval;
    let timeLeft = 30;
    let currentGameScore = 0;

    async function generateQuiz() {
        const topicInput = document.getElementById('topic-input');
        const fileInput = document.getElementById('file-upload');
        const diff = document.getElementById('difficulty-select').value;
        const count = document.getElementById('question-count').value;

        let topic = topicInput.value;
        if(!topic && fileInput && fileInput.files.length > 0) topic = "Uploaded Document";
        
        if (!topic) { alert("Please enter a topic or select a file!"); return; }

        // UI Updates
        document.getElementById('welcome-panel').classList.add('hidden');
        document.getElementById('welcome-panel').style.display = 'none';
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('loading').style.display = 'block';

        try {
            // TRY CONNECTING TO BACKEND
            const response = await fetch('http://localhost:5000/api/quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, difficulty: diff, count })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);
            currentQuizData = data;

        } catch (error) {
            console.warn("Backend error, using dummy data for demo:", error);
            // FALLBACK DUMMY DATA (So it works even if backend fails)
            currentQuizData = [];
            for(let i=0; i<count; i++) {
                currentQuizData.push({
                    question: `Sample Question ${i+1} about ${topic}?`,
                    options: ["Option A", "Option B", "Option C", "Option D"],
                    answer: "Option A"
                });
            }
        }

        // Start Game
        document.getElementById('loading').style.display = 'none';
        document.getElementById('quiz-interface').classList.remove('hidden');
        document.getElementById('quiz-interface').style.display = 'block';
        
        userAnswers = new Array(currentQuizData.length).fill(null);
        currentQuestionIndex = 0;
        currentGameScore = 0;
        document.getElementById('game-score').innerText = "Score: 0";
        
        loadQuestion(0);
    }

    function loadQuestion(index) {
        currentQuestionIndex = index;
        const qData = currentQuizData[index];
        
        document.getElementById('question-text').innerText = qData.question;
        document.getElementById('progress-text').innerText = `Question ${index + 1} / ${currentQuizData.length}`;
        
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';
        
        qData.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = opt;
            btn.onclick = () => selectOption(index, opt, btn);
            optionsContainer.appendChild(btn);
        });

        // Timer Logic
        clearInterval(timerInterval);
        timeLeft = 30;
        document.getElementById('timer-display').innerText = `⏱ ${timeLeft}s`;
        
        timerInterval = setInterval(() => {
            timeLeft--;
            document.getElementById('timer-display').innerText = `⏱ ${timeLeft}s`;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                if (index < currentQuizData.length - 1) loadQuestion(index + 1);
                else showResults();
            }
        }, 1000);
    }

    function selectOption(index, answer, clickedBtn) {
        clearInterval(timerInterval);
        userAnswers[index] = answer;
        const correctAnswer = currentQuizData[index].answer;
        const allBtns = document.querySelectorAll('.option-btn');
        allBtns.forEach(btn => btn.disabled = true);

        if (answer === correctAnswer) {
            clickedBtn.style.background = '#2A9D8F'; // Green
            currentGameScore += 10;
            document.getElementById('game-score').innerText = `Score: ${currentGameScore}`;
        } else {
            clickedBtn.style.background = '#E63946'; // Red
        }

        setTimeout(() => {
            if (index < currentQuizData.length - 1) loadQuestion(index + 1);
            else showResults();
        }, 1000);
    }

    function showResults() {
        // 1. Switch Screens
        document.getElementById('quiz-interface').style.display = 'none';
        document.getElementById('results-section').classList.remove('hidden');
        document.getElementById('results-section').style.display = 'block';
        
        // 2. Calculate Score
        const maxScore = currentQuizData.length * 10;
        document.getElementById('score-display').innerText = `You scored ${currentGameScore} / ${maxScore}`;
        document.getElementById('result-message').innerText = currentGameScore > (maxScore/2) ? "Great Job! 🎉" : "Keep Practicing! 💪";

        // 3. GENERATE REVIEW LIST (This is what was missing!)
        const reviewList = document.getElementById('review-list');
        if(reviewList) {
            reviewList.innerHTML = ''; // Clear old data
            
            currentQuizData.forEach((q, index) => {
                const userAnswer = userAnswers[index];
                const isCorrect = userAnswer === q.answer;
                
                const item = document.createElement('div');
                // Styling the review card
                item.style.cssText = "background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin-bottom: 10px; text-align: left; border-left: 5px solid " + (isCorrect ? "#2A9D8F" : "#E63946");

                item.innerHTML = `
                    <p style="color:white; font-weight:bold; margin-bottom: 5px;">Q${index + 1}: ${q.question}</p>
                    <p style="color:${isCorrect ? '#2A9D8F' : '#E63946'}">
                        Your Answer: ${userAnswer || "Skipped"} ${isCorrect ? "✅" : "❌"}
                    </p>
                    ${!isCorrect ? `<p style="color:#4CC9F0; font-size: 0.9rem;">Correct Answer: ${q.answer}</p>` : ''}
                `;
                reviewList.appendChild(item);
            });
        }

        // 4. Save History (Same as before)
        let user = JSON.parse(localStorage.getItem('user')) || {};
        if (!user.history) user.history = [];
        
        user.history.push({
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            topic: document.getElementById('topic-input').value || "Quiz",
            score: currentGameScore,
            total: maxScore
        });
        
        user.totalScore = (user.totalScore || 0) + currentGameScore;
        user.quizzesTaken = (user.quizzesTaken || 0) + 1;
        
        localStorage.setItem('user', JSON.stringify(user));
        updateSidebarStats(user.totalScore, user.quizzesTaken);
    }

    // ======================================================
    // 4. EVENT LISTENERS
    // ======================================================

    // A. Profile Click (Safe)
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('#current-avatar-btn') || e.target.id === 'username-display') {
            openAvatarModal();
        }
    });

    // B. Modal & Button Listeners
    const closeAvatarBtn = document.getElementById('close-avatar-btn');
    if(closeAvatarBtn) closeAvatarBtn.addEventListener('click', () => document.getElementById('avatar-modal').style.display = 'none');

    const historyBtn = document.getElementById('history-btn');
    if(historyBtn) historyBtn.addEventListener('click', () => {
        document.getElementById('history-modal').style.display = 'flex';
        loadHistory();
    });

    const closeHistoryBtn = document.getElementById('close-history-btn');
    if(closeHistoryBtn) closeHistoryBtn.addEventListener('click', () => document.getElementById('history-modal').style.display = 'none');

    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) logoutBtn.addEventListener('click', () => {
        if(confirm("Log out?")) { localStorage.removeItem('user'); location.reload(); }
    });

    const generateBtn = document.getElementById('generate-btn');
    if(generateBtn) generateBtn.addEventListener('click', generateQuiz);

    // C. Login/Auth Listeners
    const guestBtn = document.getElementById('guest-btn');
    if(guestBtn) guestBtn.addEventListener('click', () => {
        localStorage.setItem('user', JSON.stringify({ username: "Guest", totalScore: 0, quizzesTaken: 0, avatarSeed: "Felix" }));
        document.getElementById('auth-overlay').style.display = 'none';
    });

    const authSubmitBtn = document.getElementById('auth-submit-btn');
    if(authSubmitBtn) authSubmitBtn.addEventListener('click', () => {
        const name = document.getElementById('auth-email').value.split('@')[0] || "User";
        localStorage.setItem('user', JSON.stringify({ username: name, totalScore: 0, quizzesTaken: 0, avatarSeed: "Felix" }));
        document.getElementById('auth-overlay').style.display = 'none';
    });

    // ======================================================
    // 5. STARTUP CHECK
    // ======================================================
    let currentUser = JSON.parse(localStorage.getItem('user'));
    const authOverlay = document.getElementById('auth-overlay');

    if (currentUser && authOverlay) {
        authOverlay.style.display = 'none';
        if(document.getElementById('username-display')) document.getElementById('username-display').innerText = currentUser.username;
        updateAvatarImage(currentUser.avatarSeed || "Felix");
        updateSidebarStats(currentUser.totalScore || 0, currentUser.quizzesTaken || 0);
    }
});