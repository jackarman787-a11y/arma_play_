const audio = document.getElementById('audio');
const getEl = id => document.getElementById(id);
const playBtn = getEl('playBtn');
const fsPlayBtn = getEl('fsPlayBtn');

let tracks = JSON.parse(localStorage.getItem('arma_tracks') || '[]');
let playlists = JSON.parse(localStorage.getItem('arma_playlists') || '[]');
let current = Number(localStorage.getItem('arma_current') || 0);
let shuffle = false;
let repeat = false;
let db = null;

function openDB(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('arma-play-db', 1);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('songs')) d.createObjectStore('songs', { keyPath: 'id' });
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}
function dbSave(id, blob){
  return new Promise((res, rej) => {
    if(!db) return rej("DB not ready");
    const tx = db.transaction('songs', 'readwrite');
    tx.objectStore('songs').put({ id, blob });
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
}
function dbGet(id){
  return new Promise((res, rej) => {
    if(!db) return rej("DB not ready");
    const tx = db.transaction('songs', 'readonly');
    const req = tx.objectStore('songs').get(id);
    req.onsuccess = () => res(req.result ? req.result.blob : null);
    req.onerror = () => rej(req.error);
  });
}
function dbDelete(id){
  return new Promise((res) => {
    if(!db) return res();
    const tx = db.transaction('songs', 'readwrite');
    tx.objectStore('songs').delete(id);
    tx.oncomplete = res;
  });
}

function saveMeta(){
  localStorage.setItem('arma_tracks', JSON.stringify(tracks));
  localStorage.setItem('arma_playlists', JSON.stringify(playlists));
  localStorage.setItem('arma_current', current);
}
function fmt(s){ if(!s || isNaN(s)) return '0:00'; const m = Math.floor(s/60), sec = Math.floor(s%60); return m + ":" + (sec < 10 ? "0" : "") + sec; }
function uid(){ return Math.random().toString(36).slice(2,10); }
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

window.switchView = function(view){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const target = getEl('view-' + view); if (target) target.classList.add('active');
  const navLink = document.querySelector('.nav-link[data-view="'+view+'"]'); if (navLink) navLink.classList.add('active');
  if (view === 'home') renderHome();
  if (view === 'search') renderSearch(getEl('searchInput').value);
  if (view === 'library') renderLibrary();
  if (view === 'queue') renderQueue();
};

document.querySelectorAll('.nav-link, .see-all').forEach(el => {
  el.addEventListener('click', e => { e.preventDefault(); const v = el.dataset.view; if (v) switchView(v); });
});
getEl('backBtn').onclick = () => switchView('home');
getEl('addMusicBtn').onclick = () => getEl('file').click();

getEl('file').addEventListener('change', async e => {
  const files = [...e.target.files];
  if(!db) await openDB();
  for (const f of files){
    const id = uid();
    await dbSave(id, f);
    tracks.push({ id: id, name: f.name.replace(/\.[^.]+$/, ''), duration: 0, addedAt: Date.now() });
  }
  saveMeta(); renderAll();
  if (tracks.length) { current = tracks.length - 1; loadTrack(current); }
});

window.loadTrack = async function(i){
  if (!tracks.length) return;
  current = i;
  const t = tracks[i];
  const blob = await dbGet(t.id);
  if (!blob){ alert('File missing'); return; }
  if (audio.src) URL.revokeObjectURL(audio.src);
  audio.src = URL.createObjectURL(blob);
  getEl('npTitle').textContent = t.name;
  getEl('npArtist').textContent = 'ARMA PLAY';
  getEl('fsTitle').textContent = t.name;
  getEl('fsArtist').textContent = 'ARMA PLAY';
  saveMeta(); renderAll();
};

window.playById = function(id){
  const i = tracks.findIndex(t => t.id === id);
  if (i >= 0) { loadTrack(i).then(() => { audio.play().catch(e => console.log(e)); }); }
};
window.togglePlay = function(){ if (!tracks.length) { getEl('file').click(); return; } if (audio.paused) audio.play(); else audio.pause(); };
window.next = function(){
  if (!tracks.length) return;
  if (repeat === 'one') { audio.currentTime = 0; audio.play(); return; }
  if (shuffle) current = Math.floor(Math.random() * tracks.length);
  else current = (current + 1) % tracks.length;
  playById(tracks[current].id);
};
window.prev = function(){
  if (!tracks.length) return;
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  current = (current - 1 + tracks.length) % tracks.length;
  playById(tracks[current].id);
};

audio.addEventListener('play', () => { playBtn.textContent='⏸'; fsPlayBtn.textContent='⏸'; });
audio.addEventListener('pause', () => { playBtn.textContent='▶'; fsPlayBtn.textContent='▶'; });
audio.addEventListener('ended', () => { if (repeat === 'all') next(); else if (current < tracks.length - 1) next(); else audio.pause(); });
audio.addEventListener('loadedmetadata', () => {
  getEl('durTime').textContent = fmt(audio.duration);
  getEl('fsDur').textContent = fmt(audio.duration);
  if (tracks[current] && !tracks[current].duration){ tracks[current].duration = audio.duration; saveMeta(); renderAll(); }
});
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  getEl('seek').value = pct; getEl('fsSeek').value = pct;
  getEl('curTime').textContent = fmt(audio.currentTime); getEl('fsCur').textContent = fmt(audio.currentTime);
});

