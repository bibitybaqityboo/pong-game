const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const pauseScreen = document.getElementById('pauseScreen');
const settingsScreen = document.getElementById('settingsScreen');
const pauseBtn = document.getElementById('pauseBtn');
const settingsBtn = document.getElementById('settingsBtn');
const saveSettingsBtn = document.getElementById('saveSettings');
const closeSettingsBtn = document.getElementById('closeSettings');

// Audio elements
const bgMusic = document.getElementById('bgMusic');
const paddleHitSound = document.getElementById('paddleHit');
const wallHitSound = document.getElementById('wallHit');
const scoreSound = document.getElementById('score');
const powerupSound = document.getElementById('powerup');
const gameOverSound = document.getElementById('gameOver');

// Settings elements
const playerColorInput = document.getElementById('playerColor');
const computerColorInput = document.getElementById('computerColor');
const ballColorInput = document.getElementById('ballColor');
const bgColorInput = document.getElementById('bgColor');
const bgMusicVolume = document.getElementById('bgMusicVolume');
const sfxVolume = document.getElementById('sfxVolume');

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

// Game settings
let settings = {
    colors: {
        player: '#ffffff',
        computer: '#ffffff',
        ball: '#ffffff',
        background: '#000000'
    },
    sound: {
        bgMusicVolume: 50,
        sfxVolume: 100
    }
};

// Audio context and settings
let audioContext;
let bgMusicNode;
let bgMusicOscillator;
let bgMusicGain;
let sfxGain;

// Initialize audio
function initAudio() {
    try {
        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create gain nodes
        bgMusicGain = audioContext.createGain();
        sfxGain = audioContext.createGain();
        
        // Create background music
        bgMusicOscillator = audioContext.createOscillator();
        bgMusicOscillator.type = 'sine';
        bgMusicOscillator.frequency.setValueAtTime(220, audioContext.currentTime);
        bgMusicOscillator.connect(bgMusicGain);
        bgMusicGain.connect(audioContext.destination);
        
        // Set initial volumes
        bgMusicGain.gain.value = settings.sound.bgMusicVolume / 100;
        sfxGain.gain.value = settings.sound.sfxVolume / 100;
        
        // Start the oscillator
        bgMusicOscillator.start();
        
        // Resume audio context on user interaction
        document.addEventListener('click', resumeAudioContext, { once: true });
        document.addEventListener('keydown', resumeAudioContext, { once: true });
        document.addEventListener('touchstart', resumeAudioContext, { once: true });
    } catch (e) {
        console.error('Web Audio API not supported:', e);
    }
}

// Resume audio context
function resumeAudioContext() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('Audio context resumed');
        }).catch(error => {
            console.error('Error resuming audio context:', error);
        });
    }
}

// Sound effects
function playPaddleHit() {
    if (!audioContext || audioContext.state !== 'running') return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(sfxGain);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        console.error('Error playing paddle hit sound:', e);
    }
}

function playWallHit() {
    if (!audioContext || audioContext.state !== 'running') return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(sfxGain);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.05);
    } catch (e) {
        console.error('Error playing wall hit sound:', e);
    }
}

function playScore() {
    if (!audioContext || audioContext.state !== 'running') return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.2);
        oscillator.connect(gainNode);
        gainNode.connect(sfxGain);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
        console.error('Error playing score sound:', e);
    }
}

function playPowerup() {
    if (!audioContext || audioContext.state !== 'running') return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);
        oscillator.connect(gainNode);
        gainNode.connect(sfxGain);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        console.error('Error playing powerup sound:', e);
    }
}

function playGameOver() {
    if (!audioContext || audioContext.state !== 'running') return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 0.5);
        oscillator.connect(gainNode);
        gainNode.connect(sfxGain);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.error('Error playing game over sound:', e);
    }
}

// Load saved settings
function loadSettings() {
    const savedSettings = localStorage.getItem('pongSettings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
        applySettings();
    }
}

// Save settings
function saveSettings() {
    settings.colors.player = playerColorInput.value;
    settings.colors.computer = computerColorInput.value;
    settings.colors.ball = ballColorInput.value;
    settings.colors.background = bgColorInput.value;
    settings.sound.bgMusicVolume = parseInt(bgMusicVolume.value);
    settings.sound.sfxVolume = parseInt(sfxVolume.value);
    
    localStorage.setItem('pongSettings', JSON.stringify(settings));
    applySettings();
}

