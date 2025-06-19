
// === OpenWeatherMap API === //

const OPENWEATHER_API_KEY = 'f5ba4763ffa643358f5ffae8ef2fcfc3';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/';



// Fetch current weather by city name
async function fetchWeatherByCity(city) {
  if (!city) {
    throw new Error('City name is required');
  }
  const url = `${OPENWEATHER_BASE_URL}weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
}

// Example usage (uncomment to test):
// fetchWeatherByCity('London').then(console.log).catch(console.error);

async function displayWeatherData(city) {
  try {
    const weatherData = await fetchWeatherByCity(city);
    if (weatherData) {
      document.getElementById('weather-location').textContent = `${weatherData.name}, ${weatherData.sys.country}`;
      document.getElementById('weather-date').textContent = new Date().toLocaleDateString();
      document.getElementById('weather-icon').textContent = weatherData.weather[0].icon; // Placeholder for actual icon
      document.getElementById('weather-temp').textContent = `${Math.round(weatherData.main.temp)}°F`;
      document.getElementById('weather-desc').textContent = weatherData.weather[0].description;
      document.getElementById('weather-feels').textContent = `Feels like ${Math.round(weatherData.main.feels_like)}°F`;
      document.getElementById('weather-humidity').textContent = `Humidity ${weatherData.main.humidity}%`;
      document.getElementById('weather-wind').textContent = `Wind ${weatherData.wind.speed} mph`;
      document.getElementById('weather-result').classList.remove('hidden');
    }
  } catch (error) {
    document.getElementById('error-message').textContent = 'Error fetching weather data. Please try again.';
    document.getElementById('error-message').classList.remove('hidden');
  }
}

// Example usage
// displayWeatherData('New York');

const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input'); // Added for convenience
const recentCitiesContainer = document.getElementById('recent-cities-container'); // Added
const recentCitiesDropdown = document.getElementById('recent-cities-dropdown'); // Added

// Function to load recent cities into the dropdown
function loadRecentCitiesDropdown() {
  const recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
  recentCitiesDropdown.innerHTML = ''; // Clear existing options

  if (recentCities.length > 0) {
    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Select a recent city';
    defaultOption.value = '';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    recentCitiesDropdown.appendChild(defaultOption);

    recentCities.forEach(city => {
      const option = document.createElement('option');
      option.value = city;
      option.textContent = city;
      recentCitiesDropdown.appendChild(option);
    });
    recentCitiesContainer.classList.remove('hidden');
  } else {
    recentCitiesContainer.classList.add('hidden');
  }
}

// Event listener for city search
searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim(); // Use cityInput
  if (city) {
    document.getElementById('error-message').classList.add('hidden'); // Hide previous errors
    await displayWeatherData(city);
    await displayForecast(city);
    updateRecentCities(city);
  } else {
    showError('Please enter a valid city name.');
  }
});

// Event listener for current location button
const currentLocationBtn = document.getElementById('current-location-btn');
currentLocationBtn.addEventListener('click', async () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      await displayWeatherDataByCoords(latitude, longitude);
    }, () => {
      showError('Unable to retrieve your location.');
    });
  } else {
    showError('Geolocation is not supported by your browser.');
  }
});

// Function to update recent cities
function updateRecentCities(city) {
  let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
  // Remove city if it already exists to move it to the top (most recent)
  recentCities = recentCities.filter(c => c.toLowerCase() !== city.toLowerCase());
  recentCities.unshift(city); // Add to the beginning
  // Keep only the last 5-10 recent cities (optional)
  const maxRecentCities = 5;
  if (recentCities.length > maxRecentCities) {
    recentCities = recentCities.slice(0, maxRecentCities);
  }
  localStorage.setItem('recentCities', JSON.stringify(recentCities));
  loadRecentCitiesDropdown(); // Refresh the dropdown
  // The old recentCitiesList logic is removed as we are using a dropdown now
}

// Function to show error messages
function showError(message) {
  const errorMessage = document.getElementById('error-message');
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
}

// Function to fetch weather data by coordinates
async function displayWeatherDataByCoords(latitude, longitude) {
  try {
    const url = `${OPENWEATHER_BASE_URL}weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const response = await fetch(url);
    const weatherData = await response.json();
    if (weatherData) {
      document.getElementById('weather-location').textContent = `${weatherData.name}, ${weatherData.sys.country}`;
      document.getElementById('weather-date').textContent = new Date().toLocaleDateString();
      document.getElementById('weather-icon').textContent = weatherData.weather[0].icon;
      document.getElementById('weather-temp').textContent = `${Math.round(weatherData.main.temp)}°F`;
      document.getElementById('weather-desc').textContent = weatherData.weather[0].description;
      document.getElementById('weather-feels').textContent = `Feels like ${Math.round(weatherData.main.feels_like)}°F`;
      document.getElementById('weather-humidity').textContent = `Humidity ${weatherData.main.humidity}%`;
      document.getElementById('weather-wind').textContent = `Wind ${weatherData.wind.speed} mph`;
      document.getElementById('weather-result').classList.remove('hidden');
      // Fetch and display forecast for current location
      await displayForecastByCoords(latitude, longitude);
    }
  } catch (error) {
    showError('Error fetching weather data. Please try again.');
  }
}

