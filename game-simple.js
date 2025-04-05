// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 400;

// Game state
let gameStarted = false;
let isPaused = false;
let gameMode = 'single';
let difficulty = 'medium';
let currentTheme = 'retro';

// Game objects
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    dx: 5,
    dy: 5,
    speed: 5
};

const leftPaddle = {
    x: 10,
    y: canvas.height / 2 - 50,
    width: 10,
    height: 100,
    dy: 0,
    speed: 8,
    score: 0
};

const rightPaddle = {
    x: canvas.width - 20,
    y: canvas.height / 2 - 50,
    width: 10,
    height: 100,
    dy: 0,
    speed: 8,
    score: 0
};

// Themes
const themes = {
    retro: {
        colors: {
            background: '#000000',
            paddle: '#FFFFFF',
            ball: '#FFFFFF'
        }
    },
    neon: {
        colors: {
            background: '#000000',
            paddle: '#00FFFF',
            ball: '#FF00FF'
        }
    },
    minimal: {
        colors: {
            background: '#FFFFFF',
            paddle: '#000000',
            ball: '#000000'
        }
    }
};

// Initialize game
function initGame() {
    // Reset game state
    gameStarted = false;
    isPaused = false;
    leftPaddle.score = 0;
    rightPaddle.score = 0;
    
    // Reset positions
    resetBall();
    resetPaddles();
    
    // Setup controls
    setupKeyboardControls();
    setupEventListeners();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Reset ball position
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = ball.speed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = ball.speed * (Math.random() > 0.5 ? 1 : -1);
}

// Reset paddle positions
function resetPaddles() {
    leftPaddle.y = canvas.height / 2 - leftPaddle.height / 2;
    rightPaddle.y = canvas.height / 2 - rightPaddle.height / 2;
}

// Setup keyboard controls
function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            leftPaddle.dy = -leftPaddle.speed;
        } else if (e.key === 'ArrowDown') {
            leftPaddle.dy = leftPaddle.speed;
        } else if (e.key === 'w' && gameMode === 'multiplayer') {
            rightPaddle.dy = -rightPaddle.speed;
        } else if (e.key === 's' && gameMode === 'multiplayer') {
            rightPaddle.dy = rightPaddle.speed;
        } else if (e.key === ' ') {
            togglePause();
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            leftPaddle.dy = 0;
        } else if ((e.key === 'w' || e.key === 's') && gameMode === 'multiplayer') {
            rightPaddle.dy = 0;
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Start game button
    document.getElementById('startButton').addEventListener('click', () => {
        gameStarted = true;
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
    });

    // Settings button
    document.getElementById('settingsButton').addEventListener('click', () => {
        document.getElementById('settingsScreen').style.display = 'flex';
    });

    // Close settings button
    document.getElementById('closeSettingsButton').addEventListener('click', () => {
        document.getElementById('settingsScreen').style.display = 'none';
    });

    // Resume button
    document.getElementById('resumeButton').addEventListener('click', () => {
        togglePause();
    });

    // Restart button
    document.getElementById('restartButton').addEventListener('click', () => {
        leftPaddle.score = 0;
        rightPaddle.score = 0;
        document.getElementById('leftScore').textContent = '0';
        document.getElementById('rightScore').textContent = '0';
        resetBall();
        resetPaddles();
        togglePause();
    });

    // Game mode buttons
    document.querySelectorAll('.game-mode-button').forEach(button => {
        button.addEventListener('click', () => {
            gameMode = button.dataset.mode;
            document.querySelectorAll('.game-mode-button').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Difficulty buttons
    document.querySelectorAll('.difficulty-button').forEach(button => {
        button.addEventListener('click', () => {
            difficulty = button.dataset.difficulty;
            document.querySelectorAll('.difficulty-button').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Theme buttons
    document.querySelectorAll('.theme-button').forEach(button => {
        button.addEventListener('click', () => {
            currentTheme = button.dataset.theme;
            document.querySelectorAll('.theme-button').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
        });
    });
}

// Toggle pause
function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pauseScreen').style.display = isPaused ? 'flex' : 'none';
}

// Game loop
function gameLoop() {
    if (!gameStarted || isPaused) {
        requestAnimationFrame(gameLoop);
        return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update game state
    updateGameState();

    // Draw game
    drawGame();

    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Update game state
function updateGameState() {
    // Move paddles
    leftPaddle.y += leftPaddle.dy;
    rightPaddle.y += rightPaddle.dy;

    // Keep paddles in bounds
    if (leftPaddle.y < 0) leftPaddle.y = 0;
    if (leftPaddle.y + leftPaddle.height > canvas.height) leftPaddle.y = canvas.height - leftPaddle.height;
    if (rightPaddle.y < 0) rightPaddle.y = 0;
    if (rightPaddle.y + rightPaddle.height > canvas.height) rightPaddle.y = canvas.height - rightPaddle.height;

    // Update AI only in single player mode
    if (gameMode === 'single') {
        const paddleCenter = rightPaddle.y + rightPaddle.height / 2;
        const ballCenter = ball.y;
        const difficultyFactor = difficulty === 'easy' ? 0.5 : difficulty === 'medium' ? 0.7 : 0.9;
        
        if (paddleCenter < ballCenter - 10) {
            rightPaddle.dy = rightPaddle.speed * difficultyFactor;
        } else if (paddleCenter > ballCenter + 10) {
            rightPaddle.dy = -rightPaddle.speed * difficultyFactor;
        } else {
            rightPaddle.dy = 0;
        }
    }

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top and bottom
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
    }

    // Ball collision with paddles
    if (ball.dx < 0) {
        if (ball.x - ball.radius < leftPaddle.x + leftPaddle.width &&
            ball.y > leftPaddle.y &&
            ball.y < leftPaddle.y + leftPaddle.height) {
            ball.dx = -ball.dx;
        }
    } else {
        if (ball.x + ball.radius > rightPaddle.x &&
            ball.y > rightPaddle.y &&
            ball.y < rightPaddle.y + rightPaddle.height) {
            ball.dx = -ball.dx;
        }
    }

    // Score points
    if (ball.x - ball.radius < 0) {
        rightPaddle.score++;
        document.getElementById('rightScore').textContent = rightPaddle.score;
        resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        leftPaddle.score++;
        document.getElementById('leftScore').textContent = leftPaddle.score;
        resetBall();
    }
}

// Draw game
function drawGame() {
    // Draw background
    ctx.fillStyle = themes[currentTheme].colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = themes[currentTheme].colors.paddle;
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = themes[currentTheme].colors.paddle;
    ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
    ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

    // Draw ball
    ctx.fillStyle = themes[currentTheme].colors.ball;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw score
    ctx.fillStyle = themes[currentTheme].colors.paddle;
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${leftPaddle.score} - ${rightPaddle.score}`, canvas.width / 2, 50);
}

// Initialize game when window loads
window.addEventListener('load', initGame); 