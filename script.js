let currentFontSize = 1.15;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let favoritesOnlyMode = false;
let allSongsData = []; // Store the full tagged objects here

function applySettings() {
    const savedAlignment = localStorage.getItem('alignment');
    const savedTheme = localStorage.getItem('theme');

    if (savedAlignment === 'center') {
        document.getElementById('toc').classList.add('center-align');
        document.getElementById('songbook').classList.add('center-align');
    }
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

function toggleOptions() {
    const menu = document.getElementById('options-menu');
    menu.style.display = (menu.style.display === 'none' || menu.style.display === '') ? 'flex' : 'none';
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function toggleAlignment() {
    const toc = document.getElementById('toc');
    const songbook = document.getElementById('songbook');
    const isCentered = toc.classList.toggle('center-align');
    songbook.classList.toggle('center-align');
    localStorage.setItem('alignment', isCentered ? 'center' : 'left');
}

// --- FAVORITES LOGIC ---

function toggleFavorite(songId, event) {
    event.preventDefault();
    const index = favorites.indexOf(songId);

    if (index === -1) {
        favorites.push(songId);
    } else {
        favorites.splice(index, 1);
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateHeartUI(songId);
    if (favoritesOnlyMode) filterSongs();
}

function updateHeartUI(songId) {
    const isFav = favorites.includes(songId);
    const mainHeart = document.querySelector(`.song-chunk[id="${songId}"] .fav-btn`);
    if (mainHeart) {
        mainHeart.innerHTML = isFav ? '❤️' : '🤍';
        mainHeart.className = `fav-btn ${isFav ? 'heart-full' : 'heart-empty'}`;
    }
    const tocLink = document.querySelector(`#toc a[href="#${songId}"]`);
    if (tocLink) {
        tocLink.parentElement.classList.toggle('is-favorite', isFav);
    }
}

function toggleFavoritesFilter() {
    favoritesOnlyMode = !favoritesOnlyMode;
    const btn = document.getElementById('fav-filter-btn');
    btn.style.backgroundColor = favoritesOnlyMode ? '#e74c3c' : '';
    btn.style.color = favoritesOnlyMode ? 'white' : '';
    filterSongs();
}

function clearAllFavorites() {
    if (confirm("Are you sure you want to clear all favorites?")) {
        favorites = [];
        localStorage.setItem('favorites', JSON.stringify(favorites));
        location.reload();
    }
}

// --- UPDATED LOAD & FILTER ---

async function loadSongs() {
    const toc = document.getElementById('toc');
    const main = document.getElementById('songbook');

    applySettings();

    try {
        const response = await fetch('songs_tagged.json');
        allSongsData = await response.json();

        let tocHtml = '';
        let currentLetter = '';
        let insideList = false;

        // Generate Table of Contents with proper nested structures
        allSongsData.forEach(songObj => {
            const song = songObj.title;
            const id = song.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const isFav = favorites.includes(id);

            let cleanTitle = song.toLowerCase().startsWith("the ") ? song.substring(4) : song;
            if (cleanTitle.startsWith("(")) {
                const endBracket = cleanTitle.indexOf(")");
                if (endBracket !== -1) cleanTitle = cleanTitle.substring(endBracket + 1).trim();
            }
            const firstChar = cleanTitle.charAt(0).toUpperCase();

            if (firstChar !== currentLetter) {
                currentLetter = firstChar;
                if (insideList) {
                    tocHtml += '</ul>';
                }
                tocHtml += '<ul>';
                insideList = true;
            }

            const tagLabels = (songObj.tags || []).map(t => `<span class="toc-tag">${t}</span>`).join('');

            tocHtml += `<li class="${isFav ? 'is-favorite' : ''}" data-tags="${(songObj.tags || []).join(',')}">
                <a href="#${id}">${song}</a>${tagLabels}<span class="toc-heart"> ❤️</span>
            </li>`;
        });

        if (insideList) {
            tocHtml += '</ul>';
        }

        toc.innerHTML = tocHtml;

        // Load Lyrics
        const songPromises = allSongsData.map(async (songObj) => {
            const song = songObj.title;
            const id = song.toLowerCase().replace(/[^a-z0-9]/g, '-');
            try {
                const res = await fetch(`./songs/${encodeURIComponent(song)}.txt`);
                const text = await res.text();
                const lines = text.split('\n');
                const body = lines[0].startsWith("Title:") ? lines.slice(1).join('\n') : text;
                const formatted = body.trim().replace(/\*\*(.*?)\*\*/gs, '<b>$1</b>');
                return {
                    id,
                    title: song,
                    author: songObj.author || '',
                    lyrics: formatted,
                    tags: songObj.tags || []
                };
            } catch (err) {
                return { id, title: song, author: songObj.author || '', lyrics: "Error loading lyrics.", tags: [] };
            }
        });

        const renderedSongs = await Promise.all(songPromises);

        main.innerHTML = `<div id="empty-fav-message">Press the ❤️ emoji on any song to save it to this list.</div>` +
        renderedSongs.map(s => {
            const isFav = favorites.includes(s.id);
            return `
                <section class="song-chunk" id="${s.id}" data-tags="${(s.tags || []).join(',')}">
                    <h1>${s.title} <button class="fav-btn ${isFav ? 'heart-full' : 'heart-empty'}" onclick="toggleFavorite('${s.id}', event)">${isFav ? '❤️' : '🤍'}</button></h1>
                    ${s.author ? `<div class="song-author">By ${s.author}</div>` : ''}
                    <div class="lyrics">${s.lyrics}</div>
                    <a href="#songSearch" class="back-to-top">↑ Back to table of contents</a>
                </section>
            `
        }).join('');

    } catch (e) {
        toc.innerHTML = `<p style="color:red;">Error: ${e.message}</p>`;
    }
}

// --- Clear Search Functions (Place them OUTSIDE loadSongs) ---
function clearSearch() {
    const searchInput = document.getElementById('songSearch');
    if (searchInput) {
        searchInput.value = '';
        filterSongs();
        toggleClearButton();
    }
}

function toggleClearButton() {
    const searchInput = document.getElementById('songSearch');
    const clearBtn = document.getElementById('clear-search-btn');
    if (searchInput && clearBtn) {
        if (searchInput.value.length > 0) {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
        }
    }
}

function filterSongs() {
    const query = document.getElementById('songSearch').value.toLowerCase();
    const selectedTag = document.getElementById('tagFilter').value;
    const tocItems = document.querySelectorAll('#toc li');
    const sections = document.querySelectorAll('.song-chunk');
    const emptyMsg = document.getElementById('empty-fav-message');

    let visibleCount = 0;

    sections.forEach(s => {
        const title = s.querySelector('h1').textContent.toLowerCase();
        const authorEl = s.querySelector('.song-author');
        const author = authorEl ? authorEl.textContent.toLowerCase() : '';
        const isFav = favorites.includes(s.id);
        const songTags = (s.getAttribute('data-tags') || '').split(',');

        const matchesSearch = title.includes(query) || author.includes(query);
        const matchesTag = selectedTag === "" || songTags.includes(selectedTag);
        const matchesFavFilter = !favoritesOnlyMode || isFav;

        if (matchesSearch && matchesTag && matchesFavFilter) {
            s.style.display = 'block';
            visibleCount++;
        } else {
            s.style.display = 'none';
        }
    });

    // Update TOC display
    tocItems.forEach(li => {
        if (li.classList.contains('toc-letter-header')) {
            li.style.display = (query === '' && selectedTag === '' && !favoritesOnlyMode) ? '' : 'none';
        } else {
            const text = li.textContent.toLowerCase();
            const id = li.querySelector('a')?.getAttribute('href')?.substring(1);
            const isFav = favorites.includes(id);
            const songTags = (li.getAttribute('data-tags') || '').split(',');

            // Check if search matches title/TOC text OR author of the song
            let matchesSearch = text.includes(query);
            if (!matchesSearch && id) {
                const sectionAuthor = document.querySelector(`.song-chunk[id="${id}"] .song-author`);
                if (sectionAuthor && sectionAuthor.textContent.toLowerCase().includes(query)) {
                    matchesSearch = true;
                }
            }

            const matchesTag = selectedTag === "" || songTags.includes(selectedTag);
            const matchesFavFilter = !favoritesOnlyMode || isFav;

            li.style.display = (matchesSearch && matchesTag && matchesFavFilter) ? '' : 'none';
        }
    });

    if (favoritesOnlyMode && visibleCount === 0 && query === '' && selectedTag === '') {
        emptyMsg.style.display = 'block';
    } else {
        emptyMsg.style.display = 'none';
    }
    toggleClearButton(); // Add this line to update button visibility on input
}

function changeFontSize(delta) {
    currentFontSize += delta * 0.1;
    const elementsToScale = document.querySelectorAll('.lyrics, #toc li');
    elementsToScale.forEach(el => {
        el.style.fontSize = currentFontSize + 'em';
    });
}

function getRandomSong() {
    const sections = Array.from(document.querySelectorAll('.song-chunk')).filter(s => s.style.display !== 'none');
    if (sections.length === 0) return;
    const randomIndex = Math.floor(Math.random() * sections.length);
    const target = sections[randomIndex];
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('.song-chunk').forEach(s => s.classList.remove('highlight-target'));
    target.classList.add('highlight-target');
    toggleOptions();
}

window.onload = loadSongs;

function openQR() {
    document.getElementById('qr-modal').classList.add('open');
    toggleOptions();
}
function closeQR() {
    document.getElementById('qr-modal').classList.remove('open');
}

function openFAQ() {
    document.getElementById('faq-modal').classList.add('open');
    toggleOptions();
}
function closeFAQ() {
    document.getElementById('faq-modal').classList.remove('open');
}

function getRandomFavorite() {
    const favoriteSections = Array.from(document.querySelectorAll('.song-chunk'))
        .filter(s => favorites.includes(s.id));

    if (favoriteSections.length === 0) {
        alert("You haven't added any favorites yet!");
        return;
    }

    const randomIndex = Math.floor(Math.random() * favoriteSections.length);
    const target = favoriteSections[randomIndex];

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    document.querySelectorAll('.song-chunk').forEach(s => s.classList.remove('highlight-target'));
    target.classList.add('highlight-target');

    toggleOptions();
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('Service Worker Registered');

            // Check for service worker updates immediately
            reg.update();

            // Automatically reload the page when a new SW takes over
            reg.onupdatefound = () => {
                const installingWorker = reg.installing;
                if (installingWorker) {
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('New content available, reloading...');
                            window.location.reload();
                        }
                    };
                }
            };
        }).catch(err => console.log('Service Worker Failed', err));
    });
}
