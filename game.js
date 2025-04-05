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
let gameMode = 'single'; // 'single' or 'two'
let speedMultiplier = 1.0;
let lastSpeedIncrease = 0;
const SPEED_INCREASE_INTERVAL = 10000; // Increase speed every 10 seconds
const MAX_SPEED_MULTIPLIER = 2.0; // Maximum speed multiplier

// Power-up system
const powerUps = {
    types: ['paddleSize', 'ballSpeed', 'reverseControls', 'extraBall'],
    active: [],
    spawnInterval: 15000, // Spawn power-up every 15 seconds
    lastSpawn: 0,
    duration: 10000 // Power-up lasts 10 seconds
};

// Multiple balls system
const balls = [];
const MAX_BALLS = 3;
let lastBallSpawn = 0;
const BALL_SPAWN_INTERVAL = 30000; // Spawn new ball every 30 seconds

// Visual effects
const particles = [];
const MAX_PARTICLES = 50;

// Theme system
const themes = {
    retro: {
        colors: {
            background: '#000000',
            paddle: '#ffffff',
            ball: '#ffffff',
            powerUp: '#ff0000',
            particle: '#ffff00'
        },
        sounds: {
            paddleHit: '8bit-paddle.mp3',
            wallHit: '8bit-wall.mp3',
            score: '8bit-score.mp3',
            powerUp: '8bit-powerup.mp3'
        }
    },
    neon: {
        colors: {
            background: '#0a0a2a',
            paddle: '#00ffff',
            ball: '#ff00ff',
            powerUp: '#ffff00',
            particle: '#00ff00'
        },
        sounds: {
            paddleHit: 'synth-paddle.mp3',
            wallHit: 'synth-wall.mp3',
            score: 'synth-score.mp3',
            powerUp: 'synth-powerup.mp3'
        }
    },
    minimalist: {
        colors: {
            background: '#ffffff',
            paddle: '#000000',
            ball: '#000000',
            powerUp: '#666666',
            particle: '#999999'
        },
        sounds: {
            paddleHit: 'minimal-paddle.mp3',
            wallHit: 'minimal-wall.mp3',
            score: 'minimal-score.mp3',
            powerUp: 'minimal-powerup.mp3'
        }
    }
};

let currentTheme = 'retro';

// Advanced game mechanics
const gameModes = {
    classic: 'classic',
    endless: 'endless',
    boss: 'boss',
    zen: 'zen',
    wobbly: 'wobbly',
    meme: 'meme'
};

let currentGameMode = gameModes.classic;
let comboCounter = 0;
let comboMultiplier = 1;
let timeWarpActive = false;
let timeWarpFactor = 0.5;
let lastRallyTime = 0;
let rallyCount = 0;

// AI personality system
const aiPersonalities = {
    aggressive: {
        speed: 1.5,
        prediction: 1.2,
        name: 'Aggressive'
    },
    defensive: {
        speed: 0.8,
        prediction: 0.9,
        name: 'Defensive'
    },
    lazy: {
        speed: 0.6,
        prediction: 0.7,
        name: 'Lazy'
    },
    unpredictable: {
        speed: 1.0,
        prediction: 0.5,
        name: 'Unpredictable'
    }
};

let currentAIPersonality = aiPersonalities.aggressive;
let personalityChangeTimer = 0;
const PERSONALITY_CHANGE_INTERVAL = 30000; // Change every 30 seconds

// Adaptive difficulty
let adaptiveDifficulty = {
    enabled: true,
    baseSpeed: 5,
    maxSpeed: 10,
    scoreDifferenceThreshold: 3,
    paddleSizeReduction: 0.1
};

// High score system
const highScores = {
    classic: [],
    endless: [],
    boss: []
};

// Theme unlocks
const themeUnlocks = {
    retro: { unlocked: true, scoreRequired: 0 },
    neon: { unlocked: false, scoreRequired: 5 },
    minimalist: { unlocked: false, scoreRequired: 10 }
};

