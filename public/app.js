const TMDB_API_KEY = '4047600e7b714de665db30e862139d92';
const YOUTUBE_API_KEY = 'AIzaSyB5KK9bpFEAEhslDbieFoGDwl3TvKIVS4c';
const DAILYMOTION_API_KEY = '3d76cb201c8f34c0f89b';
const DAILYMOTION_API_SECRET = '2ce48fb77a5bd6b175edd2d37f354c12d508f2c5';

const BASE_URL = 'https://api.themoviedb.org/3';
const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const DAILYMOTION_BASE_URL = 'https://api.dailymotion.com';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const movieGrid = document.getElementById('movie-grid');
const nollywoodGrid = document.getElementById('nollywood-grid');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const voiceSearchButton = document.getElementById('voice-search-button');
const moviePage = document.getElementById('movie-page');
const backButton = document.getElementById('back-button');
const modalTitle = document.getElementById('modal-title');
const modalOverview = document.getElementById('modal-overview');
const modalPoster = document.getElementById('modal-poster');
const watchTrailerBtn = document.getElementById('watch-trailer');
const watchMovieBtn = document.getElementById('watch-movie');
const watchLaterBtn = document.getElementById('watch-later');
const favoriteBtn = document.getElementById('favorite');
const closeBtn = document.getElementsByClassName('close');
const sectionToggle = document.getElementById('section-toggle');
const themeToggle = document.getElementById('theme-toggle');
const settingsButton = document.getElementById('settings-button');
const profileButton = document.getElementById('profile-button');
const saveSettingsButton = document.getElementById('save-settings');
const profileForm = document.getElementById('profile-form');
const profileDisplay = document.getElementById('profile-display');
const genreCheckboxes = document.getElementById('genre-checkboxes');
const loadingSpinner = document.getElementById('loading-spinner');
const errorContainer = document.getElementById('error-container');
const settingsModal = document.getElementById('settings-modal');
const profileModal = document.getElementById('profile-modal');
const watchLaterListBtn = document.getElementById('watch-later-list');
const favoritesListBtn = document.getElementById('favorites-list');
const watchHistoryListBtn = document.getElementById('watch-history-list');
const cancelMenuBtn = document.getElementById('cancel-menu');
const hamburgerMenuBtn = document.getElementById('hamburger-menu');

let currentPage = 1;
let currentNollywoodPage = '';
let currentSearchQuery = '';
let youtubePlayer;
let dailymotionPlayer;
let isLoading = false;
let nollywoodMovies = [];
let genres = [];
let currentMovie = null;

let userSettings = JSON.parse(localStorage.getItem('sonixMoviesSettings')) || {
    defaultSection: 'international',
    moviesPerPage: 20,
    autoPlayTrailers: false,
    selectedGenres: [],
    darkMode: false
};

let userProfile = JSON.parse(localStorage.getItem('sonixMoviesProfile')) || {
    name: '',
    email: '',
    image: ''
};

let watchLaterList = JSON.parse(localStorage.getItem('sonixMoviesWatchLater')) || [];
let watchHistoryList = JSON.parse(localStorage.getItem('sonixMoviesWatchHistory')) || [];
let favoritesList = JSON.parse(localStorage.getItem('sonixMoviesFavorites')) || [];

let videoProgress = JSON.parse(localStorage.getItem('sonixMoviesVideoProgress')) || {};

async function initApp() {
    document.getElementById('default-section').value = userSettings.defaultSection;
    document.getElementById('movies-per-page').value = userSettings.moviesPerPage;
    document.getElementById('auto-play-trailers').checked = userSettings.autoPlayTrailers;
    document.getElementById('dark-mode').checked = userSettings.darkMode;

    if (userSettings.defaultSection === 'nollywood') {
        sectionToggle.checked = true;
        toggleSection();
    }

    if (userSettings.darkMode) {
        document.body.classList.add('dark-mode');
    }

    await fetchGenres();
    populateGenreCheckboxes();

    updateProfileButton();
    updateProfileDisplay();
    updateUserGreeting();

    if (sectionToggle.checked) {
        fetchNollywoodMovies('Nollywood movie');
    } else {
        fetchPopularMovies();
    }
}

if (searchButton) {
    searchButton.addEventListener('click', performSearch);
}

if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

if (voiceSearchButton) {
    voiceSearchButton.addEventListener('click', startVoiceSearch);
}

if (backButton) {
    backButton.addEventListener('click', closeMoviePage);
}

if (watchLaterBtn) {
    watchLaterBtn.addEventListener('click', () => toggleWatchLater(currentMovie));
}

if (favoriteBtn) {
    favoriteBtn.addEventListener('click', () => toggleFavorite(currentMovie));
}

document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', closeModal);
});

