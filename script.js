const searchInput = document.getElementById('searchInput');
const searchView = document.getElementById('searchView');
const homeView = document.getElementById('homeView');
const searchResults = document.getElementById('searchResults');

// Player Elements
const miniPlayer = document.getElementById('miniPlayer');
const audioPlayer = document.getElementById('audioPlayer');
const playerImg = document.getElementById('playerImg');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');

// Function to search songs online using iTunes API (Free)
searchInput.addEventListener('keyup', async (e) => {
    const query = e.target.value.trim();

    // If input is empty, show home, hide search
    if (query.length === 0) {
        searchView.style.display = 'none';
        homeView.style.display = 'block';
        return;
    }

    // If typing, show search, hide home
    if (query.length > 1) {
        searchView.style.display = 'block';
        homeView.style.display = 'none';

        try {
            // Fetch data from iTunes API
            const response = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&limit=15`);
            const data = await response.json();

            searchResults.innerHTML = ''; // Clear previous results

            if (data.results.length === 0) {
                searchResults.innerHTML = '<p style="color: gray;">No songs found.</p>';
                return;
            }

            // Loop through results and create list items
            data.results.forEach(song => {
                // iTunes returns 100x100 image, we replace to get 300x300 for better quality
                const highResImg = song.artworkUrl100.replace('100x100', '300x300'); 
                
                const div = document.createElement('div');
                div.className = 'search-item';
                div.innerHTML = `
                    <img src="${highResImg}" alt="cover">
                    <div class="search-item-info">
                        <h4>${song.trackName}</h4>
                        <p>${song.artistName}</p>
                    </div>
                `;
                
                // Add click event to play the song
                div.onclick = () => playSong(song.previewUrl, song.trackName, song.artistName, highResImg);
                
                searchResults.appendChild(div);
            });

        } catch (error) {
            console.error("Error fetching data:", error);
            searchResults.innerHTML = '<p style="color: red;">Error loading songs.</p>';
        }
    }
});

// Function to play selected song
function playSong(audioUrl, title, artist, image) {
    if (!audioUrl) {
        alert("Preview not available for this song.");
        return;
    }

    // Update Player UI
    playerImg.src = image;
    playerTitle.innerText = title;
    playerArtist.innerText = artist;
    
    // Show Player
    miniPlayer.style.display = 'flex';
    
    // Play Audio
    audioPlayer.src = audioUrl;
    audioPlayer.play();
}