// Apply settings
function applySettings() {
    // Update color inputs
    playerColorInput.value = settings.colors.player;
    computerColorInput.value = settings.colors.computer;
    ballColorInput.value = settings.colors.ball;
    bgColorInput.value = settings.colors.background;
    
    // Update volume inputs
    bgMusicVolume.value = settings.sound.bgMusicVolume;
    sfxVolume.value = settings.sound.sfxVolume;
    
    // Apply volumes
    if (bgMusicGain) {
        bgMusicGain.gain.value = settings.sound.bgMusicVolume / 100;
    }
    if (sfxGain) {
        sfxGain.gain.value = settings.sound.sfxVolume / 100;
    }
}

// Game objects
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    speed: 5,
    dx: 5,
    dy: 5
};

const player1 = {
    width: 10,
    height: 100,
    x: 10,
    y: canvas.height / 2 - 50,
    speed: 8,
    moving: null,
    score: 0
};

const player2 = {
    width: 10,
    height: 100,
    x: canvas.width - 20,
    y: canvas.height / 2 - 50,
    speed: 8,
    moving: null,
    score: 0
};

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
document.querySelectorAll('.mode-btn').forEach(button => {
    button.addEventListener('click', () => {
        gameMode = button.dataset.mode;
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update instructions visibility
        document.querySelector('.instructions').style.display = 
            gameMode === 'single' ? 'block' : 'none';
        document.querySelector('.two-player-instructions').style.display = 
            gameMode === 'two' ? 'block' : 'none';
    });
});

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
canvas.addEventListener('touchend', () => {
    player1.moving = null;
    player2.moving = null;
});

pauseBtn.addEventListener('click', togglePause);
settingsBtn.addEventListener('click', openSettings);
saveSettingsBtn.addEventListener('click', saveSettings);
closeSettingsBtn.addEventListener('click', closeSettings);

// Initialize audio when the game starts
document.addEventListener('DOMContentLoaded', () => {
    initAudio();
    loadSettings();
});

// Handle keyboard controls
function handleKeyDown(e) {
    if (gameMode === 'single') {
        if (e.key === 'ArrowUp') {
            player1.moving = 'up';
        } else if (e.key === 'ArrowDown') {
            player1.moving = 'down';
        }
    } else {
        // Two player mode
        if (e.key === 'w' || e.key === 'W') {
            player1.moving = 'up';
        } else if (e.key === 's' || e.key === 'S') {
            player1.moving = 'down';
        } else if (e.key === 'ArrowUp') {
            player2.moving = 'up';
        } else if (e.key === 'ArrowDown') {
            player2.moving = 'down';
        }
    }
    
    if (e.key === ' ') { // Spacebar
        togglePause();
    }
}

function handleKeyUp(e) {
    if (gameMode === 'single') {
        if ((e.key === 'ArrowUp' && player1.moving === 'up') ||
            (e.key === 'ArrowDown' && player1.moving === 'down')) {
            player1.moving = null;
        }
    } else {
        // Two player mode
        if ((e.key === 'w' || e.key === 'W') && player1.moving === 'up') {
            player1.moving = null;
        } else if ((e.key === 's' || e.key === 'S') && player1.moving === 'down') {
            player1.moving = null;
        } else if (e.key === 'ArrowUp' && player2.moving === 'up') {
            player2.moving = null;
        } else if (e.key === 'ArrowDown' && player2.moving === 'down') {
            player2.moving = null;
        }
    }
}

// Handle touch controls
function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const relativeY = touch.clientY - rect.top;
    
    if (relativeY < rect.height / 2) {
        player1.moving = 'up';
    } else {
        player1.moving = 'down';
    }
}

function togglePause() {
    if (!gameStarted) return;
    
    gamePaused = !gamePaused;
    pauseScreen.classList.toggle('hidden', !gamePaused);
    
    if (gamePaused) {
        if (bgMusicGain) {
            bgMusicGain.gain.value = 0;
        }
    } else {
        if (bgMusicGain) {
            bgMusicGain.gain.value = settings.sound.bgMusicVolume / 100;
        }
        requestAnimationFrame(gameLoop);
    }
}

