const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const pauseScreen = document.getElementById('pauseScreen');
const pauseBtn = document.getElementById('pauseBtn');
const paddleHitSound = document.getElementById('paddleHit');
const wallHitSound = document.getElementById('wallHit');
const scoreSound = document.getElementById('score');

// Set canvas size
canvas.width = 800;
canvas.height = 400;

// Game state
let gameStarted = false;
let gamePaused = false;
let difficulty = 'medium';

// Game objects
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    speed: 5,
    dx: 5,
    dy: 5
};

const paddle = {
    width: 10,
    height: 100,
    x: 10,
    y: canvas.height / 2 - 50,
    speed: 8,
    moving: null
};

const computerPaddle = {
    width: 10,
    height: 100,
    x: canvas.width - 20,
    y: canvas.height / 2 - 50,
    speed: 5
};

// Score
let playerScore = 0;
let computerScore = 0;

// Difficulty settings
const difficulties = {
    easy: {
        computerSpeed: 3,
        ballSpeed: 4
    },
    medium: {
        computerSpeed: 5,
        ballSpeed: 5
    },
    hard: {
        computerSpeed: 7,
        ballSpeed: 6
    }
};

// Event Listeners
document.querySelectorAll('.difficulty-btn').forEach(button => {
    button.addEventListener('click', () => {
        difficulty = button.dataset.difficulty;
        startGame();
    });
});

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Mobile touch controls
canvas.addEventListener('touchstart', handleTouch);
canvas.addEventListener('touchend', () => paddle.moving = null);

pauseBtn.addEventListener('click', togglePause);

// Handle keyboard controls
function handleKeyDown(e) {
    if (e.key === 'ArrowUp') {
        paddle.moving = 'up';
    } else if (e.key === 'ArrowDown') {
        paddle.moving = 'down';
    } else if (e.key === ' ') { // Spacebar
        togglePause();
    }
}

function handleKeyUp(e) {
    if ((e.key === 'ArrowUp' && paddle.moving === 'up') ||
        (e.key === 'ArrowDown' && paddle.moving === 'down')) {
        paddle.moving = null;
    }
}

// Handle touch controls
function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const relativeY = touch.clientY - rect.top;
    
    if (relativeY < rect.height / 2) {
        paddle.moving = 'up';
    } else {
        paddle.moving = 'down';
    }
}

function togglePause() {
    if (!gameStarted) return;
    
    gamePaused = !gamePaused;
    pauseScreen.classList.toggle('hidden', !gamePaused);
    
    if (!gamePaused) {
        requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    gameStarted = true;
    startScreen.classList.add('hidden');
    resetGame();
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    // Reset ball position and direction
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = difficulties[difficulty].ballSpeed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = difficulties[difficulty].ballSpeed * (Math.random() * 2 - 1);
    
    // Reset paddle positions
    paddle.y = canvas.height / 2 - paddle.height / 2;
    computerPaddle.y = canvas.height / 2 - computerPaddle.height / 2;
    
    // Update computer paddle speed based on difficulty
    computerPaddle.speed = difficulties[difficulty].computerSpeed;
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = difficulties[difficulty].ballSpeed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = difficulties[difficulty].ballSpeed * (Math.random() * 2 - 1);
}

// Game loop
function gameLoop() {
    if (!gameStarted || gamePaused) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Move paddles
    if (paddle.moving === 'up' && paddle.y > 0) {
        paddle.y -= paddle.speed;
    } else if (paddle.moving === 'down' && paddle.y + paddle.height < canvas.height) {
        paddle.y += paddle.speed;
    }
    
    // Computer paddle AI
    const paddleCenter = computerPaddle.y + computerPaddle.height / 2;
    if (paddleCenter < ball.y - 35) {
        computerPaddle.y += computerPaddle.speed;
    }
    if (paddleCenter > ball.y + 35) {
        computerPaddle.y -= computerPaddle.speed;
    }
    
    // Keep computer paddle in bounds
    if (computerPaddle.y < 0) computerPaddle.y = 0;
    if (computerPaddle.y + computerPaddle.height > canvas.height) {
        computerPaddle.y = canvas.height - computerPaddle.height;
    }
    
    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Ball collision with top and bottom
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
        wallHitSound.currentTime = 0;
        wallHitSound.play();
    }
    
    // Ball collision with paddles
    if (ball.x - ball.radius < paddle.x + paddle.width &&
        ball.y > paddle.y &&
        ball.y < paddle.y + paddle.height) {
        ball.dx = -ball.dx;
        paddleHitSound.currentTime = 0;
        paddleHitSound.play();
    }
    
    if (ball.x + ball.radius > computerPaddle.x &&
        ball.y > computerPaddle.y &&
        ball.y < computerPaddle.y + computerPaddle.height) {
        ball.dx = -ball.dx;
        paddleHitSound.currentTime = 0;
        paddleHitSound.play();
    }
    
    // Score points
    if (ball.x - ball.radius < 0) {
        computerScore++;
        document.getElementById('computerScore').textContent = computerScore;
        scoreSound.currentTime = 0;
        scoreSound.play();
        resetBall();
    }
    if (ball.x + ball.radius > canvas.width) {
        playerScore++;
        document.getElementById('playerScore').textContent = playerScore;
        scoreSound.currentTime = 0;
        scoreSound.play();
        resetBall();
    }
    
    // Draw game objects
    drawGame();
    
    requestAnimationFrame(gameLoop);
}

function drawGame() {
    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
    
    // Draw paddles
    ctx.fillStyle = '#fff';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillRect(computerPaddle.x, computerPaddle.y, computerPaddle.width, computerPaddle.height);
    
    // Draw center line
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.setLineDash([]);
} 