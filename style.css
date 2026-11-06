/* =========================================================
   ARMA_PLAY_ — Core Script
   Homepage sections · Player · Audio/Video toggle
   ========================================================= */

// ---------- MOCK DATA ----------
const MOCK = [
  { id: 1,  title: "Midnight Flame",   artist: "Ravi K.",     emoji: "🔥" },
  { id: 2,  title: "Crimson Skies",    artist: "Nova",        emoji: "🌌" },
  { id: 3,  title: "Red Light",        artist: "Zayn M.",     emoji: "🚨" },
  { id: 4,  title: "Burning Heart",    artist: "Aria",        emoji: "❤️‍🔥" },
  { id: 5,  title: "Neon Fire",        artist: "Pulse",       emoji: "⚡" },
  { id: 6,  title: "Ruby Nights",      artist: "Kairo",       emoji: "🌙" },
  { id: 7,  title: "Scarlet",          artist: "Lumen",       emoji: "💃" },
  { id: 8,  title: "Ember",            artist: "Sora",        emoji: "🕯️" },
];

// Sections config
const SECTIONS = [
  { title: "Recently Played",       badge: "NEW" },
  { title: "Made For You" },
  { title: "Your Top Mixes" },
  { title: "Popular Albums & Singles" },
  { title: "Charts — Top 50" },
  { title: "New Releases" },
  { title: "Podcasts & Shows" },
  { title: "Jump Back In" },
];

// ---------- STATE ----------
let currentTrack = null;
let isPlaying = false;
let mode = "audio";   // "audio" | "video"
let progressTimer = null;

// ---------- DOM REFS ----------
const $ = (s) => document.querySelector(s);
const sectionsContainer = $("#sectionsContainer");
const npTitle = $("#npTitle");
const npArtist = $("#npArtist");
const npArt = $("#npArt");
const playBtn = $("#playBtn");
const nextBtn = $("#nextBtn");
const prevBtn = $("#prevBtn");
const progressBar = $("#progressBar");
const currentTimeEl = $("#currentTime");
const durationEl = $("#duration");
const volumeBar = $("#volumeBar");
const modeToggle = $("#modeToggle");
const videoOverlay = $("#videoOverlay");
const videoPlayer = $("#videoPlayer");
const audioPlayer = $("#audioPlayer");
const videoClose = $("#videoClose");
const toastEl = $("#toast");

// ---------- HELPERS ----------
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("show"), 2000);
}

