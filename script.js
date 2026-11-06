// ============ DATA ============
const data = {
    quickAccess: [
        { title: "Liked Songs", img: "https://picsum.photos/seed/liked/100" },
        { title: "Daily Mix 1", img: "https://picsum.photos/seed/mix1/100" },
        { title: "Chill Vibes", img: "https://picsum.photos/seed/chill/100" },
        { title: "Top Hits", img: "https://picsum.photos/seed/top/100" },
        { title: "Workout", img: "https://picsum.photos/seed/workout/100" },
        { title: "Focus Flow", img: "https://picsum.photos/seed/focus/100" }
    ],
    madeForYou: [
        { title: "Daily Mix 1", desc: "Arijit Singh, Pritam, Atif Aslam", img: "https://picsum.photos/seed/dm1/300" },
        { title: "Daily Mix 2", desc: "A.R. Rahman, Shreya Ghoshal", img: "https://picsum.photos/seed/dm2/300" },
        { title: "Discover Weekly", desc: "Your weekly mixtape of fresh music", img: "https://picsum.photos/seed/dw/300" },
        { title: "Release Radar", desc: "Catch all the latest music", img: "https://picsum.photos/seed/rr/300" },
        { title: "Time Capsule", desc: "Songs from your past", img: "https://picsum.photos/seed/tc/300" }
    ],
    recentlyPlayed: [
        { title: "Lofi Beats", desc: "Chill beats to relax", img: "https://picsum.photos/seed/lofi/300" },
        { title: "Bollywood Hits", desc: "Latest Hindi songs", img: "https://picsum.photos/seed/bolly/300" },
        { title: "Pop 2024", desc: "Top pop hits", img: "https://picsum.photos/seed/pop/300" },
        { title: "Hip Hop", desc: "Best rap tracks", img: "https://picsum.photos/seed/hiphop/300" },
        { title: "Workout Mix", desc: "High energy songs", img: "https://picsum.photos/seed/wm/300" }
    ],
    trending: [
        { title: "Top 50 Global", desc: "The most played tracks worldwide", img: "https://picsum.photos/seed/t50/300" },
        { title: "Top 50 India", desc: "Most played in India", img: "https://picsum.photos/seed/t50in/300" },
        { title: "Viral Hits", desc: "Trending on social media", img: "https://picsum.photos/seed/viral/300" },
        { title: "New Releases", desc: "Fresh drops this week", img: "https://picsum.photos/seed/new/300" },
        { title: "Summer Vibes", desc: "Perfect for the season", img: "https://picsum.photos/seed/summer/300" }
    ],
    artists: [
        { title: "Arijit Singh", desc: "Artist", img: "https://picsum.photos/seed/arijit/300" },
        { title: "Diljit Dosanjh", desc: "Artist", img: "https://picsum.photos/seed/diljit/300" },
        { title: "A.R. Rahman", desc: "Artist", img: "https://picsum.photos/seed/ar/300" },
        { title: "Taylor Swift", desc: "Artist", img: "https://picsum.photos/seed/taylor/300" },
        { title: "Ed Sheeran", desc: "Artist", img: "https://picsum.photos/seed/ed/300" }
    ]
};

// ============ RENDER FUNCTIONS ============

// Render Quick Access Grid
function renderQuickAccess() {
    const grid = document.getElementById('quickAccessGrid');
    grid.innerHTML = data.quickAccess.map(item => `
        <div class="quick-card" data-title="${item.title}">
            <img src="${item.img}" alt="${item.title}">
            <span>${item.title}</span>
            <button class="quick-play" onclick="playTrack(event, '${item.title}', 'Playlist')">
                <i class="fa-solid fa-play"></i>
            </button>
        </div>
    `).join('');
}

// Render Cards (reusable)
function renderCards(containerId, items, isArtist = false) {
    const container = document.getElementById(containerId);
    container.innerHTML = items.map(item => `
        <div class="card ${isArtist ? 'artist' : ''}" onclick="playTrack(event, '${item.title}', '${item.desc}')">
            <div class="card-img-wrapper">
                <img src="${item.img}" alt="${item.title}">
                <button class="card-play" onclick="playTrack(event, '${item.title}', '${item.desc}')">
                    <i class="fa-solid fa-play"></i>
                </button>
            </div>
            <h3>${item.title}</h3>
            <p>${item.desc}</p>
        </div>
    `).join('');
}

