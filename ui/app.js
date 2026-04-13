// API URL — injected via K8s ConfigMap/environment
const API_URL = window.API_URL || 'http://192.168.49.2:30080';

let weatherCards = [];

async function searchWeather() {
    const input = document.getElementById('cityInput');
    const city = input.value.trim();
    
    if (!city) return;
    
    input.value = '';
    await fetchWeather(city);
}

function handleKeyPress(event) {
    if (event.key === 'Enter') searchWeather();
}

function quickSearch(city) {
    fetchWeather(city);
}

async function fetchWeather(city) {
    const grid = document.getElementById('weatherGrid');
    
    // Add loading card
    const loadingId = `loading-${Date.now()}`;
    const loadingCard = `
        <div id="${loadingId}" class="weather-card loading">
            <p>Fetching weather for <strong>${city}</strong>...</p>
        </div>
    `;
    grid.insertAdjacentHTML('afterbegin', loadingCard);
    
    try {
        const response = await fetch(`${API_URL}/weather/${encodeURIComponent(city)}`);
        const data = await response.json();
        
        // Remove loading card
        document.getElementById(loadingId)?.remove();
        
        if (!response.ok) {
            showError(city, data.detail || 'City not found');
            return;
        }
        
        addWeatherCard(data);
        
    } catch (error) {
        document.getElementById(loadingId)?.remove();
        showError(city, 'Cannot connect to API. Check if the service is running.');
    }
}

function addWeatherCard(data) {
    const grid = document.getElementById('weatherGrid');
    const cardId = `card-${Date.now()}`;
    
    const card = `
        <div id="${cardId}" class="weather-card">
            <button class="remove-btn" onclick="removeCard('${cardId}')">×</button>
            <div class="card-header">
                <div>
                    <div class="city-name">${data.city}</div>
                    <div class="country">${data.country}</div>
                </div>
                ${data.mock ? '<span class="mock-badge">Mock Data</span>' : ''}
            </div>
            <div class="temperature">${Math.round(data.temperature)}°C</div>
            <div class="description">${data.description}</div>
            <div class="weather-details">
                <div class="detail-item">
                    <div class="detail-label">Feels Like</div>
                    <div class="detail-value">${Math.round(data.feels_like)}°C</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Humidity</div>
                    <div class="detail-value">${data.humidity}%</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Wind Speed</div>
                    <div class="detail-value">${data.wind_speed} m/s</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value" style="color: #00d2ff">Live</div>
                </div>
            </div>
        </div>
    `;
    
    grid.insertAdjacentHTML('afterbegin', card);
}

function showError(city, message) {
    const grid = document.getElementById('weatherGrid');
    const cardId = `error-${Date.now()}`;
    
    const card = `
        <div id="${cardId}" class="error-card">
            <button class="remove-btn" onclick="removeCard('${cardId}')">×</button>
            <p><strong>${city}</strong></p>
            <p style="margin-top: 8px; font-size: 0.9rem">${message}</p>
        </div>
    `;
    
    grid.insertAdjacentHTML('afterbegin', card);
}

function removeCard(cardId) {
    document.getElementById(cardId)?.remove();
}

// Load default cities on startup
window.onload = () => {
    fetchWeather('Hyderabad');
    fetchWeather('London');
}