// Debug system
const debug = {
    enabled: false,
    fps: 0,
    frameCount: 0,
    lastFpsUpdate: 0,
    showState: false
};

// Initialize game objects with new properties
const ball = {
    x: 0,
    y: 0,
    radius: 10,
    dx: 5,
    dy: 5,
    baseSpeed: 5,
    spin: 0,
    wobble: 0,
    wobbleSpeed: 0,
    lastHitPaddle: null
};

const player1 = {
    width: 10,
    height: 100,
    x: 0,
    y: 0,
    speed: 8,
    score: 0,
    moving: null,
    powerUps: [],
    aimAngle: 0,
    maxAimAngle: 45,
    comboStreak: 0
};

const player2 = {
    width: 10,
    height: 100,
    x: 0,
    y: 0,
    speed: 8,
    score: 0,
    moving: null,
    powerUps: [],
    aimAngle: 0,
    maxAimAngle: 45,
    comboStreak: 0,
    personality: aiPersonalities.aggressive
};

// Progress bar
const progressBar = {
    width: 200,
    height: 10,
    x: 0,
    y: 0
};

// Initialize audio
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        sfxGain = audioContext.createGain();
        sfxGain.connect(audioContext.destination);
        
        // Load theme-specific sounds
        loadThemeSounds();
        
        // Set up dynamic music
        const bgMusic = document.getElementById('bgMusic');
        bgMusic.volume = 0.5;
        bgMusic.loop = true;
        
        // Create audio analyser for dynamic music
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(bgMusic);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        // Set up volume controls
        const volumeSlider = document.getElementById('volumeSlider');
        const soundToggle = document.getElementById('soundToggle');
        const musicToggle = document.getElementById('musicToggle');
        
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            bgMusic.volume = volume;
            sfxGain.gain.value = volume;
        });
        
        soundToggle.addEventListener('change', (e) => {
            sfxGain.gain.value = e.target.checked ? volumeSlider.value / 100 : 0;
        });
        
        musicToggle.addEventListener('change', (e) => {
            bgMusic.muted = !e.target.checked;
        });
    } catch (e) {
        console.warn('Web Audio API not supported');
    }
}

// Load theme-specific sounds
function loadThemeSounds() {
    const theme = themes[currentTheme];
    const soundElements = {
        paddleHit: document.getElementById('paddleHitSound'),
        wallHit: document.getElementById('wallHitSound'),
        score: document.getElementById('scoreSound'),
        powerUp: document.getElementById('powerUpSound')
    };
    
    Object.entries(theme.sounds).forEach(([type, file]) => {
        soundElements[type].src = `audio/${file}`;
        soundElements[type].load();
    });
}

// Change theme
function changeTheme(themeName) {
    currentTheme = themeName;
    document.body.className = `theme-${themeName}`;
    loadThemeSounds();
}

// Theme button event listeners
document.querySelectorAll('.theme-button').forEach(button => {
    button.addEventListener('click', () => {
        const themeName = button.classList[1].split('-')[1];
        changeTheme(themeName);
    });
});

// Spawn power-up
function spawnPowerUp() {
    if (powerUps.active.length >= 3) return; // Max 3 active power-ups
    
    const type = powerUps.types[Math.floor(Math.random() * powerUps.types.length)];
    const powerUp = {
        type,
        x: Math.random() * (canvas.width - 20) + 10,
        y: Math.random() * (canvas.height - 20) + 10,
        width: 20,
        height: 20,
        spawnTime: Date.now()
    };
    
    powerUps.active.push(powerUp);
    powerUps.lastSpawn = Date.now();
}

// Apply power-up
function applyPowerUp(player, powerUp) {
    player.powerUps.push({
        type: powerUp.type,
        startTime: Date.now()
    });
    
    switch (powerUp.type) {
        case 'paddleSize':
            player.height *= 1.5;
            break;
        case 'ballSpeed':
            speedMultiplier *= 1.5;
            break;
        case 'reverseControls':
            player.controlsReversed = true;
            break;
        case 'extraBall':
            spawnNewBall();
            break;
    }
    
    // Play power-up sound
    const powerUpSound = new Audio(`audio/${themes[currentTheme].sounds.powerUp}`);
    powerUpSound.play();
}

