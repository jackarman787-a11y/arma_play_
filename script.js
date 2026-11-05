/* =========================================
   ARMA PLAY - FULL SONG MUSIC PLAYER
   ========================================= */

const API_BASE = "https://YOUR-AUTHORIZED-API.com";

const searchInput = document.getElementById("searchInput");
const songList = document.getElementById("songList");
const statusMsg = document.getElementById("statusMsg");
const audioPlayer = document.getElementById("audioPlayer");
const playPauseBtn = document.getElementById("playPauseBtn");
const nextBtn = document.getElementById("nextBtn");
const songTitle = document.getElementById("songTitle");
const artistName = document.getElementById("artistName");
const coverArt = document.getElementById("coverArt");
const downloadBtn = document.getElementById("downloadBtn");
const progressBar = document.getElementById("progressBar");

let songs = [];
let homeSongsList = [];
let currentIndex = -1;
let currentSource = "search";
let searchTimer;
let requestId = 0;

audioPlayer.preload = "metadata";

// Format duration
function formatTime(time) {
    if (!Number.isFinite(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
}

// Normalize API song
function normalizeSong(s) {
    return {
        title: s.title || s.name || "Unknown Song",
        artist: s.artist || s.uploaderName || "Unknown Artist",
        thumbnail: s.thumbnail || s.cover || "",
        audioUrl: s.audioUrl || s.audio_url ||
                  s.streamUrl || s.stream_url || "",
        duration: s.duration || 0
    };
}

// Get playlist
function getPlaylist() {
    return currentSource === "home"
        ? homeSongsList : songs;
}

// Load full audio
function loadSong(index, source = currentSource) {
    const list = source === "home" ? homeSongsList : songs;
    const song = list[index];

    if (!song) return false;

    if (!song.audioUrl) {
        statusMsg.textContent =
            "Full-length audio unavailable for this track.";
        return false;
    }

    currentIndex = index;
    currentSource = source;

    requestId++;

    audioPlayer.pause();
    audioPlayer.src = song.audioUrl;
    audioPlayer.load();

    songTitle.textContent = song.title;
    artistName.textContent = song.artist;
    coverArt.src = song.thumbnail;

    downloadBtn.href = song.audioUrl;
    downloadBtn.removeAttribute("download");

    progressBar.style.width = "0%";
    statusMsg.textContent = "Loading full song...";

    updateMediaSession(song);

    return true;
}

// Play song
async function playSong(index, source = currentSource) {
    if (!loadSong(index, source)) return;

    const id = requestId;

    try {
        await audioPlayer.play();

        if (id === requestId) {
            statusMsg.textContent = "";
        }
    } catch (error) {
        if (id === requestId) {
            statusMsg.textContent = "Playback failed. Check audio API.";
        }
        console.error(error);
    }
}

// Play / Pause
async function togglePlay() {
    if (!audioPlayer.src) return;

    try {
        if (audioPlayer.paused) {
            await audioPlayer.play();
        } else {
            audioPlayer.pause();
        }
    } catch (error) {
        console.error(error);
    }
}

// Next
function nextSong() {
    const list = getPlaylist();
    if (!list.length || currentIndex < 0) return;

    playSong((currentIndex + 1) % list.length);
}

// Previous
function previousSong() {
    const list = getPlaylist();
    if (!list.length || currentIndex < 0) return;

    if (audioPlayer.currentTime > 3) {
        audioPlayer.currentTime = 0;
        return;
    }

    playSong((currentIndex - 1 + list.length) % list.length);
}

// Media session
function updateMediaSession(song) {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: "ARMA PLAY",
        artwork: song.thumbnail ? [{
            src: song.thumbnail,
            sizes: "512x512",
            type: "image/jpeg"
        }] : []
    });

    navigator.mediaSession.setActionHandler("play", () => audioPlayer.play());
    navigator.mediaSession.setActionHandler("pause", () => audioPlayer.pause());
    navigator.mediaSession.setActionHandler("nexttrack", nextSong);
    navigator.mediaSession.setActionHandler("previoustrack", previousSong);
}

