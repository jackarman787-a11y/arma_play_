// ===== JIOSAAVN API CONFIG =====
// Note: JioSaavn ka unofficial API use ho raha hai full songs ke liye. 
// Agar kabhi API down ho, toh koi doosra public instance use karna pad sakta hai.
const API_BASE = "https://jiosaavn-api-ts.vercel.app"; // Public JioSaavn API endpoint

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

// Tab Switch Function
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

// Fetch Home Data (JioSaavn API)
async function loadHomeScreen() {
    try {
        // JioSaavn API se popular songs fetch karte hain
        const res = await fetch(`${API_BASE}/api/search/songs?query=arijit singh&limit=20`);
        const data = await res.json();
        
        if (data.success && data.data && data.data.results) {
            homeSongsList = data.data.results;
            
            // Quick Grid (Top 8)
            const quickGrid = document.getElementById('quickGrid');
            quickGrid.innerHTML = homeSongsList.slice(0, 8).map((s, i) => `
                <div class="quick-item" onclick="playSong(${i}, 'home')">
                    <img src="${s.image[1].link}" alt="">
                    <span>${s.name}</span>
                </div>
            `).join('');

            // Jump Back In
            document.getElementById('jumpBackIn').innerHTML = homeSongsList.slice(8, 15).map((s, i) => `
                <div class="card" onclick="playSong(${i+8}, 'home')">
                    <img src="${s.image[2].link}" alt="">
                    <div class="card-title">${s.name}</div>
                    <div class="card-subtitle">${s.primaryArtists}</div>
                </div>
            `).join('');

            // Recommended
            document.getElementById('recommended').innerHTML = homeSongsList.slice(15, 22).map((s, i) => `
                <div class="card" onclick="playSong(${i+15}, 'home')">
                    <img src="${s.image[2].link}" alt="">
                    <div class="card-title">${s.name}</div>
                    <div class="card-subtitle">${s.primaryArtists}</div>
                </div>
            `).join('');
        }
    } catch(e) {
        console.log("Home load error", e);
    }
}

// Play Song Function (JioSaavn se full song)
function playSong(index, sourceType) {
    let listToUse = sourceType === 'home' ? homeSongsList : songs;
    if (index < 0 || index >= listToUse.length) return;
    
    currentIndex = index;
    let s = listToUse[currentIndex];

    // JioSaavn ka downloadUrl full song deta hai [citation:7]
    const streamUrl = s.downloadUrl ? s.downloadUrl[2].link : (s.downloadUrl && s.downloadUrl[0] ? s.downloadUrl[0].link : null);
    
    if(!streamUrl) return alert("Gaane ka link nahi mila!");

    audioPlayer.src = streamUrl;
    songTitle.textContent = s.name;
    artistName.textContent = s.primaryArtists;
    coverArt.src = s.image[1].link;
    downloadBtn.href = streamUrl;
    downloadBtn.setAttribute('download', `${s.name}.m4a`);
    
    audioPlayer.play().then(() => {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    }).catch(e => {
        alert("Playback error: " + e.message);
    });
}

// Search Functionality
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
        
        if (data.success && data.data && data.data.results) {
            songs = data.data.results;
        } else {
            songs = [];
        }

        if (songs.length === 0) {
            statusMsg.textContent = 'No songs found.';
            songList.innerHTML = '';
            return;
        }

        statusMsg.textContent = '';
        
        songList.innerHTML = songs.map((s, i) => `
            <li class="song-item" onclick="playSong(${i}, 'search')">
                <img src="${s.image[0].link}" alt="">
                <div class="song-info">
                    <p class="t">${s.name}</p>
                    <p class="a">${s.primaryArtists}</p>
                </div>
                <i class="fa-solid fa-play"></i>
            </li>
        `).join('');

    } catch (err) {
        statusMsg.textContent = 'Error searching songs.';
        console.log(err);
    }
}

// Player Controls
playPauseBtn.addEventListener('click', () => {
    if (!audioPlayer.src) return alert("Pehle koi gaana select karo!");
    if (audioPlayer.paused) {
        audioPlayer.play().catch(console.error);
    } else {
        audioPlayer.pause();
    }
});

nextBtn.addEventListener('click', () => {
    let isHome = !document.getElementById('homeScreen').classList.contains('hidden');
    let listToUse = isHome ? homeSongsList : songs;
    
    if (listToUse.length > 0 && currentIndex !== -1) {
        let nextIndex = (currentIndex + 1) % listToUse.length;
        playSong(nextIndex, isHome ? 'home' : 'search');
    }
});

