const audioPlayer = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');

playBtn.addEventListener('click', () => {
    audioPlayer.play();
});

pauseBtn.addEventListener('click', () => {
    
    audioPlayer.pause();
});
// गानों की लिस्ट (आप इसमें ऑनलाइन फ्री ऑडियो लिंक या अपने गाने जोड़ सकते हैं)
const availableSongs = [
    { title: "Sample Song 1", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { title: "Arma Beats", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { title: "Night Vibe", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

// करंट ऑडियो प्लेयर
let currentAudio = null;

// सर्च फंक्शन
function searchSongs() {
    let input = document.getElementById('searchInput').value.toLowerCase();
    let songList = document.getElementById('songList');
    songList.innerHTML = ""; // पुरानी लिस्ट साफ़ करें

    if (input === "") return;

    // गानों को फिल्टर करें
    let filteredSongs = availableSongs.filter(song => song.title.toLowerCase().includes(input));

    // रिजल्ट्स को स्क्रीन पर दिखाएं
    filteredSongs.forEach(song => {
        let li = document.createElement('li');
        li.textContent = song.title;
        li.onclick = () => playOnlineSong(song.url);
        songList.appendChildli(li);
    });
}

// गाना प्ले करने का फंक्शन
function playOnlineSong(url) {
    if (currentAudio) {
        currentAudio.pause(); // अगर कोई दूसरा गाना बज रहा है तो रोकें
    }
    currentAudio = new Audio(url);
    currentAudio.play();
    alert("गाना लॉन्च हो गया है!");
}
