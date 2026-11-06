const audio = document.getElementById('audio');
const getEl = id => document.getElementById(id);
const playBtn = getEl('playBtn');
const fsPlayBtn = getEl('fsPlayBtn');
const miniPlayer = getEl('miniPlayer');

let tracks = JSON.parse(localStorage.getItem('arma_tracks') || '[]');
let current = Number(localStorage.getItem('arma_current') || 0);
let shuffle = false;
let repeat = false;

function saveMeta(){
  localStorage.setItem('arma_tracks', JSON.stringify(tracks));
  localStorage.setItem('arma_current', current);
}
function fmt(s){ if(!s || isNaN(s)) return '0:00'; const m = Math.floor(s/60), sec = Math.floor(s%60); return m + ":" + (sec < 10 ? "0" : "") + sec; }
function uid(){ return Math.random().toString(36).slice(2,10); }
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

getEl('file').addEventListener('change', e => {
  const files = [...e.target.files];
  if(!files.length) return;
  
  files.forEach(f => {
    const id = uid();
    const reader = new FileReader();
    reader.onload = function(event) {
      tracks.push({ 
        id: id, name: f.name.replace(/\.[^.]+$/, ''), 
        url: event.target.result, addedAt: Date.now() 
      });
      saveMeta(); 
      renderAll();
      current = tracks.length - 1; 
      loadTrack(current);
      audio.play().catch(()=>{ miniPlayer.style.display = 'flex'; });
    };
    reader.readAsDataURL(f);
  });
});

window.loadTrack = function(i){
  if (!tracks.length) return;
  current = i;
  const t = tracks[i];
  audio.src = t.url;
  getEl('npTitle').textContent = t.name;
  getEl('fsTitle').textContent = t.name;
  miniPlayer.style.display = 'flex'; 
  saveMeta(); renderAll();
};

window.playById = function(id){
  const i = tracks.findIndex(t => t.id === id);
  if (i >= 0) { loadTrack(i); audio.play().catch(e => console.log(e)); }
};

window.togglePlay = function(){ 
  if (!tracks.length) return; 
  if (audio.paused) audio.play(); else audio.pause(); 
};

window.next = function(){
  if (!tracks.length) return;
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
audio.addEventListener('ended', () => { 
  if (repeat === 'all') next(); 
  else if (current < tracks.length - 1) next(); 
  else audio.pause(); 
});

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  getEl('seek').value = pct;
  getEl('curTime').textContent = fmt(audio.currentTime); 
  getEl('durTime').textContent = fmt(audio.duration);
});

getEl('seek').addEventListener('input', e => { if (audio.duration) audio.currentTime = (e.target.value/100) * audio.duration; });
getEl('shuffleBtn').onclick = () => { shuffle = !shuffle; getEl('shuffleBtn').style.color = shuffle ? '#1DB954' : '#fff'; };
getEl('repeatBtn').onclick = () => { if (!repeat) repeat = 'all'; else if (repeat === 'all') repeat = 'one'; else repeat = false; getEl('repeatBtn').style.color = repeat ? '#1DB954' : '#fff'; };

function renderAll() {
  const list = getEl('homeTrackList');
  if (!tracks.length) {
    list.innerHTML = '<div style="color:#888;font-size:0.9rem;padding:10px 0;">No songs added yet.</div>';
    return;
  }
  list.innerHTML = tracks.map((t, i) => {
    const isActive = tracks[current] && tracks[current].id === t.id;
    return `<div class="track-row ${isActive?'active':''}" onclick="playById('${t.id}')">
      <div class="track-num">${isActive ? '▶' : i+1}</div>
      <div>
        <div class="track-name">${esc(t.name)}</div>
        <div class="track-artist">ARMA PLAY</div>
      </div>
      <button class="track-del" onclick="event.stopPropagation(); removeTrack('${t.id}')">✕</button>
    </div>`;
  }).join('');
}

window.removeTrack = function(id){
  const i = tracks.findIndex(t => t.id === id);
  if (i < 0) return;
  tracks.splice(i, 1); 
  if (current >= tracks.length) current = Math.max(0, tracks.length - 1);
  if (!tracks.length) { audio.pause(); audio.src=''; miniPlayer.style.display = 'none'; }
  saveMeta(); renderAll();
};

renderAll();
if (tracks.length) {
  current = Math.min(current, tracks.length - 1);
  getEl('npTitle').textContent = tracks[current].name;
  getEl('fsTitle').textContent = tracks[current].name;
  miniPlayer.style.display = 'flex';
}