window.addEventListener('click', (event) => {
    if (event.target === settingsModal || event.target === profileModal) {
        closeModal();
    }
});

if (sectionToggle) {
    sectionToggle.addEventListener('change', toggleSection);
}

if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

if (settingsButton) {
    settingsButton.addEventListener('click', openSettingsModal);
}

if (profileButton) {
    profileButton.addEventListener('click', openProfileModal);
}

if (saveSettingsButton) {
    saveSettingsButton.addEventListener('click', saveSettings);
}

if (profileForm) {
    profileForm.addEventListener('submit', saveProfile);
}

if (watchLaterListBtn) {
    watchLaterListBtn.addEventListener('click', showWatchLaterList);
}

if (favoritesListBtn) {
    favoritesListBtn.addEventListener('click', showFavoritesList);
}

if (watchHistoryListBtn) {
    watchHistoryListBtn.addEventListener('click', showWatchHistoryList);
}

if (cancelMenuBtn) {
    cancelMenuBtn.addEventListener('click', () => {
        mobileNav.classList.remove('active');
    });
}

window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500 && !isLoading) {
        if (sectionToggle.checked) {
            fetchNollywoodMovies(currentSearchQuery, currentNollywoodPage);
        } else {
            loadMoreMovies();
        }
    }
});

const hamburgerMenu = document.getElementById('hamburger-menu');
const mobileNav = document.querySelector('.mobile-nav');

hamburgerMenu.addEventListener('click', () => {
    mobileNav.classList.toggle('active');
});

const mobileWatchLaterBtn = document.getElementById('mobile-watch-later-list');
const mobileFavoritesBtn = document.getElementById('mobile-favorites-list');
const mobileSettingsBtn = document.getElementById('mobile-settings-button');
const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
const mobileProfileBtn = document.getElementById('mobile-profile-button');

mobileWatchLaterBtn.addEventListener('click', () => {
    showWatchLaterList();
    mobileNav.classList.remove('active');
});

mobileFavoritesBtn.addEventListener('click', () => {
    showFavoritesList();
    mobileNav.classList.remove('active');
});

mobileSettingsBtn.addEventListener('click', () => {
    openSettingsModal();
    mobileNav.classList.remove('active');
});

mobileThemeToggle.addEventListener('click', () => {
    toggleTheme();
    mobileNav.classList.remove('active');
});

mobileProfileBtn.addEventListener('click', () => {
    openProfileModal();
    mobileNav.classList.remove('active');
});

function showLoadingSpinner() {
    loadingSpinner.classList.remove('hidden');
}

function hideLoadingSpinner() {
    loadingSpinner.classList.add('hidden');
}

function showErrorMessage(message) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
}

function hideErrorMessage() {
    errorContainer.textContent = '';
    errorContainer.classList.add('hidden');
}

function performSearch() {
    currentPage = 1;
    currentNollywoodPage = '';
    currentSearchQuery = searchInput ? searchInput.value : '';
    if (sectionToggle.checked) {
        fetchNollywoodMovies(currentSearchQuery);
    } else {
        searchMovies();
    }
}

function startVoiceSearch() {
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.start();

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            searchInput.value = transcript;
            performSearch();
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            showErrorMessage('Voice search failed. Please try again.');
        };
    } else {
        showErrorMessage('Voice search is not supported in your browser.');
    }
}

async function fetchPopularMovies() {
    if (isLoading) return;
    isLoading = true;
    showLoadingSpinner();
    hideErrorMessage();
    try {
        let url = `${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${currentPage}`;
        if (userSettings.selectedGenres.length > 0) {
            url += `&with_genres=${userSettings.selectedGenres.join(',')}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch popular movies');
        const data = await response.json();
        if (movieGrid) {
            const moviesWithPosters = data.results.filter(movie => movie.poster_path);
            displayMovies(moviesWithPosters, currentPage === 1);
            currentPage++;
        } else {
            throw new Error('Movie grid element not found');
        }
    } catch (error) {
        console.error('Error fetching popular movies:', error);
        showErrorMessage('Failed to load movies. Please try again later.');
    } finally {
        isLoading = false;
        hideLoadingSpinner();
    }
}

async function fetchNollywoodMovies(query, pageToken = '') {
    if (isLoading) return;
    isLoading = true;
    showLoadingSpinner();
    hideErrorMessage();
    try {
        const url = `${YOUTUBE_BASE_URL}/search?part=snippet&q=${encodeURIComponent(query + " Nollywood movie")}&key=${YOUTUBE_API_KEY}&pageToken=${pageToken}&type=video&videoDuration=long&maxResults=${userSettings.moviesPerPage}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch Nollywood movies');
        const data = await response.json();
        if (nollywoodGrid) {
            nollywoodMovies = pageToken === '' ? data.items : [...nollywoodMovies, ...data.items];
            displayNollywoodMovies(data.items, pageToken === '');
            currentNollywoodPage = data.nextPageToken || '';
        } else {
            throw new Error('Nollywood grid element not found');
        }
    } catch (error) {
        console.error('Error fetching Nollywood movies:', error);
        showErrorMessage('Failed to load Nollywood movies. Please try again later.');
    } finally {
        isLoading = false;
        hideLoadingSpinner();
    }
}

async function fetchGenres() {
    showLoadingSpinner();
    hideErrorMessage();
    try {
        const response = await fetch(`${BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`);
        if (!response.ok) throw new Error('Failed to fetch genres');
        const data = await response.json();
        genres = data.genres;
    } catch (error) {
        console.error('Error fetching genres:', error);
        showErrorMessage('Failed to load genres. Please try again later.');
    } finally {
        hideLoadingSpinner();
    }
}

function populateGenreCheckboxes() {
    genres.forEach(genre => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" name="genre" value="${genre.id}"> ${genre.name}`;
        genreCheckboxes.appendChild(label);
    });
    updateSelectedGenres();
}

