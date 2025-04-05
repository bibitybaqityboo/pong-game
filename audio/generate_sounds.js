const fs = require('fs');
const { exec } = require('child_process');

// Generate paddle hit sound
exec('ffmpeg -f lavfi -i "sine=frequency=800:duration=0.1" -c:a libmp3lame audio/paddle.mp3', (error) => {
    if (error) console.error('Error generating paddle sound:', error);
});

// Generate wall hit sound
exec('ffmpeg -f lavfi -i "sine=frequency=400:duration=0.1" -c:a libmp3lame audio/wall.mp3', (error) => {
    if (error) console.error('Error generating wall sound:', error);
});

// Generate score sound
exec('ffmpeg -f lavfi -i "sine=frequency=1000:duration=0.2" -c:a libmp3lame audio/score.mp3', (error) => {
    if (error) console.error('Error generating score sound:', error);
}); 