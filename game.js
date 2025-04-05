// Canvas setup
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
let gameMode = 'single'; // 'single' or 'multiplayer'
let speedMultiplier = 1;
let lastSpeedIncrease = 0;
const SPEED_INCREASE_INTERVAL = 10000; // Increase speed every 10 seconds
const MAX_SPEED_MULTIPLIER = 2.0; // Maximum speed multiplier
let isPaused = false;
let gameOver = false;
let roundTimer = 30; // 30 seconds per round
let currentRound = 1;
let maxRounds = 3;
let isSuddenDeath = false;
let lastPositions = []; // Store last positions for replay
let replayMode = false;
let replayIndex = 0;
let xp = 0;
let level = 1;
let skillPoints = 0;
let activeSkills = [];
let dailyChallenge = null;
let eventWheel = [];
let currentEvent = null;
let eventTimer = 0;
let screenFlipTimer = 0;
let invisibleBallTimer = 0;
let teleportZones = [];
let magnetPaddles = { left: false, right: false };
let shields = { left: false, right: false };
let clonedBalls = [];
let backgroundEffects = {
    shake: false,
    pulse: false,
    colorShift: false
};
let commentator = {
    lastComment: 0,
    cooldown: 2000,
    phrases: [
        { text: "UNSTOPPABLE!", trigger: "combo" },
        { text: "What a save!", trigger: "save" },
        { text: "Incredible rally!", trigger: "longRally" },
        { text: "Perfect aim!", trigger: "perfectHit" }
    ]
};

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

// Particle system
const particles = [];
const PARTICLE_COUNT = 10;
const PARTICLE_LIFETIME = 20;

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.lifetime = PARTICLE_LIFETIME;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.dx = Math.cos(angle) * speed;
        this.dy = Math.sin(angle) * speed;
        this.size = Math.random() * 3 + 2;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.lifetime--;
        this.size *= 0.95;
    }

    draw(ctx) {
        ctx.fillStyle = `${this.color}${Math.floor(this.lifetime * 255 / PARTICLE_LIFETIME).toString(16).padStart(2, '0')}`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Theme system
const themes = {
    retro: {
        colors: {
            background: '#000000',
            paddle: '#FFFFFF',
            ball: '#FFFFFF'
        },
        sounds: {
            paddle: 'audio/8bit-paddle.mp3',
            wall: 'audio/8bit-wall.mp3',
            score: 'audio/8bit-score.mp3',
            background: 'audio/background.mp3'
        }
    },
    neon: {
        colors: {
            background: '#000000',
            paddle: '#00FFFF',
            ball: '#FF00FF'
        },
        sounds: {
            paddle: 'audio/synth-paddle.mp3',
            wall: 'audio/synth-wall.mp3',
            score: 'audio/synth-score.mp3',
            background: 'audio/background.mp3'
        }
    },
    minimalist: {
        colors: {
            background: '#FFFFFF',
            paddle: '#000000',
            ball: '#000000'
        },
        sounds: {
            paddle: 'audio/minimal-paddle.mp3',
            wall: 'audio/minimal-wall.mp3',
            score: 'audio/minimal-score.mp3',
            background: 'audio/background.mp3'
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

// Setup event listeners
function setupEventListeners() {
    // Start game button
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', () => {
            gameStarted = true;
            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('gameContainer').style.display = 'block';
        });
    }

    // Settings button
    const settingsButton = document.getElementById('settingsButton');
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            document.getElementById('settingsScreen').style.display = 'flex';
        });
    }

    // Close settings button
    const closeSettingsButton = document.getElementById('closeSettingsButton');
    if (closeSettingsButton) {
        closeSettingsButton.addEventListener('click', () => {
            document.getElementById('settingsScreen').style.display = 'none';
        });
    }

    // Resume button
    const resumeButton = document.getElementById('resumeButton');
    if (resumeButton) {
        resumeButton.addEventListener('click', () => {
            togglePause();
        });
    }

    // Restart button
    const restartButton = document.getElementById('restartButton');
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            leftPaddle.score = 0;
            rightPaddle.score = 0;
            document.getElementById('leftScore').textContent = '0';
            document.getElementById('rightScore').textContent = '0';
            resetBall();
            resetPaddles();
            togglePause();
        });
    }

    // Game mode buttons
    const gameModeButtons = document.querySelectorAll('.game-mode-button');
    gameModeButtons.forEach(button => {
        button.addEventListener('click', () => {
            gameMode = button.dataset.mode;
            gameModeButtons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Difficulty buttons
    const difficultyButtons = document.querySelectorAll('.difficulty-button');
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            difficulty = button.dataset.difficulty;
            difficultyButtons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Theme buttons
    const themeButtons = document.querySelectorAll('.theme-button');
    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentTheme = button.dataset.theme;
            themeButtons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            loadThemeSounds();
        });
    });

    // Sound toggle
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.addEventListener('change', (e) => {
            const volume = e.target.checked ? 1 : 0;
            if (paddleHitSound) paddleHitSound.volume = volume;
            if (wallHitSound) wallHitSound.volume = volume;
            if (scoreSound) scoreSound.volume = volume;
        });
    }

    // Music toggle
    const musicToggle = document.getElementById('musicToggle');
    if (musicToggle) {
        musicToggle.addEventListener('change', (e) => {
            if (backgroundMusic) {
                backgroundMusic.volume = e.target.checked ? 0.5 : 0;
                if (e.target.checked && backgroundMusic.paused) {
                    backgroundMusic.play();
                }
            }
        });
    }

    // Volume slider
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            if (paddleHitSound) paddleHitSound.volume = volume;
            if (wallHitSound) wallHitSound.volume = volume;
            if (scoreSound) scoreSound.volume = volume;
            if (backgroundMusic) backgroundMusic.volume = volume * 0.5;
        });
    }
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