function updateSelectedGenres() {
    const checkboxes = genreCheckboxes.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = userSettings.selectedGenres.length === 0 || userSettings.selectedGenres.includes(checkbox.value);
    });
}

async function searchMovies() {
    if (currentSearchQuery) {
        showLoadingSpinner();
        hideErrorMessage();
        try {
            let url = `${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${currentSearchQuery}&page=${currentPage}`;
            if (userSettings.selectedGenres.length > 0) {
                url += `&with_genres=${userSettings.selectedGenres.join(',')}`;
            }
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to search movies');
            const data = await response.json();
            const moviesWithPosters = data.results.filter(movie => movie.poster_path);
            displayMovies(moviesWithPosters, currentPage === 1);
            currentPage++;
        } catch (error) {
            console.error('Error searching movies:', error);
            showErrorMessage('Failed to search movies. Please try again later.');
        } finally {
            hideLoadingSpinner();
        }
    }
}

function loadMoreMovies() {
    if (currentSearchQuery) {
        searchMovies();
    } else {
        fetchPopularMovies();
    }
}

function displayMovies(movies, clearExisting = true) {
    if (!movieGrid) {
        console.error('Movie grid element not found');
        return;
    }

    if (clearExisting) {
        movieGrid.innerHTML = '';
    }
    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        movieCard.dataset.movieId = movie.id;
        const progress = videoProgress[movie.id] ? videoProgress[movie.id].progress : 0;
        movieCard.innerHTML = `
            <img src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'placeholder.jpg'}" alt="${movie.title}">
            <h3>${movie.title}</h3>
            <p><i class="fas fa-star"></i> ${movie.vote_average.toFixed(1)}</p>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${progress}%"></div>
            </div>
        `;
        movieCard.addEventListener('click', () => openMoviePage(movie));
        movieGrid.appendChild(movieCard);
    });
    updateWatchLaterButtons();
    updateFavoriteButtons();
}

function displayNollywoodMovies(movies, clearExisting = true) {
    if (!nollywoodGrid) {
        console.error('Nollywood grid element not found');
        return;
    }

    if (clearExisting) {
        nollywoodGrid.innerHTML = '';
    }
    movies.forEach(movie => {
        const videoId = movie.id.videoId;
        const title = movie.snippet.title;
        const thumbnailUrl = movie.snippet.thumbnails.high.url;
        const publishedAt = new Date(movie.snippet.publishedAt).toLocaleDateString();
        const progress = videoProgress[videoId] ? videoProgress[videoId].progress : 0;

        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        movieCard.dataset.movieId = videoId;
        
        movieCard.innerHTML = `
            <img src="${thumbnailUrl}" alt="${title}">
            <h3>${title}</h3>
            <p><i class="fas fa-calendar-alt"></i> ${publishedAt}</p>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${progress}%"></div>
            </div>
        `;

        movieCard.addEventListener('click', () => openNollywoodMoviePage(movie));
        nollywoodGrid.appendChild(movieCard);
    });
    updateWatchLaterButtons();
    updateFavoriteButtons();
}

