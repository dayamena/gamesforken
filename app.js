document.addEventListener('DOMContentLoaded', () => {
    // ---- Global State & Profiles ----
    let currentProfile = localStorage.getItem('gamesForKenActiveProfile') || "Ken";
    let gameSettings = JSON.parse(localStorage.getItem('gamesForKenProfiles')) || ["Ken"];

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
            // Keep nav highlight on 'Games'
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelector('[data-target="hub-view"]').classList.add('active');
        });
    });

    document.getElementById('btn-play-matching').addEventListener('click', () => switchView('matching-view'));
    document.getElementById('btn-play-sudoku').addEventListener('click', () => switchView('sudoku-view'));
    document.getElementById('btn-play-logic').addEventListener('click', () => switchView('logic-view'));
    document.getElementById('btn-play-trivia').addEventListener('click', () => switchView('trivia-view'));

    // ---- Profile Logic ----
    const profileInput = document.getElementById('username-input');
    const btnAddProfile = document.getElementById('btn-add-profile');
    const profilesList = document.getElementById('active-profiles-list');

    function renderProfiles() {
        profilesList.innerHTML = '';
        gameSettings.forEach(name => {
            const div = document.createElement('div');
            div.className = `profile-item ${name === currentProfile ? 'active-profile' : ''}`;
            div.innerHTML = `<span>👤 ${name}</span> <span>${name === currentProfile ? '✅ Active' : ''}</span>`;
            div.addEventListener('click', () => {
                currentProfile = name;
                localStorage.setItem('gamesForKenActiveProfile', currentProfile);
                renderProfiles();
            });
            profilesList.appendChild(div);
        });
    }

    btnAddProfile.addEventListener('click', () => {
        const newName = profileInput.value.trim();
        if (newName && !gameSettings.includes(newName)) {
            gameSettings.push(newName);
            localStorage.setItem('gamesForKenProfiles', JSON.stringify(gameSettings));
            currentProfile = newName;
            localStorage.setItem('gamesForKenActiveProfile', currentProfile);
            profileInput.value = '';
            renderProfiles();
        }
    });

    renderProfiles();

    // ---- Trivia Logic ----
    const triviaData = [
        {
            question: "Which renowned dictionary author was instrumental in the founding of Amherst College in 1821?",
            options: ["Samuel Johnson", "Noah Webster", "William Safire", "Peter Mark Roget"],
            answer: 1
        },
        {
            question: "Hampshire College was conceived as an experimental college. Which of the following was NOT one of its original 'Four College' co-sponsors?",
            options: ["Yale University", "Smith College", "Mount Holyoke College", "UMass Amherst"],
            answer: 0
        },
        {
            question: "Which iconic secret society at Yale counts both George H.W. Bush and George W. Bush among its alumni?",
            options: ["Book and Snake", "Scroll and Key", "Skull and Bones", "Wolf's Head"],
            answer: 2
        },
        {
            question: "In property law, what is the 'Rule Against Perpetuities' primarily designed to prevent?",
            options: ["Excessive taxation", "Property interests vesting too far into the future", "Foreign ownership of land", "Eminent domain"],
            answer: 1
        },
        {
            question: "In Constitutional Law, the 'Chevron deference' traditionally established that courts should defer to what?",
            options: ["A federal agency's interpretation of an ambiguous statute", "The President's executive orders", "State supreme court rulings", "Congressional committee reports"],
            answer: 0
        }
    ];

    let currentQuestionIndex = 0;
    let triviaScore = 0;
    const triviaContent = document.getElementById('trivia-content');

    function renderTrivia() {
        if (currentQuestionIndex >= triviaData.length) {
            triviaContent.innerHTML = `
                <h2>Quiz Complete!</h2>
                <p class="subtitle">You scored ${triviaScore} out of ${triviaData.length}.</p>
                <button class="primary-btn" id="restart-trivia">Restart Trivia</button>
            `;
            document.getElementById('restart-trivia').addEventListener('click', () => {
                currentQuestionIndex = 0;
                triviaScore = 0;
                renderTrivia();
            });
            return;
        }

        const q = triviaData[currentQuestionIndex];
        let optionsHtml = '';
        q.options.forEach((opt, idx) => {
            optionsHtml += `<button class="trivia-option" data-idx="${idx}">${opt}</button>`;
        });

        triviaContent.innerHTML = `
            <p class="trivia-question">Question ${currentQuestionIndex + 1}/${triviaData.length}:<br>${q.question}</p>
            <div class="trivia-options">
                ${optionsHtml}
            </div>
        `;

        const optionBtns = document.querySelectorAll('.trivia-option');
        optionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const selectedIdx = parseInt(e.target.getAttribute('data-idx'));
                const isCorrect = selectedIdx === q.answer;
                
                // Feedback styles
                optionBtns.forEach(b => {
                    b.style.pointerEvents = 'none';
                    if (parseInt(b.getAttribute('data-idx')) === q.answer) {
                        b.classList.add('correct');
                    }
                });

                if (isCorrect) {
                    triviaScore++;
                } else {
                    e.target.classList.add('wrong');
                }

                setTimeout(() => {
                    currentQuestionIndex++;
                    renderTrivia();
                }, 1500);
            });
        });
    }

    renderTrivia();
    
    // ---- Memory Game Logic ----
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

    function initGame() {
        // Reset state
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
        
        // Create deck
        deck = [...baseIcons, ...baseIcons];
        deck.sort(() => Math.random() - 0.5);
        
        deck.forEach((icon, index) => {
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
        if (
            clickedCard.classList.contains('flipped') || 
            clickedCard.classList.contains('matched') ||
            flippedCards.length === 2
        ) {
            return;
        }
        
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
        const isMatch = card1.dataset.icon === card2.dataset.icon;
        
        if (isMatch) {
            setTimeout(() => {
                card1.classList.add('matched');
                card2.classList.add('matched');
                matchedPairs++;
                flippedCards = [];
                checkWin();
            }, 500);
        } else {
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                flippedCards = [];
            }, 1000);
        }
    }

    function checkWin() {
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

    restartBtn.addEventListener('click', initGame);

    // Initial load
    initGame();

    // ---- Progress Tracking Logic ----
    const totalGamesEl = document.getElementById('total-games');
    const bestTimeEl = document.getElementById('best-time');
    const bestMovesEl = document.getElementById('best-moves');
    const historyListEl = document.getElementById('history-list');

    let gameHistory = JSON.parse(localStorage.getItem('memoryGameStats')) || [];

    function updateProgressUI() {
        if (gameHistory.length === 0) {
            historyListEl.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">No games played yet. Play a matching game to hit the leaderboard!</p>';
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
                month: 'short', day: 'numeric'
            });
            const m = String(Math.floor(item.time / 60)).padStart(2, '0');
            const s = String(item.time % 60).padStart(2, '0');
            const player = item.profile || "Ken";
            const gameType = item.game || "Match";
            
            historyListEl.innerHTML += `
                <div class="history-item">
                    <span class="history-date">${date} <strong style="color: var(--text-main); margin-left:10px;">👤 ${player}</strong></span>
                    <span class="history-score">[${gameType}] Moves: ${item.moves} | Time: ${m}:${s}</span>
                </div>
            `;
        });
    }

    window.saveProgress = function(moves, timeInSeconds, gameName="Match") {
        gameHistory.push({
            timestamp: Date.now(),
            profile: currentProfile,
            moves: moves,
            time: timeInSeconds,
            game: gameName
        });
        localStorage.setItem('memoryGameStats', JSON.stringify(gameHistory));
        updateProgressUI();
    };

    updateProgressUI();

    // ---- Sudoku Game Logic ----
    const sudokuGridContainer = document.getElementById('sudoku-grid');
    const validSudoku = [
        [5,3,4,6,7,8,9,1,2],
        [6,7,2,1,9,5,3,4,8],
        [1,9,8,3,4,2,5,6,7],
        [8,5,9,7,6,1,4,2,3],
        [4,2,6,8,5,3,7,9,1],
        [7,1,3,9,2,4,8,5,6],
        [9,6,1,5,3,7,2,8,4],
        [2,8,7,4,1,9,6,3,5],
        [3,4,5,2,8,6,1,7,9]
    ];
    let sudokuPuzzle = [];
    let sudokuTimerInterval;
    let sudokuSeconds = 0;
    
    function initSudoku() {
        clearInterval(sudokuTimerInterval);
        sudokuSeconds = 0;
        sudokuGridContainer.innerHTML = '';
        sudokuPuzzle = validSudoku.map(row => [...row]);
        
        let hiddenCount = 0;
        while(hiddenCount < 30) {
            let r = Math.floor(Math.random() * 9);
            let c = Math.floor(Math.random() * 9);
            if(sudokuPuzzle[r][c] !== '') {
                sudokuPuzzle[r][c] = '';
                hiddenCount++;
            }
        }
        
        renderSudokuGrid();
        
        sudokuTimerInterval = setInterval(() => {
            sudokuSeconds++;
        }, 1000);
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
                        if(!/^[1-9]$/.test(val)) {
                            e.target.value = '';
                        }
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
            } else if (parseInt(input.value) !== validSudoku[r][c]) {
                allCorrect = false;
            }
        });
        
        if(allFilled && allCorrect) {
            clearInterval(sudokuTimerInterval);
            setTimeout(() => {
                alert("Sudoku Solved! Excellent work.");
                if(typeof window.saveProgress === 'function') {
                    window.saveProgress(0, sudokuSeconds, "Sudoku");
                }
            }, 500);
        }
    }
    
    document.getElementById('btn-play-sudoku').addEventListener('click', initSudoku);

    // ---- Logic Puzzle Logic ----
    const logicContent = document.getElementById('logic-content');
    const logicPuzzles = [
        {
            question: "What comes next in the sequence: 2, 6, 12, 20, 30, ?",
            options: ["40", "42", "44", "48"],
            answer: 1
        },
        {
            question: "If all ZURBS are BLORPS and some BLORPS are GLOMPS, which of the following MUST be true?",
            options: ["All GLOMPS are ZURBS", "Some ZURBS are GLOMPS", "Some BLORPS are ZURBS", "No ZURBS are GLOMPS"],
            answer: 2
        },
        {
            question: "Which word does NOT belong with the others?",
            options: ["Leopard", "Cougar", "Elephant", "Lion"],
            answer: 2
        }
    ];
    let currentLogicIndex = 0;
    let logicScore = 0;
    
    function initLogicPuzzles() {
        currentLogicIndex = 0;
        logicScore = 0;
        renderLogicPuzzle();
    }
    
    function renderLogicPuzzle() {
        if(currentLogicIndex >= logicPuzzles.length) {
            logicContent.innerHTML = `
                <h2>Puzzles Complete!</h2>
                <p class="subtitle">You scored ${logicScore} out of ${logicPuzzles.length}.</p>
                <button class="primary-btn" id="restart-logic">Restart Logic Puzzles</button>
            `;
            document.getElementById('restart-logic').addEventListener('click', initLogicPuzzles);
            if(typeof window.saveProgress === 'function') {
                window.saveProgress(logicScore, 0, "Logic Puzzle");
            }
            return;
        }
        
        const q = logicPuzzles[currentLogicIndex];
        let optionsHtml = '';
        q.options.forEach((opt, idx) => {
            optionsHtml += `<button class="trivia-option" data-idx="${idx}">${opt}</button>`;
        });
        
        logicContent.innerHTML = `
            <p class="trivia-question">Puzzle ${currentLogicIndex + 1}/${logicPuzzles.length}:<br>${q.question}</p>
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

    document.getElementById('btn-play-logic').addEventListener('click', initLogicPuzzles);

});
