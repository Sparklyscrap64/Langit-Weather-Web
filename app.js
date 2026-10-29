(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const API = {
    forecast: 'https://api.open-meteo.com/v1/forecast',
    air: 'https://air-quality-api.open-meteo.com/v1/air-quality',
    geocode: 'https://geocoding-api.open-meteo.com/v1/search',
    reverse: 'https://api.bigdatacloud.net/data/reverse-geocode-client',
    ip: 'https://ipwho.is/'
  };

  const DEFAULT_LOCATION = {
    name: 'Bandung',
    admin1: 'Jawa Barat',
    country: 'Indonesia',
    latitude: -6.9175,
    longitude: 107.6191,
    elevation: 768,
    timezone: 'Asia/Jakarta'
  };

  const BASE_CITIES = [
    { name: 'Bandung', admin1: 'Jawa Barat', country: 'Indonesia', latitude: -6.9175, longitude: 107.6191, elevation: 768, timezone: 'Asia/Jakarta' },
    { name: 'Jakarta Pusat', admin1: 'DKI Jakarta', country: 'Indonesia', latitude: -6.1862, longitude: 106.834, elevation: 8, timezone: 'Asia/Jakarta' },
    { name: 'Sumedang', admin1: 'Jawa Barat', country: 'Indonesia', latitude: -6.8586, longitude: 107.9208, elevation: 480, timezone: 'Asia/Jakarta' },
    { name: 'Yogyakarta', admin1: 'DI Yogyakarta', country: 'Indonesia', latitude: -7.7956, longitude: 110.3695, elevation: 113, timezone: 'Asia/Jakarta' },
    { name: 'Surabaya', admin1: 'Jawa Timur', country: 'Indonesia', latitude: -7.2575, longitude: 112.7521, elevation: 5, timezone: 'Asia/Jakarta' }
  ];

  const WEEKDAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
  const num = (value, fallback = null) => {
    if (value === null || value === undefined || value === '') return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const round = (value, digits = 0) => Number(Number(value).toFixed(digits));
  const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

  /* ---------- WMO weather codes -> Indonesian labels, icons and colours ---------- */
  const WEATHER_CODES = {
    0: ['Cerah', 'Malam Cerah', 'wb_sunny', 'bedtime', '#fbbf24', false],
    1: ['Cerah Berawan', 'Malam Cerah Berawan', 'wb_sunny', 'bedtime', '#fbbf24', false],
    2: ['Berawan Sebagian', 'Berawan Malam', 'partly_cloudy_day', 'partly_cloudy_night', '#7dd3fc', false],
    3: ['Berawan', 'Berawan Malam', 'cloud', 'cloud', '#88b4cc', false],
    45: ['Kabut', 'Kabut Malam', 'foggy', 'foggy', '#a0b4c4', false],
    48: ['Kabut Beku', 'Kabut Beku', 'foggy', 'foggy', '#a0b4c4', false],
    51: ['Gerimis Ringan', 'Gerimis Ringan', 'rainy', 'rainy', '#7dd3fc', true],
    53: ['Gerimis Sedang', 'Gerimis Sedang', 'rainy', 'rainy', '#7dd3fc', true],
    55: ['Gerimis Lebat', 'Gerimis Lebat', 'rainy', 'rainy', '#7dd3fc', true],
    56: ['Gerimis Beku Ringan', 'Gerimis Beku Ringan', 'weather_mix', 'weather_mix', '#bae6fd', true],
    57: ['Gerimis Beku Lebat', 'Gerimis Beku Lebat', 'weather_mix', 'weather_mix', '#bae6fd', true],
    61: ['Hujan Ringan', 'Hujan Ringan', 'rainy', 'rainy', '#7dd3fc', true],
    63: ['Hujan Sedang', 'Hujan Sedang', 'rainy', 'rainy', '#7dd3fc', true],
    65: ['Hujan Lebat', 'Hujan Lebat', 'rainy', 'rainy', '#7dd3fc', true],
    66: ['Hujan Beku Ringan', 'Hujan Beku Ringan', 'weather_mix', 'weather_mix', '#bae6fd', true],
    67: ['Hujan Beku Lebat', 'Hujan Beku Lebat', 'weather_mix', 'weather_mix', '#bae6fd', true],
    71: ['Salju Ringan', 'Salju Ringan', 'weather_snowy', 'weather_snowy', '#bae6fd', true],
    73: ['Salju Sedang', 'Salju Sedang', 'weather_snowy', 'weather_snowy', '#bae6fd', true],
    75: ['Salju Lebat', 'Salju Lebat', 'weather_snowy', 'weather_snowy', '#bae6fd', true],
    77: ['Butiran Salju', 'Butiran Salju', 'weather_snowy', 'weather_snowy', '#bae6fd', true],
    80: ['Hujan Lokal Ringan', 'Hujan Lokal Ringan', 'rainy', 'rainy', '#7dd3fc', true],
    81: ['Hujan Lokal Sedang', 'Hujan Lokal Sedang', 'rainy', 'rainy', '#7dd3fc', true],
    82: ['Hujan Lokal Lebat', 'Hujan Lokal Lebat', 'rainy', 'rainy', '#7dd3fc', true],
    85: ['Hujan Salju Ringan', 'Hujan Salju Ringan', 'weather_snowy', 'weather_snowy', '#bae6fd', true],
    86: ['Hujan Salju Lebat', 'Hujan Salju Lebat', 'weather_snowy', 'weather_snowy', '#bae6fd', true],
    95: ['Hujan Petir', 'Hujan Petir', 'thunderstorm', 'thunderstorm', '#fbbf24', true],
    96: ['Hujan Petir & Es', 'Hujan Petir & Es', 'thunderstorm', 'thunderstorm', '#fbbf24', true],
    99: ['Hujan Petir & Es Lebat', 'Hujan Petir & Es Lebat', 'thunderstorm', 'thunderstorm', '#fbbf24', true]
  };
  const DEFAULT_WEATHER = WEATHER_CODES[3];

  function weatherInfo(code, isDay) {
    const entry = WEATHER_CODES[Number(code)] || DEFAULT_WEATHER;
    const daytime = Number(isDay) !== 0;
    return {
      label: daytime ? entry[0] : (entry[1] || entry[0]),
      icon: daytime ? entry[2] : (entry[3] || entry[2]),
      color: entry[4],
      rain: Boolean(entry[5])
    };
  }

  function shortWeatherLabel(code) {
    const value = Number(code);
    if (value === 0 || value === 1) return 'Cerah';
    if (value === 2 || value === 3) return 'Berawan';
    if (value === 45 || value === 48) return 'Kabut';
    if (value >= 51 && value <= 57) return 'Gerimis';
    if (value >= 61 && value <= 67) return 'Hujan';
    if (value >= 71 && value <= 77) return 'Salju';
    if (value >= 80 && value <= 82) return 'Hujan';
    if (value >= 85 && value <= 86) return 'Salju';
    if (value >= 95) return 'Petir';
    return 'Berawan';
  }

  const AQI_LEVELS = [
    { max: 50, short: 'Baik', full: 'Baik', color: '#4ade80' },
    { max: 100, short: 'Sedang', full: 'Sedang', color: '#fbbf24' },
    { max: 150, short: 'Sensitif', full: 'Tidak sehat bagi kelompok sensitif', color: '#fb923c' },
    { max: 200, short: 'Tidak Sehat', full: 'Tidak sehat', color: '#f87171' },
    { max: 300, short: 'Sangat Tidak Sehat', full: 'Sangat tidak sehat', color: '#c084fc' },
    { max: Infinity, short: 'Berbahaya', full: 'Berbahaya', color: '#fb7185' }
  ];

  function aqiLevel(value) {
    return AQI_LEVELS.find((level) => value <= level.max) || AQI_LEVELS[AQI_LEVELS.length - 1];
  }

  /* ---------- Local storage ---------- */
  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      /* storage can be unavailable in private mode */
    }
  }

  function sanitizeLocation(location) {
    const latitude = num(location && location.latitude);
    const longitude = num(location && location.longitude);
    if (latitude === null || longitude === null) return { ...DEFAULT_LOCATION };
    return {
      name: String(location.name || 'Lokasi'),
      admin1: String(location.admin1 || ''),
      country: String(location.country || ''),
      latitude,
      longitude,
      elevation: num(location.elevation),
      timezone: String(location.timezone || 'Asia/Jakarta')
    };
  }

  const storedFavorites = readJSON('langit-favorites', null);
  const storedExtras = readJSON('langit-extra-cities', []);
  const storedUnit = readJSON('langit-unit', 'C');
  const storedLocation = readJSON('langit-location', null);
  const storedSource = readJSON('langit-location-source', null);

  const state = {
    location: sanitizeLocation(storedLocation || DEFAULT_LOCATION),
    locationSource: storedSource === 'manual' ? 'manual' : 'auto',
    hasSavedLocation: Boolean(storedLocation),
    detectedVia: null,
    detectFailed: false,
    detecting: false,
    favorites: Array.isArray(storedFavorites)
      ? storedFavorites.filter((value) => typeof value === 'string')
      : ['Bandung', 'Yogyakarta'],
    extras: (Array.isArray(storedExtras) ? storedExtras : [])
      .map(sanitizeLocation)
      .filter((location) => location.name && location.name !== 'Bandung'),
    unit: storedUnit === 'F' ? 'F' : 'C',
    forecast: null,
    aqi: null,
    citySummaries: [],
    timezone: DEFAULT_LOCATION.timezone,
    tzAbbr: 'GMT+7',
    loading: false,
    controller: null,
    cityLoadToken: 0,
    searchResults: [],
    searchQuery: '',
    resultsQuery: '',
    searchTimer: null,
    geocodeController: null
  };

  /* ---------- Toast ---------- */
  const toast = $('#toast');
  const toastIcon = $('#toast-icon');
  const toastMsg = $('#toast-msg');
  let toastTimer;

  function showToast(message, icon = 'info') {
    if (!toast) return;
    toastMsg.textContent = message;
    toastIcon.textContent = icon;
    toast.classList.remove('hidden');
    toast.classList.add('flex');
    toast.classList.remove('toast-visible');
    void toast.offsetWidth;
    toast.classList.add('toast-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.add('hidden');
      toast.classList.remove('flex', 'toast-visible');
    }, 3000);
  }

  /* ---------- Theme ---------- */
  const root = document.documentElement;
  const themeToggle = $('#theme-toggle');
  const themeIcon = $('#theme-icon');
  const themeMeta = $('meta[name="theme-color"]');

  function applyTheme(isLight) {
    root.classList.toggle('light', isLight);
    root.classList.toggle('dark', !isLight);
    if (themeIcon) themeIcon.textContent = isLight ? 'dark_mode' : 'light_mode';
    if (themeMeta) themeMeta.setAttribute('content', isLight ? '#eef5fc' : '#0a0e1a');
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', isLight ? 'Alihkan ke mode gelap' : 'Alihkan ke mode terang');
    }
  }

  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('langit-theme') || 'dark'; } catch (_) {}
  applyTheme(savedTheme === 'light');

  themeToggle?.addEventListener('click', () => {
    const isLight = !root.classList.contains('light');
    applyTheme(isLight);
    try { localStorage.setItem('langit-theme', isLight ? 'light' : 'dark'); } catch (_) {}
    showToast(isLight ? 'Mode terang diaktifkan' : 'Mode gelap diaktifkan', isLight ? 'light_mode' : 'dark_mode');
  });

  /* ---------- Temperature units ---------- */
  function formatTemp(celsius, options = {}) {
    const { suffix = false, decimals = 0 } = options;
    const value = state.unit === 'F' ? (celsius * 9) / 5 + 32 : celsius;
    return `${value.toFixed(decimals)}°${suffix ? state.unit : ''}`;
  }

  function renderTemps() {
    $$('[data-c]').forEach((el) => {
      const celsius = num(el.dataset.c);
      if (celsius === null) return;
      const decimals = clamp(Number.parseInt(el.dataset.decimals || '0', 10) || 0, 0, 2);
      const suffix = el.hasAttribute('data-suffix') ? state.unit : '';
      const value = state.unit === 'F' ? (celsius * 9) / 5 + 32 : celsius;
      el.textContent = `${value.toFixed(decimals)}°${suffix}`;
    });
  }

  function applyUnit(nextUnit, notify = true) {
    state.unit = nextUnit === 'F' ? 'F' : 'C';
    $$('.unit-btn').forEach((btn) => {
      const active = btn.dataset.unit === state.unit;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    const legend = $('#temp-legend');
    if (legend) legend.textContent = `Suhu (°${state.unit})`;
    renderTemps();
    writeJSON('langit-unit', state.unit);
    if (notify) {
      showToast(state.unit === 'F' ? 'Satuan diubah ke Fahrenheit (°F)' : 'Satuan diubah ke Celsius (°C)', 'thermostat');
    }
  }

  $$('.unit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.unit === state.unit) return;
      applyUnit(btn.dataset.unit);
    });
  });

  /* ---------- Time helpers ---------- */
  function tzShort() {
    const timezone = state.timezone || state.location.timezone || 'Asia/Jakarta';
    if (timezone === 'Asia/Jakarta') return 'WIB';
    if (timezone === 'Asia/Makassar') return 'WITA';
    if (timezone === 'Asia/Jayapura') return 'WIT';
    return state.tzAbbr || 'WIB';
  }

  function clockFromISO(iso) {
    return typeof iso === 'string' && iso.length >= 16 ? iso.slice(11, 16) : '—';
  }

  function minutesFromISO(iso) {
    const clock = clockFromISO(iso);
    if (clock === '—') return null;
    const [hours, minutes] = clock.split(':').map(Number);
    return hours * 60 + minutes;
  }

  function currentClock() {
    const timezone = state.timezone || state.location.timezone || 'Asia/Jakarta';
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone
    }).format(new Date()).replace('.', ':');
  }

  function updateClock() {
    const timezone = state.timezone || state.location.timezone || 'Asia/Jakarta';
    const now = new Date();
    const weekday = capitalize(new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone: timezone }).format(now));
    const day = new Intl.DateTimeFormat('id-ID', { day: 'numeric', timeZone: timezone }).format(now);
    const month = new Intl.DateTimeFormat('id-ID', { month: 'long', timeZone: timezone }).format(now);
    const time = new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone
    }).format(now).replace('.', ':');
    const target = $('#local-time');
    if (target) target.textContent = `${weekday}, ${day} ${month} • ${time} ${tzShort()}`;
  }

  /* ---------- Location helpers ---------- */
  function currentHourIndex(hourly, currentTime) {
    if (!hourly || !Array.isArray(hourly.time) || !hourly.time.length) return 0;
    const key = typeof currentTime === 'string' ? currentTime.slice(0, 13) : '';
    const index = hourly.time.findIndex((time) => time.slice(0, 13) === key);
    return index >= 0 ? index : 0;
  }

  function sameCoords(a, b) {
    return Math.abs(Number(a.latitude) - Number(b.latitude)) < 0.01
      && Math.abs(Number(a.longitude) - Number(b.longitude)) < 0.01;
  }

  function distanceKm(a, b) {
    const toRad = (value) => (Number(value) * Math.PI) / 180;
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const dLat = lat2 - lat1;
    const dLon = toRad(Number(b.longitude) - Number(a.longitude));
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  function normalizePlaceName(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/^(kota administrasi|kabupaten administrasi|kota|kabupaten)\s+/, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function findDetectedCity(location) {
    const target = normalizePlaceName(location.name);
    return getCityList().find((city) => {
      const km = distanceKm(city, location);
      const name = normalizePlaceName(city.name);
      if (name && target && name === target && km < 40) return true;
      return km < 4;
    });
  }

  function deviceTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';
    } catch (_) {
      return 'Asia/Jakarta';
    }
  }

  function isActiveLocation(location) {
    return sameCoords(location, state.location);
  }

  function getCityList() {
    const seen = new Set();
    return [...BASE_CITIES, ...state.extras]
      .filter((city) => {
        const key = `${Number(city.latitude).toFixed(2)},${Number(city.longitude).toFixed(2)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 10);
  }

  function setLocation(location, source = state.locationSource) {
    state.location = sanitizeLocation(location);
    state.searchQuery = '';
    if (source === 'auto' || source === 'manual') {
      state.locationSource = source;
      writeJSON('langit-location-source', source);
    }
    if (state.location.timezone) state.timezone = state.location.timezone;
    writeJSON('langit-location', state.location);
    $$('.js-search').forEach((input) => { input.value = ''; });
    renderLocationHeader();
    renderLocationChip();
    updateClock();
    document.title = `${state.location.name} — Langit Cuaca`;
  }

  function locationRegion(location) {
    const parts = [];
    if (location.admin1 && location.admin1.toLowerCase() !== location.name.toLowerCase()) parts.push(location.admin1);
    if (!parts.length && location.country) parts.push(location.country);
    return parts.length ? `, ${parts.join(', ')}` : '';
  }

  function renderLocationHeader() {
    const name = $('#hero-city-name');
    if (name) name.textContent = state.location.name;
    const region = $('#hero-region');
    if (region) region.textContent = locationRegion(state.location);
  }

  function renderLocationChip() {
    const chip = $('#location-chip');
    const text = $('#location-chip-text');
    if (!chip || !text) return;
    const icon = chip.querySelector('.material-symbols-outlined');
    const auto = state.locationSource === 'auto';
    const approximate = auto && state.detectedVia === 'ip';

    if (state.detecting) {
      text.textContent = 'Mendeteksi lokasi…';
      chip.title = 'Sedang mendeteksi lokasi perangkat Anda';
      chip.setAttribute('aria-busy', 'true');
      icon?.classList.add('animate-pulse');
    } else {
      const failed = auto && state.detectFailed;
      text.textContent = auto
        ? (failed ? 'Deteksi gagal' : (approximate ? 'Perkiraan lokasi' : 'Lokasi otomatis'))
        : 'Lokasi manual';
      chip.title = auto
        ? (failed
          ? 'Lokasi tidak terdeteksi. Klik untuk mencoba lagi.'
          : (approximate
            ? 'Perkiraan lokasi dari alamat IP. Klik untuk deteksi ulang bila izin lokasi tersedia.'
            : 'Lokasi mengikuti perangkat Anda. Klik untuk deteksi ulang.'))
        : 'Lokasi dipilih manual. Klik untuk kembali ke deteksi otomatis.';
      chip.removeAttribute('aria-busy');
      icon?.classList.remove('animate-pulse');
      if (icon) {
        icon.classList.toggle('text-amber-300', approximate);
        icon.classList.toggle('text-primary', !approximate);
      }
    }
    chip.setAttribute('aria-pressed', String(auto));

    const geoLabel = $('#geo-label');
    if (geoLabel) geoLabel.textContent = auto ? 'Deteksi Ulang' : 'Gunakan Lokasi';
  }

  function addExtraCity(location) {
    const candidate = sanitizeLocation(location);
    const known = BASE_CITIES.concat(state.extras).some((city) => (
      sameCoords(city, candidate)
      || distanceKm(city, candidate) < 3
      || normalizePlaceName(city.name) === normalizePlaceName(candidate.name)
    ));
    if (known) return;
    state.extras = [...state.extras, candidate].slice(-5);
    writeJSON('langit-extra-cities', state.extras);
  }

  function setLiveStatus(message, tone = 'ok') {
    const label = $('#live-label');
    const dot = $('#live-dot');
    if (label) {
      label.textContent = message;
      label.style.color = tone === 'error' ? '#ff6b6b' : '';
    }
    if (dot) {
      dot.style.backgroundColor = tone === 'error' ? '#ff6b6b' : tone === 'loading' ? '#fbbf24' : '#7dd3fc';
    }
  }

  function setBusy(busy) {
    const button = $('#refresh-btn');
    if (!button) return;
    const icon = button.querySelector('.material-symbols-outlined');
    if (busy) button.setAttribute('aria-busy', 'true');
    else button.removeAttribute('aria-busy');
    if (icon) icon.classList.toggle('animate-spin', busy);
  }

  async function fetchJSON(url, signal) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const abort = () => controller.abort();
    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener('abort', abort, { once: true });
    }
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timeout);
      if (signal) signal.removeEventListener('abort', abort);
    }
  }

  /* ---------- Search & geocoding ---------- */
  function closeSearchResults() {
    $$('.search-results').forEach((container) => container.classList.add('hidden'));
  }

  function renderSearchResults() {
    const containers = $$('.search-results');
    if (!containers.length) return;
    if (state.searchQuery.trim().length < 2) {
      closeSearchResults();
      return;
    }
    if (!state.searchResults.length) {
      const empty = `<div class="px-4 py-3 text-[11px] text-on-surface-variant">Tidak ada hasil untuk “${esc(state.searchQuery.trim())}”. Tekan Enter untuk mencoba lagi.</div>`;
      containers.forEach((container) => {
        container.innerHTML = empty;
        container.classList.remove('hidden');
      });
      return;
    }
    const rows = state.searchResults.map((result, index) => {
      const subtitle = [result.admin1, result.country].filter(Boolean).join(', ');
      return `<button type="button" role="option" data-index="${index}" aria-selected="false" class="search-result w-full text-left px-3 py-2.5 hover:bg-surface-container-high flex items-center gap-2.5 transition-colors">
        <span class="material-symbols-outlined text-[17px] text-primary shrink-0" aria-hidden="true">location_on</span>
        <span class="min-w-0 flex-1">
          <span class="block text-xs font-semibold text-on-surface truncate">${esc(result.name)}</span>
          <span class="block text-[10px] text-on-surface-variant truncate">${esc(subtitle || 'Lokasi')}</span>
        </span>
        <span class="text-[10px] font-medium text-primary shrink-0">Pilih</span>
      </button>`;
    }).join('');
    containers.forEach((container) => {
      container.innerHTML = rows;
      container.classList.remove('hidden');
    });
  }

  async function runGeocode(query) {
    const term = query.trim();
    if (term.length < 2) {
      state.searchResults = [];
      closeSearchResults();
      return;
    }
    state.geocodeController?.abort();
    const controller = new AbortController();
    state.geocodeController = controller;
    try {
      const params = new URLSearchParams({ name: term, count: '6', language: 'id', format: 'json' });
      const data = await fetchJSON(`${API.geocode}?${params}`, controller.signal);
      if (controller.signal.aborted) return;
      const results = Array.isArray(data.results)
        ? data.results.filter((result) => num(result.latitude) !== null && num(result.longitude) !== null)
        : [];
      results.sort((a, b) => Number(b.country_code === 'ID') - Number(a.country_code === 'ID'));
      state.searchResults = results;
      state.resultsQuery = term;
      if (state.searchQuery.trim() === term) renderSearchResults();
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.warn('Pencarian lokasi gagal:', error);
      state.searchResults = [];
      state.resultsQuery = term;
      if (state.searchQuery.trim() === term) renderSearchResults();
    }
  }

  function chooseSearchResult(result) {
    const location = sanitizeLocation({
      name: result.name,
      admin1: result.admin1 || '',
      country: result.country || '',
      latitude: result.latitude,
      longitude: result.longitude,
      elevation: result.elevation,
      timezone: result.timezone || 'Asia/Jakarta'
    });
    const known = getCityList().find((city) => sameCoords(city, location));
    const resolved = known || location;
    setLocation(resolved, 'manual');
    addExtraCity(resolved);
    closeSearchResults();
    closeMobileMenu();
    updateActiveCityCards();
    loadWeather();
    $('#prakiraan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast(`Menampilkan cuaca ${resolved.name}`, 'location_on');
  }

  function filterCityCards(query) {
    const term = String(query || '').trim().toLowerCase();
    let visible = 0;
    $$('.city-card').forEach((card) => {
      const haystack = `${card.dataset.city || ''} ${card.dataset.cond || ''}`.toLowerCase();
      const match = !term || haystack.includes(term);
      card.classList.toggle('hidden', !match);
      if (match) visible += 1;
    });
    const empty = $('#city-empty');
    if (empty) empty.classList.toggle('hidden', visible > 0 || state.citySummaries.length === 0);
  }

  function scheduleSearch(query) {
    state.searchQuery = query;
    filterCityCards(query);
    clearTimeout(state.searchTimer);
    if (query.trim().length < 2) {
      state.searchResults = [];
      closeSearchResults();
      return;
    }
    state.searchTimer = setTimeout(() => runGeocode(query), 350);
  }

  $$('.js-search').forEach((input) => {
    input.addEventListener('input', () => scheduleSearch(input.value));
    input.addEventListener('focus', () => {
      if (state.searchResults.length && state.searchQuery.trim().length >= 2) renderSearchResults();
    });
    input.addEventListener('keydown', async (event) => {
      if (event.key === 'Escape') {
        closeSearchResults();
        input.blur();
        return;
      }
      if (event.key !== 'Enter') return;
      event.preventDefault();
      const term = input.value.trim();
      if (!term) return;
      if (state.resultsQuery === term && state.searchResults.length) {
        chooseSearchResult(state.searchResults[0]);
        return;
      }
      await runGeocode(term);
      if (state.searchResults.length) {
        chooseSearchResult(state.searchResults[0]);
        return;
      }
      const card = $$('.city-card').find((item) => (item.dataset.city || '').toLowerCase() === term.toLowerCase());
      if (card) {
        selectCityCard(card);
        closeMobileMenu();
        return;
      }
      showToast(`Kota “${term}” tidak ditemukan.`, 'search_off');
    });
  });

  $$('.search-results').forEach((container) => {
    container.addEventListener('click', (event) => {
      const item = event.target.closest('[data-index]');
      if (!item) return;
      const result = state.searchResults[Number(item.dataset.index)];
      if (result) chooseSearchResult(result);
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.search-results') && !event.target.closest('.js-search')) {
      closeSearchResults();
    }
  });

  /* ---------- Mobile menu & navigation ---------- */
  const mobileNav = $('#mobile-nav');
  const menuBtn = $('#menu-btn');
  const menuIcon = $('#menu-icon');

  function openMobileMenu() {
    if (!mobileNav || !menuBtn) return;
    mobileNav.classList.remove('hidden');
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Tutup menu');
    if (menuIcon) menuIcon.textContent = 'close';
  }

  function closeMobileMenu() {
    if (!mobileNav || !menuBtn) return;
    mobileNav.classList.add('hidden');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Buka menu');
    if (menuIcon) menuIcon.textContent = 'menu';
  }

  menuBtn?.addEventListener('click', () => {
    if (mobileNav?.classList.contains('hidden')) openMobileMenu();
    else closeMobileMenu();
  });

  function setActiveNav(key) {
    $$('[data-nav]').forEach((link) => {
      const active = link.dataset.nav === key;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  const unavailablePages = {
    radar: 'Peta Radar',
    peringatan: 'Peringatan Dini',
    arsip: 'Detail Arsip'
  };

  $$('[data-nav]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const key = link.dataset.nav;
      if (key === 'prakiraan') {
        event.preventDefault();
        closeMobileMenu();
        setActiveNav('prakiraan');
        $('#prakiraan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (key === 'udara') {
        event.preventDefault();
        closeMobileMenu();
        setActiveNav('udara');
        $('#kondisi-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showToast('Kualitas udara ditampilkan pada panel kondisi atmosfer.', 'air');
        return;
      }
      if (unavailablePages[key]) {
        event.preventDefault();
        closeMobileMenu();
        showToast(`Halaman ${unavailablePages[key]} belum tersedia pada versi ini.`, 'info');
      }
    });
  });

  /* ---------- Location detection ---------- */
  function getBrowserPosition(timeout = 9000) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error('Geolokasi tidak didukung perangkat ini');
        error.code = 0;
        reject(error);
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout,
        maximumAge: 5 * 60 * 1000
      });
    });
  }

  async function geolocationPermission() {
    try {
      if (!navigator.permissions?.query) return 'prompt';
      const status = await navigator.permissions.query({ name: 'geolocation' });
      return status.state;
    } catch (_) {
      return 'prompt';
    }
  }

  function describeReverseGeocode(data) {
    const admin = Array.isArray(data?.localityInfo?.administrative) ? data.localityInfo.administrative : [];
    const countryCode = String(data?.countryCode || '').toUpperCase();
    const regionEntry = admin
      .filter((entry) => entry && entry.isoCode && String(entry.isoCode).toUpperCase() !== countryCode)
      .sort((a, b) => (num(b.order, 0) ?? 0) - (num(a.order, 0) ?? 0))[0];
    const region = (regionEntry && regionEntry.name) || data?.principalSubdivision || '';
    const name = data?.city || data?.locality || region || 'Lokasi Saya';
    return {
      name,
      admin1: region,
      country: data?.countryName || ''
    };
  }

  async function reverseGeocode(latitude, longitude) {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      localityLanguage: 'id'
    });
    const data = await fetchJSON(`${API.reverse}?${params}`);
    return describeReverseGeocode(data);
  }

  async function describePosition(coords) {
    const latitude = Number(coords.latitude);
    const longitude = Number(coords.longitude);
    let details = null;
    try {
      details = await reverseGeocode(latitude, longitude);
    } catch (error) {
      console.warn('Reverse geocoding gagal:', error);
    }
    if (!details) {
      const nearest = getCityList()
        .map((city) => ({ city, km: distanceKm(city, { latitude, longitude }) }))
        .sort((a, b) => a.km - b.km)[0];
      if (nearest && nearest.km < 60) {
        details = { name: nearest.city.name, admin1: nearest.city.admin1, country: nearest.city.country };
      }
    }
    return sanitizeLocation({
      name: details?.name || 'Lokasi Saya',
      admin1: details?.admin1 || `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
      country: details?.country || '',
      latitude,
      longitude,
      elevation: coords.altitude,
      timezone: deviceTimezone()
    });
  }

  async function locateByIP() {
    const data = await fetchJSON(API.ip);
    const latitude = num(data?.latitude);
    const longitude = num(data?.longitude);
    if (!data || data.success === false || latitude === null || longitude === null) {
      throw new Error('Perkiraan lokasi IP tidak tersedia');
    }
    return sanitizeLocation({
      name: data.city || data.region || 'Lokasi Saya',
      admin1: data.region && data.region !== data.city ? data.region : '',
      country: data.country || '',
      latitude,
      longitude,
      elevation: null,
      timezone: data.timezone?.id || deviceTimezone()
    });
  }

  async function detectLocation(options = {}) {
    const { notify = true } = options;
    if (state.detecting) return;
    state.detecting = true;
    renderLocationChip();
    setLiveStatus('Mendeteksi lokasi Anda…', 'loading');
    const heroStatus = $('#hero-status');
    if (heroStatus) heroStatus.textContent = 'Deteksi';
    if (notify) showToast('Mendeteksi lokasi Anda…', 'my_location');

    const previousName = state.location.name;
    let detected = null;
    let via = null;

    try {
      const permission = await geolocationPermission();
      if (permission !== 'denied') {
        try {
          const position = await getBrowserPosition();
          detected = await describePosition(position.coords);
          via = 'gps';
        } catch (error) {
          console.warn('Geolokasi perangkat tidak tersedia:', error);
        }
      }
      if (!detected) {
        detected = await locateByIP();
        via = 'ip';
      }
    } catch (error) {
      console.warn('Deteksi lokasi gagal:', error);
    } finally {
      state.detecting = false;
    }

    if (!detected) {
      state.detectedVia = null;
      state.detectFailed = true;
      renderLocationChip();
      setLiveStatus('Lokasi tidak terdeteksi • coba lagi', 'error');
      if (heroStatus) heroStatus.textContent = state.hasSavedLocation ? 'Lokasi Terakhir' : 'Manual';
      if (notify) showToast('Lokasi tidak terdeteksi. Menampilkan lokasi terakhir.', 'location_off');
      loadWeather();
      return;
    }

    const knownCity = findDetectedCity(detected);
    if (!knownCity) addExtraCity(detected);
    const resolved = knownCity || detected;
    state.detectedVia = via;
    state.detectFailed = false;
    state.hasSavedLocation = true;
    setLocation(resolved, 'auto');
    closeMobileMenu();
    updateActiveCityCards();
    renderLocationChip();
    loadWeather();

    if (notify || previousName !== resolved.name) {
      showToast(
        via === 'ip'
          ? `Perkiraan lokasi: ${resolved.name}. Izinkan akses lokasi untuk hasil lebih akurat.`
          : `Lokasi terdeteksi: ${resolved.name}. Menampilkan cuaca daerah Anda.`,
        via === 'ip' ? 'wifi_tethering' : 'my_location'
      );
    }
  }

  $$('.js-geo').forEach((button) => {
    button.addEventListener('click', () => {
      detectLocation({ notify: true });
    });
  });

  $('#location-chip')?.addEventListener('click', () => {
    detectLocation({ notify: true });
  });

  /* ---------- Live data loading ---------- */
  async function loadWeather(options = {}) {
    const { notify = false, silent = false } = options;
    state.controller?.abort();
    const controller = new AbortController();
    state.controller = controller;
    state.loading = true;
    setBusy(true);
    setLiveStatus('Memuat data Open-Meteo…', 'loading');
    const heroStatus = $('#hero-status');
    if (heroStatus) heroStatus.textContent = 'Memuat';

    const location = state.location;
    const forecastParams = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
      hourly: 'temperature_2m,relative_humidity_2m,dew_point_2m,precipitation_probability,precipitation,weather_code,visibility,uv_index,is_day',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,precipitation_sum',
      timezone: 'auto',
      forecast_days: '7'
    });
    const airParams = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current: 'us_aqi,european_aqi,pm2_5,pm10',
      timezone: 'auto'
    });

    try {
      const [forecastResult, airResult] = await Promise.allSettled([
        fetchJSON(`${API.forecast}?${forecastParams}`, controller.signal),
        fetchJSON(`${API.air}?${airParams}`, controller.signal)
      ]);
      if (controller.signal.aborted) return;
      if (forecastResult.status === 'rejected') throw forecastResult.reason;

      const forecast = forecastResult.value;
      const air = airResult.status === 'fulfilled' ? airResult.value : null;
      state.forecast = forecast;
      state.aqi = air;
      state.timezone = forecast.timezone || location.timezone || 'Asia/Jakarta';
      state.tzAbbr = forecast.timezone_abbreviation || 'GMT+7';

      renderWeather(forecast, air);
      setLiveStatus('Data Langsung • Open-Meteo', 'ok');
      loadCitySummaries();

      if (notify && !silent) {
        showToast(`Cuaca ${location.name} diperbarui • ${currentClock()} ${tzShort()}`, 'check_circle');
      }
    } catch (error) {
      if (error?.name === 'AbortError' && controller.signal.aborted) return;
      console.error('Gagal memuat data cuaca:', error);
      setLiveStatus('Koneksi gagal • coba lagi', 'error');
      const heroStatus = $('#hero-status');
      if (heroStatus) heroStatus.textContent = 'Offline';
      const insight = $('#hero-insight');
      if (insight) {
        insight.textContent = 'Data cuaca tidak dapat dimuat saat ini. Tekan tombol "Perbarui Data" untuk mencoba lagi.';
      }
      if (!silent) showToast('Gagal memuat data cuaca. Periksa koneksi internet Anda.', 'error');
      loadCitySummaries();
    } finally {
      if (!controller.signal.aborted) {
        state.loading = false;
        setBusy(false);
      }
    }
  }

  function renderWeather(forecast, air) {
    state.forecast = forecast;
    state.aqi = air;
    renderHero(forecast);
    renderMetrics(forecast);
    renderHourly(forecast);
    renderWeekly(forecast);
    renderChart(forecast);
    renderAqi(air);
    renderTemps();
    updateClock();
  }

  /* ---------- Hero ---------- */
  function renderHero(forecast) {
    const current = forecast.current || {};
    const hourly = forecast.hourly || {};
    const daily = forecast.daily || {};
    const index = currentHourIndex(hourly, current.time);
    const info = weatherInfo(current.weather_code, current.is_day);
    const high = daily.temperature_2m_max?.[0];
    const low = daily.temperature_2m_min?.[0];

    renderLocationHeader();
    const status = $('#hero-status');
    if (status) status.textContent = 'Live';

    const station = $('#hero-station');
    if (station) {
      const elevation = num(forecast.elevation, state.location.elevation);
      station.textContent = elevation === null
        ? 'Model Open-Meteo • Data langsung'
        : `Model Open-Meteo • Ketinggian ${Math.round(elevation)} mdpl`;
    }

    const temp = $('#hero-temp');
    if (temp && num(current.temperature_2m) !== null) temp.dataset.c = String(current.temperature_2m);
    const feels = $('#hero-feels');
    if (feels && num(current.apparent_temperature) !== null) feels.dataset.c = String(current.apparent_temperature);
    const highEl = $('#hero-high');
    if (highEl && num(high) !== null) highEl.dataset.c = String(high);
    const lowEl = $('#hero-low');
    if (lowEl && num(low) !== null) lowEl.dataset.c = String(low);

    const icon = $('#hero-condition-icon');
    if (icon) {
      icon.textContent = info.icon;
      icon.style.color = info.color;
    }
    const condition = $('#hero-condition-text');
    if (condition) condition.textContent = info.label;

    const insight = $('#hero-insight');
    if (insight) insight.innerHTML = buildInsight(forecast, index, info);

    const precipitation = num(current.precipitation, num(hourly.precipitation?.[index], 0));
    const precipEl = $('#hero-precip');
    if (precipEl) precipEl.textContent = `${(precipitation ?? 0).toFixed(1)} mm/jam`;

    const art = $('#hero-art');
    if (art) art.setAttribute('aria-label', `Ilustrasi cuaca ${info.label.toLowerCase()}`);

    const sun = $('#sun-group');
    const moon = $('#moon-group');
    const rain = $('#rain-group');
    const cloud = $('#cloud-shape');
    const glow = $('#sun-glow');
    const dark = Number(current.is_day) === 0;
    if (sun) sun.classList.toggle('hidden', dark);
    if (moon) moon.classList.toggle('hidden', !dark);
    if (rain) rain.classList.toggle('hidden', !info.rain);
    if (cloud) cloud.style.opacity = String(info.rain ? 1 : Math.max(0.45, (num(current.cloud_cover, 50) ?? 50) / 100));
    if (glow) glow.style.opacity = dark ? '0' : (Number(current.weather_code) <= 2 ? '1' : '0.35');
  }

  function buildInsight(forecast, index, info) {
    const current = forecast.current || {};
    const hourly = forecast.hourly || {};
    const probabilities = Array.isArray(hourly.precipitation_probability)
      ? hourly.precipitation_probability.slice(index, index + 12).map((value) => num(value, 0) ?? 0)
      : [];
    let maxProbability = 0;
    let maxOffset = 0;
    probabilities.forEach((value, offset) => {
      if (value > maxProbability) {
        maxProbability = value;
        maxOffset = offset;
      }
    });
    const peakTime = clockFromISO(hourly.time?.[index + maxOffset]);
    const locationName = esc(state.location.name);
    const feels = num(current.apparent_temperature);
    const feelsText = feels === null ? '' : ` dengan suhu terasa ${formatTemp(feels, { suffix: true })}`;

    if (maxProbability >= 55) {
      const period = maxOffset === 0
        ? 'saat ini'
        : `hingga pukul <strong class="text-primary">${peakTime} ${tzShort()}</strong>`;
      return `Peluang presipitasi tinggi ${period}. Siapkan payung atau jas hujan jika bepergian di sekitar ${locationName}.`;
    }
    if (info.rain && maxOffset === 0) {
      return `Hujan ${info.label.toLowerCase()} masih terpantau di ${locationName}${feelsText}. Peluang presipitasi ${Math.round(maxProbability)}% pada jam ini.`;
    }
    if (maxProbability >= 30) {
      return `Potensi hujan ringan diperkirakan sekitar pukul <strong class="text-primary">${peakTime} ${tzShort()}</strong>. Aktivitas luar ruang masih nyaman dengan persiapan ringan.`;
    }
    if (info.rain) {
      return `Hujan ${info.label.toLowerCase()} masih terpantau di ${locationName}${feelsText}. Perhatikan genangan di jalan yang lebih rendah.`;
    }
    return `Langit ${info.label.toLowerCase()} di ${locationName}${feelsText}. Peluang hujan rendah, sekitar <strong class="text-primary">${Math.round(maxProbability)}%</strong>, dalam 12 jam ke depan.`;
  }

  /* ---------- Atmospheric metrics ---------- */
  function renderMetrics(forecast) {
    const current = forecast.current || {};
    const hourly = forecast.hourly || {};
    const daily = forecast.daily || {};
    const index = currentHourIndex(hourly, current.time);

    const humidity = num(current.relative_humidity_2m, 0) ?? 0;
    const humidityValue = $('#humidity-value');
    if (humidityValue) humidityValue.textContent = `${Math.round(humidity)}%`;
    const humidityTag = $('#humidity-tag');
    if (humidityTag) {
      humidityTag.textContent = humidity >= 80 ? 'Sangat Tinggi' : humidity >= 60 ? 'Tinggi' : humidity >= 40 ? 'Sedang' : 'Rendah';
    }
    const humidityBar = $('#humidity-bar');
    if (humidityBar) humidityBar.style.width = `${clamp(humidity, 0, 100)}%`;
    const humidityTrack = $('#humidity-track');
    if (humidityTrack) humidityTrack.setAttribute('aria-label', `Kelembapan ${Math.round(humidity)} persen`);

    const dewPoint = num(hourly.dew_point_2m?.[index]);
    const dewEl = $('#dew-point');
    if (dewEl && dewPoint !== null) {
      dewEl.dataset.c = String(dewPoint);
      dewEl.dataset.decimals = '1';
      dewEl.setAttribute('data-suffix', '');
    }

    const windSpeed = num(current.wind_speed_10m, 0) ?? 0;
    const windValue = $('#wind-value');
    if (windValue) windValue.textContent = String(Math.round(windSpeed));
    const direction = ((num(current.wind_direction_10m, 0) ?? 0) + 360) % 360;
    const cardinals = [
      ['Utara', 'N'], ['Timur Laut', 'NE'], ['Timur', 'E'], ['Tenggara', 'SE'],
      ['Selatan', 'S'], ['Barat Daya', 'SW'], ['Barat', 'W'], ['Barat Laut', 'NW']
    ];
    const cardinal = cardinals[Math.round(direction / 45) % 8];
    const windArrow = $('#wind-arrow');
    if (windArrow) windArrow.style.transform = `rotate(${direction}deg)`;
    const windDir = $('#wind-dir');
    if (windDir) windDir.textContent = `${cardinal[0]} (${cardinal[1]} ${Math.round(direction)}°)`;
    const gust = num(current.wind_gusts_10m);
    const gustEl = $('#wind-gust');
    if (gustEl) gustEl.textContent = gust === null ? '— km/jam' : `${gust.toFixed(1)} km/jam`;

    const pressure = num(current.pressure_msl);
    const pressureValue = $('#pressure-value');
    if (pressureValue) pressureValue.textContent = pressure === null ? '—' : String(Math.round(pressure));
    const pressureTag = $('#pressure-tag');
    const pressureDot = $('#pressure-dot');
    let pressureLabel = 'Menunggu data';
    let pressureColor = '#7dd3fc';
    if (pressure !== null) {
      if (pressure < 1000) {
        pressureLabel = 'Di Bawah Normal';
        pressureColor = '#fbbf24';
      } else if (pressure > 1025) {
        pressureLabel = 'Di Atas Normal';
        pressureColor = '#fb923c';
      } else {
        pressureLabel = 'Barometrik Normal';
        pressureColor = '#4ade80';
      }
    }
    if (pressureTag) pressureTag.textContent = pressureLabel;
    if (pressureDot) pressureDot.style.backgroundColor = pressureColor;
    const surfacePressure = num(current.surface_pressure);
    const surfaceEl = $('#surface-pressure');
    if (surfaceEl) surfaceEl.textContent = surfacePressure === null ? '— hPa' : `${surfacePressure.toFixed(1)} hPa`;

    const visibilityMeters = num(hourly.visibility?.[index]);
    const visibilityValue = $('#visibility-value');
    const visibilityTag = $('#visibility-tag');
    const visibilityIcon = $('#visibility-icon');
    const visibilityNote = $('#visibility-note');
    if (visibilityMeters === null) {
      if (visibilityValue) visibilityValue.textContent = '—';
      if (visibilityTag) visibilityTag.textContent = 'Tidak tersedia';
    } else {
      const km = visibilityMeters / 1000;
      if (visibilityValue) visibilityValue.textContent = km >= 10 ? km.toFixed(0) : km.toFixed(1);
      let label = 'Buruk';
      let color = '#ff6b6b';
      let icon = 'warning';
      let note = 'Batasi aktivitas luar ruang dan berkendara dengan hati-hati.';
      if (km >= 10) {
        label = 'Sangat Baik';
        color = '#7dd3fc';
        icon = 'check_circle';
        note = 'Tidak ada hambatan pandang signifikan.';
      } else if (km >= 5) {
        label = 'Baik';
        color = '#7dd3fc';
        icon = 'check_circle';
        note = 'Jarak pandang memadai untuk berkendara.';
      } else if (km >= 2) {
        label = 'Sedang';
        color = '#fbbf24';
        icon = 'visibility';
        note = 'Kabut tipis mungkin terlihat di beberapa titik.';
      }
      if (visibilityTag) {
        visibilityTag.textContent = label;
        visibilityTag.style.color = color;
      }
      if (visibilityIcon) {
        visibilityIcon.textContent = icon;
        visibilityIcon.style.color = color;
      }
      if (visibilityNote) visibilityNote.textContent = note;
    }

    const uv = num(hourly.uv_index?.[index], num(daily.uv_index_max?.[0]));
    const uvValue = $('#uv-value');
    const uvTag = $('#uv-tag');
    const uvBar = $('#uv-bar');
    const uvNote = $('#uv-note');
    if (uv === null) {
      if (uvValue) uvValue.textContent = '—';
      if (uvTag) uvTag.textContent = 'Tidak tersedia';
    } else {
      if (uvValue) uvValue.textContent = uv >= 10 ? String(Math.round(uv)) : uv.toFixed(1).replace('.0', '');
      let label = 'Rendah';
      let color = '#4ade80';
      let note = 'Aman untuk beraktivitas di luar ruang.';
      if (uv >= 11) {
        label = 'Ekstrem';
        color = '#fb7185';
        note = 'Hindari paparan matahari pada siang hari.';
      } else if (uv >= 8) {
        label = 'Sangat Tinggi';
        color = '#f87171';
        note = 'Gunakan tabir surya, topi, dan pelindung mata.';
      } else if (uv >= 6) {
        label = 'Tinggi';
        color = '#fb923c';
        note = 'Lindungi kulit dan mata saat berada di luar.';
      } else if (uv >= 3) {
        label = 'Sedang';
        color = '#fbbf24';
        note = 'Tabir surya dianjurkan bila beraktivitas lama.';
      }
      if (uvTag) {
        uvTag.textContent = label;
        uvTag.style.color = color;
      }
      if (uvBar) uvBar.style.width = `${clamp((uv / 12) * 100, 0, 100)}%`;
      if (uvNote) uvNote.textContent = note;
      if (uvBar && uvBar.parentElement) {
        uvBar.parentElement.setAttribute('aria-label', `Indeks UV ${uv.toFixed(1)} dari 12`);
      }
    }

    const sunrise = daily.sunrise?.[0];
    const sunset = daily.sunset?.[0];
    const sunriseEl = $('#sunrise-time');
    const sunsetEl = $('#sunset-time');
    if (sunriseEl) sunriseEl.textContent = sunrise ? `${clockFromISO(sunrise)} ${tzShort()}` : '—';
    if (sunsetEl) sunsetEl.textContent = sunset ? `${clockFromISO(sunset)} ${tzShort()}` : '—';

    const sunPosition = $('#sun-position');
    if (sunPosition) {
      const nowMinutes = minutesFromISO(current.time);
      const riseMinutes = minutesFromISO(sunrise);
      const setMinutes = minutesFromISO(sunset);
      if (nowMinutes !== null && riseMinutes !== null && setMinutes !== null
        && setMinutes > riseMinutes && nowMinutes >= riseMinutes && nowMinutes <= setMinutes) {
        const progress = (nowMinutes - riseMinutes) / (setMinutes - riseMinutes);
        sunPosition.setAttribute('cx', (20 + 160 * progress).toFixed(1));
        sunPosition.setAttribute('cy', (50 * (1 - 2 * progress + 2 * progress * progress)).toFixed(1));
        sunPosition.style.visibility = 'visible';
      } else {
        sunPosition.style.visibility = 'hidden';
      }
    }

    const sensor = $('#sensor-label');
    if (sensor) {
      const elevation = num(forecast.elevation, state.location.elevation);
      sensor.textContent = `Open-Meteo • ${elevation === null ? 'Data langsung' : `${Math.round(elevation)} mdpl`} • Data ${clockFromISO(current.time)} ${tzShort()}`;
    }
  }

  /* ---------- Air quality ---------- */
  function renderAqi(air) {
    const text = $('#aqi-text');
    const dot = $('#aqi-dot');
    const chip = $('#aqi-chip');
    const icon = chip?.querySelector('.material-symbols-outlined');
    const current = air && air.current;
    const value = num(current && current.us_aqi, num(current && current.european_aqi));

    if (value === null) {
      if (text) text.textContent = 'AQI tidak tersedia';
      if (dot) dot.style.backgroundColor = '#a0b4c4';
      if (chip) chip.title = 'Indeks kualitas udara tidak tersedia';
      return;
    }

    const level = aqiLevel(value);
    if (text) text.textContent = `AQI ${Math.round(value)} (${level.short})`;
    if (dot) dot.style.backgroundColor = level.color;
    if (icon) icon.style.color = level.color;
    if (chip) {
      const pm25 = num(current.pm2_5);
      const pm10 = num(current.pm10);
      const details = [];
      if (pm25 !== null) details.push(`PM2.5 ${pm25.toFixed(1)} μg/m³`);
      if (pm10 !== null) details.push(`PM10 ${pm10.toFixed(1)} μg/m³`);
      chip.title = `US AQI ${Math.round(value)} • ${level.full}${details.length ? ` • ${details.join(' • ')}` : ''}`;
    }
  }

  /* ---------- Hourly strip ---------- */
  function renderHourly(forecast) {
    const container = $('#hourly-container');
    if (!container) return;
    const hourly = forecast.hourly || {};
    if (!Array.isArray(hourly.time) || !hourly.time.length) {
      container.innerHTML = '<div class="shrink-0 w-56 p-4 rounded-xl bg-surface-container/60 text-xs text-on-surface-variant">Prakiraan per jam belum tersedia.</div>';
      return;
    }

    const start = currentHourIndex(hourly, forecast.current?.time);
    const count = Math.min(24, hourly.time.length - start);
    const cards = [];

    for (let offset = 0; offset < count; offset += 1) {
      const index = start + offset;
      const info = weatherInfo(hourly.weather_code?.[index], hourly.is_day?.[index] ?? 1);
      const temp = num(hourly.temperature_2m?.[index]);
      const pop = Math.round(num(hourly.precipitation_probability?.[index], 0));
      const time = clockFromISO(hourly.time[index]);
      const now = offset === 0;
      const popClass = pop >= 60
        ? 'bg-primary-container text-on-primary-container font-semibold'
        : pop >= 30
          ? 'bg-surface-container-highest text-secondary font-medium'
          : 'bg-surface-container-highest text-on-surface-variant font-medium';
      const tempAttr = temp === null ? '' : ` data-c="${temp}"`;

      cards.push(`<button type="button" class="hour-card shrink-0 w-24 p-3.5 rounded-xl ${now ? 'bg-surface-container-high/90 shadow-lg' : 'bg-surface-container/60 hover:bg-surface-container-high/60 backdrop-blur-md transition-all'} flex flex-col items-center gap-2 relative js-hour" data-time="${now ? 'Sekarang' : time}" data-temp="${temp === null ? '' : temp}" data-pop="${pop}" data-cond="${esc(info.label)}" aria-label="${now ? 'Sekarang' : `Pukul ${time}`}, ${esc(info.label)}, ${pop} persen peluang hujan">
        <span class="text-[11px] ${now ? 'font-semibold text-primary' : 'text-on-surface-variant'}">${now ? 'Sekarang' : time}</span>
        <span class="material-symbols-outlined text-[26px]" style="color:${info.color}" aria-hidden="true">${info.icon}</span>
        <span${tempAttr} class="text-base ${now ? 'font-bold' : 'font-semibold'} text-on-surface">${temp === null ? '—' : `${Math.round(temp)}°`}</span>
        <span class="px-2 py-0.5 rounded-full text-[10px] ${popClass} flex items-center gap-0.5">
          <span class="material-symbols-outlined text-[10px]" aria-hidden="true">water_drop</span> ${pop}%
        </span>
      </button>`);
    }

    container.innerHTML = cards.join('');
    renderTemps();
  }

  /* ---------- Seven day forecast ---------- */
  function parseDateParts(iso) {
    const parts = String(iso || '').split('T')[0].split('-').map(Number);
    if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) return null;
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  }

  function renderWeekly(forecast) {
    const list = $('#weekly-list');
    if (!list) return;
    const daily = forecast.daily || {};
    const times = Array.isArray(daily.time) ? daily.time : [];
    if (!times.length) {
      list.innerHTML = '<div class="py-3 px-2 text-xs text-on-surface-variant">Prakiraan tujuh hari belum tersedia.</div>';
      return;
    }

    const mins = times.map((_, index) => num(daily.temperature_2m_min?.[index], 0) ?? 0);
    const maxs = times.map((_, index) => num(daily.temperature_2m_max?.[index], 0) ?? 0);
    const weekMin = Math.min(...mins);
    const weekMax = Math.max(...maxs);
    const range = weekMax - weekMin || 1;

    const rows = times.map((date, index) => {
      const info = weatherInfo(daily.weather_code?.[index], 1);
      const shortLabel = shortWeatherLabel(daily.weather_code?.[index]);
      const min = mins[index];
      const max = maxs[index];
      const pop = Math.round(num(daily.precipitation_probability_max?.[index], 0));
      const total = num(daily.precipitation_sum?.[index], 0) ?? 0;
      const parsed = parseDateParts(date);
      const dayName = parsed ? WEEKDAYS[parsed.getUTCDay()] : String(date);
      const label = index === 0 ? 'Hari Ini' : dayName;
      const left = clamp(((min - weekMin) / range) * 100, 0, 100);
      const right = clamp(((weekMax - max) / range) * 100, 0, 100);
      const popClass = pop >= 60 ? 'text-primary' : pop >= 30 ? 'text-secondary' : 'text-on-surface-variant';
      const gradient = pop >= 60 ? 'from-secondary to-primary' : pop >= 30 ? 'from-secondary to-amber-300' : 'from-primary to-amber-300';

      return `<div class="grid grid-cols-[3rem_4.75rem_1fr_2rem] items-center gap-1.5 text-xs py-1.5 px-2 ${index === 0 ? 'bg-surface-container/70 rounded-lg' : 'hover:bg-surface-container/40 rounded-lg transition-colors'}" title="${esc(info.label)} • presipitasi ${total.toFixed(1)} mm">
        <span class="${index === 0 ? 'font-semibold text-primary' : 'font-medium text-on-surface'} whitespace-nowrap">${label}</span>
        <div class="flex items-center gap-1.5 min-w-0">
          <span class="material-symbols-outlined text-[18px]" style="color:${info.color}" aria-hidden="true">${info.icon}</span>
          <span class="text-on-surface-variant truncate">${shortLabel}</span>
        </div>
        <div class="flex items-center gap-1.5 min-w-0">
          <span class="text-on-surface-variant text-[11px] w-6 text-right shrink-0" data-c="${min}">${Math.round(min)}°</span>
          <div class="w-full bg-surface-container-high h-1.5 rounded-full relative overflow-hidden min-w-6">
            <div class="absolute h-full bg-gradient-to-r ${gradient} rounded-full" style="left:${left.toFixed(1)}%; right:${right.toFixed(1)}%;"></div>
          </div>
          <span class="text-on-surface font-semibold text-[11px] w-6 shrink-0" data-c="${max}">${Math.round(max)}°</span>
        </div>
        <span class="text-[11px] font-medium ${popClass} text-right">${pop}%</span>
      </div>`;
    }).join('');

    list.innerHTML = rows;

    const total = (daily.precipitation_sum || []).reduce((sum, value) => sum + (num(value, 0) ?? 0), 0);
    let level = 'Kering';
    if (total >= 100) level = 'Sangat Tinggi';
    else if (total >= 50) level = 'Tinggi';
    else if (total >= 10) level = 'Sedang';
    else if (total > 0) level = 'Rendah';
    const stat = $('#weekly-stat');
    if (stat) stat.textContent = `${level} • ${total.toFixed(total >= 10 ? 0 : 1)} mm`;

    renderTemps();
  }

  /* ---------- Temperature / precipitation chart ---------- */
  function smoothPath(points) {
    if (!points.length) return '';
    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let index = 0; index < points.length - 1; index += 1) {
      const p0 = points[index - 1] || points[index];
      const p1 = points[index];
      const p2 = points[index + 1];
      const p3 = points[index + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  }

  function renderChart(forecast) {
    const chart = $('#chart-svg');
    if (!chart) return;
    const hourly = forecast.hourly || {};
    if (!Array.isArray(hourly.time) || hourly.time.length < 2) {
      chart.innerHTML = '<text x="325" y="120" text-anchor="middle" class="chart-axis-label" font-family="Inter" font-size="12">Data grafik belum tersedia</text>';
      return;
    }

    const start = currentHourIndex(hourly, forecast.current?.time);
    const count = Math.min(24, hourly.time.length - start);
    const temps = [];
    const precip = [];
    for (let offset = 0; offset < count; offset += 1) {
      temps.push(num(hourly.temperature_2m?.[start + offset], 0) ?? 0);
      precip.push(num(hourly.precipitation?.[start + offset], 0) ?? 0);
    }
    if (temps.length < 2) {
      chart.innerHTML = '<text x="325" y="120" text-anchor="middle" class="chart-axis-label" font-family="Inter" font-size="12">Data grafik belum tersedia</text>';
      return;
    }

    let minTemp = Math.floor(Math.min(...temps)) - 1;
    let maxTemp = Math.ceil(Math.max(...temps)) + 1;
    if (maxTemp - minTemp < 4) {
      const middle = (maxTemp + minTemp) / 2;
      minTemp = middle - 2;
      maxTemp = middle + 2;
    }
    const tempRange = maxTemp - minTemp;
    const left = 50;
    const right = 610;
    const top = 40;
    const bottom = 190;
    const step = (right - left) / (count - 1);
    const xFor = (index) => left + step * index;
    const yFor = (value) => bottom - ((value - minTemp) / tempRange) * (bottom - top);

    const points = temps.map((value, index) => ({ x: xFor(index), y: yFor(value) }));
    const linePath = smoothPath(points);
    const areaPath = `${linePath} L ${xFor(count - 1).toFixed(1)} ${bottom} L ${left} ${bottom} Z`;
    const maxPrecip = Math.max(...precip, 0.1);

    const bars = precip.map((value, index) => {
      const height = (value / maxPrecip) * 80;
      if (height <= 0.2) return '';
      const x = xFor(index) - 5;
      const y = bottom - height;
      const opacity = 0.2 + (value / maxPrecip) * 0.65;
      return `<rect class="chart-bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="10" height="${height.toFixed(1)}" rx="3" opacity="${opacity.toFixed(2)}"></rect>`;
    }).join('');

    const gridLines = [0, 1, 2, 3].map((stepIndex) => {
      const y = top + stepIndex * 50;
      return `<line x1="30" x2="620" y1="${y}" y2="${y}" stroke-width="1"></line>`;
    }).join('');

    const yLabels = [0, 1, 2, 3].map((stepIndex) => {
      const y = top + stepIndex * 50;
      const value = maxTemp - (stepIndex / 3) * tempRange;
      return `<text x="5" y="${y + 4}" font-family="Inter" font-size="10" data-c="${round(value, 1)}" data-suffix="C">${Math.round(value)}°C</text>`;
    }).join('');

    const labelIndexes = [0, 4, 8, 12, 16, 20, count - 1]
      .filter((value, index, array) => value >= 0 && value < count && array.indexOf(value) === index);
    const xLabels = labelIndexes.map((index) => `<text x="${xFor(index).toFixed(1)}" y="215" font-family="Inter" font-size="10" text-anchor="middle">${clockFromISO(hourly.time[start + index])}</text>`).join('');

    const dots = points.map((point, index) => {
      const showLabel = index % 4 === 0 || index === points.length - 1;
      const value = temps[index];
      return `<circle class="chart-dot" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${showLabel ? 4.5 : 3}" stroke-width="2"></circle>
        ${showLabel ? `<text class="chart-value-label" x="${point.x.toFixed(1)}" y="${(point.y - 9).toFixed(1)}" font-family="Inter" font-size="10" font-weight="600" text-anchor="middle" data-c="${round(value, 1)}">${Math.round(value)}°</text>` : ''}`;
    }).join('');

    chart.innerHTML = `<defs>
      <linearGradient id="areaGradient" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="180">
        <stop stop-color="var(--chart-line)" stop-opacity="0.3"></stop>
        <stop offset="1" stop-color="var(--chart-line)" stop-opacity="0"></stop>
      </linearGradient>
    </defs>
    <g class="chart-grid-line">${gridLines}</g>
    <g class="chart-bar" fill-opacity="0.85">${bars}</g>
    <path d="${areaPath}" fill="url(#areaGradient)"></path>
    <path d="${linePath}" class="chart-line drop-shadow-[0_0_10px_rgba(125,211,252,0.5)]" fill="none" stroke-linecap="round" stroke-width="3"></path>
    <g>${dots}</g>
    <g class="chart-axis-label" font-family="Inter" font-size="10">${yLabels}</g>
    <g class="chart-axis-label" font-family="Inter" font-size="10" text-anchor="middle">${xLabels}</g>`;

    chart.setAttribute('aria-label', `Grafik suhu dan curah hujan per jam dari pukul ${clockFromISO(hourly.time[start])} hingga ${clockFromISO(hourly.time[start + count - 1])}`);

    let peakValue = 0;
    let peakIndex = 0;
    precip.forEach((value, index) => {
      if (value > peakValue) {
        peakValue = value;
        peakIndex = index;
      }
    });
    const peak = $('#chart-peak');
    if (peak) {
      peak.textContent = peakValue >= 0.1
        ? `pukul ${clockFromISO(hourly.time[start + peakIndex])} ${tzShort()} (${peakValue.toFixed(1)} mm)`
        : 'tidak ada presipitasi signifikan dalam 24 jam';
    }
    const source = $('#chart-source');
    if (source) source.textContent = 'Open-Meteo • Model Best Match';

    renderTemps();
  }

  /* ---------- City cards ---------- */
  async function loadCitySummaries() {
    const cities = getCityList();
    if (!cities.length) return;
    const token = ++state.cityLoadToken;
    const params = new URLSearchParams({
      latitude: cities.map((city) => city.latitude).join(','),
      longitude: cities.map((city) => city.longitude).join(','),
      current: 'temperature_2m,weather_code,is_day',
      daily: 'temperature_2m_max,temperature_2m_min',
      timezone: 'auto',
      forecast_days: '1'
    });

    try {
      const data = await fetchJSON(`${API.forecast}?${params}`);
      if (token !== state.cityLoadToken) return;
      const responses = Array.isArray(data) ? data : [data];
      state.citySummaries = cities.map((city, index) => ({ ...city, summary: responses[index] || null }));
      renderCityCards();
    } catch (error) {
      console.warn('Ringkasan kota gagal dimuat:', error);
      if (token !== state.cityLoadToken) return;
      if (!state.citySummaries.length) {
        state.citySummaries = cities.map((city) => ({ ...city, summary: null }));
        renderCityCards();
      }
    }
  }

  function renderCityCards() {
    const grid = $('#city-grid');
    if (!grid) return;
    if (!state.citySummaries.length) {
      grid.innerHTML = '<div class="p-4 rounded-xl bg-surface-container/60 text-xs text-on-surface-variant">Memuat ringkasan kota…</div>';
      return;
    }

    grid.innerHTML = state.citySummaries.map((city) => {
      const summary = city.summary;
      const current = summary && summary.current;
      const daily = summary && summary.daily;
      const temp = num(current && current.temperature_2m);
      const code = current && current.weather_code;
      const info = code !== undefined && code !== null ? weatherInfo(code, current.is_day) : null;
      const max = num(daily && daily.temperature_2m_max && daily.temperature_2m_max[0]);
      const min = num(daily && daily.temperature_2m_min && daily.temperature_2m_min[0]);
      const active = isActiveLocation(city);
      const favorite = state.favorites.includes(city.name);
      const tempText = temp === null ? '—' : `${Math.round(temp)}°`;
      const maxText = max === null ? '—' : `${Math.round(max)}°`;
      const minText = min === null ? '—' : `${Math.round(min)}°`;
      const tempAttr = temp === null ? '' : ` data-c="${temp}"`;
      const maxAttr = max === null ? '' : ` data-c="${max}"`;
      const minAttr = min === null ? '' : ` data-c="${min}"`;
      const label = info ? info.label : 'Tidak tersedia';
      const icon = info
        ? `<span class="material-symbols-outlined text-[28px]" style="color:${info.color}" aria-hidden="true">${info.icon}</span>`
        : '<span class="material-symbols-outlined text-on-surface-variant/40 text-[28px]" aria-hidden="true">cloud_off</span>';
      const cardClasses = active
        ? 'bg-surface-container-high/90 shadow-xl'
        : 'bg-surface-container/60 hover:bg-surface-container-high/60 backdrop-blur-xl shadow-md';
      const tempClasses = active ? 'text-primary font-extrabold' : 'text-on-surface font-bold';
      const footerClasses = active ? 'text-secondary' : 'text-on-surface-variant';

      return `<article class="city-card group cursor-pointer p-4 rounded-xl ${cardClasses} flex flex-col justify-between relative transition-all min-w-0" tabindex="0" role="button" data-city="${esc(city.name)}" data-cond="${esc(label)}" data-temp="${temp === null ? '' : temp}" data-lat="${city.latitude}" data-lon="${city.longitude}" aria-label="${esc(city.name)}, ${temp === null ? 'data suhu tidak tersedia' : `${Math.round(temp)} derajat`}, ${esc(label)}">
        <div class="flex items-center justify-between gap-2 mb-2">
          <div class="flex items-center gap-1 min-w-0">
            <span data-role="dot" class="w-1.5 h-1.5 rounded-full bg-primary shrink-0 ${active ? '' : 'hidden'}" aria-hidden="true"></span>
            <span class="text-xs font-bold text-on-surface truncate" title="${esc(city.name)}">${esc(city.name)}</span>
          </div>
          <button type="button" class="js-star star shrink-0 ${favorite ? 'is-fav' : ''}" data-city="${esc(city.name)}" aria-label="${favorite ? 'Hapus' : 'Tandai'} ${esc(city.name)} ${favorite ? 'dari' : 'sebagai'} favorit" aria-pressed="${favorite}">
            <span class="material-symbols-outlined text-[16px]" aria-hidden="true">star</span>
          </button>
        </div>
        <div class="flex items-center justify-between my-2 gap-2">
          <span data-role="temp" class="text-3xl ${tempClasses} font-headline"${tempAttr}>${tempText}</span>
          ${icon}
        </div>
        <div class="min-w-0">
          <span class="text-[11px] font-medium text-on-surface-variant block truncate">${esc(label)}</span>
          <span class="text-[10px] ${footerClasses}">T: <span${maxAttr}>${maxText}</span> • R: <span${minAttr}>${minText}</span></span>
        </div>
      </article>`;
    }).join('');

    renderTemps();
    updateActiveCityCards();
    filterCityCards(state.searchQuery);
  }

  function updateActiveCityCards() {
    $$('.city-card').forEach((card) => {
      const active = sameCoords(
        { latitude: Number(card.dataset.lat), longitude: Number(card.dataset.lon) },
        state.location
      );
      card.classList.toggle('bg-surface-container-high/90', active);
      card.classList.toggle('shadow-xl', active);
      card.classList.toggle('bg-surface-container/60', !active);
      card.classList.toggle('hover:bg-surface-container-high/60', !active);
      card.classList.toggle('backdrop-blur-xl', !active);
      card.classList.toggle('shadow-md', !active);

      const dot = card.querySelector('[data-role="dot"]');
      if (dot) dot.classList.toggle('hidden', !active);

      const temp = card.querySelector('[data-role="temp"]');
      if (temp) {
        const hasData = temp.hasAttribute('data-c');
        temp.classList.toggle('text-primary', active);
        temp.classList.toggle('font-extrabold', active);
        temp.classList.toggle('text-on-surface', !active && hasData);
        temp.classList.toggle('text-on-surface-variant', !active && !hasData);
        temp.classList.toggle('font-bold', !active);
      }
    });
  }

  function selectCityCard(card) {
    const latitude = Number(card.dataset.lat);
    const longitude = Number(card.dataset.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    const city = getCityList().find((item) => (
      Math.abs(item.latitude - latitude) < 0.0001 && Math.abs(item.longitude - longitude) < 0.0001
    ));
    if (!city) return;
    setLocation(city, 'manual');
    closeSearchResults();
    updateActiveCityCards();
    loadWeather();
    $('#prakiraan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast(`Memuat cuaca ${city.name}…`, 'location_city');
  }

  function toggleFavorite(name, button) {
    if (!name) return;
    const exists = state.favorites.includes(name);
    const next = exists
      ? state.favorites.filter((item) => item !== name)
      : [...state.favorites, name];
    state.favorites = next;
    writeJSON('langit-favorites', next);
    const favorite = !exists;
    button.classList.toggle('is-fav', favorite);
    button.setAttribute('aria-pressed', String(favorite));
    button.setAttribute('aria-label', `${favorite ? 'Hapus' : 'Tandai'} ${name} ${favorite ? 'dari' : 'sebagai'} favorit`);
    showToast(`${name} ${favorite ? 'ditambahkan ke' : 'dihapus dari'} favorit`, 'star');
  }

  const cityGrid = $('#city-grid');
  cityGrid?.addEventListener('click', (event) => {
    const star = event.target.closest('.js-star');
    if (star) {
      toggleFavorite(star.dataset.city || '', star);
      return;
    }
    const card = event.target.closest('.city-card');
    if (card) selectCityCard(card);
  });

  cityGrid?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (event.target.closest('.js-star')) return;
    const card = event.target.closest('.city-card');
    if (!card) return;
    event.preventDefault();
    selectCityCard(card);
  });

  /* ---------- Hourly controls ---------- */
  const hourlyContainer = $('#hourly-container');
  $('#hourly-prev')?.addEventListener('click', () => {
    hourlyContainer?.scrollBy({ left: -180, behavior: 'smooth' });
  });
  $('#hourly-next')?.addEventListener('click', () => {
    hourlyContainer?.scrollBy({ left: 180, behavior: 'smooth' });
  });
  hourlyContainer?.addEventListener('click', (event) => {
    const slot = event.target.closest('.js-hour');
    if (!slot) return;
    const temp = num(slot.dataset.temp);
    const label = temp === null ? '' : formatTemp(temp, { suffix: true });
    showToast(`${slot.dataset.time} • ${slot.dataset.cond} • ${label}`, 'schedule');
  });

  /* ---------- Add city / refresh / misc ---------- */
  $('#add-city')?.addEventListener('click', () => {
    const isMobile = window.matchMedia('(max-width: 639px)').matches;
    const input = isMobile ? $('#search-mobile') : $('#search-input');
    if (isMobile) {
      openMobileMenu();
      setTimeout(() => input?.focus(), 80);
    } else {
      input?.focus();
      input?.select();
    }
    showToast('Ketik nama kota, lalu pilih hasil pencarian untuk menambahkannya.', 'add_location_alt');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  $('#refresh-btn')?.addEventListener('click', () => {
    if (state.loading) return;
    loadWeather({ notify: true });
  });

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMobileMenu();
      closeSearchResults();
    }
  });

  /* ---------- Startup ---------- */
  setLocation(state.location, state.locationSource);
  applyUnit(state.unit, false);
  updateActiveCityCards();
  renderLocationChip();
  updateClock();

  if (state.locationSource === 'auto') {
    if (!state.hasSavedLocation) {
      const placeholder = $('#hero-city-name');
      if (placeholder) placeholder.textContent = 'Mendeteksi lokasi…';
      const region = $('#hero-region');
      if (region) region.textContent = '';
      const status = $('#hero-status');
      if (status) status.textContent = 'Deteksi';
      setLiveStatus('Mendeteksi lokasi Anda…', 'loading');
    }
    detectLocation({ notify: false });
  } else {
    loadWeather();
  }

  setInterval(updateClock, 30000);
  setInterval(() => {
    if (!document.hidden && !state.loading) loadWeather({ silent: true });
  }, 10 * 60 * 1000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) updateClock();
  });
})();
