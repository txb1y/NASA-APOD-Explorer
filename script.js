// Constants and global variables
const API_KEY = 'ZpRG44F53myJ3MTZmnSgvR0OMZyf0ScdfYMZr9qQ';
const API_URL = `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`;

// DOM Elements
const dateInput = document.getElementById('date-input');
const todayBtn = document.getElementById('today-btn');
 const randomBtn = document.getElementById('random-btn');
const favoriteBtn = document.getElementById('favorite-btn');
const loadingElement = document.getElementById('loading');
const errorContainer = document.getElementById('error-container');
const errorMessage = document.getElementById('error-message');
const apodContainer = document.getElementById('apod-container');
const apodTitle = document.getElementById('apod-title');
const apodDate = document.getElementById('apod-date');
const mediaContainer = document.getElementById('media-container');
const apodExplanation = document.getElementById('apod-explanation');
const favoritesList = document.getElementById('favorites-list');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Set max date to today to prevent future dates
    const today = new Date();
    const formattedDate = formatDate(today);
    dateInput.max = formattedDate;
    dateInput.value = formattedDate;
    
    // Load today's APOD
    fetchAPOD(formattedDate);
    
    // Load favorites from localStorage
    loadFavorites();
    
    // Event listeners
    dateInput.addEventListener('change', handleDateChange);
    todayBtn.addEventListener('click', handleTodayClick);
    randomBtn.addEventListener('click', handleRandomClick);
    favoriteBtn.addEventListener('click', handleFavoriteClick);
});

// Event Handlers
function handleDateChange() {
    const selectedDate = dateInput.value;
    fetchAPOD(selectedDate);
}

function handleTodayClick() {
    const today = new Date();
    const formattedDate = formatDate(today);
    dateInput.value = formattedDate;
    fetchAPOD(formattedDate);
}

function handleRandomClick() {
    // Generate a random date between June 16, 1995 (first APOD) and today
    const start = new Date(1995, 5, 16).getTime();
    const end = new Date().getTime();
    const randomTimestamp = start + Math.random() * (end - start);
    const randomDate = new Date(randomTimestamp);
    const formattedDate = formatDate(randomDate);
    
    dateInput.value = formattedDate;
    fetchAPOD(formattedDate);
}

function handleFavoriteClick() {
    const currentData = {
        title: apodTitle.textContent,
        date: apodDate.textContent,
        url: mediaContainer.querySelector('img, iframe').src,
        isVideo: mediaContainer.querySelector('iframe') !== null
    };
    
    toggleFavorite(currentData);
}

// API Functions
async function fetchAPOD(date) {
    showLoading();
    hideError();
    hideAPODContainer();
    
    try {
        const response = await fetch(`${API_URL}&date=${date}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        displayAPOD(data);
        updateFavoriteButton(date);
    } catch (error) {
        console.error('Error fetching APOD:', error);
        showError('Failed to fetch data from NASA API. Please try again later.');
    } finally {
        hideLoading();
    }
}

// Display Functions
function displayAPOD(data) {
    apodTitle.textContent = data.title;
    apodDate.textContent = formatDisplayDate(data.date);
    apodExplanation.textContent = data.explanation;
    
    // Clear previous media
    mediaContainer.innerHTML = '';
    
    // Check if it's an image or video
    if (data.media_type === 'image') {
        const img = document.createElement('img');
        img.src = data.hdurl || data.url;
        img.alt = data.title;
        img.loading = 'lazy';
        mediaContainer.appendChild(img);
    } else if (data.media_type === 'video') {
        const iframe = document.createElement('iframe');
        iframe.src = data.url;
        iframe.width = '100%';
        iframe.height = '500';
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        mediaContainer.appendChild(iframe);
    } else {
        // For other media types
        const message = document.createElement('p');
        message.textContent = 'Media type not supported. Please visit the NASA APOD website to view this content.';
        mediaContainer.appendChild(message);
    }
    
    showAPODContainer();
}

// Favorites Functions
function loadFavorites() {
    const favorites = getFavoritesFromStorage();
    renderFavorites(favorites);
}

function getFavoritesFromStorage() {
    const favoritesJSON = localStorage.getItem('apod-favorites');
    return favoritesJSON ? JSON.parse(favoritesJSON) : [];
}

function saveFavoritesToStorage(favorites) {
    localStorage.setItem('apod-favorites', JSON.stringify(favorites));
}

function toggleFavorite(data) {
    const favorites = getFavoritesFromStorage();
    const existingIndex = favorites.findIndex(item => item.date === data.date);
    
    if (existingIndex >= 0) {
        // Remove from favorites
        favorites.splice(existingIndex, 1);
        favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
    } else {
        // Add to favorites
        favorites.push(data);
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
    }
    
    saveFavoritesToStorage(favorites);
    renderFavorites(favorites);
}

function updateFavoriteButton(date) {
    const favorites = getFavoritesFromStorage();
    const isFavorite = favorites.some(item => item.date === date);
    
    if (isFavorite) {
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
    } else {
        favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
    }
}

function renderFavorites(favorites) {
    favoritesList.innerHTML = '';
    
    if (favorites.length === 0) {
        const message = document.createElement('p');
        message.textContent = 'No favorites yet. Click the heart icon to save your favorite images!';
        favoritesList.appendChild(message);
        return;
    }
    
    favorites.forEach(favorite => {
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'favorite-item';
        
        // Create thumbnail
        const thumbnail = document.createElement('img');
        thumbnail.src = favorite.isVideo ? 'video-thumbnail.jpg' : favorite.url;
        thumbnail.alt = favorite.title;
        thumbnail.onerror = () => {
            thumbnail.src = 'https://via.placeholder.com/150?text=NASA+APOD';
        };
        
        // Create info section
        const info = document.createElement('div');
        info.className = 'info';
        
        const title = document.createElement('h4');
        title.textContent = favorite.title;
        
        const date = document.createElement('p');
        date.textContent = favorite.date;
        
        // Create remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFavorite(favorite.date);
        });
        
        // Append elements
        info.appendChild(title);
        info.appendChild(date);
        
        favoriteItem.appendChild(thumbnail);
        favoriteItem.appendChild(info);
        favoriteItem.appendChild(removeBtn);
        
        // Add click event to load this APOD
        favoriteItem.addEventListener('click', () => {
            dateInput.value = favorite.date;
            fetchAPOD(favorite.date);
        });
        
        favoritesList.appendChild(favoriteItem);
    });
}

function removeFavorite(date) {
    const favorites = getFavoritesFromStorage();
    const updatedFavorites = favorites.filter(item => item.date !== date);
    saveFavoritesToStorage(updatedFavorites);
    renderFavorites(updatedFavorites);
    
    // Update heart icon if currently viewing this date
    if (dateInput.value === date) {
        favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
    }
}

// Utility Functions
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function showLoading() {
    loadingElement.classList.remove('hidden');
}

function hideLoading() {
    loadingElement.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorContainer.classList.remove('hidden');
}

function hideError() {
    errorContainer.classList.add('hidden');
}

function showAPODContainer() {
    apodContainer.classList.remove('hidden');
}

function hideAPODContainer() {
    apodContainer.classList.add('hidden');
}