// Spawn new ball
function spawnNewBall() {
    if (balls.length >= MAX_BALLS) return;
    
    const newBall = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: ball.radius,
        dx: ball.baseSpeed * (Math.random() > 0.5 ? 1 : -1),
        dy: ball.baseSpeed * (Math.random() > 0.5 ? 1 : -1),
        spin: 0
    };
    
    balls.push(newBall);
    lastBallSpawn = Date.now();
}

// Create particle effect
function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x,
            y,
            size: Math.random() * 3 + 1,
            color: color || themes[currentTheme].colors.particle,
            speedX: (Math.random() - 0.5) * 5,
            speedY: (Math.random() - 0.5) * 5,
            life: 1.0
        });
    }
}

// Update particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.life -= 0.02;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Draw particles
function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// Time warp system
function activateTimeWarp() {
    if (!timeWarpActive && Math.random() < 0.1) { // 10% chance to activate
        timeWarpActive = true;
        setTimeout(() => {
            timeWarpActive = false;
        }, 2000); // Lasts 2 seconds
    }
}

// Combo system
function updateComboSystem() {
    const currentTime = Date.now();
    if (currentTime - lastRallyTime < 2000) { // 2 second window for combos
        comboCounter++;
        if (comboCounter >= 5) {
            comboMultiplier = Math.min(5, 1 + Math.floor(comboCounter / 5));
            createComboEffect();
        }
    } else {
        comboCounter = 0;
        comboMultiplier = 1;
    }
    lastRallyTime = currentTime;
}

function createComboEffect() {
    // Visual effect for combos
    for (let i = 0; i < comboMultiplier * 2; i++) {
        createParticles(
            canvas.width / 2,
            canvas.height / 2,
            themes[currentTheme].colors.powerUp
        );
    }
}

// AI personality system
function updateAIPersonality() {
    personalityChangeTimer += 16; // Assuming 60fps
    if (personalityChangeTimer >= PERSONALITY_CHANGE_INTERVAL) {
        const personalities = Object.keys(aiPersonalities);
        const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];
        currentAIPersonality = aiPersonalities[randomPersonality];
        personalityChangeTimer = 0;
        
        // Visual indicator of personality change
        createParticles(
            player2.x + player2.width / 2,
            player2.y + player2.height / 2,
            themes[currentTheme].colors.particle
        );
    }
}

// Adaptive difficulty
function updateAdaptiveDifficulty() {
    if (!adaptiveDifficulty.enabled) return;
    
    const scoreDiff = Math.abs(player1.score - player2.score);
    if (scoreDiff >= adaptiveDifficulty.scoreDifferenceThreshold) {
        const leadingPlayer = player1.score > player2.score ? player1 : player2;
        const trailingPlayer = player1.score > player2.score ? player2 : player1;
        
        // Increase ball speed
        ball.baseSpeed = Math.min(
            adaptiveDifficulty.maxSpeed,
            adaptiveDifficulty.baseSpeed + (scoreDiff * 0.5)
        );
        
        // Reduce paddle size
        trailingPlayer.height = Math.max(
            50,
            trailingPlayer.height * (1 - adaptiveDifficulty.paddleSizeReduction)
        );
    }
}

// High score system
function updateHighScores(score, name, mode) {
    const scores = highScores[mode] || [];
    scores.push({ score, name, date: new Date().toISOString() });
    scores.sort((a, b) => b.score - a.score);
    highScores[mode] = scores.slice(0, 10); // Keep top 10
    
    // Save to localStorage
    localStorage.setItem('pongHighScores', JSON.stringify(highScores));
}