async function openMoviePage(movie) {
    clearMoviePageContent();
    currentMovie = movie;
    modalTitle.textContent = movie.title;
    modalOverview.textContent = movie.overview;
    modalPoster.src = movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'placeholder.jpg';
    moviePage.classList.remove('hidden');

    showLoadingSpinner();
    hideErrorMessage();

    try {
        const movieDetails = await fetchMovieDetails(movie.id);
        displayMovieDetails(movieDetails);

        const trailerUrl = await fetchYouTubeTrailer(movie.title);
        watchTrailerBtn.onclick = () => playYouTubeTrailer(trailerUrl);
        watchTrailerBtn.disabled = false;
        watchTrailerBtn.textContent = 'Watch Trailer';
        if (userSettings.autoPlayTrailers) {
            playYouTubeTrailer(trailerUrl);
        }

        const dailymotionVideoId = await searchDailymotionVideo(movie.title, movieDetails.runtime);
        if (dailymotionVideoId) {
            watchMovieBtn.onclick = () => playDailymotionMovie(dailymotionVideoId);
            watchMovieBtn.disabled = false;
            watchMovieBtn.textContent = 'Watch Movie (Dailymotion)';
        } else {
            const youtubeFullMovieId = await searchYouTubeFullMovie(movie.title, movieDetails.runtime);
            if (youtubeFullMovieId) {
                watchMovieBtn.onclick = () => playYouTubeMovie(youtubeFullMovieId);
                watchMovieBtn.disabled = false;
                watchMovieBtn.textContent = 'Watch Movie (YouTube)';
            } else {
                watchMovieBtn.disabled = true;
                watchMovieBtn.textContent = 'Full Movie Unavailable';
            }
        }

        updateWatchLaterButton(movie);
        updateFavoriteButton(movie);

        const progressBarContainer = document.querySelector('.progress-bar-container');
        const progressBar = progressBarContainer.querySelector('.progress-bar');
        const savedProgress = videoProgress[movie.id] ? videoProgress[movie.id].progress : 0;
        progressBar.style.width = `${savedProgress}%`;

        if (savedProgress > 0 && savedProgress < 100) {
            const continueBtn = document.createElement('button');
            continueBtn.textContent = 'Continue Watching';
            continueBtn.classList.add('continue-btn');
            continueBtn.onclick = () => {
                if (dailymotionVideoId) {
                    playDailymotionMovie(dailymotionVideoId, savedProgress);
                } else if (youtubeFullMovieId) {
                    playYouTubeMovie(youtubeFullMovieId, savedProgress);
                }
            };
            document.querySelector('.button-container').appendChild(continueBtn);
        }

    } catch (error) {
        console.error('Error loading movie details:', error);
        showErrorMessage('Failed to load movie details. Please try again later.');
        watchTrailerBtn.disabled = true;
        watchTrailerBtn.textContent = 'Trailer Unavailable';
        watchMovieBtn.disabled = true;
        watchMovieBtn.textContent = 'Full Movie Unavailable';
    } finally {
        hideLoadingSpinner();
    }

    watchMovieBtn.style.display = 'inline-block';
}

function openNollywoodMoviePage(movie) {
    clearMoviePageContent();
    currentMovie = movie;
    modalTitle.textContent = movie.snippet.title;
    modalOverview.textContent = movie.snippet.description;
    modalPoster.src = movie.snippet.thumbnails.high.url;
    moviePage.classList.remove('hidden');

    watchTrailerBtn.onclick = () => playYouTubeTrailer(`https://www.youtube.com/watch?v=${movie.id.videoId}`);
    watchTrailerBtn.disabled = false;
    watchTrailerBtn.textContent = 'Watch Now';
    
    if (userSettings.autoPlayTrailers) {
        playYouTubeTrailer(`https://www.youtube.com/watch?v=${movie.id.videoId}`);
    }
    
    watchMovieBtn.style.display = 'none';

    updateWatchLaterButton(movie);
    updateFavoriteButton(movie);

    const progressBarContainer = document.querySelector('.progress-bar-container');
    const progressBar = progressBarContainer.querySelector('.progress-bar');
    const savedProgress = videoProgress[movie.id.videoId] ? videoProgress[movie.id.videoId].progress : 0;
    progressBar.style.width = `${savedProgress}%`;

    if (savedProgress > 0 && savedProgress < 100) {
        const continueBtn = document.createElement('button');
        continueBtn.textContent = 'Continue Watching';
        continueBtn.classList.add('continue-btn');
        continueBtn.onclick = () => playYouTubeTrailer(`https://www.youtube.com/watch?v=${movie.id.videoId}`, savedProgress);
        document.querySelector('.button-container').appendChild(continueBtn);
    }
}

function clearMoviePageContent() {
    modalTitle.textContent = '';
    modalOverview.textContent = '';
    modalPoster.src = '';
    document.getElementById('movie-details').innerHTML = '';
    if (youtubePlayer) {
        youtubePlayer.destroy();
        youtubePlayer = null;
    }
    if (dailymotionPlayer) {
        dailymotionPlayer.pause();
    }
    const continueBtn = document.querySelector('.continue-btn');
    if (continueBtn) {
        continueBtn.remove();
    }
}

function closeMoviePage() {
    moviePage.classList.add('hidden');
    clearMoviePageContent();
}

