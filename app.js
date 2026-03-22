document.addEventListener('DOMContentLoaded', () => {
    // ---- Theme Toggle & Wipe ----
    if (!localStorage.getItem('gamesForKenV5Wiped')) {
        localStorage.removeItem('gamesForKenProfiles');
        localStorage.removeItem('gamesForKenActiveProfile');
        localStorage.removeItem('memoryGameStats');
        localStorage.setItem('gamesForKenV5Wiped', 'true');
    }

    const themeBtn = document.getElementById('theme-toggle');
    if (localStorage.getItem('gamesForKenTheme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeBtn.textContent = '☀️';
    }

    themeBtn.addEventListener('click', () => {
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('gamesForKenTheme', 'light');
            themeBtn.textContent = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('gamesForKenTheme', 'dark');
            themeBtn.textContent = '☀️';
        }
    });

    // ---- Global State & Profiles ----
    let activeStored = localStorage.getItem('gamesForKenActiveProfile');
    let currentProfile = activeStored ? JSON.parse(activeStored) : { name: "Ken", emoji: "👤" };
    let gameSettings = JSON.parse(localStorage.getItem('gamesForKenProfiles')) || [{ name: "Ken", emoji: "👤" }];

    // ---- Nav & Hub Logic ----
    const tabBtns = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.view-section');
    const backBtns = document.querySelectorAll('.back-btn');

    function switchView(targetId) {
        sections.forEach(s => {
            s.classList.remove('active');
            s.classList.add('hidden');
        });
        const targetSection = document.getElementById(targetId);
        targetSection.classList.remove('hidden');
        targetSection.classList.add('active');

        // Fix 1: Auto-refresh Leaderboard when viewing Progress Tab
        if (targetId === 'progress-view') {
            updateProgressUI();
        }
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            switchView(btn.getAttribute('data-target'));
        });
    });

    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.getAttribute('data-target'));
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelector('[data-target="hub-view"]').classList.add('active');
        });
    });

    document.getElementById('btn-play-matching').addEventListener('click', () => {
        initMatchingGame();
        switchView('matching-view');
    });
    document.getElementById('btn-play-sudoku').addEventListener('click', () => {
        initSudoku();
        switchView('sudoku-view');
    });
    document.getElementById('btn-play-logic').addEventListener('click', () => {
        initLogicPuzzles();
        switchView('logic-view');
    });
    document.getElementById('btn-play-trivia').addEventListener('click', () => {
        initTrivia();
        switchView('trivia-view');
    });

    // ---- Profile Logic ----
    const profileInput = document.getElementById('username-input');
    const btnAddProfile = document.getElementById('btn-add-profile');
    const profilesList = document.getElementById('active-profiles-list');
    const emojiBtns = document.querySelectorAll('.emoji-btn');

    let selectedEmoji = '👤';

    emojiBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            emojiBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedEmoji = btn.textContent;
        });
    });

    function renderProfiles() {
        profilesList.innerHTML = '';
        gameSettings.forEach(profileObj => {
            const isActive = profileObj.name === currentProfile.name;
            const div = document.createElement('div');
            div.className = `profile-item ${isActive ? 'active-profile' : ''}`;
            div.innerHTML = `<span>${profileObj.emoji} ${profileObj.name}</span> <span>${isActive ? '✅ Active' : ''}</span>`;
            div.addEventListener('click', () => {
                currentProfile = profileObj;
                localStorage.setItem('gamesForKenActiveProfile', JSON.stringify(currentProfile));
                renderProfiles();
            });
            profilesList.appendChild(div);
        });
    }

    btnAddProfile.addEventListener('click', () => {
        const newName = profileInput.value.trim();
        if (newName && !gameSettings.some(p => p.name === newName)) {
            const newProfile = { name: newName, emoji: selectedEmoji };
            gameSettings.push(newProfile);
            localStorage.setItem('gamesForKenProfiles', JSON.stringify(gameSettings));
            currentProfile = newProfile;
            localStorage.setItem('gamesForKenActiveProfile', JSON.stringify(currentProfile));
            profileInput.value = '';
            renderProfiles();
        }
    });

    renderProfiles();

    // ---- Progress Tracking Logic ----
    const totalGamesEl = document.getElementById('total-games');
    const bestTimeEl = document.getElementById('best-time');
    const bestMovesEl = document.getElementById('best-moves');
    const historyListEl = document.getElementById('history-list');

    function updateProgressUI() {
        let gameHistory = JSON.parse(localStorage.getItem('memoryGameStats')) || [];
        if (gameHistory.length === 0) {
            historyListEl.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">No games played yet. Play a game to hit the leaderboard!</p>';
            return;
        }

        totalGamesEl.textContent = gameHistory.length;

        const validTimes = gameHistory.filter(h => h.time !== undefined && h.time > 0).map(h => h.time);
        const validMoves = gameHistory.filter(h => h.moves !== undefined && h.moves > 0).map(h => h.moves);

        if (validTimes.length > 0) {
            const bestTime = Math.min(...validTimes);
            const mins = String(Math.floor(bestTime / 60)).padStart(2, '0');
            const secs = String(bestTime % 60).padStart(2, '0');
            bestTimeEl.textContent = `${mins}:${secs}`;
        }
        
        if (validMoves.length > 0) {
            bestMovesEl.textContent = Math.min(...validMoves);
        }

        historyListEl.innerHTML = '';
        const sortedHistory = [...gameHistory].sort((a, b) => b.timestamp - a.timestamp);
        
        sortedHistory.forEach(item => {
            const date = new Date(item.timestamp).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const m = String(Math.floor(item.time / 60)).padStart(2, '0');
            const s = String(item.time % 60).padStart(2, '0');
            
            // Backwards compatibility for older string profiles
            let playerStr = "👤 Ken";
            if (item.profile) {
                if (typeof item.profile === 'string') {
                    playerStr = `👤 ${item.profile}`;
                } else if (item.profile.name) {
                    playerStr = `${item.profile.emoji} ${item.profile.name}`;
                }
            }
            
            const gameType = item.game || "Match";
            
            let scoreText = `Moves: ${item.moves} | Time: ${m}:${s}`;
            if (item.time === 0 && item.moves === 0 && item.scoreText) {
                scoreText = item.scoreText; 
            } else if (item.time === 0 && item.moves > 0) {
                scoreText = `Score: ${item.moves}`;
            }

            historyListEl.innerHTML += `
                <div class="history-item">
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <span class="history-date">${date}</span>
                        <strong style="color: var(--text-main); font-size:1.1rem;">${playerStr}</strong>
                    </div>
                    <span class="history-score">[${gameType}]<br>${scoreText}</span>
                </div>
            `;
        });
    }

    window.saveProgress = function(moves, timeInSeconds, gameName="Match", customScoreText=null) {
        let gameHistory = JSON.parse(localStorage.getItem('memoryGameStats')) || [];
        gameHistory.push({
            timestamp: Date.now(),
            profile: currentProfile,
            moves: moves,
            time: timeInSeconds,
            game: gameName,
            scoreText: customScoreText
        });
        localStorage.setItem('memoryGameStats', JSON.stringify(gameHistory));
        updateProgressUI();
    };

    updateProgressUI();


    // ---- Trivia Logic ----
    const triviaContent = document.getElementById('trivia-content');
    const triviaBank = [
        { question: "Which renowned dictionary author was instrumental in the founding of Amherst College in 1821?", options: ["Samuel Johnson", "Noah Webster", "William Safire", "Peter Mark Roget"], answer: 1 },
        { question: "Hampshire College was conceived as an experimental college. Which of the following was NOT one of its original 'Four College' co-sponsors?", options: ["Yale University", "Smith College", "Mount Holyoke College", "UMass Amherst"], answer: 0 },
        { question: "Which iconic secret society at Yale counts both George H.W. Bush and George W. Bush among its alumni?", options: ["Book and Snake", "Scroll and Key", "Skull and Bones", "Wolf's Head"], answer: 2 },
        { question: "In property law, what is the 'Rule Against Perpetuities' primarily designed to prevent?", options: ["Excessive taxation", "Property interests vesting too far into the future", "Foreign ownership of land", "Eminent domain"], answer: 1 },
        { question: "In Constitutional Law, the 'Chevron deference' traditionally established that courts should defer to what?", options: ["A federal agency's interpretation of an ambiguous statute", "The President's executive orders", "State supreme court rulings", "Congressional committee reports"], answer: 0 },
        { question: "Which of these pairs of US Presidents both graduated from Yale Law School?", options: ["Bill Clinton & Gerald Ford", "Barack Obama & Joe Biden", "JFK & Richard Nixon", "Jimmy Carter & Ronald Reagan"], answer: 0 },
        { question: "Amherst College is known as the 'Fairest College'. What colors represent the school?", options: ["Crimson and Gold", "Purple and White", "Blue and White", "Green and White"], answer: 1 },
        { question: "In a civil trial, what is the standard of proof required to win a case?", options: ["Beyond a reasonable doubt", "Preponderance of the evidence", "Probable cause", "Clear and convincing certainty"], answer: 1 },
        { question: "What is the legal doctrine preventing someone from being tried twice for the same crime?", options: ["Habeas Corpus", "Double Jeopardy", "Stare Decisis", "Res Judicata"], answer: 1 },
        { question: "Hampshire College students do not receive letter grades. Instead, they receive:", options: ["Numeric scores out of 100", "No feedback until graduation", "Narrative evaluations", "Pass/Fail only"], answer: 2 },
        { question: "A 'tort' in the legal world refers to:", options: ["A civil wrong causing loss or harm", "A breach of contract", "A criminal offense", "A type of sweet pastry served in court"], answer: 0 },
        { question: "Which 19th-century poet briefly attended Mount Holyoke and lived in nearby Amherst?", options: ["Walt Whitman", "Emily Dickinson", "Robert Frost", "Henry David Thoreau"], answer: 1 },
        { question: "The highest court in the United States, established by Article III of the Constitution, is the:", options: ["Supreme Court", "Federal Circuit Court", "Court of Appeals", "Superior Court"], answer: 0 }
    ];

    let currentTriviaSession = [];
    let currentQuestionIndex = 0;
    let triviaScore = 0;

    function initTrivia() {
        let shuffled = [...triviaBank].sort(() => Math.random() - 0.5);
        currentTriviaSession = shuffled.slice(0, 5); // Pick 5 randomly
        currentQuestionIndex = 0;
        triviaScore = 0;
        renderTrivia();
    }

    function renderTrivia() {
        if (currentQuestionIndex >= currentTriviaSession.length) {
            triviaContent.innerHTML = `
                <h2>Quiz Complete!</h2>
                <p class="subtitle">You scored ${triviaScore} out of ${currentTriviaSession.length}.</p>
                <button class="primary-btn" id="restart-trivia">Play Again</button>
            `;
            document.getElementById('restart-trivia').addEventListener('click', initTrivia);
            if (typeof window.saveProgress === 'function') {
                window.saveProgress(triviaScore, 0, "Trivia", `Score: ${triviaScore}/${currentTriviaSession.length}`);
            }
            return;
        }

        const q = currentTriviaSession[currentQuestionIndex];
        let optionsHtml = '';
        q.options.forEach((opt, idx) => {
            optionsHtml += `<button class="trivia-option" data-idx="${idx}">${opt}</button>`;
        });

        triviaContent.innerHTML = `
            <p class="trivia-question">Question ${currentQuestionIndex + 1}/${currentTriviaSession.length}:<br>${q.question}</p>
            <div class="trivia-options">
                ${optionsHtml}
            </div>
        `;

        const optionBtns = document.querySelectorAll('.trivia-option');
        optionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const selectedIdx = parseInt(e.target.getAttribute('data-idx'));
                const isCorrect = selectedIdx === q.answer;
                
                optionBtns.forEach(b => {
                    b.style.pointerEvents = 'none';
                    if (parseInt(b.getAttribute('data-idx')) === q.answer) {
                        b.classList.add('correct');
                    }
                });

                if (isCorrect) triviaScore++;
                else e.target.classList.add('wrong');

                setTimeout(() => {
                    currentQuestionIndex++;
                    renderTrivia();
                }, 1500);
            });
        });
    }

    // ---- Matching Game Logic ----
    const memoryGrid = document.getElementById('memory-grid');
    const movesElement = document.getElementById('moves-count');
    const timeElement = document.getElementById('time-count');
    const restartBtn = document.getElementById('restart-btn');

    const baseIcons = ['🎓', '🐕', '🦣', '🏛️', '⚖️', '🔨', '📜', '🌳', '📚', '🖋️', '💼', '🦉'];
    let deck = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let moves = 0;
    let timer = null;
    let seconds = 0;
    let gameStarted = false;

    function initMatchingGame() {
        clearInterval(timer);
        timer = null;
        seconds = 0;
        moves = 0;
        matchedPairs = 0;
        flippedCards = [];
        gameStarted = false;
        
        movesElement.textContent = `Moves: ${moves}`;
        timeElement.textContent = `Time: 00:00`;
        memoryGrid.innerHTML = '';
        
        deck = [...baseIcons, ...baseIcons];
        deck.sort(() => Math.random() - 0.5);
        
        deck.forEach((icon) => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('memory-card');
            cardElement.dataset.icon = icon;
            
            cardElement.innerHTML = `
                <div class="card-face card-front">${icon}</div>
                <div class="card-face card-back"></div>
            `;
            
            cardElement.addEventListener('click', onCardClick);
            memoryGrid.appendChild(cardElement);
        });
    }

    function startTimer() {
        if (gameStarted) return;
        gameStarted = true;
        timer = setInterval(() => {
            seconds++;
            const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
            const secs = String(seconds % 60).padStart(2, '0');
            timeElement.textContent = `Time: ${mins}:${secs}`;
        }, 1000);
    }

    function onCardClick(e) {
        startTimer();
        const clickedCard = e.currentTarget;
        if (clickedCard.classList.contains('flipped') || clickedCard.classList.contains('matched') || flippedCards.length === 2) return;
        
        clickedCard.classList.add('flipped');
        flippedCards.push(clickedCard);
        
        if (flippedCards.length === 2) {
            moves++;
            movesElement.textContent = `Moves: ${moves}`;
            checkForMatch();
        }
    }

    function checkForMatch() {
        const [card1, card2] = flippedCards;
        if (card1.dataset.icon === card2.dataset.icon) {
            setTimeout(() => {
                card1.classList.add('matched');
                card2.classList.add('matched');
                matchedPairs++;
                flippedCards = [];
                checkMatchWin();
            }, 500);
        } else {
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                flippedCards = [];
            }, 1000);
        }
    }

    function checkMatchWin() {
        if (matchedPairs === baseIcons.length) {
            clearInterval(timer);
            setTimeout(() => {
                alert(`Congratulations! You completed the game in ${moves} moves and ${timeElement.textContent.replace('Time: ', '')}.`);
                if (typeof window.saveProgress === 'function') {
                    window.saveProgress(moves, seconds, "Match");
                }
            }, 500);
        }
    }

    restartBtn.addEventListener('click', initMatchingGame);

    // ---- Sudoku Game Logic ----
    const sudokuGridContainer = document.getElementById('sudoku-grid');
    const validSudokus = [
        [
            [5,3,4,6,7,8,9,1,2],
            [6,7,2,1,9,5,3,4,8],
            [1,9,8,3,4,2,5,6,7],
            [8,5,9,7,6,1,4,2,3],
            [4,2,6,8,5,3,7,9,1],
            [7,1,3,9,2,4,8,5,6],
            [9,6,1,5,3,7,2,8,4],
            [2,8,7,4,1,9,6,3,5],
            [3,4,5,2,8,6,1,7,9]
        ],
        [
            [2,9,5,7,4,3,8,6,1],
            [4,3,1,8,6,5,9,2,7],
            [8,7,6,1,9,2,5,4,3],
            [3,8,7,4,5,9,2,1,6],
            [6,1,2,3,8,7,4,9,5],
            [5,4,9,2,1,6,7,3,8],
            [7,6,3,5,2,4,1,8,9],
            [9,2,8,6,7,1,3,5,4],
            [1,5,4,9,3,8,6,7,2]
        ]
    ];
    let activeSudokuSolution = [];
    let sudokuPuzzle = [];
    let sudokuTimerInterval;
    let sudokuSeconds = 0;
    
    function initSudoku() {
        clearInterval(sudokuTimerInterval);
        sudokuSeconds = 0;
        sudokuGridContainer.innerHTML = '';
        
        activeSudokuSolution = validSudokus[Math.floor(Math.random() * validSudokus.length)];
        sudokuPuzzle = activeSudokuSolution.map(row => [...row]);
        
        let hiddenCount = 0;
        while(hiddenCount < 35) {
            let r = Math.floor(Math.random() * 9);
            let c = Math.floor(Math.random() * 9);
            if(sudokuPuzzle[r][c] !== '') {
                sudokuPuzzle[r][c] = '';
                hiddenCount++;
            }
        }
        
        renderSudokuGrid();
        sudokuTimerInterval = setInterval(() => { sudokuSeconds++; }, 1000);
    }
    
    function renderSudokuGrid() {
        sudokuGridContainer.innerHTML = '';
        for(let r=0; r<9; r++) {
            for(let c=0; c<9; c++) {
                const cell = document.createElement('input');
                cell.type = "text";
                cell.maxLength = 1;
                cell.className = 'sudoku-cell';
                cell.style.textAlign = 'center';
                cell.style.outline = 'none';
                cell.style.border = '1px solid #ccc';
                
                if(r===2 || r===5) cell.style.borderBottom = "2px solid var(--text-main)";
                if(c===2 || c===5) cell.style.borderRight = "2px solid var(--text-main)";
                
                if(sudokuPuzzle[r][c] !== '') {
                    cell.value = sudokuPuzzle[r][c];
                    cell.readOnly = true;
                    cell.style.backgroundColor = "var(--glass-bg)";
                    cell.style.color = "var(--text-main)";
                } else {
                    cell.addEventListener('input', (e) => {
                        const val = e.target.value;
                        if(!/^[1-9]$/.test(val)) e.target.value = '';
                        checkSudokuWin();
                    });
                }
                sudokuGridContainer.appendChild(cell);
            }
        }
    }
    
    function checkSudokuWin() {
        const inputs = sudokuGridContainer.querySelectorAll('input');
        let allFilled = true;
        let allCorrect = true;
        
        inputs.forEach((input, index) => {
            const r = Math.floor(index / 9);
            const c = index % 9;
            if(input.value === '') {
                allFilled = false;
            } else if (parseInt(input.value) !== activeSudokuSolution[r][c]) {
                allCorrect = false;
            }
        });
        
        if(allFilled && allCorrect) {
            clearInterval(sudokuTimerInterval);
            setTimeout(() => {
                alert("Sudoku Solved! Excellent work.");
                if(typeof window.saveProgress === 'function') {
                    window.saveProgress(0, sudokuSeconds, "Sudoku", `Time: ${Math.floor(sudokuSeconds/60)}m ${sudokuSeconds%60}s`);
                }
            }, 500);
        }
    }
    
    // ---- Logic Puzzle Logic ----
    const logicContent = document.getElementById('logic-content');
    const logicBank = [
        { question: "What comes next in the sequence: 2, 6, 12, 20, 30, ?", options: ["40", "42", "44", "48"], answer: 1 },
        { question: "If all ZURBS are BLORPS and some BLORPS are GLOMPS, which of the following MUST be true?", options: ["All GLOMPS are ZURBS", "Some ZURBS are GLOMPS", "Some BLORPS are ZURBS", "No ZURBS are GLOMPS"], answer: 2 },
        { question: "Which word does NOT belong with the others?", options: ["Leopard", "Cougar", "Elephant", "Lion"], answer: 2 },
        { question: "If a lawyer has 10 clients and drops all but 3, how many does he have left?", options: ["7", "0", "3", "10"], answer: 2 },
        { question: "Divide 30 by half and add 10. What do you get?", options: ["25", "40", "70", "15"], answer: 2 },
        { question: "A red house is made of red bricks. A blue house is made of blue bricks. What is a greenhouse made of?", options: ["Green Bricks", "Glass", "Wood", "Leaves"], answer: 1 },
        { question: "Which number is next: 1, 1, 2, 3, 5, 8, ?", options: ["11", "12", "13", "14"], answer: 2 },
        { question: "Mary's father has 5 daughters: Nana, Nene, Nini, Nono, and...", options: ["Nunu", "Mary", "Nina", "Nano"], answer: 1 },
        { question: "What flies when it's born, lies when it's alive, and runs when it's dead?", options: ["A bird", "A snowflake", "A river", "A train"], answer: 1 }
    ];
    let currentLogicSession = [];
    let currentLogicIndex = 0;
    let logicScore = 0;
    
    function initLogicPuzzles() {
        let shuffled = [...logicBank].sort(() => Math.random() - 0.5);
        currentLogicSession = shuffled.slice(0, 5); // Pick 5 randomly
        currentLogicIndex = 0;
        logicScore = 0;
        renderLogicPuzzle();
    }
    
    function renderLogicPuzzle() {
        if(currentLogicIndex >= currentLogicSession.length) {
            logicContent.innerHTML = `
                <h2>Puzzles Complete!</h2>
                <p class="subtitle">You scored ${logicScore} out of ${currentLogicSession.length}.</p>
                <button class="primary-btn" id="restart-logic">Play Again</button>
            `;
            document.getElementById('restart-logic').addEventListener('click', initLogicPuzzles);
            if(typeof window.saveProgress === 'function') {
                window.saveProgress(logicScore, 0, "Logic Puzzle", `Score: ${logicScore}/${currentLogicSession.length}`);
            }
            return;
        }
        
        const q = currentLogicSession[currentLogicIndex];
        let optionsHtml = '';
        q.options.forEach((opt, idx) => {
            optionsHtml += `<button class="trivia-option" data-idx="${idx}">${opt}</button>`;
        });
        
        logicContent.innerHTML = `
            <p class="trivia-question">Puzzle ${currentLogicIndex + 1}/${currentLogicSession.length}:<br>${q.question}</p>
            <div class="trivia-options">
                ${optionsHtml}
            </div>
        `;
        
        const optBtns = logicContent.querySelectorAll('.trivia-option');
        optBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const selectedIdx = parseInt(e.target.getAttribute('data-idx'));
                optBtns.forEach(b => {
                    b.style.pointerEvents = 'none';
                    if(parseInt(b.getAttribute('data-idx')) === q.answer) {
                        b.classList.add('correct');
                    }
                });
                
                if(selectedIdx === q.answer) {
                    logicScore++;
                } else {
                    e.target.classList.add('wrong');
                }
                
                setTimeout(() => {
                    currentLogicIndex++;
                    renderLogicPuzzle();
                }, 2000);
            });
        });
    }
});