// Theme unlocks
function checkThemeUnlocks() {
    Object.entries(themeUnlocks).forEach(([theme, data]) => {
        if (!data.unlocked && player1.score >= data.scoreRequired) {
            data.unlocked = true;
            // Show unlock notification
            showNotification(`Unlocked ${theme} theme!`);
        }
    });
}

// Debug system
function updateDebugInfo() {
    if (!debug.enabled) return;
    
    debug.frameCount++;
    const currentTime = Date.now();
    if (currentTime - debug.lastFpsUpdate >= 1000) {
        debug.fps = Math.round((debug.frameCount * 1000) / (currentTime - debug.lastFpsUpdate));
        debug.frameCount = 0;
        debug.lastFpsUpdate = currentTime;
    }
}

function drawDebugInfo() {
    if (!debug.enabled) return;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    const debugInfo = [
        `FPS: ${debug.fps}`,
        `Game Mode: ${currentGameMode}`,
        `Combo: ${comboCounter}x${comboMultiplier}`,
        `AI Personality: ${currentAIPersonality.name}`,
        `Ball Speed: ${ball.baseSpeed}`,
        `Time Warp: ${timeWarpActive ? 'Active' : 'Inactive'}`
    ];
    
    debugInfo.forEach((info, index) => {
        ctx.fillText(info, 10, 20 + (index * 15));
    });
}

// Update game state with new features
function updateGameState() {
    if (!gameStarted || gamePaused) return;
    
    // Update debug info
    updateDebugInfo();
    
    // Check for time warp activation
    if (Math.abs(ball.x - player1.x) < 50 || Math.abs(ball.x - player2.x) < 50) {
        activateTimeWarp();
    }
    
    // Update combo system
    updateComboSystem();
    
    // Update AI personality
    if (gameMode === 'single') {
        updateAIPersonality();
    }
    
    // Update adaptive difficulty
    updateAdaptiveDifficulty();
    
    // Check theme unlocks
    checkThemeUnlocks();
    
    // Update power-ups
    if (Date.now() - powerUps.lastSpawn > powerUps.spawnInterval) {
        spawnPowerUp();
    }
    
    // Check power-up collisions
    powerUps.active.forEach((powerUp, index) => {
        if (checkCollision(ball, powerUp)) {
            applyPowerUp(player1, powerUp);
            powerUps.active.splice(index, 1);
            createParticles(powerUp.x, powerUp.y, themes[currentTheme].colors.powerUp);
        }
    });
    
    // Update active power-ups
    player1.powerUps.forEach((powerUp, index) => {
        if (Date.now() - powerUp.startTime > powerUps.duration) {
            removePowerUp(player1, powerUp.type);
            player1.powerUps.splice(index, 1);
        }
    });
    
    // Update paddle positions with spin effect
    if (player1.moving === 'up') {
        player1.y -= player1.speed;
        ball.spin = -1;
    } else if (player1.moving === 'down') {
        player1.y += player1.speed;
        ball.spin = 1;
    }
    
    if (gameMode === 'single') {
        updateAI();
    } else if (player2.moving === 'up') {
        player2.y -= player2.speed;
    } else if (player2.moving === 'down') {
        player2.y += player2.speed;
    }
    
    // Keep paddles within canvas bounds
    if (player1.y < 0) player1.y = 0;
    if (player1.y + player1.height > canvas.height) player1.y = canvas.height - player1.height;
    if (player2.y < 0) player2.y = 0;
    if (player2.y + player2.height > canvas.height) player2.y = canvas.height - player2.height;
    
    // Update all balls
    [ball, ...balls].forEach(b => {
        // Apply spin effect
        b.dy += b.spin * 0.1;
        b.spin *= 0.99; // Dampen spin over time
        
        // Update position
        b.x += b.dx * speedMultiplier;
        b.y += b.dy * speedMultiplier;
        
        // Ball collision with top and bottom
        if (b.y - b.radius < 0 || b.y + b.radius > canvas.height) {
            b.dy = -b.dy;
            createParticles(b.x, b.y);
            if (wallHitSound) wallHitSound.play();
        }
        
        // Ball collision with paddles
        if (b.dx < 0) {
            if (b.x - b.radius < player1.x + player1.width &&
                b.y > player1.y &&
                b.y < player1.y + player1.height) {
                b.dx = -b.dx;
                b.spin = player1.moving ? (player1.moving === 'up' ? -1 : 1) : 0;
                createParticles(b.x, b.y);
                if (paddleHitSound) paddleHitSound.play();
            }
        } else {
            if (b.x + b.radius > player2.x &&
                b.y > player2.y &&
                b.y < player2.y + player2.height) {
                b.dx = -b.dx;
                b.spin = player2.moving ? (player2.moving === 'up' ? -1 : 1) : 0;
                createParticles(b.x, b.y);
                if (paddleHitSound) paddleHitSound.play();
            }
        }
        
        // Score points
        if (b.x - b.radius < 0) {
            player2.score++;
            createParticles(b.x, b.y);
            if (scoreSound) scoreSound.play();
            resetBall(b);
        } else if (b.x + b.radius > canvas.width) {
            player1.score++;
            createParticles(b.x, b.y);
            if (scoreSound) scoreSound.play();
            resetBall(b);
        }
    });
    
    // Update particles
    updateParticles();
    
    // Update progress bar
    updateProgressBar();
    
    // Update score display with animation
    updateScoreDisplay();
}