// Load theme sounds
function loadThemeSounds() {
    const theme = themes[currentTheme];
    if (theme.sounds) {
        paddleHitSound = new Audio(theme.sounds.paddle);
        wallHitSound = new Audio(theme.sounds.wall);
        scoreSound = new Audio(theme.sounds.score);
        if (theme.sounds.background) {
            backgroundMusic = new Audio(theme.sounds.background);
            backgroundMusic.loop = true;
        }
    }
}

// Initialize new systems
function initNewSystems() {
    // Initialize teleport zones
    teleportZones = [
        { x: canvas.width * 0.25, y: canvas.height * 0.25, width: 50, height: 50, pair: 1 },
        { x: canvas.width * 0.75, y: canvas.height * 0.25, width: 50, height: 50, pair: 1 },
        { x: canvas.width * 0.25, y: canvas.height * 0.75, width: 50, height: 50, pair: 2 },
        { x: canvas.width * 0.75, y: canvas.height * 0.75, width: 50, height: 50, pair: 2 }
    ];

    // Initialize event wheel
    eventWheel = [
        { name: "Giant Ball", duration: 10, effect: () => { ball.size = 20; } },
        { name: "No Walls", duration: 15, effect: () => { ball.wallBounce = false; } },
        { name: "Screen Flip", duration: 5, effect: () => { screenFlipTimer = 5; } },
        { name: "Invisible Ball", duration: 3, effect: () => { invisibleBallTimer = 3; } }
    ];

    // Load daily challenge
    loadDailyChallenge();
}

// Load daily challenge
function loadDailyChallenge() {
    const challenges = [
        { name: "No Movement", description: "Win a rally without moving your paddle", reward: 100 },
        { name: "Perfect Hits", description: "Score 3 points with perfect paddle hits", reward: 150 },
        { name: "Long Rally", description: "Keep a rally going for 30 seconds", reward: 200 }
    ];
    dailyChallenge = challenges[Math.floor(Math.random() * challenges.length)];
}

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
        dx: ball.speed * (Math.random() > 0.5 ? 1 : -1),
        dy: ball.speed * (Math.random() > 0.5 ? 1 : -1),
        spin: 0
    };
    
    balls.push(newBall);
    lastBallSpawn = Date.now();
}

