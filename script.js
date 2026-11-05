const audioPlayer = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');

playBtn.addEventListener('click', () => {
    audioPlayer.play();
});

pauseBtn.addEventListener('click', () => {
    audioPlayer.pause();
});
