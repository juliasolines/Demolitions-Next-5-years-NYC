// --- CONFIGURATION (using your provided values) ---
mapboxgl.accessToken = 'pk.eyJ1IjoianVsaWFzb2xpbmVzIiwiYSI6ImNtaGR0ZThmeTA2cXUyanB4NnpmazVhZTkifQ.1jlD2cD9KGg5FPVfq101CA'; 
const STYLE_URL = 'mapbox://styles/juliasolines/cmhdtj1n100dw01qqdab458t3'; 
const INITIAL_CENTER = [-73.98, 40.75]; // NYC Center
const INITIAL_ZOOM = 9.5;
// ---------------------

document.addEventListener('DOMContentLoaded', function() {
            const button = document.getElementById('backButton');
            if (button) {
                button.addEventListener('click', function() {
                    window.location.href = 'index.html';
                });
            }
        });

// Initialize Mapbox Map
const map = new mapboxgl.Map({
    style: STYLE_URL,
    container: 'map', 
    center: INITIAL_CENTER,
    zoom: INITIAL_ZOOM,
    attributionControl: false, 
});



// --- CRITICAL: All interaction logic is inside the map.on('load') event ---
map.on('load', () => {
    console.log('Mapbox style and data layers loaded. Attaching toggle handlers...');
    
    // --- DEBUGGING CODE ---
    const allLayers = map.getStyle().layers;
    const allLayerIds = allLayers.map(layer => layer.id);
    
    console.log("--- AVAILABLE LAYER IDS IN YOUR STYLE ---");
    console.log(allLayerIds);
    console.log("-----------------------------------------");
    console.log("Please ensure the 'data-layer-id' on your HTML buttons exactly matches one of these IDs.");
    // --- END DEBUGGING CODE ---

  document.querySelectorAll('.layer-toggle').forEach(button => {
                
                const layerId = button.getAttribute('data-layer-id');

                if (map.getLayer(layerId)) {
                    
                    // Set initial visibility (Start ON)
                    map.setLayoutProperty(layerId, 'visibility', 'visible');
                    
                    // --- 1. SET "ON" STYLES (Selected) ---
                    // Gray background, Black text
                    button.classList.add('bg-gray-300', 'text-gray-800'); 
                    button.classList.remove('bg-transparent', 'text-gray-500'); // Remove OFF styles

                    // Set up the click handler
                    button.onclick = function (e) {
                        e.preventDefault();
                        e.stopPropagation();

                        const visibility = map.getLayoutProperty(layerId, 'visibility') || 'visible';

                        if (visibility === 'visible') {
                         
                            map.setLayoutProperty(layerId, 'visibility', 'none');
                            
                            button.classList.add('bg-transparent', 'text-gray-500');
                            button.classList.remove('bg-gray-300', 'text-gray-800'); // Remove ON styles
                            
                        } else {
                      
                            map.setLayoutProperty(layerId, 'visibility', 'visible');
                            
                            button.classList.add('bg-gray-300', 'text-gray-800'); 
                            button.classList.remove('bg-transparent', 'text-gray-500'); // Remove OFF styles
                        }
                    };
                } else {
                    console.error(`Layer ID "${layerId}" not found in Mapbox style. Disabling button.`);
                    button.disabled = true;
                    button.classList.add('opacity-50', 'bg-red-500'); 
                }
            });
});