// Update progress bar
function updateProgressBar() {
    const totalScore = player1.score + player2.score;
    const progress = player1.score / totalScore;
    progressBar.x = canvas.width / 2 - progressBar.width / 2;
    progressBar.y = canvas.height - 20;
    
    // Draw progress bar
    ctx.fillStyle = themes[currentTheme].colors.background;
    ctx.fillRect(progressBar.x, progressBar.y, progressBar.width, progressBar.height);
    ctx.fillStyle = themes[currentTheme].colors.paddle;
    ctx.fillRect(progressBar.x, progressBar.y, progressBar.width * progress, progressBar.height);
}

// Update score display with animation
function updateScoreDisplay() {
    const scoreElement = document.getElementById('score');
    scoreElement.textContent = `${player1.score} - ${player2.score}`;
    scoreElement.classList.add('score-animation');
    setTimeout(() => scoreElement.classList.remove('score-animation'), 500);
}

// Draw game with new features
function drawGame() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = themes[currentTheme].colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw paddles
    ctx.fillStyle = themes[currentTheme].colors.paddle;
    ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
    ctx.fillRect(player2.x, player2.y, player2.width, player2.height);
    
    // Draw balls
    ctx.fillStyle = themes[currentTheme].colors.ball;
    [ball, ...balls].forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw power-ups
    powerUps.active.forEach(powerUp => {
        ctx.fillStyle = themes[currentTheme].colors.powerUp;
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    });
    
    // Draw particles
    drawParticles();
    
    // Draw progress bar
    updateProgressBar();
    
    // Draw score
    ctx.font = '32px Arial';
    ctx.fillStyle = themes[currentTheme].colors.paddle;
    ctx.textAlign = 'center';
    ctx.fillText(`${player1.score} - ${player2.score}`, canvas.width / 2, 50);
    
    // Draw debug info
    drawDebugInfo();
    
    // Draw combo multiplier
    if (comboMultiplier > 1) {
        ctx.fillStyle = themes[currentTheme].colors.powerUp;
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${comboMultiplier}x`, canvas.width / 2, 100);
    }
    
    // Draw time warp effect
    if (timeWarpActive) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Initialize game with new features
window.addEventListener('load', () => {
    resizeCanvas();
    initGame();
    initAudio();
    
    // Load high scores
    const savedScores = localStorage.getItem('pongHighScores');
    if (savedScores) {
        Object.assign(highScores, JSON.parse(savedScores));
    }
    
    // Initialize debug system
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F3') {
            debug.enabled = !debug.enabled;
        }
    });
});

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