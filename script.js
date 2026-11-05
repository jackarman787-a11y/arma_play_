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
let homeSongsList = [];

// ==========================================
// 🎵 NAYA JIOSAAVN API (CORS Proxy ke saath)
// ==========================================
const PROXY = "https://corsproxy.io/?";
const JIOSAAVN_SEARCH = "https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&api_version=4&ctx=web6dot0&q=";

// Mobile Back Button rokne ke liye
history.pushState(null, null, location.href);
window.onpopstate = function () {
    history.go(1);
};

// Media Session API (Lock screen controls)
function updateMediaSession(song) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.song || song.title || 'Unknown',
            artist: song.primary_artists || song.singers || 'Artist',
            album: 'Arma Play',
            artwork: [{ src: song.image || 'https://via.placeholder.com/512', sizes: '512x512', type: 'image/jpeg' }]
        });

        navigator.mediaSession.setActionHandler('play', () => {
            audioPlayer.play();
            playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        });
        navigator.mediaSession.setActionHandler('pause', () => {
            audioPlayer.pause();
            playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            nextBtn.click();
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            if (audioPlayer.currentTime > 3) {
                audioPlayer.currentTime = 0;
            } else {
                let isHome = !document.getElementById('homeScreen').classList.contains('hidden');
                let listToUse = isHome ? homeSongsList : songs;
                if (listToUse.length > 0 && currentIndex !== -1) {
                    let prevIndex = (currentIndex - 1 + listToUse.length) % listToUse.length;
                    playSong(prevIndex, isHome ? 'home' : 'search');
                }
            }
        });
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

// ===== HOME DATA FETCH =====
async function loadHomeScreen() {
    try {
        const res = await fetch(`${PROXY}${JIOSAAVN_SEARCH}arijit%20singh`);
        const data = await res.json();
        homeSongsList = data.results || [];

        const quickGrid = document.getElementById('quickGrid');
        if (homeSongsList.length > 0) {
            quickGrid.innerHTML = homeSongsList.slice(0, 8).map((s, i) => `
                <div class="quick-item" onclick="playSong(${i}, 'home')">
                    <img src="${s.image || 'https://via.placeholder.com/56'}" alt="">
                    <span>${s.song || s.title}</span>
                </div>
            `).join('');
        }

        const jumpBackIn = document.getElementById('jumpBackIn');
        if (homeSongsList.length > 8) {
            jumpBackIn.innerHTML = homeSongsList.slice(8, 18).map((s, i) => `
                <div class="card" onclick="playSong(${i+8}, 'home')">
                    <img src="${s.image || 'https://via.placeholder.com/150'}" alt="">
                    <div class="card-title">${s.song || s.title}</div>
                    <div class="card-subtitle">${s.primary_artists || s.singers}</div>
                </div>
            `).join('');
        }

        const recommended = document.getElementById('recommended');
        if (homeSongsList.length > 18) {
            recommended.innerHTML = homeSongsList.slice(18, 28).map((s, i) => `
                <div class="card" onclick="playSong(${i+18}, 'home')">
                    <img src="${s.image || 'https://via.placeholder.com/150'}" alt="">
                    <div class="card-title">${s.song || s.title}</div>
                    <div class="card-subtitle">${s.primary_artists || s.singers}</div>
                </div>
            `).join('');
        }
    } catch(e) {
        console.log("Home load error", e);
        document.getElementById('quickGrid').innerHTML = '<p style="color:red; font-size:12px;">Failed to load. Refresh karein.</p>';
    }
}

// ===== SONG PLAY (Full 320kbps) =====
function playSong(index, sourceType) {
    let listToUse = sourceType === 'home' ? homeSongsList : songs;
    if (index < 0 || index >= listToUse.length) return;
    
    currentIndex = index;
    let s = listToUse[currentIndex];

    // JioSaavn se 320kbps link nikalna
    let streamUrl = s.media_url || s.downloadUrl || null;
    
    // Agar 96kbps link hai, toh 320kbps mein badlo
    if (streamUrl && streamUrl.includes('_96')) {
        streamUrl = streamUrl.replace('_96.mp4', '_320.mp4').replace('_96.mp3', '_320.mp4');
    }

    if (!streamUrl) {
        alert("Is gaane ka link nahi mila. Agla try karein.");
        return;
    }

    audioPlayer.src = streamUrl;
    songTitle.textContent = s.song || s.title || 'Unknown';
    artistName.textContent = s.primary_artists || s.singers || 'Artist';
    coverArt.src = s.image || 'https://via.placeholder.com/44';
    downloadBtn.href = streamUrl;
    
    updateMediaSession(s);
    
    audioPlayer.play().then(() => {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    }).catch(e => {
        alert("Playback error: " + e.message);
    });
}

// ===== SEARCH =====
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
        const res = await fetch(`${PROXY}${JIOSAAVN_SEARCH}${encodeURIComponent(q)}`);
        const data = await res.json();
        songs = data.results || [];

        if (songs.length === 0) {
            statusMsg.textContent = 'No songs found.';
            songList.innerHTML = '';
            return;
        }
        statusMsg.textContent = '';
        
        songList.innerHTML = songs.map((s, i) => `
            <li class="song-item" onclick="playSong(${i}, 'search')">
                <img src="${s.image || 'https://via.placeholder.com/45'}" alt="">
                <div class="song-info">
                    <p class="t">${s.song || s.title}</p>
                    <p class="a">${s.primary_artists || s.singers || 'Artist'}</p>
                </div>
                <i class="fa-solid fa-play"></i>
            </li>
        `).join('');
    } catch (err) {
        statusMsg.textContent = 'Error searching.';
        console.log(err);
    }
}

// ===== CONTROLS =====
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
    // Auto-next
    let isHome = !document.getElementById('homeScreen').classList.contains('hidden');
    let listToUse = isHome ? homeSongsList : songs;
    if (listToUse.length > 0) playSong((currentIndex + 1) % listToUse.length, isHome ? 'home' : 'search');
});

// Progress
audioPlayer.addEventListener('timeupdate', () => {
    if (audioPlayer.duration) {
        progressBar.style.width = ((audioPlayer.currentTime / audioPlayer.duration) * 100) + '%';
    }
});

// App Start
window.onload = loadHomeScreen;
