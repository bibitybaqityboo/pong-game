// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameStarted = false;
let isPaused = false;
let gameMode = 'single';
let difficulty = 'medium';

// Game objects
const ball = {
    x: 0,
    y: 0,
    radius: 15,
    speed: 5,
    dx: 5,
    dy: 5
};

const leftPaddle = {
    x: 20,
    y: 0,
    width: 10,
    height: 100,
    speed: 8,
    score: 0,
    upPressed: false,
    downPressed: false
};

const rightPaddle = {
    x: 0,
    y: 0,
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
    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Position paddles
    leftPaddle.y = canvas.height / 2 - leftPaddle.height / 2;
    rightPaddle.x = canvas.width - 30;
    rightPaddle.y = canvas.height / 2 - rightPaddle.height / 2;
    
    // Reset ball
    resetBall();
    
    // Setup controls
    setupControls();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Reset ball
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = ball.speed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = ball.speed * (Math.random() > 0.5 ? 1 : -1);
}

// Setup controls
function setupControls() {
    // Keyboard controls
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

    // Game mode buttons
    document.querySelectorAll('.game-mode-button').forEach(button => {
        button.addEventListener('click', () => {
            gameMode = button.dataset.mode;
            document.querySelectorAll('.game-mode-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Start button
    document.getElementById('startButton').addEventListener('click', () => {
        gameStarted = true;
        document.getElementById('startScreen').style.display = 'none';
    });

    // Pause screen buttons
    document.getElementById('resumeButton').addEventListener('click', togglePause);
    document.getElementById('restartButton').addEventListener('click', () => {
        leftPaddle.score = 0;
        rightPaddle.score = 0;
        updateScore();
        resetBall();
        togglePause();
    });
}

// Toggle pause
function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pauseScreen').style.display = isPaused ? 'flex' : 'none';
}

// Update score
function updateScore() {
    document.getElementById('scoreDisplay').textContent = `${leftPaddle.score} - ${rightPaddle.score}`;
}

// Game loop
function gameLoop() {
    if (!isPaused && gameStarted) {
        updateGame();
    }
    drawGame();
    requestAnimationFrame(gameLoop);
}

// Update game state
function updateGame() {
    // Move paddles
    if (leftPaddle.upPressed && leftPaddle.y > 0) leftPaddle.y -= leftPaddle.speed;
    if (leftPaddle.downPressed && leftPaddle.y < canvas.height - leftPaddle.height) leftPaddle.y += leftPaddle.speed;
    
    if (gameMode === 'multiplayer') {
        if (rightPaddle.upPressed && rightPaddle.y > 0) rightPaddle.y -= rightPaddle.speed;
        if (rightPaddle.downPressed && rightPaddle.y < canvas.height - rightPaddle.height) rightPaddle.y += rightPaddle.speed;
    } else {
        // AI for right paddle
        const paddleCenter = rightPaddle.y + rightPaddle.height / 2;
        if (paddleCenter < ball.y - 35) rightPaddle.y += rightPaddle.speed;
        if (paddleCenter > ball.y + 35) rightPaddle.y -= rightPaddle.speed;
    }

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with walls
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) ball.dy = -ball.dy;

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
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = '#fff';
    ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
    ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
}

// Start game
window.addEventListener('load', initGame); 