// Search songs
async function searchSongs() {
    const query = searchInput.value.trim();

    if (!query) {
        songs = [];
        songList.innerHTML = "";
        statusMsg.textContent = "";
        return;
    }

    const id = ++requestId;
    statusMsg.textContent = "Searching...";

    try {
        const response = await fetch(
            `${API_BASE}/search?q=${encodeURIComponent(query)}`
        );

        if (!response.ok) throw new Error("API error");

        const data = await response.json();

        if (id !== requestId) return;

        const results = Array.isArray(data)
            ? data
            : data.songs || data.items || [];

        songs = results.map(normalizeSong);

        if (!songs.length) {
            statusMsg.textContent = "No songs found.";
            songList.innerHTML = "";
            return;
        }

        statusMsg.textContent = "";

        songList.innerHTML = songs.map((s, i) => `
            <li class="song-item" data-index="${i}">
                <img src="${escapeHTML(s.thumbnail)}" alt="">
                <div class="song-info">
                    <p class="t">${escapeHTML(s.title)}</p>
                    <p class="a">${escapeHTML(s.artist)}</p>
                </div>
                <i class="fa-solid fa-play"></i>
            </li>
        `).join("");

    } catch (error) {
        statusMsg.textContent = "Search API unavailable.";
        console.error(error);
    }
}

// Escape text
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[c]);
}

// Search delay
searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(searchSongs, 500);
});

// Select search song
songList.addEventListener("click", event => {
    const item = event.target.closest("[data-index]");
    if (item) playSong(Number(item.dataset.index), "search");
});

// Progress bar
audioPlayer.addEventListener("timeupdate", () => {
    if (!Number.isFinite(audioPlayer.duration)) return;

    const percent =
        audioPlayer.currentTime / audioPlayer.duration * 100;

    progressBar.style.width = percent + "%";

    const current = document.getElementById("currentTime");
    const total = document.getElementById("totalTime");

    if (current) current.textContent = formatTime(audioPlayer.currentTime);
    if (total) total.textContent = formatTime(audioPlayer.duration);
});

// Seek
progressBar.parentElement.addEventListener("click", event => {
    if (!Number.isFinite(audioPlayer.duration)) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1,
        (event.clientX - rect.left) / rect.width
    ));

    audioPlayer.currentTime = percent * audioPlayer.duration;
});

// Player controls
playPauseBtn.addEventListener("click", togglePlay);
nextBtn.addEventListener("click", nextSong);

document.getElementById("previousBtn")
    ?.addEventListener("click", previousSong);

// Player icons
audioPlayer.addEventListener("play", () => {
    playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
});

audioPlayer.addEventListener("pause", () => {
    playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
});

// Automatic next song
audioPlayer.addEventListener("ended", nextSong);

// Loading and error
audioPlayer.addEventListener("waiting", () => {
    statusMsg.textContent = "Buffering...";
});

audioPlayer.addEventListener("playing", () => {
    statusMsg.textContent = "";
});

audioPlayer.addEventListener("error", () => {
    statusMsg.textContent = "Audio stream unavailable.";
});

// Home screen
async function loadHomeScreen() {
    try {
        const response = await fetch(
            `${API_BASE}/search?q=popular`
        );

        if (!response.ok) throw new Error("API error");

        const data = await response.json();

        const results = Array.isArray(data)
            ? data : data.songs || data.items || [];

        homeSongsList = results.map(normalizeSong);

        const quickGrid = document.getElementById("quickGrid");
        const jumpBackIn = document.getElementById("jumpBackIn");

        quickGrid.innerHTML = homeSongsList.slice(0, 8)
            .map((s, i) => `
                <div class="quick-item" data-home="${i}">
                    <img src="${escapeHTML(s.thumbnail)}">
                    <span>${escapeHTML(s.title)}</span>
                </div>
            `).join("");

        jumpBackIn.innerHTML = homeSongsList.slice(8, 18)
            .map((s, i) => `
                <div class="card" data-home="${i + 8}">
                    <img src="${escapeHTML(s.thumbnail)}">
                    <div class="card-title">${escapeHTML(s.title)}</div>
                    <div class="card-subtitle">${escapeHTML(s.artist)}</div>
                </div>
            `).join("");

    } catch (error) {
        console.error("Home API error:", error);
    }
}

// Home click
document.addEventListener("click", event => {
    const item = event.target.closest("[data-home]");
    if (item) playSong(Number(item.dataset.home), "home");
});

// Tabs
function switchTab(tab) {
    document.querySelectorAll(".nav-item")
        .forEach(n => n.classList.remove("active"));

    document.getElementById("homeScreen")
        .classList.toggle("hidden", tab !== "home");

    document.getElementById("searchScreen")
        .classList.toggle("hidden", tab !== "search");

    document.querySelector(
        `.nav-item:nth-child(${tab === "home" ? 1 : 2})`
    )?.classList.add("active");
}

// Start
loadHomeScreen();
                        