function fmtTime(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ---------- GREETING ----------
function setGreeting() {
  const h = new Date().getHours();
  let g = "Good evening";
  if (h < 12) g = "Good morning";
  else if (h < 18) g = "Good afternoon";
  $("#greetingText").textContent = g;
}

// ---------- BUILD HOMEPAGE ----------
function buildSections() {
  sectionsContainer.innerHTML = "";
  SECTIONS.forEach((sec, idx) => {
    const sectionEl = document.createElement("section");
    sectionEl.className = "section";

    const header = document.createElement("div");
    header.className = "section-header";
    header.innerHTML = `
      <h2>${sec.title}</h2>
      <span class="see-all">Show all</span>
    `;

    const row = document.createElement("div");
    row.className = "card-row";

    // shuffle mock data per section
    const items = [...MOCK].sort(() => Math.random() - 0.5).slice(0, 6);

    items.forEach((track, i) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="card-img">
          ${track.emoji}
          ${idx === 0 && i === 0 ? '<span class="card-badge">NEW</span>' : ''}
          <div class="card-play">▶</div>
        </div>
        <div class="card-title">${track.title}</div>
        <div class="card-sub">${track.artist}</div>
      `;
      card.addEventListener("click", () => playTrack(track));
      row.appendChild(card);
    });

    sectionEl.appendChild(header);
    sectionEl.appendChild(row);
    sectionsContainer.appendChild(sectionEl);
  });
}

// ---------- PLAY LOGIC ----------
function playTrack(track) {
  currentTrack = track;
  npTitle.textContent = track.title;
  npArtist.textContent = track.artist;
  npArt.textContent = track.emoji;
  npArt.style.fontSize = "24px";
  npArt.style.display = "flex";
  npArt.style.alignItems = "center";
  npArt.style.justifyContent = "center";

  if (mode === "video") {
    openVideoMode();
    return;
  }

  // Simulate audio playback (no real audio file in demo)
  isPlaying = true;
  playBtn.textContent = "⏸";
  showToast(`▶ Playing: ${track.title}`);
  startFakeProgress();
}

function startFakeProgress() {
  clearInterval(progressTimer);
  let p = 0;
  const total = 210; // fake 3:30 duration
  durationEl.textContent = fmtTime(total);

  progressTimer = setInterval(() => {
    if (!isPlaying) return;
    p += 1;
    if (p > 100) { p = 0; nextTrack(); return; }
    progressBar.value = p;
    currentTimeEl.textContent = fmtTime((p / 100) * total);
  }, 300);
}

function togglePlay() {
  if (!currentTrack) { showToast("Pick a song first 🎵"); return; }
  isPlaying = !isPlaying;
  playBtn.textContent = isPlaying ? "⏸" : "▶";
  if (mode === "video") {
    isPlaying ? videoPlayer.play() : videoPlayer.pause();
  }
}

function nextTrack() {
  if (!currentTrack) return;
  const idx = MOCK.findIndex(t => t.id === currentTrack.id);
  const next = MOCK[(idx + 1) % MOCK.length];
  playTrack(next);
}

function prevTrack() {
  if (!currentTrack) return;
  const idx = MOCK.findIndex(t => t.id === currentTrack.id);
  const prev = MOCK[(idx - 1 + MOCK.length) % MOCK.length];
  playTrack(prev);
}

// ---------- AUDIO / VIDEO TOGGLE ----------
function toggleMode() {
  if (mode === "audio") {
    mode = "video";
    modeToggle.textContent = "🎬 Video";
    modeToggle.classList.add("video-mode");
    showToast("Video mode ON 🎬");
    if (currentTrack) openVideoMode();
  } else {
    mode = "audio";
    modeToggle.textContent = "🎵 Audio";
    modeToggle.classList.remove("video-mode");
    closeVideoMode();
    showToast("Audio mode ON 🎵");
  }
}

function openVideoMode() {
  videoOverlay.classList.add("active");
  $("#videoTitle").textContent = currentTrack ? currentTrack.title : "Music Video";
  $("#videoArtist").textContent = currentTrack ? currentTrack.artist : "ARMA_PLAY_";

  // Demo public sample video (Big Buck Bunny)
  if (!videoPlayer.src) {
    videoPlayer.src = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  }
  videoPlayer.volume = volumeBar.value / 100;
  if (isPlaying) videoPlayer.play().catch(() => {});
}

function closeVideoMode() {
  videoOverlay.classList.remove("active");
  videoPlayer.pause();
}

// ---------- PROGRESS SEEK ----------
progressBar.addEventListener("input", () => {
  const total = 210;
  currentTimeEl.textContent = fmtTime((progressBar.value / 100) * total);
  if (mode === "video" && videoPlayer.duration) {
    videoPlayer.currentTime = (progressBar.value / 100) * videoPlayer.duration;
  }
});

// ---------- VOLUME ----------
volumeBar.addEventListener("input", () => {
  audioPlayer.volume = volumeBar.value / 100;
  videoPlayer.volume = volumeBar.value / 100;
});

// ---------- EVENT BINDINGS ----------
playBtn.addEventListener("click", togglePlay);
nextBtn.addEventListener("click", nextTrack);
prevBtn.addEventListener("click", prevTrack);
modeToggle.addEventListener("click", toggleMode);
videoClose.addEventListener("click", closeVideoMode);

document.getElementById("likeBtn").addEventListener("click", () => {
  showToast("❤ Added to Liked Songs");
});

document.getElementById("shuffleBtn").addEventListener("click", (e) => {
  e.currentTarget.classList.toggle("active");
  showToast("Shuffle toggled");
});

document.getElementById("repeatBtn").addEventListener("click", (e) => {
  e.currentTarget.classList.toggle("active");
  showToast("Repeat toggled");
});

// Chips
document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    showToast(`Filter: ${chip.textContent}`);
  });
});

// Quick cards
document.querySelectorAll(".quick-card").forEach(card => {
  card.addEventListener("click", () => {
    const track = MOCK[Math.floor(Math.random() * MOCK.length)];
    playTrack(track);
  });
});

// ---------- INIT ----------
function init() {
  setGreeting();
  buildSections();
  audioPlayer.volume = 0.8;
  videoPlayer.volume = 0.8;
  console.log("%cARMA_PLAY_ ready 🎵🎬", "color:#E50914;font-weight:bold;font-size:14px");
}

init();