// Create particle effect
function createParticles(x, y, color) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// Update particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].lifetime <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Draw particles
function drawParticles() {
    particles.forEach(particle => particle.draw(ctx));
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
            rightPaddle.x + rightPaddle.width / 2,
            rightPaddle.y + rightPaddle.height / 2,
            themes[currentTheme].colors.particle
        );
    }
}

// Adaptive difficulty
function updateAdaptiveDifficulty() {
    if (!adaptiveDifficulty.enabled) return;
    
    const scoreDiff = Math.abs(leftPaddle.score - rightPaddle.score);
    if (scoreDiff >= adaptiveDifficulty.scoreDifferenceThreshold) {
        const leadingPlayer = leftPaddle.score > rightPaddle.score ? leftPaddle : rightPaddle;
        const trailingPlayer = leftPaddle.score > rightPaddle.score ? rightPaddle : leftPaddle;
        
        // Increase ball speed
        ball.speed = Math.min(
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
        if (!data.unlocked && leftPaddle.score >= data.scoreRequired) {
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
        `Ball Speed: ${ball.speed}`,
        `Time Warp: ${timeWarpActive ? 'Active' : 'Inactive'}`
    ];
    
    debugInfo.forEach((info, index) => {
        ctx.fillText(info, 10, 20 + (index * 15));
    });
}

// Update game state with new features
function updateGameState() {
    if (isPaused || !gameStarted) return;
    
    // Update round timer
    if (gameMode === 'timed') {
        roundTimer -= 1/60;
        if (roundTimer <= 0) {
            endRound();
        }
    }

    // Update sudden death
    if (isSuddenDeath) {
        ball.speed *= 1.1;
        if (ball.speed > 20) ball.speed = 20;
    }

    // Update screen flip
    if (screenFlipTimer > 0) {
        screenFlipTimer -= 1/60;
    }

    // Update invisible ball
    if (invisibleBallTimer > 0) {
        invisibleBallTimer -= 1/60;
    }

    // Update magnet paddles
    if (magnetPaddles.left || magnetPaddles.right) {
        applyMagnetEffect();
    }

    // Update shields
    if (shields.left || shields.right) {
        updateShields();
    }

    // Update cloned balls
    if (clonedBalls.length > 0) {
        updateClonedBalls();
    }

    // Update background effects
    updateBackgroundEffects();

    // Update seasonal effects
    if (seasonalEffects.active) {
        updateSeasonalEffects();
    }

    // Update commentator
    updateCommentator();

    // Store positions for replay
    if (!replayMode) {
        lastPositions.push({
            ball: { ...ball },
            leftPaddle: { ...leftPaddle },
            rightPaddle: { ...rightPaddle }
        });
        if (lastPositions.length > 300) { // Store 5 seconds at 60fps
            lastPositions.shift();
        }
    }

    // Update debug info
    updateDebugInfo();
    
    // Check for time warp activation
    if (Math.abs(ball.x - leftPaddle.x) < 50 || Math.abs(ball.x - rightPaddle.x) < 50) {
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
            applyPowerUp(leftPaddle, powerUp);
            powerUps.active.splice(index, 1);
            createParticles(powerUp.x, powerUp.y, themes[currentTheme].colors.powerUp);
        }
    });
    
    // Update active power-ups
    leftPaddle.powerUps.forEach((powerUp, index) => {
        if (Date.now() - powerUp.startTime > powerUps.duration) {
            removePowerUp(leftPaddle, powerUp.type);
            leftPaddle.powerUps.splice(index, 1);
        }
    });
    
    // Update paddle positions with spin effect
    if (leftPaddle.dy !== 0) {
        leftPaddle.y += leftPaddle.dy;
        ball.spin = leftPaddle.dy > 0 ? -1 : 1;
    }
    
    if (gameMode === 'single') {
        updateAI();
    } else if (rightPaddle.dy !== 0) {
        rightPaddle.y += rightPaddle.dy;
    }
    
    // Keep paddles within canvas bounds
    if (leftPaddle.y < 0) leftPaddle.y = 0;
    if (leftPaddle.y + leftPaddle.height > canvas.height) leftPaddle.y = canvas.height - leftPaddle.height;
    if (rightPaddle.y < 0) rightPaddle.y = 0;
    if (rightPaddle.y + rightPaddle.height > canvas.height) rightPaddle.y = canvas.height - rightPaddle.height;
    
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
            if (b.x - b.radius < leftPaddle.x + leftPaddle.width &&
                b.y > leftPaddle.y &&
                b.y < leftPaddle.y + leftPaddle.height) {
                b.dx = -b.dx;
                b.spin = leftPaddle.dy ? (leftPaddle.dy > 0 ? -1 : 1) : 0;
                createParticles(b.x, b.y, themes[currentTheme].colors.paddle);
                if (paddleHitSound) paddleHitSound.play();
            }
        } else {
            if (b.x + b.radius > rightPaddle.x &&
                b.y > rightPaddle.y &&
                b.y < rightPaddle.y + rightPaddle.height) {
                b.dx = -b.dx;
                b.spin = rightPaddle.dy ? (rightPaddle.dy > 0 ? -1 : 1) : 0;
                createParticles(b.x, b.y, themes[currentTheme].colors.paddle);
                if (paddleHitSound) paddleHitSound.play();
            }
        }
        
        // Score points
        if (b.x - b.radius < 0) {
            rightPaddle.score++;
            createParticles(b.x, b.y);
            if (scoreSound) scoreSound.play();
            resetBall();
        } else if (b.x + b.radius > canvas.width) {
            leftPaddle.score++;
            createParticles(b.x, b.y);
            if (scoreSound) scoreSound.play();
            resetBall();
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
    const totalScore = leftPaddle.score + rightPaddle.score;
    const progress = leftPaddle.score / totalScore;
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
    scoreElement.textContent = `${leftPaddle.score} - ${rightPaddle.score}`;
    scoreElement.classList.add('score-animation');
    setTimeout(() => scoreElement.classList.remove('score-animation'), 500);
}

