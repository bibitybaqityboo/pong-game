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
    speed: 5,
    dx: 5,
    dy: 5
};

const leftPaddle = {
    x: 10,
    y: canvas.height / 2 - 50,
    width: 10,
    height: 100,
    speed: 8,
    score: 0,
    upPressed: false,
    downPressed: false
};

const rightPaddle = {
    x: canvas.width - 20,
    y: canvas.height / 2 - 50,
    width: 10,
    height: 100,
    speed: 8,
    score: 0,
    upPressed: false,
    downPressed: false
};

// Themes
const themes = {
    retro: {
        background: '#000000',
        paddle: '#ffffff',
        ball: '#ffffff',
        text: '#ffffff'
    },
    neon: {
        background: '#000000',
        paddle: '#00ffff',
        ball: '#ff00ff',
        text: '#ffffff'
    },
    minimal: {
        background: '#ffffff',
        paddle: '#000000',
        ball: '#000000',
        text: '#000000'
    }
};

// Initialize game
function initGame() {
    // Set initial theme
    document.body.className = currentTheme;
    
    // Add event listeners
    setupEventListeners();
    setupKeyboardControls();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Reset ball to center
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = ball.speed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = ball.speed * (Math.random() > 0.5 ? 1 : -1);
}

// Reset paddles to center
function resetPaddles() {
    leftPaddle.y = canvas.height / 2 - leftPaddle.height / 2;
    rightPaddle.y = canvas.height / 2 - rightPaddle.height / 2;
}

// Setup keyboard controls
function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') leftPaddle.upPressed = true;
        if (e.key === 'ArrowDown') leftPaddle.downPressed = true;
        if (gameMode === 'multiplayer') {
            if (e.key === 'w') rightPaddle.upPressed = true;
            if (e.key === 's') rightPaddle.downPressed = true;
        }
        if (e.key === 'Escape') togglePause();
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowUp') leftPaddle.upPressed = false;
        if (e.key === 'ArrowDown') leftPaddle.downPressed = false;
        if (gameMode === 'multiplayer') {
            if (e.key === 'w') rightPaddle.upPressed = false;
            if (e.key === 's') rightPaddle.downPressed = false;
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Theme buttons
    document.querySelectorAll('.theme-button').forEach(button => {
        button.addEventListener('click', () => {
            currentTheme = button.dataset.theme;
            document.body.className = currentTheme;
            document.querySelectorAll('.theme-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Game mode buttons
    document.querySelectorAll('.game-mode-button').forEach(button => {
        button.addEventListener('click', () => {
            gameMode = button.dataset.mode;
            document.querySelectorAll('.game-mode-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Difficulty buttons
    document.querySelectorAll('.difficulty-button').forEach(button => {
        button.addEventListener('click', () => {
            difficulty = button.dataset.difficulty;
            document.querySelectorAll('.difficulty-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            updateDifficulty();
        });
    });

    // Start button
    document.getElementById('startButton').addEventListener('click', () => {
        gameStarted = true;
        document.getElementById('startScreen').style.display = 'none';
        resetBall();
        resetPaddles();
    });

    // Pause screen buttons
    document.getElementById('resumeButton').addEventListener('click', togglePause);
    document.getElementById('restartButton').addEventListener('click', () => {
        leftPaddle.score = 0;
        rightPaddle.score = 0;
        updateScore();
        resetBall();
        resetPaddles();
        togglePause();
    });

    // Settings screen button
    document.getElementById('backButton').addEventListener('click', () => {
        document.getElementById('settingsScreen').style.display = 'none';
    });
}

// Update difficulty settings
function updateDifficulty() {
    switch (difficulty) {
        case 'easy':
            ball.speed = 4;
            rightPaddle.speed = 6;
            break;
        case 'medium':
            ball.speed = 5;
            rightPaddle.speed = 8;
            break;
        case 'hard':
            ball.speed = 6;
            rightPaddle.speed = 10;
            break;
    }
    ball.dx = ball.speed * (ball.dx > 0 ? 1 : -1);
    ball.dy = ball.speed * (ball.dy > 0 ? 1 : -1);
}

// Toggle pause
function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pauseScreen').style.display = isPaused ? 'flex' : 'none';
}

// Update score display
function updateScore() {
    document.getElementById('scoreDisplay').textContent = `${leftPaddle.score} - ${rightPaddle.score}`;
}

// Game loop
function gameLoop() {
    if (!isPaused && gameStarted) {
        updateGameState();
    }
    drawGame();
    requestAnimationFrame(gameLoop);
}

// Update game state
function updateGameState() {
    // Move paddles
    if (leftPaddle.upPressed && leftPaddle.y > 0) {
        leftPaddle.y -= leftPaddle.speed;
    }
    if (leftPaddle.downPressed && leftPaddle.y < canvas.height - leftPaddle.height) {
        leftPaddle.y += leftPaddle.speed;
    }

    if (gameMode === 'multiplayer') {
        if (rightPaddle.upPressed && rightPaddle.y > 0) {
            rightPaddle.y -= rightPaddle.speed;
        }
        if (rightPaddle.downPressed && rightPaddle.y < canvas.height - rightPaddle.height) {
            rightPaddle.y += rightPaddle.speed;
        }
    } else {
        // AI for right paddle in single player mode
        const paddleCenter = rightPaddle.y + rightPaddle.height / 2;
        if (paddleCenter < ball.y - 35) {
            rightPaddle.y += rightPaddle.speed;
        } else if (paddleCenter > ball.y + 35) {
            rightPaddle.y -= rightPaddle.speed;
        }
    }

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top and bottom
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
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

    // Scoring
    if (ball.x - ball.radius < 0) {
        rightPaddle.score++;
        updateScore();
        resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        leftPaddle.score++;
        updateScore();
        resetBall();
    }
}

// Draw game
function drawGame() {
    const theme = themes[currentTheme];
    
    // Clear canvas
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = theme.text;
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = theme.paddle;
    ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
    ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = theme.ball;
    ctx.fill();
    ctx.closePath();
}

// Start the game
window.addEventListener('load', initGame); 
window.addEventListener('load', initGame); 