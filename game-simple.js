// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Audio setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let isMusicPlaying = false;

// Sound effects
const sounds = {
    paddleHit: new Audio('sounds/paddle-hit.mp3'),
    wallHit: new Audio('sounds/wall-hit.mp3'),
    score: new Audio('sounds/score.mp3'),
    background: new Audio('sounds/background-music.mp3')
};

// Game state
let gameStarted = false;
let isPaused = false;
let gameMode = 'single';
let rallyCount = 0;
let maxRally = 0;

// Game objects
const ball = {
    x: 0,
    y: 0,
    radius: 15,
    baseSpeed: 5,
    speed: 5,
    dx: 5,
    dy: 5,
    spin: 0
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
    try {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        leftPaddle.y = canvas.height / 2 - leftPaddle.height / 2;
        rightPaddle.x = canvas.width - 30;
        rightPaddle.y = canvas.height / 2 - rightPaddle.height / 2;
        
        resetBall();
        setupControls();
        setupAudio();
        requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error('Game initialization failed:', error);
    }
}

// Setup audio
function setupAudio() {
    try {
        // Preload sounds
        Object.values(sounds).forEach(sound => {
            sound.volume = 0.5;
            sound.load();
        });
        
        // Setup background music
        sounds.background.loop = true;
        sounds.background.volume = 0.3;
        
        // Resume audio context on user interaction
        document.addEventListener('click', () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }, { once: true });
    } catch (error) {
        console.error('Audio setup failed:', error);
    }
}

// Play sound effect
function playSound(soundName) {
    try {
        if (sounds[soundName]) {
            sounds[soundName].currentTime = 0;
            sounds[soundName].play().catch(e => console.error('Audio play failed:', e));
        }
    } catch (error) {
        console.error('Sound playback failed:', error);
    }
}

// Toggle background music
function toggleMusic() {
    try {
        if (isMusicPlaying) {
            sounds.background.pause();
        } else {
            sounds.background.play().catch(e => console.error('Music play failed:', e));
        }
        isMusicPlaying = !isMusicPlaying;
    } catch (error) {
        console.error('Music toggle failed:', error);
    }
}

// Reset ball with random direction
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = ball.baseSpeed;
    ball.spin = 0;
    rallyCount = 0;
    
    const angle = Math.random() * Math.PI / 4 - Math.PI / 8;
    ball.dx = ball.speed * Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = ball.speed * Math.sin(angle);
}

// Setup controls
function setupControls() {
    try {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') leftPaddle.upPressed = true;
            if (e.key === 'ArrowDown') leftPaddle.downPressed = true;
            if (gameMode === 'multiplayer') {
                if (e.key === 'w') rightPaddle.upPressed = true;
                if (e.key === 's') rightPaddle.downPressed = true;
            }
            if (e.key === 'Escape') togglePause();
            if (e.key === 'm') toggleMusic();
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowUp') leftPaddle.upPressed = false;
            if (e.key === 'ArrowDown') leftPaddle.downPressed = false;
            if (gameMode === 'multiplayer') {
                if (e.key === 'w') rightPaddle.upPressed = false;
                if (e.key === 's') rightPaddle.downPressed = false;
            }
        });

        document.querySelectorAll('.game-mode-button').forEach(button => {
            button.addEventListener('click', () => {
                gameMode = button.dataset.mode;
                document.querySelectorAll('.game-mode-button').forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                });
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
            });
        });

        document.getElementById('startButton').addEventListener('click', () => {
            gameStarted = true;
            document.getElementById('startScreen').style.display = 'none';
            if (!isMusicPlaying) toggleMusic();
        });

        document.getElementById('resumeButton').addEventListener('click', togglePause);
        document.getElementById('restartButton').addEventListener('click', () => {
            leftPaddle.score = 0;
            rightPaddle.score = 0;
            maxRally = 0;
            updateScore();
            resetBall();
            togglePause();
        });
    } catch (error) {
        console.error('Controls setup failed:', error);
    }
}

// Toggle pause
function togglePause() {
    try {
        isPaused = !isPaused;
        document.getElementById('pauseScreen').style.display = isPaused ? 'flex' : 'none';
        if (isPaused) {
            sounds.background.pause();
        } else if (isMusicPlaying) {
            sounds.background.play().catch(e => console.error('Music play failed:', e));
        }
    } catch (error) {
        console.error('Pause toggle failed:', error);
    }
}

// Update score display
function updateScore() {
    try {
        document.getElementById('scoreDisplay').textContent = `${leftPaddle.score} - ${rightPaddle.score} (Rally: ${rallyCount}, Max: ${maxRally})`;
    } catch (error) {
        console.error('Score update failed:', error);
    }
}

// Game loop
function gameLoop() {
    try {
        if (!isPaused && gameStarted) {
            updateGame();
        }
        drawGame();
        requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error('Game loop error:', error);
    }
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
    ball.y += ball.dy + ball.spin;
    ball.spin *= 0.95; // Dampen spin

    // Ball collision with walls
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
        ball.spin = -ball.spin;
        playSound('wallHit');
    }

    // Ball collision with paddles
    if (ball.dx < 0) {
        if (ball.x - ball.radius < leftPaddle.x + leftPaddle.width &&
            ball.y > leftPaddle.y &&
            ball.y < leftPaddle.y + leftPaddle.height) {
            handlePaddleHit(leftPaddle);
        }
    } else {
        if (ball.x + ball.radius > rightPaddle.x &&
            ball.y > rightPaddle.y &&
            ball.y < rightPaddle.y + rightPaddle.height) {
            handlePaddleHit(rightPaddle);
        }
    }

    // Scoring
    if (ball.x - ball.radius < 0) {
        rightPaddle.score++;
        playSound('score');
        updateScore();
        resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        leftPaddle.score++;
        playSound('score');
        updateScore();
        resetBall();
    }
}

// Handle paddle hit
function handlePaddleHit(paddle) {
    ball.dx = -ball.dx;
    rallyCount++;
    maxRally = Math.max(maxRally, rallyCount);
    
    // Calculate hit position relative to paddle center
    const hitPosition = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
    
    // Apply spin based on hit position
    ball.spin = hitPosition * 2;
    
    // Increase speed based on rally length
    ball.speed = ball.baseSpeed + Math.min(rallyCount * 0.1, 3);
    const angle = Math.atan2(ball.dy, ball.dx);
    ball.dx = ball.speed * Math.cos(angle);
    ball.dy = ball.speed * Math.sin(angle);
    
    playSound('paddleHit');
    updateScore();
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