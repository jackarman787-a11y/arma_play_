/* =====================================================
   ARMA PLAY — Advanced Music Player Engine
   ===================================================== */

const audio = document.getElementById("audio");
const results = document.getElementById("results");
const statusText = document.getElementById("status");
const queryInput = document.getElementById("query");

const coverEl = document.getElementById("cover");
const titleEl = document.getElementById("title");
const artistEl = document.getElementById("artist");
const fullSongEl = document.getElementById("fullSong");
const toggleBtn = document.getElementById("toggle");
const progressBar = document.getElementById("progress");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const volumeBar = document.getElementById("volume");

let songs = [];
let currentIndex = -1;
let isShuffle = false;
let repeatMode = 0; // 0 = off, 1 = all, 2 = one
let lastVolume = 1;

/* ---------------- UTILS ---------------- */
const fmt = (s) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

const toast = (() => {
  const el = document.getElementById("toast");
  let t;
  return (msg, ms = 2200) => {
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(t);
    t = setTimeout(() => el.classList.remove("show"), ms);
  };
})();

const $ = (id) => document.getElementById(id);

/* ---------------- RECENTLY PLAYED ---------------- */
function saveRecent(song) {
  try {
    let recent = JSON.parse(localStorage.getItem("arma_recent") || "[]");
    recent = recent.filter((r) => r.trackId !== song.trackId);
    recent.unshift({
      trackId: song.trackId,
      trackName: song.trackName,
      artistName: song.artistName,
      artworkUrl100: song.artworkUrl100,
      previewUrl: song.previewUrl,
      trackViewUrl: song.trackViewUrl,
    });
    localStorage.setItem("arma_recent", JSON.stringify(recent.slice(0, 15)));
  } catch (e) {}
}

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem("arma_recent") || "[]");
  } catch (e) {
    return [];
  }
}

function saveLastSong(song) {
  try {
    localStorage.setItem("arma_last", JSON.stringify(song));
  } catch (e) {}
}

function loadLastSong() {
  try {
    return JSON.parse(localStorage.getItem("arma_last") || "null");
  } catch (e) {
    return null;
  }
}

/* ---------------- SEARCH ---------------- */
let searchTimeout = null;
function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(searchSongs, 400);
}

