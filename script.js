// put api key in here
maptilersdk.config.apiKey = '1T1gYH5rUfJK0n4WJLBz'; 

const MAP_ID = '019af70b-bc53-7d37-9beb-fce986b24e05';
const CSV_PATH = 'landmark_5yr_demolitions.csv';

// UPDATED BOUNDS: Tightened to cut off more of New Jersey
// [West, South, East, North]
const NYC_BOUNDS = [-74.45, 40.49, -73.65, 40.92]; 

let mapInstance = null; // We need global access to the map for the animation
let isDrifting = false; // Flag to control the animation loop

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Map first so we have the instance
  initMap();
  // 2. Setup Overlay Logic
  setupOverlayInteractions();
});

// --- MAP LOGIC ---

function initMap() {
  mapInstance = new maptilersdk.Map({
    container: 'map',
    style: MAP_ID,
    center: [-73.93, 40.73], // [Lng, Lat]
    zoom: 11,
    maxBounds: NYC_BOUNDS,
    minZoom: 10
  });

  mapInstance.on('load', () => {
    console.log("Map style loaded. Fetching CSV...");
    loadCSVData(mapInstance);

    // START the drifting animation immediately because overlay is visible on load
    startIdleDrift(); 
  });
}

function loadCSVData(map) {
  Papa.parse(CSV_PATH, {
    download: true,
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: (results) => {
      console.log(`CSV Loaded: ${results.data.length} rows.`);
      addDemolitionsLayer(map, results.data);
    },
    error: (err) => {
      console.error("CSV Error:", err);
      alert("Error loading CSV file. Check console for details.");
    }
  });
}

function addDemolitionsLayer(map, rows) {
  const features = [];
  rows.forEach((row, index) => {
    const lat = row.latitude;
    const lon = row.longitude;

    if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lon, lat] },
        properties: {
          id: index,
          address: row.address || 'Unknown Address',
          borough: row.borough || '',
          // year: row.prediction_for_year || 'N/A'
        }
      });
    }
  });

  if (features.length === 0) return;

  map.addSource('demolition_points', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: features }
  });

  map.addLayer({
    id: 'demolitions-circles',
    type: 'circle',
    source: 'demolition_points',
    paint: {
      'circle-radius': 6,
      'circle-color': '#222222',
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1.5,
      'circle-opacity': 0.9
    }
  });

  // Hover Interaction (Popup)
  const popup = new maptilersdk.Popup({
    closeButton: false,
    closeOnClick: false
  });

  map.on('mouseenter', 'demolitions-circles', (e) => {
    // Stop drifting if user tries to hover while it's moving (edge case)
    if (isDrifting) stopIdleDrift();

    map.getCanvas().style.cursor = 'pointer';
    const coordinates = e.features[0].geometry.coordinates.slice();
    const props = e.features[0].properties;

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    popup.setLngLat(coordinates)
      .setHTML(`
        <div style="font-family: 'Geo', sans-serif; padding: 5px; color: #333;">
          <h3 style="margin:0; font-size:16px;">${props.address}</h3>
          <p style="margin:4px 0 0; font-size:14px;">
            ${props.borough}<br>
          </p>
        </div>
      `)
      .addTo(map);
  });
            // <span style="color:#666;">Predicted: ${props.year}</span>

  map.on('mouseleave', 'demolitions-circles', () => {
    map.getCanvas().style.cursor = '';
    popup.remove();
  });
}


// --- OVERLAY & IDLE TIMER LOGIC ---

let idleTimeout;
const INACTIVITY_LIMIT = 10000; // 30 seconds

function setupOverlayInteractions() {
  const overlay = document.getElementById('mission-overlay');
  
  if (!overlay) return;

  // 1. Click to hide overlay and STOP animation
  overlay.addEventListener('click', () => {
    overlay.classList.add('hidden');
    stopIdleDrift(); // <--- STOP MOVING
    resetIdleTimer();
  });

  // 2. Setup listeners to detect user activity
  const events = ['mousemove', 'click', 'keypress', 'touchstart', 'scroll'];
  events.forEach(event => {
    window.addEventListener(event, resetIdleTimer);
  });
}

function resetIdleTimer() {
  const overlay = document.getElementById('mission-overlay');

  if (idleTimeout) clearTimeout(idleTimeout);

  // If overlay is visible, we are already idle/drifting
  if (!overlay.classList.contains('hidden')) return;

  // Start new timer
  idleTimeout = setTimeout(() => {
    overlay.classList.remove('hidden');
    startIdleDrift(); // <--- START MOVING AGAIN
  }, INACTIVITY_LIMIT);
}

// --- DRIFT ANIMATION FUNCTIONS ---

function startIdleDrift() {
  if (isDrifting || !mapInstance) return; // Already running or map not ready
  isDrifting = true;
  driftStep();
}

function stopIdleDrift() {
  isDrifting = false;
  if (mapInstance) {
    mapInstance.stop(); // Immediately stops the camera movement
  }
}

function driftStep() {
  if (!isDrifting || !mapInstance) return;

  // Generate a random target within the bounds
  // Bounds format: [West, South, East, North]
  const minLng = NYC_BOUNDS[0] + 0.05; // padding to stay safely inside
  const minLat = NYC_BOUNDS[1] + 0.05;
  const maxLng = NYC_BOUNDS[2] - 0.05;
  const maxLat = NYC_BOUNDS[3] - 0.05;

  const targetLng = Math.random() * (maxLng - minLng) + minLng;
  const targetLat = Math.random() * (maxLat - minLat) + minLat;

  // Ease to the new point very slowly
  mapInstance.easeTo({
    center: [targetLng, targetLat],
    zoom: 11,     // Maintain zoom
    duration: 25000, // 25 seconds = very slow drift
    easing: (t) => t, // Linear easing for constant speed
    essential: true // Ensures animation runs even if user hasn't interacted recently
  });

  // When this move finishes, trigger the next one IF we are still drifting
  mapInstance.once('moveend', () => {
    if (isDrifting) {
      driftStep();
    }
  });
}
