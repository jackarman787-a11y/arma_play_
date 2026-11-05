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

// ===== TAB SWITCHING (Home vs Search) =====
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

// ===== FETCH HOME DATA (Fake Spotify style) =====
// Spotify API requires OAuth, so we use iTunes API to get real album arts for UI
async function loadHomeScreen() {
    const terms = ['arijit singh', 'karan aujla', 'atif aslam', 'khesari lal yadav'];
    let allResults = [];

    for (let t of terms) {
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(t)}&media=music&limit=5`);
            const data = await res.json();
            if(data.results) allResults = allResults.concat(data.results);
        } catch(e) { console.log("Error loading home data", e); }
    }

    // Filter out items without artwork
    allResults = allResults.filter(s => s.artworkUrl100);

    // Populate Quick Grid (Top 8 items)
    const quickGrid = document.getElementById('quickGrid');
    quickGrid.innerHTML = allResults.slice(0, 8).map(s => `
        <div class="quick-item" onclick="playFromHome('${s.previewUrl}', '${s.trackName.replace(/'/g, "")}', '${s.artistName.replace(/'/g, "")}', '${s.artworkUrl100}')">
            <img src="${s.artworkUrl100}" alt="">
            <span>${s.collectionName || s.trackName}</span>
        </div>
    `).join('');

    // Populate Jump Back In (Cards)
    const jumpBackIn = document.getElementById('jumpBackIn');
    jumpBackIn.innerHTML = allResults.slice(8, 18).map(s => `
        <div class="card" onclick="playFromHome('${s.previewUrl}', '${s.trackName.replace(/'/g, "")}', '${s.artistName.replace(/'/g, "")}', '${s.artworkUrl100}')">
            <img src="${s.artworkUrl100.replace('100x100', '300x300')}" alt="">
            <div class="card-title">${s.collectionName || s.trackName}</div>
            <div class="card-subtitle">${s.artistName}</div>
        </div>
    `).join('');

    // Populate Recommended
    const recommended = document.getElementById('recommended');
    recommended.innerHTML = allResults.slice(18, 28).map(s => `
        <div class="card" onclick="playFromHome('${s.previewUrl}', '${s.trackName.replace(/'/g, "")}', '${s.artistName.replace(/'/g, "")}', '${s.artworkUrl100}')">
            <img src="${s.artworkUrl100.replace('100x100', '300x300')}" alt="">
            <div class="card-title">${s.collectionName || s.trackName}</div>
            <div class="card-subtitle">${s.artistName}</div>
        </div>
    `).join('');
}

// Call on load
window.onload = loadHomeScreen;

// Play from Home screen
function playFromHome(url, title, artist, art) {
    if(!url) return alert("Preview not available");
    audioPlayer.src = url;
    songTitle.textContent = title;
    artistName.textContent = artist;
    coverArt.src = art;
    downloadBtn.href = url;
    downloadBtn.setAttribute('download', `${title}.m4a`);
    
    audioPlayer.play().catch(e => console.log(e));
}

// ===== SEARCH FUNCTIONALITY =====
let timer;
searchInput.addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(searchSongs, 500);
});

async function searchSongs() {
  const q = searchInput.value.trim();
  if (!q) { songList.innerHTML = ''; statusMsg.textContent = ''; return; }

  statusMsg.textContent = 'Searching...';

  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=20`);
    const data = await res.json();
    songs = (data.results || []).filter(s => s.previewUrl);

    if (songs.length === 0) {
      statusMsg.textContent = 'No songs found.';
      songList.innerHTML = '';
      return;
    }

    statusMsg.textContent = '';
    
    songList.innerHTML = songs.map((s, i) => `
      <li class="song-item" onclick="loadAndPlay(${i})">
        <img src="${s.artworkUrl60}" alt="">
        <div class="song-info">
          <p class="t">${s.trackName}</p>
          <p class="a">${s.artistName}</p>
        </div>
        <i class="fa-solid fa-play"></i>
      </li>
    `).join('');

  } catch (err) {
    statusMsg.textContent = 'Error searching songs.';
  }
}

function loadAndPlay(index) {
  if (index < 0 || index >= songs.length) return;
  currentIndex = index;
  const s = songs[index];
  playFromHome(s.previewUrl, s.trackName, s.artistName, s.artworkUrl100 || s.artworkUrl60);
}

// ===== PLAYER CONTROLS =====
playPauseBtn.addEventListener('click', () => {
  if (!audioPlayer.src) return;
  if (audioPlayer.paused) audioPlayer.play().catch(console.error);
  else audioPlayer.pause();
});

nextBtn.addEventListener('click', () => {
  // If playing from Search, play next search song
  if (songs.length > 0 && currentIndex !== -1) {
      currentIndex = (currentIndex + 1) % songs.length;
      loadAndPlay(currentIndex);
  } else {
      // If playing from home, just alert for now (since we didn't store home array globally)
      alert("Next song: Search tab me jakar gaana select karein");
  }
});

// ===== SYNC UI & PROGRESS =====
audioPlayer.addEventListener('play',  () => playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>');
audioPlayer.addEventListener('pause', () => playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>');
audioPlayer.addEventListener('ended', () => playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>');

audioPlayer.addEventListener('timeupdate', () => {
  if (audioPlayer.duration) {
    const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.style.width = percent + '%';
  }
});