function closeModal() {
    settingsModal.style.display = 'none';
    profileModal.style.display = 'none';
    moviePage.classList.add('hidden');
}

async function fetchMovieDetails(movieId) {
    const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits,release_dates`);
    if (!response.ok) throw new Error('Failed to fetch movie details');
    return await response.json();
}

function displayMovieDetails(movie) {
    const movieDetailsContainer = document.getElementById('movie-details');
    
    const releaseDate = new Date(movie.release_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const mpaaRating = movie.release_dates.results
        .find(release => release.iso_3166_1 === 'US')?.release_dates
        .find(date => date.certification)?.certification || 'Not Rated';

    const director = movie.credits.crew.find(person => person.job === 'Director')?.name || 'Unknown';

    const topCast = movie.credits.cast.slice(0, 5).map(actor => actor.name).join(', ');

    const additionalDetails = `
        <p><strong>Release Date:</strong> ${releaseDate}</p>
        <p><strong>Runtime:</strong> ${movie.runtime} minutes</p>
        <p><strong>Rating:</strong> ${mpaaRating}</p>
        <p><strong>Director:</strong> ${director}</p>
        <p><strong>Cast:</strong> ${topCast}</p>
        <p><strong>Genres:</strong> ${movie.genres.map(genre => genre.name).join(', ')}</p>
        <p><strong>Average Rating:</strong> ${movie.vote_average.toFixed(1)}/10 (${movie.vote_count} votes)</p>
    `;

    movieDetailsContainer.innerHTML = additionalDetails;
}

async function fetchYouTubeTrailer(movieTitle) {
    const response = await fetch(`${YOUTUBE_BASE_URL}/search?part=snippet&q=${movieTitle} trailer&key=${YOUTUBE_API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch YouTube trailer');
    const data = await response.json();
    if (data.items.length === 0) throw new Error('No trailer found');
    return `https://www.youtube.com/watch?v=${data.items[0].id.videoId}`;
}

function playYouTubeTrailer(trailerUrl, startTime = 0) {
    const videoId = trailerUrl.split('v=')[1];
    modalPoster.style.display = 'none';
    if (!youtubePlayer) {
        youtubePlayer = new YT.Player('video-container', {
            height: '360',
            width: '640',
            videoId: videoId,
            playerVars: {
                'autoplay': 1,
                'controls': 1,
                'rel': 0,
                'fs': 1,
                'start': Math.floor(startTime),
                'modestbranding': 1,
                'showinfo': 0,
                'iv_load_policy': 3
            },
            events: {
                'onReady': (event) => event.target.playVideo(),
                'onStateChange': onYouTubePlayerStateChange
            }
        });
    } else {
        youtubePlayer.loadVideoById({
            videoId: videoId,
            startSeconds: startTime
        });
    }
    addToWatchHistory(currentMovie);
}

function playDailymotionMovie(videoId, startTime = 0) {
    modalPoster.style.display = 'none';
    const videoContainer = document.getElementById('video-container');
    videoContainer.innerHTML = `
        <iframe src="https://www.dailymotion.com/embed/video/${videoId}?autoplay=1&start=${Math.floor(startTime)}"
                width="100%"
                height="360"
                frameborder="0"
                allowfullscreen
                allow="autoplay">
        </iframe>
    `;
    dailymotionPlayer = new DM.player(videoContainer, {
        video: videoId,
        params: {
            autoplay: true,
            start: Math.floor(startTime)
        }
    });
    dailymotionPlayer.addEventListener('timeupdate', updateVideoProgress);
    addToWatchHistory(currentMovie);
}

async function searchDailymotionVideo(movieTitle, runtime) {
    const response = await fetch(`${DAILYMOTION_BASE_URL}/videos?fields=id,title,duration&search=${encodeURIComponent(movieTitle)}&limit=5`);
    if (!response.ok) throw new Error('Failed to search Dailymotion video');
    const data = await response.json();
    
    const matchingVideos = data.list.filter(video => {
        const titleMatch = video.title.toLowerCase().includes(movieTitle.toLowerCase());
        const durationMatch = Math.abs(video.duration - runtime * 60) < 300;
        return titleMatch && durationMatch;
    });

    return matchingVideos.length > 0 ? matchingVideos[0].id : null;
}

async function searchYouTubeFullMovie(movieTitle, runtime) {
    const response = await fetch(`${YOUTUBE_BASE_URL}/search?part=snippet&q=${encodeURIComponent(movieTitle + " full movie")}&key=${YOUTUBE_API_KEY}&type=video&videoDuration=long`);
    if (!response.ok) throw new Error('Failed to search YouTube full movie');
    const data = await response.json();

    if (data.items.length === 0) return null;

    const videoId = data.items[0].id.videoId;
    const videoDetailsResponse = await fetch(`${YOUTUBE_BASE_URL}/videos?part=contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`);
    if (!videoDetailsResponse.ok) throw new Error('Failed to get YouTube video details');
    const videoDetailsData = await videoDetailsResponse.json();

    const videoDuration = parseDuration(videoDetailsData.items[0].contentDetails.duration);
    
    if (Math.abs(videoDuration - runtime * 60) < 600) {
        return videoId;
    }

    return null;
}

document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});
document.addEventListener('gesturechange', function(e) {
    e.preventDefault();
});
document.addEventListener('gestureend', function(e) {
    e.preventDefault();
});

function parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (parseInt(match[1]) || 0);
    const minutes = (parseInt(match[2]) || 0);
    const seconds = (parseInt(match[3]) || 0);
    return hours * 3600 + minutes * 60 + seconds;
}

function playYouTubeMovie(videoId, startTime = 0) {
    modalPoster.style.display = 'none';
    if (!youtubePlayer) {
        youtubePlayer = new YT.Player('video-container', {
            height: '360',
            width: '640',
            videoId: videoId,
            playerVars: {
                'autoplay': 1,
                'controls': 1,
                'rel': 0,
                'fs': 1,
                'start': Math.floor(startTime),
                'modestbranding': 1,
                'showinfo': 0,
                'iv_load_policy': 3
            },
            events: {
                'onReady': (event) => event.target.playVideo(),
                'onStateChange': onYouTubePlayerStateChange
            }
        });
    } else {
        youtubePlayer.loadVideoById({
            videoId: videoId,
            startSeconds: startTime
        });
    }
    addToWatchHistory(currentMovie);
}

function updateVideoProgress(event) {
    if (!currentMovie) return;

    const movieId = currentMovie.id || currentMovie.id.videoId;
    const duration = event.target.getDuration();
    const currentTime = event.target.getCurrentTime();
    const progress = (currentTime / duration) * 100;

    videoProgress[movieId] = {
        progress: progress,
        lastWatched: new Date().toISOString()
    };

    localStorage.setItem('sonixMoviesVideoProgress', JSON.stringify(videoProgress));

    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
}

function onYouTubePlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        setInterval(() => updateVideoProgress(event), 5000);
    }
}

function toggleWatchLater(movie) {
    const movieId = movie.id || movie.id.videoId;
    const index = watchLaterList.findIndex(item => item.id === movieId);
    if (index === -1) {
        watchLaterList.push(movie);
    } else {
        watchLaterList.splice(index, 1);
    }
    localStorage.setItem('sonixMoviesWatchLater', JSON.stringify(watchLaterList));
    updateWatchLaterButtons();
    updateWatchLaterButton(movie);
}

function toggleFavorite(movie) {
    const movieId = movie.id || movie.id.videoId;
    const index = favoritesList.findIndex(item => item.id === movieId);
    if (index === -1) {
        favoritesList.push(movie);
    } else {
        favoritesList.splice(index, 1);
    }
    localStorage.setItem('sonixMoviesFavorites', JSON.stringify(favoritesList));
    updateFavoriteButtons();
    updateFavoriteButton(movie);
}

function addToWatchHistory(movie) {
    const movieId = movie.id || movie.id.videoId;
    const index = watchHistoryList.findIndex(item => item.id === movieId);
    if (index !== -1) {
        watchHistoryList.splice(index, 1);
    }
    watchHistoryList.unshift(movie);
    localStorage.setItem('sonixMoviesWatchHistory', JSON.stringify(watchHistoryList));
}

function updateWatchLaterButtons() {
    document.querySelectorAll('.watch-later-btn').forEach(btn => {
        const movieCard = btn.closest('.movie-card');
        const movieId = movieCard.dataset.movieId;
        const isInWatchLater = watchLaterList.some(item => (item.id || item.id.videoId) === movieId);
        btn.classList.toggle('active', isInWatchLater);
    });
}

function updateFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const movieCard = btn.closest('.movie-card');
        const movieId = movieCard.dataset.movieId;
        const isInFavorites = favoritesList.some(item => (item.id || item.id.videoId) === movieId);
        btn.classList.toggle('active', isInFavorites);
    });
}

function updateWatchLaterButton(movie) {
    const movieId = movie.id || movie.id.videoId;
    const isInWatchLater = watchLaterList.some(item => (item.id || item.id.videoId) === movieId);
    watchLaterBtn.classList.toggle('active', isInWatchLater);
    watchLaterBtn.innerHTML = isInWatchLater ? '<i class="fas fa-clock"></i> Remove from Watch Later' : '<i class="far fa-clock"></i> Add to Watch Later';
}