getEl('seek').addEventListener('input', e => { if (audio.duration) audio.currentTime = (e.target.value/100) * audio.duration; });
getEl('fsSeek').addEventListener('input', e => { if (audio.duration) audio.currentTime = (e.target.value/100) * audio.duration; });
getEl('volume').addEventListener('input', e => { audio.volume = e.target.value/100; });
getEl('shuffleBtn').onclick = () => { shuffle = !shuffle; getEl('shuffleBtn').classList.toggle('on', shuffle); };
getEl('repeatBtn').onclick = () => { if (!repeat) repeat = 'all'; else if (repeat === 'all') repeat = 'one'; else repeat = false; getEl('repeatBtn').classList.toggle('on', repeat !== false); getEl('repeatBtn').textContent = repeat === 'one' ? '🔂' : '🔁'; };
getEl('expandBtn').onclick = () => getEl('fullscreen').classList.add('show');
getEl('fsClose').onclick = () => getEl('fullscreen').classList.remove('show');
getEl('queueBtn').onclick = () => switchView('queue');

function renderAll(){ renderHome(); renderLibrary(); renderQueue(); renderPlaylists(); }

function renderHome(){
  const recent = getEl('recentGrid');
  const recentTracks = [...tracks].sort((a,b) => (b.addedAt||0)-(a.addedAt||0)).slice(0,6);
  if (!recentTracks.length) recent.innerHTML = '<div class="card"><div class="card-cover">🎵</div><div class="card-title">No tracks</div><div class="card-sub">Add Music</div></div>';
  else recent.innerHTML = recentTracks.map(t => '<div class="card" onclick="playById(' + "'" + t.id + "'" + ')"><div class="card-cover">🎵</div><div class="card-title">'+esc(t.name)+'</div><div class="card-sub">ARMA PLAY</div></div>').join('');
  getEl('homeTrackList').innerHTML = trackListHTML(tracks);
}

getEl('searchInput').addEventListener('input', e => renderSearch(e.target.value));
function renderSearch(q){
  const out = getEl('searchResults');
  if (!q.trim()){ out.innerHTML = '<p style="color:#888">Type to search</p>'; return; }
  const results = tracks.filter(t => t.name.toLowerCase().includes(q.toLowerCase()));
  if (!results.length){ out.innerHTML = '<p style="color:#888">No results</p>'; return; }
  out.innerHTML = results.map(t => '<div class="card" onclick="playById(' + "'" + t.id + "'" + ')"><div class="card-cover">🎵</div><div class="card-title">'+esc(t.name)+'</div><div class="card-sub">ARMA PLAY</div></div>').join('');
}

function renderLibrary(){ getEl('libraryTrackList').innerHTML = trackListHTML(tracks); }
function renderQueue(){ getEl('queueTrackList').innerHTML = trackListHTML(tracks); }

function trackListHTML(list){
  if (!list.length) return '<div class="empty">No tracks yet.</div>';
  return list.map((t, i) => {
    const isActive = tracks[current] && tracks[current].id === t.id;
    let actions = '<button title="Delete" onclick="event.stopPropagation(); removeTrack(' + "'" + t.id + "'" + ')">✕</button>';
    return '<div class="track-row '+(isActive?'active':'')+'">' +
      '<div class="track-num">'+(isActive ? '▶' : i+1)+'</div>' +
      '<div class="track-art">🎵</div>' +
      '<div class="track-info" onclick="playById(' + "'" + t.id + "'" + ')">' +
        '<div class="track-name">'+esc(t.name)+'</div><div class="track-artist">ARMA PLAY</div>' +
      '</div>' +
      '<div class="track-actions">'+actions+'</div>' +
      '<div class="track-duration">'+fmt(t.duration)+'</div>' +
    '</div>';
  }).join('');
}

window.removeTrack = async function(id){
  const i = tracks.findIndex(t => t.id === id);
  if (i < 0) return;
  if(!confirm('Delete song?')) return;
  tracks.splice(i, 1); await dbDelete(id);
  if (current >= tracks.length) current = Math.max(0, tracks.length - 1);
  if (!tracks.length) { audio.pause(); audio.src=''; }
  saveMeta(); renderAll();
};

function renderPlaylists(){
  const out = getEl('playlists');
  if (!playlists.length) { out.innerHTML = '<div style="color:#666;font-size:0.8rem;padding:8px 12px">No playlists</div>'; return; }
  out.innerHTML = playlists.map(p => '<div class="playlist-item">🎵 '+esc(p.name)+'</div>').join('');
}

getEl('newPlaylistBtn').onclick = () => {
  const name = prompt('Playlist name:'); if (!name) return;
  playlists.push({ id: uid(), name: name, trackIds: [] });
  saveMeta(); renderPlaylists();
};

(async () => {
  await openDB();
  if (tracks.length) {
    current = Math.min(current, tracks.length - 1);
    renderAll();
    getEl('npTitle').textContent = tracks[current].name;
    getEl('fsTitle').textContent = tracks[current].name;
  } else {
    renderAll();
  }
})();