// Draw game with new features
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

    // Draw paddles with shadow effect
    ctx.fillStyle = themes[currentTheme].colors.paddle;
    ctx.shadowColor = themes[currentTheme].colors.paddle;
    ctx.shadowBlur = 10;
    ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
    ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

    // Draw ball with glow effect
    ctx.fillStyle = themes[currentTheme].colors.ball;
    ctx.shadowColor = themes[currentTheme].colors.ball;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw score with glow effect
    ctx.fillStyle = themes[currentTheme].colors.paddle;
    ctx.shadowColor = themes[currentTheme].colors.paddle;
    ctx.shadowBlur = 10;
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(leftPaddle.score, canvas.width / 4, 60);
    ctx.fillText(rightPaddle.score, (canvas.width / 4) * 3, 60);

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw game mode and difficulty if in single player
    if (gameMode === 'single') {
        ctx.font = '16px Arial';
        ctx.fillText(`Mode: Single Player - ${difficulty.toUpperCase()}`, canvas.width / 2, 30);
    } else {
        ctx.font = '16px Arial';
        ctx.fillText('Mode: Two Players', canvas.width / 2, 30);
    }

    // Draw particles
    drawParticles();
    
    // Draw progress bar
    updateProgressBar();
    
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

// Initialize game when window loads
window.addEventListener('load', () => {
    initGame();
    initAudio();
});