function updateFavoriteButton(movie) {
    const movieId = movie.id || movie.id.videoId;
    const isInFavorites = favoritesList.some(item => (item.id || item.id.videoId) === movieId);
    favoriteBtn.classList.toggle('active', isInFavorites);
    favoriteBtn.innerHTML = isInFavorites ? '<i class="fas fa-heart"></i> Remove from Favorites' : '<i class="far fa-heart"></i> Add to Favorites';
}

function toggleSection() {
    const tmdbSection = document.getElementById('tmdb-section');
    const nollywoodSection = document.getElementById('nollywood-section');

    if (sectionToggle.checked) {
        tmdbSection.classList.remove('active');
        nollywoodSection.classList.add('active');
        if (nollywoodMovies.length === 0) {
            fetchNollywoodMovies('Nollywood movie');
        } else {
            displayNollywoodMovies(nollywoodMovies, true);
        }
    } else {
        tmdbSection.classList.add('active');
        nollywoodSection.classList.remove('active');
        if (movieGrid.children.length === 0) {
            fetchPopularMovies();
        }
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    const themeIcon = document.querySelector('#theme-toggle i');
    const mobileThemeIcon = document.querySelector('#mobile-theme-toggle i');

    if (isDarkMode) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
        mobileThemeIcon.classList.remove('fa-moon');
        mobileThemeIcon.classList.add('fa-sun');
        mobileThemeToggle.textContent = ' Light Mode';
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
        mobileThemeIcon.classList.remove('fa-sun');
        mobileThemeIcon.classList.add('fa-moon');
        mobileThemeToggle.textContent = ' Dark Mode';
    }
}

function openMovieDetails(movie) {
    modalTitle.textContent = movie.title || movie.snippet.title;
    modalOverview.textContent = movie.overview || movie.snippet.description;
    modalPoster.src = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 
                      (movie.snippet ? movie.snippet.thumbnails.high.url : 'placeholder.jpg');
    moviePage.classList.remove('hidden');

    watchTrailerBtn.onclick = () => playTrailer(movie);
    watchMovieBtn.onclick = () => playMovie(movie);
    watchLaterBtn.onclick = () => toggleWatchLater(movie);
    favoriteBtn.onclick = () => toggleFavorite(movie);

    updateWatchLaterButton(movie);
    updateFavoriteButton(movie);
}

async function playTrailer(movie) {
    try {
        const trailerUrl = await fetchYouTubeTrailer(movie.title || movie.snippet.title);
        playYouTubeTrailer(trailerUrl);
    } catch (error) {
        console.error('Error playing trailer:', error);
        alert('Failed to play trailer. Please try again later.');
    }
}

async function playMovie(movie) {
    try {
        if (movie.snippet) {
            playYouTubeTrailer(`https://www.youtube.com/watch?v=${movie.id.videoId}`);
        } else {
            const movieDetails = await fetchMovieDetails(movie.id);
            const dailymotionVideoId = await searchDailymotionVideo(movie.title, movieDetails.runtime);
            if (dailymotionVideoId) {
                playDailymotionMovie(dailymotionVideoId);
            } else {
                const youtubeFullMovieId = await searchYouTubeFullMovie(movie.title, movieDetails.runtime);
                if (youtubeFullMovieId) {
                    playYouTubeMovie(youtubeFullMovieId);
                } else {
                    alert('Full movie is not available at the moment.');
                }
            }
        }
    } catch (error) {
        console.error('Error playing movie:', error);
        alert('Failed to play movie. Please try again later.');
    }
}

function openSettingsModal() {
    settingsModal.style.display = 'block';
}

function openProfileModal() {
    profileModal.style.display = 'block';
    document.getElementById('profile-name').value = userProfile.name;
    document.getElementById('profile-email').value = userProfile.email;
}

function saveSettings() {
    userSettings.defaultSection = document.getElementById('default-section').value;
    userSettings.moviesPerPage = parseInt(document.getElementById('movies-per-page').value);
    userSettings.autoPlayTrailers = document.getElementById('auto-play-trailers').checked;
    userSettings.selectedGenres = Array.from(document.querySelectorAll('input[name="genre"]:checked')).map(checkbox => checkbox.value);
    userSettings.darkMode = document.getElementById('dark-mode').checked;

    localStorage.setItem('sonixMoviesSettings', JSON.stringify(userSettings));
    closeModal();
    currentPage = 1;
    if (sectionToggle.checked) {
        fetchNollywoodMovies('Nollywood movie');
    } else {
        fetchPopularMovies();
    }
}

function saveProfile(event) {
    event.preventDefault();
    userProfile.name = document.getElementById('profile-name').value;
    userProfile.email = document.getElementById('profile-email').value;

    const imageFile = document.getElementById('profile-image').files[0];
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            userProfile.image = e.target.result;
            localStorage.setItem('sonixMoviesProfile', JSON.stringify(userProfile));
            updateProfileButton();
            updateProfileDisplay();
            updateUserGreeting();
            closeModal();
        };
        reader.readAsDataURL(imageFile);
    } else {
        localStorage.setItem('sonixMoviesProfile', JSON.stringify(userProfile));
        updateProfileButton();
        updateProfileDisplay();
        updateUserGreeting();
        closeModal();
    }
}