async function searchSongs(term) {
  const query = (term ?? queryInput.value).trim();
  if (!query) {
    statusText.textContent = "Enter a song or artist name.";
    return;
  }

  statusText.textContent = "🔎 Searching iTunes...";
  statusText.style.opacity = "1";
  results.innerHTML = skeleton(6);

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      query
    )}&entity=song&limit=30&country=IN`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    songs = (data.results || []).filter((s) => s.previewUrl);

    if (!songs.length) {
      results.innerHTML = "";
      statusText.textContent = "No results. Try another keyword.";
      return;
    }

    statusText.textContent = `✅ ${songs.length} songs found`;
    statusText.style.opacity = ".7";
    renderList(songs);
  } catch (err) {
    console.error(err);
    results.innerHTML = "";
    statusText.textContent = "❌ Connection error. Try again.";
    toast("Search failed — check your connection");
  }
}

function skeleton(n) {
  return Array(n)
    .fill(0)
    .map(
      () => `
    <div class="song" style="pointer-events:none;opacity:.6">
      <div style="width:57px;height:57px;border-radius:9px;background:#1e1e1e;flex-shrink:0"></div>
      <div class="info">
        <div style="height:12px;width:70%;background:#1e1e1e;border-radius:4px;margin-bottom:8px"></div>
        <div style="height:10px;width:40%;background:#1e1e1e;border-radius:4px"></div>
      </div>
    </div>`
    )
    .join("");
}

/* ---------------- RENDER LIST ---------------- */
function renderList(list) {
  results.innerHTML = "";
  const frag = document.createDocumentFragment();

  list.forEach((song, index) => {
    const item = document.createElement("div");
    item.className = "song";
    item.dataset.index = index;
    if (index === currentIndex) item.classList.add("playing");

    const img = document.createElement("img");
    img.src = song.artworkUrl100 || "";
    img.alt = "";
    img.loading = "lazy";
    img.onerror = () => {
      img.src = "https://placehold.co/100x100/1a1a1a/d8ad55?text=♪";
    };

    const info = document.createElement("div");
    info.className = "info";
    const name = document.createElement("b");
    name.textContent = song.trackName || "Unknown song";
    const artist = document.createElement("small");
    artist.textContent = song.artistName || "Unknown artist";
    info.append(name, artist);

    const btn = document.createElement("button");
    btn.className = "play";
    btn.textContent = index === currentIndex ? "❚❚" : "▶";
    btn.onclick = (e) => {
      e.stopPropagation();
      if (index === currentIndex) togglePlay();
      else playSong(index);
    };

    item.onclick = () => {
      if (index === currentIndex) togglePlay();
      else playSong(index);
    };

    item.append(img, info, btn);
    frag.appendChild(item);
  });

  results.appendChild(frag);
}

/* ---------------- PLAYBACK ---------------- */
function playSong(index) {
  const song = songs[index];
  if (!song || !song.previewUrl) {
    toast("Preview not available");
    return;
  }

  currentIndex = index;
  audio.src = song.previewUrl;
  audio.volume = parseFloat(volumeBar.value);

  audio
    .play()
    .then(() => {
      updatePlayer(song);
      markPlaying();
      saveRecent(song);
      saveLastSong(song);
      updateMediaSession(song);
    })
    .catch(() => {
      statusText.textContent = "Playback failed. Tap play again.";
      toast("Playback failed");
    });
}

function updatePlayer(song) {
  coverEl.src = song.artworkUrl100?.replace("100x100", "300x300") || coverEl.src;
  titleEl.textContent = song.trackName || "Unknown song";
  artistEl.textContent = song.artistName || "Unknown artist";
  fullSongEl.href = song.trackViewUrl || "#";
  document.title = `${song.trackName || "Song"} • ARMA PLAY`;
  extractAccentColor(song.artworkUrl100);
}

function markPlaying() {
  document.querySelectorAll(".song").forEach((el) => {
    const i = Number(el.dataset.index);
    el.classList.toggle("playing", i === currentIndex);
    const btn = el.querySelector(".play");
    if (btn) btn.textContent = i === currentIndex && !audio.paused ? "❚❚" : "▶";
  });
}

function togglePlay() {
  if (!audio.src) {
    if (songs.length) playSong(0);
    else toast("Search a song first 🎵");
    return;
  }
  if (audio.paused) audio.play();
  else audio.pause();
}

function updatePlayButton() {
  toggleBtn.textContent = audio.paused ? "▶" : "❚❚";
  markPlaying();
}

/* ---------------- NAV ---------------- */
function nextSong(auto = false) {
  if (!songs.length) return;

  if (isShuffle) {
    let n;
    do {
      n = Math.floor(Math.random() * songs.length);
    } while (songs.length > 1 && n === currentIndex);
    return playSong(n);
  }

  if (currentIndex < songs.length - 1) {
    playSong(currentIndex + 1);
  } else if (repeatMode === 1) {
    playSong(0);
  } else if (auto) {
    statusText.textContent = "🎵 Queue finished";
  }
}

function previousSong() {
  if (!songs.length) return;
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  if (currentIndex > 0) playSong(currentIndex - 1);
  else if (repeatMode === 1) playSong(songs.length - 1);
}

/* ---------------- AUDIO EVENTS ---------------- */
audio.addEventListener("timeupdate", () => {
  progressBar.value = audio.duration
    ? (audio.currentTime / audio.duration) * 100
    : 0;
  currentTimeEl.textContent = fmt(audio.currentTime);
  durationEl.textContent = fmt(audio.duration);
});

audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = fmt(audio.duration);
});

progressBar.addEventListener("input", (e) => {
  if (audio.duration) {
    audio.currentTime = (e.target.value / 100) * audio.duration;
  }
});

audio.addEventListener("play", updatePlayButton);
audio.addEventListener("pause", updatePlayButton);

audio.addEventListener("ended", () => {
  if (repeatMode === 2) {
    audio.currentTime = 0;
    audio.play();
  } else {
    nextSong(true);
  }
});

audio.addEventListener("error", () => {
  toast("⚠️ Playback error");
});

/* ---------------- VOLUME ---------------- */
if (volumeBar) {
  volumeBar.addEventListener("input", () => {
    audio.volume = parseFloat(volumeBar.value);
    if (audio.volume > 0) lastVolume = audio.volume;
  });
}

/* ---------------- MEDIA SESSION ---------------- */
function updateMediaSession(song) {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.trackName || "",
    artist: song.artistName || "",
    album: song.collectionName || "",
    artwork: [
      { src: song.artworkUrl100 || "", sizes: "100x100", type: "image/jpeg" },
    ],
  });
  navigator.mediaSession.setActionHandler("play", () => audio.play());
  navigator.mediaSession.setActionHandler("pause", () => audio.pause());
  navigator.mediaSession.setActionHandler("previoustrack", previousSong);
  navigator.mediaSession.setActionHandler("nexttrack", nextSong);
}

/* ---------------- ACCENT COLOR EXTRACT ---------------- */
function extractAccentColor(url) {
  if (!url) return;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    try {
      const c = document.createElement("canvas");
      c.width = c.height = 1;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      const bright = (r + g + b) / 3;
      if (bright > 30 && bright < 230) {
        document.documentElement.style.setProperty(
          "--accent",
          `rgb(${r},${g},${b})`
        );
      }
    } catch (e) {}
  };
  img.src = url;
}

/* ---------------- KEYBOARD SHORTCUTS ---------------- */
document.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;

  switch (e.key.toLowerCase()) {
    case " ":
      e.preventDefault();
      togglePlay();
      break;
    case "arrowright":
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
      break;
    case "arrowleft":
      audio.currentTime = Math.max(0, audio.currentTime - 5);
      break;
    case "arrowup":
      e.preventDefault();
      if (volumeBar) {
        volumeBar.value = Math.min(1, parseFloat(volumeBar.value) + 0.1);
        audio.volume = parseFloat(volumeBar.value);
      }
      break;
    case "arrowdown":
      e.preventDefault();
      if (volumeBar) {
        volumeBar.value = Math.max(0, parseFloat(volumeBar.value) - 0.1);
        audio.volume = parseFloat(volumeBar.value);
      }
      break;
    case "m":
      audio.muted = !audio.muted;
      toast(audio.muted ? "🔇 Muted" : "🔊 Unmuted");
      break;
    case "n":
      nextSong();
      break;
    case "p":
      previousSong();
      break;
  }
});

/* ---------------- SEARCH EVENTS ---------------- */
queryInput.addEventListener("input", () => {
  const v = queryInput.value.trim();
  if (v.length >= 2) debouncedSearch();
});

queryInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    clearTimeout(searchTimeout);
    searchSongs();
  }
});

/* ---------------- INIT ---------------- */
(function init() {
  // Restore last song
  const last = loadLastSong();
  if (last) {
    titleEl.textContent = last.trackName || "Select a song";
    artistEl.textContent = last.artistName || "ARMA PLAY";
    if (last.artworkUrl100) coverEl.src = last.artworkUrl100;
    if (last.trackViewUrl) fullSongEl.href = last.trackViewUrl;
    songs = [last];
    currentIndex = 0;
    audio.src = last.previewUrl;
    statusText.textContent = "▶ Last played — tap play to resume";
  }

  // Recent history
  const recent = loadRecent();
  if (recent.length && !last) {
    statusText.textContent = `🎧 ${recent.length} recently played — search or tap a chip`;
  }

  // Volume
  if (volumeBar) audio.volume = parseFloat(volumeBar.value);
})();

/* ---------------- GLOBAL EXPORTS (for HTML buttons) ---------------- */
window.searchSongs = searchSongs;
window.playSong = playSong;
window.togglePlay = togglePlay;
window.nextSong = nextSong;
window.previousSong = previousSong;
function toggleShuffle(){
  isShuffle = !isShuffle;
  const b = document.getElementById("shuffleBtn");
  if(b) b.style.color = isShuffle ? "#d8ad55" : "";
  toast(isShuffle ? "🔀 Shuffle ON" : "Shuffle OFF");
}
function toggleRepeat(){
  repeatMode = (repeatMode + 1) % 3;
  const b = document.getElementById("repeatBtn");
  if(b){
    b.style.color = repeatMode > 0 ? "#d8ad55" : "";
    b.textContent = repeatMode === 2 ? "🔂" : "🔁";
  }
  toast(["Repeat OFF","🔁 Repeat All","🔂 Repeat One"][repeatMode]);
}
window.toggleShuffle = toggleShuffle;
window.toggleRepeat = toggleRepeat;
const audio = document.getElementById('audio');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const title = document.getElementById('title');
const artist = document.getElementById('artist');
const cover = document.getElementById('cover');
const progress = document.getElementById('progress');
const progressContainer = document.getElementById('progress-container');
const playIcon = document.getElementById('play-icon');

// Songs List (Aap yahan apne gaano ke links badal sakte hain)
const songs = [
    {
        name: 'Song 1',
        artist: 'Artist One',
        audioUrl: 'https://soundhelix.com',
        coverUrl: 'https://unsplash.com'
    },
    {
        name: 'Song 2',
        artist: 'Artist Two',
        audioUrl: 'https://soundhelix.com',
        coverUrl: 'https://unsplash.com'
    }
];

// Track rakhne ke liye ki kaunsa gana chal raha hai
let songIndex = 0;

// Shuruat me pehla gana load karo
loadSong(songs[songIndex]);

function loadSong(song) {
    title.innerText = song.name;
    artist.innerText = song.artist;
    audio.src = song.audioUrl;
    cover.src = song.coverUrl;
}

// Play Song
function playSong() {
    playBtn.classList.add('play');
    playIcon.classList.remove('fa-play');
    playIcon.classList.add('fa-pause');
    audio.play();
}

// Pause Song
function pauseSong() {
    playBtn.classList.remove('play');
    playIcon.classList.remove('fa-pause');
    playIcon.classList.add('fa-play');
    audio.pause();
}

// Previous Song
function prevSong() {
    songIndex--;
    if (songIndex < 0) {
        songIndex = songs.length - 1;
    }
    loadSong(songs[songIndex]);
    playSong();
}

// Next Song
function nextSong() {
    songIndex++;
    if (songIndex > songs.length - 1) {
        songIndex = 0;
    }
    loadSong(songs[songIndex]);
    playSong();
}

// Progress Bar Update
function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;
}

// Click karke Song ko aage-piche (Seek) karna
function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
}

// Event Listeners
playBtn.addEventListener('click', () => {
    const isPlaying = playBtn.classList.contains('play');
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
});

prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);

// Audio ke events
audio.addEventListener('timeupdate', updateProgress);
progressContainer.addEventListener('click', setProgress);
audio.addEventListener('ended', nextSong); // Gana khatam hone par automatic next chale
