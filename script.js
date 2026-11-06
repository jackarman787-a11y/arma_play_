/* ============================================================
   ARMA PLAY — Spotify-style player
   FIX: full song plays even after refresh (IndexedDB storage)
   ============================================================ */

const audio = document.getElementById('audio');
const $ = id => document.getElementById(id);
const playBtn = $('playBtn');
const fsPlayBtn = $('fsPlayBtn');

/* ---------------- INDEXEDDB (the real fix for 30s bug) ---------------- */
const DB_NAME = 'arma-play-db';
const STORE = 'songs';
let db = null;

function openDB(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}

function dbSave(id, blob){
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ id, blob });
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
  });
}

function dbGet(id){
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => res(req.result ? req.result.blob : null);
    req.onerror = () => rej(req.error);
  });
}

function dbDelete(id){
  return new Promise((res) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = res;
  });
}

/* ---------------- STATE ---------------- */
let tracks = JSON.parse(localStorage.getItem('arma_tracks') || '[]'); // {id, name, duration, addedAt}
let playlists = JSON.parse(localStorage.getItem('arma_playlists') || '[]');
let current = Number(localStorage.getItem('arma_current') || 0);
let liked = JSON.parse(localStorage.getItem('arma_liked') || '[]');
let shuffle = false;
let repeat = false;   // false | 'all' | 'one'
let activePlaylistId = null;

function saveMeta(){
  localStorage.setItem('arma_tracks', JSON.stringify(tracks));
  localStorage.setItem('arma_playlists', JSON.stringify(playlists));
  localStorage.setItem('arma_current', current);
  localStorage.setItem('arma_liked', JSON.stringify(liked));
}

function fmt(s){
  if(!s || isNaN(s)) return '0:00';
  const m = Math.floor(s/60), sec = Math.floor(s%60);
  return `${m}:${sec.toString().padStart(2,'0')}`;
}
function uid(){ return Math.random().toString(36).slice(2,10); }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ---------------- NAVIGATION ---------------- */
function switchView(view){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const target = $('view-' + view);
  if (target) target.classList.add('active');
  const navLink = document.querySelector(`.nav-link[data-view="${view}"]`);
  if (navLink) navLink.classList.add('active');

  if (view === 'home') renderHome();
  if (view === 'search') renderSearch($('searchInput').value);
  if (view === 'library') renderLibrary();
  if (view === 'queue') renderQueue();
  if (view === 'playlist') renderPlaylist(activePlaylistId);
}
document.querySelectorAll('.nav-link, .see-all').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    const v = el.dataset.view;
    if (v) switchView(v);
  });
});
$('backBtn').onclick = () => switchView('home');

/* ---------------- ADD MUSIC ---------------- */
$('addMusicBtn').onclick = () => $('file').click();

$('file').addEventListener('change', async e => {
  const files = [...e.target.files];
  for (const f of files){
    const id = uid();
    // Save blob to IndexedDB so it survives refresh
    await dbSave(id, f);
    tracks.push({
      id,
      name: f.name.replace(/\.[^.]+$/, ''),
      duration: 0,
      addedAt: Date.now()
    });
  }
  saveMeta();
  renderAll();
  if (tracks.length && !audio.src) { current = 0; await loadTrack(current); }
});

/* ---------------- PLAYBACK ---------------- */
async function loadTrack(i){
  if (!tracks.length) return;
  current = i;
  const t = tracks[i];
  const blob = await dbGet(t.id);
  if (!blob){ console.warn('Blob missing for', t.name); return; }

  if (audio.src) URL.revokeObjectURL(audio.src);
  audio.src = URL.createObjectURL(blob);

  $('npTitle').textContent = t.name;
  $('npArtist').textContent = 'ARMA PLAY';
  $('fsTitle').textContent = t.name;
  $('fsArtist').textContent = 'ARMA PLAY';
  $('likeBtn').classList.toggle('liked', liked.includes(t.id));
  saveMeta();
  renderAll();
}

async function play(i){
  await loadTrack(i);
  audio.play().catch(err => console.warn('play error:', err));
}

function togglePlay(){
  if (!tracks.length) { $('file').click(); return; }
  if (audio.paused) audio.play(); else audio.pause();
}

function next(){
  if (!tracks.length) return;
  if (repeat === 'one') { audio.currentTime = 0; audio.play(); return; }
  if (shuffle) current = Math.floor(Math.random() * tracks.length);
  else current = (current + 1) % tracks.length;
  play(current);
}
function prev(){
  if (!tracks.length) return;
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  current = (current - 1 + tracks.length) % tracks.length;
  play(current);
}

/* Audio events */
audio.addEventListener('play', () => { playBtn.textContent='⏸'; fsPlayBtn.textContent='⏸'; });
audio.addEventListener('pause', () => { playBtn.textContent='▶'; fsPlayBtn.textContent='▶'; });
audio.addEventListener('ended', () => {
  if (repeat === 'all') next();
  else if (current < tracks.length - 1) next();
  else audio.pause();
});
audio.addEventListener('loadedmetadata', () => {
  $('durTime').textContent = fmt(audio.duration);
  $('fsDur').textContent = fmt(audio.duration);
  if (tracks[current] && !tracks[current].duration){
    tracks[current].duration = audio.duration;
    saveMeta();
    renderAll();
  }
});
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  $('seek').value = pct;
  $('fsSeek').value = pct;
  $('curTime').textContent = fmt(audio.currentTime);
  $('fsCur').textContent = fmt(audio.currentTime);
});
audio.addEventListener('error', () => {
  console.warn('Audio error, skipping...');
  setTimeout(next, 300);
});