function openSettings() {
    settingsScreen.classList.remove('hidden');
    pauseScreen.classList.add('hidden');
}

function closeSettings() {
    settingsScreen.classList.add('hidden');
    pauseScreen.classList.remove('hidden');
}

function startGame() {
    gameStarted = true;
    startScreen.classList.add('hidden');
    resetGame();
    
    // Resume audio context if needed
    resumeAudioContext();
    
    // Set background music volume
    if (bgMusicGain) {
        bgMusicGain.gain.value = settings.sound.bgMusicVolume / 100;
    }
    
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    // Reset ball position and direction
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = difficulties[difficulty].ballSpeed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = difficulties[difficulty].ballSpeed * (Math.random() * 2 - 1);
    
    // Reset paddle positions
    player1.y = canvas.height / 2 - player1.height / 2;
    player2.y = canvas.height / 2 - player2.height / 2;
    
    // Reset scores
    player1.score = 0;
    player2.score = 0;
    document.getElementById('playerScore').textContent = '0';
    document.getElementById('computerScore').textContent = '0';
    
    // Reset speed multiplier
    speedMultiplier = 1.0;
    lastSpeedIncrease = 0;
    
    // Update computer paddle speed based on difficulty
    if (gameMode === 'single') {
        player2.speed = difficulties[difficulty].computerSpeed;
    }
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
    
    // Set background color
    ctx.fillStyle = settings.colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Move paddles
    if (player1.moving === 'up' && player1.y > 0) {
        player1.y -= player1.speed;
    } else if (player1.moving === 'down' && player1.y + player1.height < canvas.height) {
        player1.y += player1.speed;
    }
    
    if (gameMode === 'single') {
        // Computer paddle AI
        const paddleCenter = player2.y + player2.height / 2;
        if (paddleCenter < ball.y - 35) {
            player2.y += player2.speed;
        }
        if (paddleCenter > ball.y + 35) {
            player2.y -= player2.speed;
        }
    } else {
        // Two player mode
        if (player2.moving === 'up' && player2.y > 0) {
            player2.y -= player2.speed;
        } else if (player2.moving === 'down' && player2.y + player2.height < canvas.height) {
            player2.y += player2.speed;
        }
    }
    
    // Keep paddles in bounds
    if (player1.y < 0) player1.y = 0;
    if (player1.y + player1.height > canvas.height) {
        player1.y = canvas.height - player1.height;
    }
    if (player2.y < 0) player2.y = 0;
    if (player2.y + player2.height > canvas.height) {
        player2.y = canvas.height - player2.height;
    }
    
    // Move ball with speed multiplier
    ball.x += ball.dx * speedMultiplier;
    ball.y += ball.dy * speedMultiplier;
    
    // Increase speed over time
    const currentTime = Date.now();
    if (currentTime - lastSpeedIncrease > SPEED_INCREASE_INTERVAL) {
        speedMultiplier = Math.min(speedMultiplier + 0.1, MAX_SPEED_MULTIPLIER);
        lastSpeedIncrease = currentTime;
        playPowerup();
    }
    
    // Ball collision with top and bottom
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
        playWallHit();
    }
    
    // Ball collision with paddles
    if (ball.x - ball.radius < player1.x + player1.width &&
        ball.y > player1.y &&
        ball.y < player1.y + player1.height) {
        ball.dx = -ball.dx;
        playPaddleHit();
    }
    
    if (ball.x + ball.radius > player2.x &&
        ball.y > player2.y &&
        ball.y < player2.y + player2.height) {
        ball.dx = -ball.dx;
        playPaddleHit();
    }
    
    // Score points
    if (ball.x - ball.radius < 0) {
        player2.score++;
        document.getElementById('computerScore').textContent = player2.score;
        playScore();
        resetBall();
    }
    if (ball.x + ball.radius > canvas.width) {
        player1.score++;
        document.getElementById('playerScore').textContent = player1.score;
        playScore();
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
    ctx.fillStyle = settings.colors.ball;
    ctx.fill();
    ctx.closePath();
    
    // Draw paddles
    ctx.fillStyle = settings.colors.player;
    ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
    ctx.fillStyle = settings.colors.computer;
    ctx.fillRect(player2.x, player2.y, player2.width, player2.height);
    
    // Draw center line
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.setLineDash([]);
} 