// Fetch 5-day weather forecast by coordinates
async function fetchForecastByCoords(latitude, longitude) {
  const url = `${OPENWEATHER_BASE_URL}forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch forecast data');
    }
    const data = await response.json();
    // Group by day, pick the forecast closest to 12:00 for each day
    const dailyMap = {};
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const day = date.toISOString().split('T')[0];
      if (!dailyMap[day]) {
        dailyMap[day] = [];
      }
      dailyMap[day].push(item);
    });
    const dailyList = Object.values(dailyMap).map(items => {
      return items.reduce((prev, curr) => {
        const prevHour = Math.abs(new Date(prev.dt * 1000).getHours() - 12);
        const currHour = Math.abs(new Date(curr.dt * 1000).getHours() - 12);
        return currHour < prevHour ? curr : prev;
      });
    });
    return dailyList.slice(0, 5);
  } catch (error) {
    console.error('Error fetching forecast:', error);
    throw error;
  }
}

// Display 5-day weather forecast by coordinates
async function displayForecastByCoords(latitude, longitude) {
  try {
    const forecastData = await fetchForecastByCoords(latitude, longitude);
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = '';
    forecastData.forEach((dayData, index) => {
      const dateObj = new Date(dayData.dt * 1000);
      let dayName = dateObj.toLocaleDateString(undefined, { weekday: 'long' });
      if (index === 0) {
        dayName = 'Today';
      }
      const iconCode = dayData.weather[0].icon;
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
      const temp = `${Math.round(dayData.main.temp)}°`;
      const pop = `${Math.round(dayData.pop * 100)}%`;
      const wind = `${Math.round(dayData.wind.speed * 3.6)} km/h`;
      const humidity = `${dayData.main.humidity}%`;
      const forecastItem = document.createElement('div');
      forecastItem.className = 'forecast-item grid grid-cols-4 items-center py-2 border-b border-gray-200 last:border-b-0';
      forecastItem.innerHTML = `
        <div class="forecast-day-name col-span-1 font-medium text-gray-700">${dayName}</div>
        <div class="forecast-icon-pop col-span-1 flex flex-col items-center">
          <img src="${iconUrl}" alt="${dayData.weather[0].description}" class="w-10 h-10">
          <span class="text-xs text-blue-500">${pop}</span>
        </div>
        <div class="forecast-temp col-span-1 text-lg text-gray-800 text-center">${temp}</div>
        <div class="forecast-details col-span-1 text-xs text-gray-500 text-right">
            <div>Wind: ${wind}</div>
            <div>Humidity: ${humidity}</div>
        </div>
      `;
      forecastContainer.appendChild(forecastItem);
    });
    document.getElementById('forecast-section').classList.remove('hidden');
  } catch (error) {
    console.error('Error displaying forecast:', error);
    showError('Error fetching or displaying forecast data. Please try again.');
  }
}

// Fetch 5-day weather forecast by city name
async function fetchForecastByCity(city) {
  if (!city) {
    throw new Error('City name is required');
  }
  const url = `${OPENWEATHER_BASE_URL}forecast?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch forecast data');
    }
    const data = await response.json();
    // Group by day, pick the forecast closest to 12:00 for each day
    const dailyMap = {};
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const day = date.toISOString().split('T')[0];
      if (!dailyMap[day]) {
        dailyMap[day] = [];
      }
      dailyMap[day].push(item);
    });
    const dailyList = Object.values(dailyMap).map(items => {
      // Find the item closest to 12:00
      return items.reduce((prev, curr) => {
        const prevHour = Math.abs(new Date(prev.dt * 1000).getHours() - 12);
        const currHour = Math.abs(new Date(curr.dt * 1000).getHours() - 12);
        return currHour < prevHour ? curr : prev;
      });
    });
    return dailyList.slice(0, 5); // Get 5 unique days
  } catch (error) {
    console.error('Error fetching forecast:', error);
    throw error;
  }
}

