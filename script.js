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

// Mobile Back Button rokne ke liye
history.pushState(null, null, location.href);
window.onpopstate = function () { history.go(1); };

// ===== JIOSAAVN API & DECRYPTION SETUP =====
const CORS_PROXY = "https://api.allorigins.win/raw?url=";
const JIOSAAVN_SEARCH = "https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&api_version=4&ctx=web6dot0&q=";

// JioSaavn ke encrypted link ko decrypt karne ka function
function decryptUrl(encryptedUrl) {
    try {
        const key = CryptoJS.enc.Utf8.parse("38346591");
        const decrypted = CryptoJS.DES.decrypt(
            { ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl) },
            key,
            { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
        );
        let url = decrypted.toString(CryptoJS.enc.Utf8);
        // 96kbps ko 320kbps mein convert karo
        return url.replace('_96.mp4', '_320.mp4').replace('_96_p.mp4', '_320.mp4');
    } catch (e) {
        console.log("Decrypt error", e);
        return null;
    }
}

// Media Session (Lock screen controls)
function updateMediaSession(song) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.song || 'Unknown',
            artist: song.primary_artists || 'Artist',
            album: 'Arma Play',
            artwork: [{ src: song.image || 'https://via.placeholder.com/512', sizes: '512x512', type: 'image/jpeg' }]
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

// Home Screen Load (Arijit Singh ke songs)
async function loadHomeScreen() {
    try {
        document.getElementById('quickGrid').innerHTML = '<p style="color:#aaa; font-size:12px;">Loading...</p>';
        const res = await fetch(`${CORS_PROXY}${encodeURIComponent(JIOSAAVN_SEARCH + 'arijit singh')}`);
        const data = await res.json();
        homeSongsList = data.results || [];

        const quickGrid = document.getElementById('quickGrid');
        if (homeSongsList.length > 0) {
            quickGrid.innerHTML = homeSongsList.slice(0, 8).map((s, i) => `
                <div class="quick-item" onclick="playSong(${i}, 'home')">
                    <img src="${s.image || 'https://via.placeholder.com/56'}" alt="">
                    <span>${s.song}</span>
                </div>
            `).join('');
        }

        const jumpBackIn = document.getElementById('jumpBackIn');
        if (homeSongsList.length > 8) {
            jumpBackIn.innerHTML = homeSongsList.slice(8, 18).map((s, i) => `
                <div class="card" onclick="playSong(${i+8}, 'home')">
                    <img src="${s.image || 'https://via.placeholder.com/150'}" alt="">
                    <div class="card-title">${s.song}</div>
                    <div class="card-subtitle">${s.primary_artists}</div>
                </div>
            `).join('');
        }
    } catch(e) { 
        console.log("Home load error", e); 
        document.getElementById('quickGrid').innerHTML = '<p style="color:red; font-size:12px;">Network error. Refresh karein.</p>';
    }
}

// ===== FULL SONG PLAY =====
function playSong(index, sourceType) {
    let listToUse = sourceType === 'home' ? homeSongsList : songs;
    if (index < 0 || index >= listToUse.length) return;
    
    currentIndex = index;
    let s = listToUse[currentIndex];

    // Decrypt the link to get full 320kbps audio
    let streamUrl = decryptUrl(s.encrypted_media_url);
    
    if (!streamUrl) return alert("Gaane ka link nahi mila. Agla try karein.");

    audioPlayer.src = streamUrl;
    songTitle.textContent = s.song;
    artistName.textContent = s.primary_artists;
    coverArt.src = s.image;
    downloadBtn.href = streamUrl;
    downloadBtn.setAttribute('download', `${s.song}.mp4`);
    
    updateMediaSession(s);
    
    audioPlayer.play().then(() => {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    }).catch(e => alert("Playback error: " + e.message));
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
        const res = await fetch(`${CORS_PROXY}${encodeURIComponent(JIOSAAVN_SEARCH + q)}`);
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
                    <p class="t">${s.song}</p>
                    <p class="a">${s.primary_artists}</p>
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
    nextBtn.click(); // Auto next song
});

// Progress
audioPlayer.addEventListener('timeupdate', () => {
    if (audioPlayer.duration) {
        progressBar.style.width = ((audioPlayer.currentTime / audioPlayer.duration) * 100) + '%';
    }
});

window.onload = loadHomeScreen;
