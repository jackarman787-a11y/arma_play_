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

// Back button rokne ke liye
history.pushState(null, null, location.href);
window.onpopstate = function () { history.go(1); };

// ===== NAYA API (Jo seedha decrypted link deta hai) =====
// Yeh API JioSaavn ka data laati hai aur decrypt karke full link deti hai
const API_BASE = "https://jiosaavn-api-private-phi.vercel.app";

// Media Session (Lock screen controls)
function updateMediaSession(song) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.name || song.title || 'Unknown',
            artist: song.primaryArtists || song.singers || 'Artist',
            album: 'Arma Play',
            artwork: [{ src: song.image?.[2]?.link || song.image?.[1]?.link || 'https://via.placeholder.com/512', sizes: '512x512', type: 'image/jpeg' }]
        });
        navigator.mediaSession.setActionHandler('play', () => audioPlayer.play());
        navigator.mediaSession.setActionHandler('pause', () => audioPlayer.pause());
        navigator.mediaSession.setActionHandler('nexttrack', () => nextBtn.click());
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            if (audioPlayer.currentTime > 3) audioPlayer.currentTime = 0;
            else {
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

// Home load
async function loadHomeScreen() {
    try {
        const res = await fetch(`${API_BASE}/api/search/songs?query=arijit singh&limit=20`);
        const data = await res.json();
        homeSongsList = data.data?.results || data.results || [];

        const quickGrid = document.getElementById('quickGrid');
        if (homeSongsList.length > 0) {
            quickGrid.innerHTML = homeSongsList.slice(0, 8).map((s, i) => `
                <div class="quick-item" onclick="playSong(${i}, 'home')">
                    <img src="${s.image?.[1]?.link || 'https://via.placeholder.com/56'}" alt="">
                    <span>${s.name || s.title}</span>
                </div>
            `).join('');
        }
        const jumpBackIn = document.getElementById('jumpBackIn');
        if (homeSongsList.length > 8) {
            jumpBackIn.innerHTML = homeSongsList.slice(8, 18).map((s, i) => `
                <div class="card" onclick="playSong(${i+8}, 'home')">
                    <img src="${s.image?.[2]?.link || 'https://via.placeholder.com/150'}" alt="">
                    <div class="card-title">${s.name || s.title}</div>
                    <div class="card-subtitle">${s.primaryArtists || 'Artist'}</div>
                </div>
            `).join('');
        }
    } catch(e) { console.log("Home load error", e); }
}

// ===== PLAY SONG (FULL 320kbps) =====
function playSong(index, sourceType) {
    let listToUse = sourceType === 'home' ? homeSongsList : songs;
    if (index < 0 || index >= listToUse.length) return;
    
    currentIndex = index;
    let s = listToUse[currentIndex];

    // Naye API mein 'downloadUrl' array hota hai, jisme 320kbps ka link hota hai
    // Format: downloadUrl = [{ quality: '12kbps', link: '...' }, ..., { quality: '320kbps', link: '...' }]
    let streamUrl = null;
    
    if (s.downloadUrl && Array.isArray(s.downloadUrl)) {
        // 320kbps wala link dhundho
        let highQuality = s.downloadUrl.find(d => d.quality === '320kbps');
        streamUrl = highQuality ? highQuality.link : s.downloadUrl[s.downloadUrl.length - 1]?.link;
    } else if (s.media_url) {
        // Fallback: agar direct media_url hai toh use karo
        streamUrl = s.media_url;
    }

    if (!streamUrl) {
        alert("Is gaane ka link nahi mila. Agla try karein.");
        return;
    }

    // Agar link 96kbps hai toh 320kbps mein badlo (backup logic)
    if (streamUrl.includes('_96.mp4') || streamUrl.includes('_96_p.mp4')) {
        streamUrl = streamUrl.replace(/_96_p?\.mp4/g, '_320.mp4').replace('preview.saavncdn.com', 'aac.saavncdn.com');
    }

    audioPlayer.src = streamUrl;
    songTitle.textContent = s.name || s.title || 'Unknown';
    artistName.textContent = s.primaryArtists || s.singers || 'Artist';
    coverArt.src = s.image?.[1]?.link || 'https://via.placeholder.com/44';
    downloadBtn.href = streamUrl;
    
    updateMediaSession(s);
    audioPlayer.play().then(() => {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    }).catch(e => {
        alert("Playback error: " + e.message);
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
        const res = await fetch(`${API_BASE}/api/search/songs?query=${encodeURIComponent(q)}&limit=20`);
        const data = await res.json();
        songs = data.data?.results || data.results || [];

        if (songs.length === 0) {
            statusMsg.textContent = 'No songs found.';
            songList.innerHTML = '';
            return;
        }
        statusMsg.textContent = '';
        
        songList.innerHTML = songs.map((s, i) => `
            <li class="song-item" onclick="playSong(${i}, 'search')">
                <img src="${s.image?.[0]?.link || 'https://via.placeholder.com/45'}" alt="">
                <div class="song-info">
                    <p class="t">${s.name || s.title}</p>
                    <p class="a">${s.primaryArtists || 'Artist'}</p>
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

window.onload = loadHomeScreen;
