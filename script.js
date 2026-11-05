// ===== ELEMENTS =====
const searchInput  = document.getElementById('searchInput');
const songList     = document.getElementById('songList');
const statusMsg    = document.getElementById('statusMsg');
const audioPlayer  = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const nextBtn      = document.getElementById('nextBtn');
const songTitle    = document.getElementById('songTitle');
const artistName   = document.getElementById('artistName');
const coverArt     = document.getElementById('coverArt');
const downloadBtn  = document.getElementById('downloadBtn');
const progressBar  = document.getElementById('progressBar');

let songs = [];
let currentIndex = -1;

// Piped API (YouTube se full audio stream karta hai)
const API_BASE = "https://pipedapi.kavin.rocks";

// Mobile Back Button rokne ke liye
history.pushState(null, null, location.href);
window.onpopstate = function () { history.go(1); };

// Media Session (Lock screen controls)
function updateMediaSession(song) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.title,
            artist: song.uploaderName,
            album: 'Arma Play',
            artwork: [{ src: song.thumbnail, sizes: '512x512', type: 'image/jpeg' }]
        });
        navigator.mediaSession.setActionHandler('play', () => audioPlayer.play());
        navigator.mediaSession.setActionHandler('pause', () => audioPlayer.pause());
        navigator.mediaSession.setActionHandler('nexttrack', () => nextBtn.click());
    }
}

// Tab Switch
function switchTab(tab) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (tab === 'home') {
        document.getElementById('homeScreen').classList.remove('hidden');
        document.getElementById('searchScreen').classList.add('hidden');
        document.querySelector('.nav-item:nth-child(1)').classList.add('active');
    } else {
        document.getElementById('homeScreen').classList.add('hidden');
        document.getElementById('searchScreen').classList.remove('hidden');
        document.querySelector('.nav-item:nth-child(2)').classList.add('active');
    }
}

// Home Data Load
async function loadHomeScreen() {
    try {
        document.getElementById('quickGrid').innerHTML = '<p style="color:#aaa; font-size:12px;">Loading...</p>';
        
        // Popular songs fetch karo
        const res = await fetch(`${API_BASE}/search?q=arijit+singh&filter=music_songs`);
        const data = await res.json();
        
        homeSongsList = data.items ? data.items.filter(i => i.type === 'stream') : [];

        const quickGrid = document.getElementById('quickGrid');
        if (homeSongsList.length > 0) {
            quickGrid.innerHTML = homeSongsList.slice(0, 8).map((s, i) => `
                <div class="quick-item" onclick="playSong(${i}, 'home')">
                    <img src="${s.thumbnail}" alt="">
                    <span>${s.title}</span>
                </div>
            `).join('');
        }

        const jumpBackIn = document.getElementById('jumpBackIn');
        if (homeSongsList.length > 8) {
            jumpBackIn.innerHTML = homeSongsList.slice(8, 18).map((s, i) => `
                <div class="card" onclick="playSong(${i+8}, 'home')">
                    <img src="${s.thumbnail}" alt="">
                    <div class="card-title">${s.title}</div>
                    <div class="card-subtitle">${s.uploaderName}</div>
                </div>
            `).join('');
        }
    } catch(e) { 
        console.log("Home load error", e); 
        document.getElementById('quickGrid').innerHTML = '<p style="color:red; font-size:12px;">Network error. Refresh karein.</p>';
    }
}

// ===== FULL SONG PLAY (Direct Stream) =====
function playSong(index, sourceType) {
    let listToUse = sourceType === 'home' ? homeSongsList : songs;
    if (index < 0 || index >= listToUse.length) return;
    
    currentIndex = index;
    let s = listToUse[currentIndex];

    // Piped API videoId deti hai, usse stream URL banega
    // Hum direct URL nahi bana sakte kyunki API se stream fetch karna padta hai
    // Toh hum stream fetch karne ke liye alag function call karenge
    
    statusMsg.textContent = "Loading audio...";
    
    // Piped API ka video stream endpoint
    fetch(`${API_BASE}/streams/${s.url.split('=')[1]}`)
        .then(res => res.json())
        .then(data => {
            // Audio stream link dhundho
            let audioStream = data.audioStreams?.find(a => a.mimeType.includes('mp4'));
            
            if (!audioStream) throw new Error("Audio link nahi mila");

            audioPlayer.src = audioStream.url;
            songTitle.textContent = s.title;
            artistName.textContent = s.uploaderName;
            coverArt.src = s.thumbnail;
            downloadBtn.href = audioStream.url;
            
            updateMediaSession(s);
            statusMsg.textContent = "";
            
            audioPlayer.play().then(() => {
                playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            }).catch(e => alert("Playback error: " + e.message));
        })
        .catch(err => {
            alert("Gaana load nahi hua: " + err.message);
            statusMsg.textContent = "";
        });
}

// Search
let timer;
searchInput.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(searchSongs, 600);
});

async function searchSongs() {
    const q = searchInput.value.trim();
    if (!q) { songList.innerHTML = ''; statusMsg.textContent = ''; return; }
    statusMsg.textContent = 'Searching...';

    try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}&filter=music_songs`);
        const data = await res.json();
        songs = data.items ? data.items.filter(i => i.type === 'stream') : [];

        if (songs.length === 0) {
            statusMsg.textContent = 'No songs found.';
            songList.innerHTML = '';
            return;
        }
        statusMsg.textContent = '';
        
        songList.innerHTML = songs.map((s, i) => `
            <li class="song-item" onclick="playSong(${i}, 'search')">
                <img src="${s.thumbnail}" alt="">
                <div class="song-info">
                    <p class="t">${s.title}</p>
                    <p class="a">${s.uploaderName}</p>
                </div>
                <i class="fa-solid fa-play"></i>
            </li>
        `).join('');
    } catch (err) {
        statusMsg.textContent = 'Error searching.';
    }
}

// Controls
playPauseBtn.addEventListener('click', () => {
    if (!audioPlayer.src) return;
    if (audioPlayer.paused) audioPlayer.play();
    else audioPlayer.pause();
});

nextBtn.addEventListener('click', () => {
    let isHome = !document.getElementById('homeScreen').classList.contains('hidden');
    let listToUse = isHome ? homeSongsList : songs;
    if (listToUse.length > 0 && currentIndex !== -1) {
        playSong((currentIndex + 1) % listToUse.length, isHome ? 'home' : 'search');
    }
});

// Sync UI
audioPlayer.addEventListener('play',  () => playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>');
audioPlayer.addEventListener('pause', () => playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>');
audioPlayer.addEventListener('ended', () => {
    playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    nextBtn.click();
});

// Progress
audioPlayer.addEventListener('timeupdate', () => {
    if (audioPlayer.duration) {
        progressBar.style.width = ((audioPlayer.currentTime / audioPlayer.duration) * 100) + '%';
    }
});

window.onload = loadHomeScreen;