// Apply magnet effect
function applyMagnetEffect() {
    if (magnetPaddles.left) {
        const dx = leftPaddle.x - ball.x;
        const dy = leftPaddle.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 200) {
            ball.dx -= dx * 0.1 / distance;
            ball.dy -= dy * 0.1 / distance;
        }
    }
    if (magnetPaddles.right) {
        const dx = rightPaddle.x - ball.x;
        const dy = rightPaddle.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 200) {
            ball.dx -= dx * 0.1 / distance;
            ball.dy -= dy * 0.1 / distance;
        }
    }
}

// Update shields
function updateShields() {
    if (shields.left) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.fillRect(0, 0, 20, canvas.height);
    }
    if (shields.right) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.fillRect(canvas.width - 20, 0, 20, canvas.height);
    }
}

// Update cloned balls
function updateClonedBalls() {
    clonedBalls.forEach((clone, index) => {
        clone.x += clone.dx;
        clone.y += clone.dy;
        
        // Bounce off walls
        if (clone.y <= 0 || clone.y >= canvas.height) {
            clone.dy = -clone.dy;
        }
        
        // Check paddle collisions
        if (clone.x <= leftPaddle.x + leftPaddle.width &&
            clone.x >= leftPaddle.x &&
            clone.y >= leftPaddle.y &&
            clone.y <= leftPaddle.y + leftPaddle.height) {
            clone.dx = -clone.dx;
            clone.dx *= 1.1;
        }
        
        if (clone.x >= rightPaddle.x &&
            clone.x <= rightPaddle.x + rightPaddle.width &&
            clone.y >= rightPaddle.y &&
            clone.y <= rightPaddle.y + rightPaddle.height) {
            clone.dx = -clone.dx;
            clone.dx *= 1.1;
        }
        
        // Draw cloned ball
        ctx.beginPath();
        ctx.arc(clone.x, clone.y, clone.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
        ctx.closePath();
    });
}

// Update background effects
function updateBackgroundEffects() {
    if (backgroundEffects.shake) {
        canvas.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
    }
    if (backgroundEffects.pulse) {
        const pulse = Math.sin(Date.now() / 200) * 0.1 + 1;
        canvas.style.transform = `scale(${pulse})`;
    }
    if (backgroundEffects.colorShift) {
        const hue = (Date.now() / 1000) % 360;
        document.body.style.backgroundColor = `hsl(${hue}, 50%, 20%)`;
    }
}

// Update seasonal effects
function updateSeasonalEffects() {
    if (seasonalEffects.type === 'winter') {
        // Add snowflakes
        if (Math.random() < 0.1) {
            seasonalEffects.particles.push({
                x: Math.random() * canvas.width,
                y: 0,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 2 + 1
            });
        }
        
        seasonalEffects.particles.forEach((flake, index) => {
            flake.y += flake.speed;
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            
            if (flake.y > canvas.height) {
                seasonalEffects.particles.splice(index, 1);
            }
        });
    }
    // Add other seasonal effects here
}

// Update commentator
function updateCommentator() {
    const now = Date.now();
    if (now - commentator.lastComment > commentator.cooldown) {
        const phrase = commentator.phrases[Math.floor(Math.random() * commentator.phrases.length)];
        if (checkCommentTrigger(phrase.trigger)) {
            showComment(phrase.text);
            commentator.lastComment = now;
        }
    }
}

// Check comment trigger conditions
function checkCommentTrigger(trigger) {
    switch (trigger) {
        case 'combo':
            return comboCounter > 3;
        case 'save':
            return lastSaveTime > Date.now() - 1000;
        case 'longRally':
            return rallyTime > 5;
        case 'perfectHit':
            return lastHitPerfect;
        default:
            return false;
    }
}

// Show commentator text
function showComment(text) {
    const comment = document.createElement('div');
    comment.className = 'commentator-text';
    comment.textContent = text;
    document.body.appendChild(comment);
    
    setTimeout(() => {
        comment.remove();
    }, 2000);
}

// Handle screen flip
function handleScreenFlip() {
    if (screenFlipTimer > 0) {
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate(Math.PI);
        ctx.translate(-canvas.width/2, -canvas.height/2);
    }
}

// Handle teleport zones
function handleTeleportZones() {
    teleportZones.forEach(zone => {
        if (ball.x > zone.x && ball.x < zone.x + zone.width &&
            ball.y > zone.y && ball.y < zone.y + zone.height) {
            const pair = teleportZones.find(z => z.pair === zone.pair && z !== zone);
            if (pair) {
                ball.x = pair.x + pair.width/2;
                ball.y = pair.y + pair.height/2;
                createParticles(ball.x, ball.y, 20, 'teleport');
            }
        }
    });
}

// Handle ball size variation
function handleBallSizeVariation() {
    if (Math.random() < 0.001) { // 0.1% chance per frame
        ball.size = Math.random() * 10 + 5;
        createParticles(ball.x, ball.y, 10, 'sizeChange');
    }
}

// Handle invisible ball
function handleInvisibleBall() {
    if (invisibleBallTimer > 0) {
        ball.visible = false;
    } else {
        ball.visible = true;
    }
}

// Handle skill effects
function applySkillEffects() {
    // Ball curve
    if (skillTree.ballCurve.level > 0) {
        ball.dy += Math.sin(Date.now() / 500) * 0.1 * skillTree.ballCurve.level;
    }
    
    // Mid-air deflect
    if (skillTree.midAirDeflect.level > 0 && Math.random() < skillTree.midAirDeflect.chance) {
        ball.dx = -ball.dx;
        createParticles(ball.x, ball.y, 10, 'deflect');
    }
    
    // Paddle speed
    if (skillTree.paddleSpeed.level > 0) {
        rightPaddle.speed *= (1 + skillTree.paddleSpeed.effect * skillTree.paddleSpeed.level);
    }
    
    // Ball speed
    if (skillTree.ballSpeed.level > 0) {
        ball.speed *= (1 + skillTree.ballSpeed.effect * skillTree.ballSpeed.level);
    }
}

// Handle event wheel
function spinEventWheel() {
    if (eventWheel.length > 0) {
        const event = eventWheel[Math.floor(Math.random() * eventWheel.length)];
        currentEvent = event;
        event.effect();
        eventTimer = event.duration;
        
        showEventNotification(event.name);
    }
}

// Show event notification
function showEventNotification(eventName) {
    const notification = document.createElement('div');
    notification.className = 'event-notification';
    notification.textContent = `EVENT: ${eventName}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Handle replay
function startReplay() {
    if (lastPositions.length > 0) {
        replayMode = true;
        replayIndex = 0;
        gameStarted = false;
        isPaused = false;
    }
}

// Update replay
function updateReplay() {
    if (replayMode && replayIndex < lastPositions.length) {
        const state = lastPositions[replayIndex];
        ball = { ...state.ball };
        leftPaddle = { ...state.leftPaddle };
        rightPaddle = { ...state.rightPaddle };
        replayIndex++;
        
        if (replayIndex >= lastPositions.length) {
            replayMode = false;
            gameStarted = false;
        }
    }
}

// End round
function endRound() {
    if (currentRound < maxRounds) {
        currentRound++;
        roundTimer = 30;
        resetBall();
        isPaused = true;
        showRoundStart();
    } else {
        endGame();
    }
}

// Show round start
function showRoundStart() {
    const roundDisplay = document.createElement('div');
    roundDisplay.className = 'round-display';
    roundDisplay.textContent = `Round ${currentRound}`;
    document.body.appendChild(roundDisplay);
    
    setTimeout(() => {
        roundDisplay.remove();
        isPaused = false;
    }, 2000);
}

// Handle sudden death
function checkSuddenDeath() {
    if (leftPaddle.score >= 10 && rightPaddle.score >= 10) {
        isSuddenDeath = true;
        ball.speed *= 1.5;
        showSuddenDeathNotification();
    }
}

// Show sudden death notification
function showSuddenDeathNotification() {
    const notification = document.createElement('div');
    notification.className = 'sudden-death-notification';
    notification.textContent = 'SUDDEN DEATH!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// AI control for right paddle
function updateAI() {
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
}

// Toggle pause
function togglePause() {
    isPaused = !isPaused;
    const pauseScreen = document.getElementById('pauseScreen');
    if (pauseScreen) {
        pauseScreen.style.display = isPaused ? 'flex' : 'none';
    }
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
    updateParticles();

    // Draw game
    drawGame();
    drawBallTrail();
    drawParticles();

    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Ball trail effect
const ballTrail = [];
const MAX_TRAIL_LENGTH = 5;

// Update ball trail
function updateBallTrail() {
    ballTrail.push({ x: ball.x, y: ball.y });
    if (ballTrail.length > MAX_TRAIL_LENGTH) {
        ballTrail.shift();
    }
}

// Draw ball trail
function drawBallTrail() {
    for (let i = 0; i < ballTrail.length; i++) {
        const alpha = (i + 1) / ballTrail.length;
        ctx.fillStyle = `rgba(${getRGBValues(themes[currentTheme].colors.ball)}, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(ballTrail[i].x, ballTrail[i].y, ball.radius * (1 - i / ballTrail.length), 0, Math.PI * 2);
        ctx.fill();
    }
}

// Helper function to get RGB values from hex color
function getRGBValues(hex) {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    return `${r}, ${g}, ${b}`;
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

    // Update ball trail
    updateBallTrail();

    // Ball collision with top and bottom
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
        if (wallHitSound) wallHitSound.play();
    }

    // Ball collision with paddles
    if (ball.dx < 0) {
        if (ball.x - ball.radius < leftPaddle.x + leftPaddle.width &&
            ball.y > leftPaddle.y &&
            ball.y < leftPaddle.y + leftPaddle.height) {
            ball.dx = -ball.dx;
            if (paddleHitSound) paddleHitSound.play();
            createParticles(ball.x, ball.y, themes[currentTheme].colors.paddle);
        }
    } else {
        if (ball.x + ball.radius > rightPaddle.x &&
            ball.y > rightPaddle.y &&
            ball.y < rightPaddle.y + rightPaddle.height) {
            ball.dx = -ball.dx;
            if (paddleHitSound) paddleHitSound.play();
            createParticles(ball.x, ball.y, themes[currentTheme].colors.paddle);
        }
    }

    // Score points
    if (ball.x - ball.radius < 0) {
        rightPaddle.score++;
        document.getElementById('rightScore').textContent = rightPaddle.score;
        if (scoreSound) scoreSound.play();
        resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        leftPaddle.score++;
        document.getElementById('leftScore').textContent = leftPaddle.score;
        if (scoreSound) scoreSound.play();
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

    // Draw paddles with shadow effect
    ctx.fillStyle = themes[currentTheme].colors.paddle;
    ctx.shadowColor = themes[currentTheme].colors.paddle;
    ctx.shadowBlur = 10;
    ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
    ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

    // Draw ball with glow effect
    ctx.fillStyle = themes[currentTheme].colors.ball;
    ctx.shadowColor = themes[currentTheme].colors.ball;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw score with glow effect
    ctx.fillStyle = themes[currentTheme].colors.paddle;
    ctx.shadowColor = themes[currentTheme].colors.paddle;
    ctx.shadowBlur = 10;
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(leftPaddle.score, canvas.width / 4, 60);
    ctx.fillText(rightPaddle.score, (canvas.width / 4) * 3, 60);

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw game mode and difficulty if in single player
    if (gameMode === 'single') {
        ctx.font = '16px Arial';
        ctx.fillText(`Mode: Single Player - ${difficulty.toUpperCase()}`, canvas.width / 2, 30);
    } else {
        ctx.font = '16px Arial';
        ctx.fillText('Mode: Two Players', canvas.width / 2, 30);
    }

    // Draw particles
    drawParticles();
    
    // Draw progress bar
    updateProgressBar();
    
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