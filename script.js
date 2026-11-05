// ===== ELEMENTS =====
* { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

body {
  background-color: #000;
  color: #fff;
  padding-bottom: 150px; /* Space for mini player and nav */
  overflow-x: hidden;
}

/* ===== COMMON ===== */
.hidden { display: none !important; }
.app-container { padding: 16px; }

/* ===== HEADER ===== */
.header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; overflow-x: auto; }
.profile-icon {
  width: 36px; height: 36px; background: #ff4b8b; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;
}
.chips { display: flex; gap: 8px; }
.chip {
  padding: 6px 14px; background: #2a2a2a; border-radius: 20px; font-size: 13px; font-weight: 500; white-space: nowrap;
}
.chip.active { background: #1ed760; color: #000; }

/* ===== SECTION TITLES ===== */
.section-title { font-size: 22px; font-weight: 700; margin: 20px 0 12px 0; letter-spacing: -0.5px; }

/* ===== QUICK GRID (Top 8 items) ===== */
.quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.quick-item {
  display: flex; align-items: center; gap: 10px; background: #282828; border-radius: 4px;
  overflow: hidden; height: 56px; cursor: pointer;
}
.quick-item img { width: 56px; height: 56px; object-fit: cover; }
.quick-item span { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 8px;}

/* ===== CARD SCROLL (Horizontal scrolling) ===== */
.card-scroll { display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 10px; }
.card-scroll::-webkit-scrollbar { display: none; }
.card {
  width: 150px; flex-shrink: 0; scroll-snap-align: start; cursor: pointer;
}
.card img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 6px; margin-bottom: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
.card-title { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-subtitle { font-size: 12px; color: #a7a7a7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;}

/* ===== SEARCH SCREEN ===== */
.search-header h2 { font-size: 26px; margin-bottom: 15px; }
.search-header input {
  width: 100%; padding: 12px 16px; background: #242424; border: none; border-radius: 6px;
  color: #fff; font-size: 16px; outline: none;
}
.status-msg { color: #a7a7a7; margin-top: 20px; text-align: center; }
.song-list { list-style: none; margin-top: 15px; }
.song-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #1a1a1a; cursor: pointer; }
.song-item img { width: 45px; height: 45px; border-radius: 4px; }
.song-info { flex: 1; min-width: 0; }
.song-info .t { font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
.song-info .a { font-size: 12px; color: #a7a7a7; }
.song-item i { color: #1ed760; }

/* ===== MINI PLAYER ===== */
.mini-player {
  position: fixed; bottom: 65px; left: 8px; right: 8px;
  background: #1a1a1a; border-radius: 8px; padding: 10px;
  display: flex; align-items: center; gap: 12px; z-index: 100;
  box-shadow: 0 4px 15px rgba(0,0,0,0.6); border: 1px solid #282828;
}
.mini-player img { width: 44px; height: 44px; border-radius: 4px; background: #282828; }
.mp-text { flex: 1; min-width: 0; }
#songTitle { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#artistName { font-size: 12px; color: #a7a7a7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mini-player button, .mini-player a {
  background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; padding: 4px;
}
#playPauseBtn { font-size: 26px; color: #1ed760; }
#downloadBtn { color: #a7a7a7; font-size: 18px; }
.mp-progress {
  position: absolute; bottom: 0; left: 10px; right: 10px; height: 2px; background: #333; border-radius: 2px;
}
#progressBar { height: 100%; background: #1ed760; width: 0%; border-radius: 2px; transition: width 0.1s; }

/* ===== BOTTOM NAVIGATION ===== */
.bottom-nav {
  position: fixed; bottom: 0; left: 0; right: 0; height: 60px;
  background: linear-gradient(to top, #000 70%, rgba(0,0,0,0.8));
  display: flex; justify-content: space-around; align-items: center; z-index: 101;
}
.nav-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px; color: #a7a7a7; cursor: pointer;
}
.nav-item i { font-size: 20px; }
.nav-item span { font-size: 11px; font-weight: 600; }
.nav-item.active { color: #fff; }