// Audio State Sync
audioPlayer.addEventListener('play',  () => playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>');
audioPlayer.addEventListener('pause', () => playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>');
audioPlayer.addEventListener('ended', () => playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>');

// Progress Bar Update
audioPlayer.addEventListener('timeupdate', () => {
    if (audioPlayer.duration) {
        const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.style.width = percent + '%';
    }
});

// App Start
window.onload = loadHomeScreen;
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
// 🔥 BACKGROUND PLAY & LOCK SCREEN CONTROLS 🔥
// ==========================================

// 1. Mobile Back Button rokne ke liye (App band na ho)
history.pushState(null, null, location.href);
window.onpopstate = function () {
    history.go(1); // Wapas push kar dega taaki back na ho
};

// 2. Media Session API (Lock screen controls)
function updateMediaSession(song) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.name || song.title || 'Unknown',
            artist: song.primaryArtists || 'Artist',
            album: 'Arma Play',
            artwork: [
                { src: song.image?.[2]?.link || song.image?.[1]?.link || 'https://via.placeholder.com/512', sizes: '512x512', type: 'image/jpeg' }
            ]
        });

        // Lock screen buttons setup
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

// Tab Switch Function
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

// Home Data Fetching
async function loadHomeScreen() {
    try {
        const res = await fetch(`https://jiosaavn-api-private-phi.vercel.app/search/songs?query=arijit%20singh&limit=20`);
        const data = await res.json();
        let results = data.data?.results || data.results || data;
        homeSongsList = Array.isArray(results) ? results : [];

        const quickGrid = document.getElementById('quickGrid');
        if (homeSongsList.length > 0) {
            quickGrid.innerHTML = homeSongsList.slice(0, 8).map((s, i) => `
                <div class="quick-item" onclick="playSong(${i}, 'home')">
                    <img src="${s.image?.[1]?.link || 'https://via.placeholder.com/56'}" alt="">
                    <span>${s.name || s.title || 'Unknown'}</span>
                </div>
            `).join('');
        }

        const jumpBackIn = document.getElementById('jumpBackIn');
        if (homeSongsList.length > 8) {
            jumpBackIn.innerHTML = homeSongsList.slice(8, 18).map((s, i) => `
                <div class="card" onclick="playSong(${i+8}, 'home')">
                    <img src="${s.image?.[2]?.link || 'https://via.placeholder.com/150'}" alt="">
                    <div class="card-title">${s.name || s.title || 'Unknown'}</div>
                    <div class="card-subtitle">${s.primaryArtists || 'Artist'}</div>
                </div>
            `).join('');
        }

        const recommended = document.getElementById('recommended');
        if (homeSongsList.length > 18) {
            recommended.innerHTML = homeSongsList.slice(18, 28).map((s, i) => `
                <div class="card" onclick="playSong(${i+18}, 'home')">
                    <img src="${s.image?.[2]?.link || 'https://via.placeholder.com/150'}" alt="">
                    <div class="card-title">${s.name || s.title || 'Unknown'}</div>
                    <div class="card-subtitle">${s.primaryArtists || 'Artist'}</div>
                </div>
            `).join('');
        }

    } catch(e) {
        console.log("Home load error", e);
    }
}

// Play Song
function playSong(index, sourceType) {
    let listToUse = sourceType === 'home' ? homeSongsList : songs;
    if (index < 0 || index >= listToUse.length) return;
    
    currentIndex = index;
    let s = listToUse[currentIndex];

    let streamUrl = s.downloadUrl?.[2]?.link || s.downloadUrl?.[1]?.link || s.media_url;
    
    if(!streamUrl) return alert("Is gaane ka link nahi mila.");
    if (streamUrl.includes('_96.mp4')) streamUrl = streamUrl.replace('_96.mp4', '_320.mp4');

    audioPlayer.src = streamUrl;
    songTitle.textContent = s.name || s.title || 'Unknown';
    artistName.textContent = s.primaryArtists || 'Artist';
    coverArt.src = s.image?.[1]?.link || 'https://via.placeholder.com/44';
    downloadBtn.href = streamUrl;
    
    // Lock screen metadata update karo
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
        const res = await fetch(`https://jiosaavn-api-private-phi.vercel.app/search/songs?query=${encodeURIComponent(q)}&limit=20`);
        const data = await res.json();
        let results = data.data?.results || data.results || data;
        songs = Array.isArray(results) ? results : [];

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
    if (audioPlayer.paused) {
        audioPlayer.play();
    } else {
        audioPlayer.pause();
    }
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
audioPlayer.addEventListener('ended', () => playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>');

// Progress
audioPlayer.addEventListener('timeupdate', () => {
    if (audioPlayer.duration) {
        progressBar.style.width = ((audioPlayer.currentTime / audioPlayer.duration) * 100) + '%';
    }
});

window.onload = loadHomeScreen;
