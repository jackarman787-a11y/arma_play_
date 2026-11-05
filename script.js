// ===== ELEMENTS =====
const searchInput  = document.getElementById('searchInput');
const songList     = document.getElementById('songList');
const statusMsg    = document.getElementById('statusMsg');
const audioPlayer  = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn      = document.getElementById('prevBtn');
const nextBtn      = document.getElementById('nextBtn');
const songTitle    = document.getElementById('songTitle');
const artistName   = document.getElementById('artistName');
const coverArt     = document.getElementById('coverArt');
const downloadBtn  = document.getElementById('downloadBtn');
const seekBar      = document.getElementById('seekBar');
const currentTime  = document.getElementById('currentTime');
const durationEl   = document.getElementById('duration');

let songs = [];
let currentIndex = -1;

// ===== SEARCH (debounced) =====
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
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=20`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const data = await res.json();
    songs = (data.results || []).filter(s => s.previewUrl);

    if (songs.length === 0) {
      statusMsg.textContent = 'कोई गाना नहीं मिला';
      songList.innerHTML = '';
      return;
    }

    statusMsg.textContent = '';
    renderSongs();
  } catch (err) {
    console.error(err);
    statusMsg.textContent = 'Search error: ' + err.message;
  }
}

// ===== RENDER LIST =====
function renderSongs() {
  songList.innerHTML = songs.map((s, i) => `
    <li class="song-item ${i === currentIndex ? 'active' : ''}" data-index="${i}">
      <img src="${s.artworkUrl60}" alt="">
      <div class="song-info">
        <p class="t">${s.trackName}</p>
        <p class="a">${s.artistName}</p>
      </div>
      <a class="dl-one" href="${s.previewUrl}" download title="Download">⬇</a>
      <button class="play-one">▶</button>
    </li>
  `).join('');

  songList.querySelectorAll('.song-item').forEach(li => {
    li.addEventListener('click', (e) => {
      if (e.target.classList.contains('dl-one')) return; // download link pe click ho to play na ho
      loadAndPlay(Number(li.dataset.index));
    });
  });
}

// ===== LOAD + PLAY =====
function loadAndPlay(index) {
  if (index < 0 || index >= songs.length) return;
  currentIndex = index;
  const s = songs[index];

  audioPlayer.src = s.previewUrl;
  songTitle.textContent = s.trackName;
  artistName.textContent = s.artistName;
  coverArt.src = s.artworkUrl100 || s.artworkUrl60 || '';
  downloadBtn.href = s.previewUrl;
  downloadBtn.setAttribute('download', `${s.trackName} - ${s.artistName}.m4a`);

  audioPlayer.play().catch(err => console.error('Play error:', err));

  // highlight active song
  songList.querySelectorAll('.song-item').forEach(li => li.classList.remove('active'));
  const active = songList.querySelector(`.song-item[data-index="${index}"]`);
  if (active) active.classList.add('active');
}

// ===== PLAY / PAUSE =====
playPauseBtn.addEventListener('click', () => {
  if (!audioPlayer.src) { alert('पहले कोई गाना चुनो'); return; }
  if (audioPlayer.paused) audioPlayer.play().catch(console.error);
  else audioPlayer.pause();
});

// ===== NEXT / PREVIOUS =====
nextBtn.addEventListener('click', () => {
  if (songs.length === 0) return;
  loadAndPlay((currentIndex + 1) % songs.length);
});

prevBtn.addEventListener('click', () => {
  if (songs.length === 0) return;
  if (audioPlayer.currentTime > 3) { audioPlayer.currentTime = 0; return; }
  loadAndPlay((currentIndex - 1 + songs.length) % songs.length);
});

// ===== SYNC UI =====
audioPlayer.addEventListener('play',  () => playPauseBtn.textContent = '⏸');
audioPlayer.addEventListener('pause', () => playPauseBtn.textContent = '▶');
audioPlayer.addEventListener('ended', () => {
  playPauseBtn.textContent = '▶';
  if (songs.length > 0) loadAndPlay((currentIndex + 1) % songs.length);
});

// ===== PROGRESS BAR =====
function fmt(t) {
  if (!t || isNaN(t)) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

audioPlayer.addEventListener('loadedmetadata', () => {
  seekBar.max = audioPlayer.duration;
  durationEl.textContent = fmt(audioPlayer.duration);
});

audioPlayer.addEventListener('timeupdate', () => {
  seekBar.value = audioPlayer.currentTime;
  currentTime.textContent = fmt(audioPlayer.currentTime);
});

seekBar.addEventListener('input', () => {
  audioPlayer.currentTime = seekBar.value;
});