// Display 5-day weather forecast
async function displayForecast(city) {
  try {
    const forecastData = await fetchForecastByCity(city);
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = ''; // Clear previous forecast

    // Optional: Add a header like in the image
    const forecastHeader = document.createElement('div');
    forecastHeader.className = 'forecast-summary-message text-gray-600 mb-3'; // Added Tailwind classes
    // This message could be dynamic based on overall forecast, for now, a placeholder
    // forecastHeader.textContent = 'Rainy conditions expected around 6 PM'; 
    // forecastContainer.appendChild(forecastHeader);

    forecastData.forEach((dayData, index) => {
      const dateObj = new Date(dayData.dt * 1000);
      let dayName = dateObj.toLocaleDateString(undefined, { weekday: 'long' });
      if (index === 0) {
        dayName = 'Today'; // First item is 'Today'
      }

      const iconCode = dayData.weather[0].icon;
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
      const temp = `${Math.round(dayData.main.temp)}°`; // Temperature (Min/Max could be added if available and desired)
      const pop = `${Math.round(dayData.pop * 100)}%`; // Probability of precipitation
      // Wind and Humidity are not directly in the image per row, but you asked for them.
      // If you want to exclude them from the row display, remove the lines below.
      const wind = `${Math.round(dayData.wind.speed * 3.6)} km/h`; // Convert m/s to km/h
      const humidity = `${dayData.main.humidity}%`;

      const forecastItem = document.createElement('div');
      // Using Tailwind classes for layout similar to the image
      forecastItem.className = 'forecast-item grid grid-cols-4 items-center py-2 border-b border-gray-200 last:border-b-0';

      forecastItem.innerHTML = `
        <div class="forecast-day-name col-span-1 font-medium text-gray-700">${dayName}</div>
        <div class="forecast-icon-pop col-span-1 flex flex-col items-center">
          <img src="${iconUrl}" alt="${dayData.weather[0].description}" class="w-10 h-10">
          <span class="text-xs text-blue-500">${pop}</span>
        </div>
        <div class="forecast-temp col-span-1 text-lg text-gray-800 text-center">${temp}</div>
        <div class="forecast-details col-span-1 text-xs text-gray-500 text-right">
            <div>Wind: ${wind}</div>
            <div>Humidity: ${humidity}</div>
        </div>
      `;
      // Note: The image shows min/max temps with a bar. We are omitting the bar and showing a single temp.
      // If you have min/max temp data, you could display it like: `${Math.round(dayData.main.temp_min)}° / ${Math.round(dayData.main.temp_max)}°`

      forecastContainer.appendChild(forecastItem);
    });
    document.getElementById('forecast-section').classList.remove('hidden');
  } catch (error) {
    console.error('Error displaying forecast:', error); // Log error to console
    showError('Error fetching or displaying forecast data. Please try again.');
  }
}

// Add event listener for the dropdown
recentCitiesDropdown.addEventListener('change', async (event) => {
  const selectedCity = event.target.value;
  if (selectedCity) {
    cityInput.value = selectedCity; // Optionally update the search input
    document.getElementById('error-message').classList.add('hidden'); // Hide previous errors
    await displayWeatherData(selectedCity);
    await displayForecast(selectedCity);
  }
});

// Initial load of recent cities into dropdown when the page loads
document.addEventListener('DOMContentLoaded', () => {
  loadRecentCitiesDropdown();
});