/* Sliders */
$('seek').addEventListener('input', e => {
  if (audio.duration) audio.currentTime = (e.target.value/100) * audio.duration;
});
$('fsSeek').addEventListener('input', e => {
  if (audio.duration) audio.currentTime = (e.target.value/100) * audio.duration;
});
$('volume').addEventListener('input', e => { audio.volume = e.target.value/100; });

/* shuffle / repeat */
$('shuffleBtn').onclick = () => { shuffle = !shuffle; $('shuffleBtn').classList.toggle('on', shuffle); };
$('repeatBtn').onclick = () => {
  if (!repeat) repeat = 'all';
  else if (repeat === 'all') repeat = 'one';
  else repeat = false;
  $('repeatBtn').classList.toggle('on', repeat !== false);
  $('repeatBtn').textContent = repeat === 'one' ? '🔂' : '🔁';
};

/* like */
$('likeBtn').onclick = () => {
  const t = tracks[current]; if (!t) return;
  if (liked.includes(t.id)) liked = liked.filter(x => x !== t.id);
  else liked.push(t.id);
  $('likeBtn').classList.toggle('liked', liked.includes(t.id));
  saveMeta();
};

/* fullscreen */
$('expandBtn').onclick = () => $('fullscreen').classList.add('show');
$('fsClose').onclick   = () => $('fullscreen').classList.remove('show');
$('queueBtn').onclick  = () => switchView('queue');

/* ---------------- RENDERERS ---------------- */
function renderAll(){
  renderHome();
  renderLibrary();
  renderQueue();
  renderPlaylists();
  if (activePlaylistId) renderPlaylist(activePlaylistId);
}

function renderHome(){
  const recent = $('recentGrid');
  const recentTracks = [...tracks].sort((a,b) => (b.addedAt||0)-(a.addedAt||0)).slice(0,6);
  if (!recentTracks.length){
    recent.innerHTML = '<div class="card"><div class="card-cover">🎵</div><div class="card-title">No tracks yet</div><div class="card-sub">Tap + Add Music</div></div>';
  } else {
    recent.innerHTML = recentTracks.map(t =>
      `<div class="card" onclick="playById('${t.id}')">
         <div class="card-cover">🎵</div>
         <div class="card-title">${escapeHtml(t.name)}</div>
         <div class="card-sub">ARMA PLAY</div>
       </div>`).join('');
  }
  $('homeTrackList').innerHTML = trackListHTML(tracks);
}

$('searchInput').addEventListener('input', e => renderSearch(e.target.value));
function renderSearch(q){
  const out = $('searchResults');
  if (!q.trim()){ out.innerHTML = '<p style="color:#888">Type to search your music</p>'; return; }
  const results = tracks.filter(t => t.name.toLowerCase().includes(q.toLowerCase()));
  if (!results.length){ out.innerHTML = '<p style="color:#888">No results</p>'; return; }
  out.innerHTML = results.map(t =>
    `<div class="card" onclick="playById('${t.id}')">
       <div class="card-cover">🎵</div>
       <div class="card-title">${escapeHtml(t.name)}</div>
       <div class="card-sub">ARMA PLAY</div>
     </div>`).join('');
}

function renderLibrary(){ $('libraryTrackList').innerHTML = trackListHTML(tracks); }
function renderQueue(){ $('queueTrackList').innerHTML = trackListHTML(tracks); }

function renderPlaylist(id){
  const pl = playlists.find(p => p.id === id);
  if (!pl){ switchView('library'); return; }
  $('playlistName').textContent = pl.name;
  $('playlistMeta').textContent = `${pl.trackIds.length} songs`;
  const plTracks = pl.trackIds.map(tid => tracks.find(t => t.id === tid)).filter(Boolean);
  $('playlistTracks').innerHTML = trackListHTML(plTracks, id);
}

function trackListHTML(list, playlistId=null){
  if (!list.length) return '<div class="empty">No tracks</div>';
  return list.map((t, i) => {
    const isActive = tracks[current] && tracks[current].id === t.id;
    return `<div class="track-row ${isActive?'active':''}">
      <div class="track-num">${isActive ? '▶' : i+1}</div>
      <div class="track-art">🎵</div>
      <div class="track-info" onclick="playById('${t.id}')">
        <div class="track-name">${escapeHtml(t.name)}</div>
        <div class="track-artist">ARMA PLAY</div>
      </div>
      <div class="track-actions">
        ${playlistId
          ? `<button title="Remove from playlist" onclick="event.stopPropagation(); removeFromPlaylist('${playlistId}','${t.id}')">✕</button>`
          : `<button title="Add to playlist" onclick="event.stopPropagation(); addToPlaylistPrompt('${t.id}')">＋</button>
             <button title="Delete" onclick="event.stopPropagation(); removeTrack('${t.id}')">✕</button>`}
      </div>
      <div class="track-duration">${fmt(t.duration)}</div>
    </div>`;
  }).join('');
}

function playById(id){
  const i = tracks.findIndex(t => t.id === id);
  if (i >= 0