function updateProfileButton() {
    if (userProfile.image) {
        profileButton.innerHTML = `<img src="${userProfile.image}" alt="${userProfile.name}">`;
    } else {
        profileButton.innerHTML = '<i class="fas fa-user"></i>';
    }
}

function updateProfileDisplay() {
    if (profileDisplay) {
        profileDisplay.textContent = userProfile.name ? `Welcome, ${userProfile.name}!` : 'Welcome!';
    }
}

function updateUserGreeting() {
    const greetingElement = document.getElementById('user-greeting');
    if (greetingElement) {
        const greeting = userProfile.name ? `Welcome, ${userProfile.name}!` : 'Welcome!';
        greetingElement.textContent = greeting;
    }
}

function showWatchLaterList() {
    const listContainer = document.getElementById('list-container');
    listContainer.innerHTML = '<h2>Watch Later</h2>';
    watchLaterList.forEach(movie => {
        const movieElement = createMovieElement(movie);
        listContainer.appendChild(movieElement);
    });
    listContainer.classList.remove('hidden');
    document.getElementById('tmdb-section').classList.add('hidden');
    document.getElementById('nollywood-section').classList.add('hidden');
}

function showFavoritesList() {
    const listContainer = document.getElementById('list-container');
    listContainer.innerHTML = '<h2>Favorites</h2>';
    favoritesList.forEach(movie => {
        const movieElement = createMovieElement(movie);
        listContainer.appendChild(movieElement);
    });
    listContainer.classList.remove('hidden');
    document.getElementById('tmdb-section').classList.add('hidden');
    document.getElementById('nollywood-section').classList.add('hidden');
}

function showWatchHistoryList() {
    const listContainer = document.getElementById('list-container');
    listContainer.innerHTML = '<h2>Watch History</h2>';
    watchHistoryList.forEach(movie => {
        const movieElement = createMovieElement(movie);
        listContainer.appendChild(movieElement);
    });
    listContainer.classList.remove('hidden');
    document.getElementById('tmdb-section').classList.add('hidden');
    document.getElementById('nollywood-section').classList.add('hidden');
}

function createMovieElement(movie) {
    const movieElement = document.createElement('div');
    movieElement.classList.add('list-movie');
    const title = movie.title || movie.snippet.title;
    const imageUrl = movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 
                     (movie.snippet ? movie.snippet.thumbnails.medium.url : 'placeholder.jpg');
    movieElement.innerHTML = `
        <img src="${imageUrl}" alt="${title}">
        <h3>${title}</h3>
    `;
    movieElement.addEventListener('click', () => {
        if (movie.snippet) {
            openNollywoodMoviePage(movie);
        } else {
            openMoviePage(movie);
        }
    });
    return movieElement;
}

document.getElementById('download-button').addEventListener('click', async () => {
    const movieTitleElement = document.getElementById('modal-title');
    const messageContainer = document.getElementById('message-container');
    const downloadButton = document.getElementById('download-button');

    if (!movieTitleElement) {
        messageContainer.textContent = 'Movie title is not available!';
        return;
    }

    const movieTitle = movieTitleElement.textContent.trim();
    if (!movieTitle) {
        messageContainer.textContent = 'Please provide a valid movie title!';
        return;
    }

    messageContainer.textContent = `Starting download process for "${movieTitle}"...`;
    downloadButton.disabled = true;
    downloadButton.textContent = "Downloading...";

    try {
        const response = await fetch('https://sonix-movies-fullstack.onrender.com/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movieTitle }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            messageContainer.textContent = `Error: ${errorData.error}`;
            downloadButton.disabled = false;
            downloadButton.textContent = "Download Movie";
            return;
        }

        const responseData = await response.json();
        if (responseData.downloadLink) {
            messageContainer.textContent = `Download ready! Resolution: ${responseData.resolution}`;
            
            // Create a link to the download
            const downloadLink = document.createElement('a');
            downloadLink.href = responseData.downloadLink;
            downloadLink.textContent = 'Click here to download';
            downloadLink.style.display = 'block';
            downloadLink.target = '_blank';

            messageContainer.appendChild(downloadLink);
        } else {
            messageContainer.textContent = 'No download link available.';
        }
    } catch (error) {
        console.error('Error initiating download:', error);
        messageContainer.textContent = 'An unexpected error occurred while starting the download.';
    } finally {
        downloadButton.disabled = false;
        downloadButton.textContent = "Download Movie";
    }
});

initApp();