// ============ PLAYER LOGIC ============

let isPlaying = false;
let currentTrack = { title: "Select a song", artist: "Artist" };
let progressInterval = null;
let currentProgress = 0;
const totalDuration = 210; // 3:30 dummy duration

// Play a track
function playTrack(event, title, artist) {
    if (event) event.stopPropagation();
    
    currentTrack = { title, artist };
    document.getElementById('nowPlayingTitle').textContent = title;
    document.getElementById('nowPlayingArtist').textContent = artist;
    
    // Random album art
    const artSeed = title.replace(/\s/g, '').toLowerCase();
    document.getElementById('nowPlayingArt').style.backgroundImage = 
        `url('https://picsum.photos/seed/${artSeed}/100')`;
    
    // Reset progress
    currentProgress = 0;
    updateProgressUI();
    
    // Play
    isPlaying = true;
    updatePlayButton();
    startProgress();
    
    // Update total time display
    document.getElementById('totalTime').textContent = formatTime(totalDuration);
}

// Toggle play/pause
function togglePlay() {
    if (!currentTrack.title || currentTrack.title === "Select a song") {
        // Play first quick access item if nothing selected
        playTrack(null, data.quickAccess[0].title, "Playlist");
        return;
    }
    
    isPlaying = !isPlaying;
    updatePlayButton();
    
    if (isPlaying) {
        startProgress();
    } else {
        stopProgress();
    }
}

// Update play button icon
function updatePlayButton() {
    const btn = document.getElementById('playBtn');
    btn.innerHTML = isPlaying 
        ? '<i class="fa-solid fa-pause"></i>' 
        : '<i class="fa-solid fa-play"></i>';
}

// Progress bar animation
function startProgress() {
    stopProgress();
    progressInterval = setInterval(() => {
        currentProgress += 1;
        if (currentProgress >= totalDuration) {
            currentProgress = 0;
            // Auto-play next (simple: reset)
        }
        updateProgressUI();
    }, 1000);
}

function stopProgress() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

function updateProgressUI() {
    const slider = document.getElementById('progressSlider');
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');
    
    slider.value = (currentProgress / totalDuration) * 100;
    currentTimeEl.textContent = formatTime(currentProgress);
    totalTimeEl.textContent = formatTime(totalDuration);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============ EVENT LISTENERS ============

document.addEventListener('DOMContentLoaded', () => {
    // Render all sections
    renderQuickAccess();
    renderCards('madeForYou', data.madeForYou);
    renderCards('recentlyPlayed', data.recentlyPlayed);
    renderCards('trending', data.trending);
    renderCards('artists', data.artists, true);

    // Play button
    document.getElementById('playBtn').addEventListener('click', togglePlay);

    // Progress slider
    const progressSlider = document.getElementById('progressSlider');
    progressSlider.addEventListener('input', (e) => {
        currentProgress = (e.target.value / 100) * totalDuration;
        updateProgressUI();
    });

    // Volume slider
    document.getElementById('volumeSlider').addEventListener('input', (e) => {
        console.log('Volume:', e.target.value + '%');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            togglePlay();
        }
    });

    // Initial duration display
    document.getElementById('totalTime').textContent = formatTime(totalDuration);
});

// ============ SEARCH SIMULATION ============
// (Optional: Hook into sidebar search)
document.querySelector('nav a:nth-child(2)')?.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Search functionality: Type to find songs, artists, albums!');
});

// ============ SMOOTH SCROLL ============
document.querySelector('.content-scroll')?.addEventListener('scroll', function() {
    const topBar = document.querySelector('.top-bar');
    if (this.scrollTop > 50) {
        topBar.style.background = 'rgba(18, 18, 18, 0.95)';
        topBar.style.backdropFilter = 'blur(10px)';
    } else {
        topBar.style.background = 'transparent';
        topBar.style.backdropFilter = 'none';
    }
});
