// map_layer_toggle.js - Add satellite/OpenStreetMap toggle switch functionality
// This script adds a toggle button to switch between satellite and OpenStreetMap views
// and provides offline map functionality

// Wait for the document to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize map layers after a short delay to ensure map is initialized
    setTimeout(initMapLayers, 500);
});

// Global variables
let satelliteLayer = null;
let streetLayer = null;
let currentLayer = null;
let mapToggleControl = null;
let downloadControl = null;

/**
 * Initialize the map layers and toggle control
 */
function initMapLayers() {
    // Check if map is initialized
    if (!window.map) {
        console.error("Map not initialized yet. Cannot add layer toggle.");
        // Try again after a delay
        setTimeout(initMapLayers, 500);
        return;
    }

    try {
        // Create the satellite layer (default in the app)
        satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 19
        });

        // Create the street layer (OpenStreetMap)
        streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        });

        // Get the current base layer from the map
        currentLayer = satelliteLayer;
        
        // Create and add the toggle button
        createToggleButton();
        
        // Initialize offline functionality if available
        initOfflineSupport();
        
        console.log("Map layer toggle initialized successfully");
    } catch (error) {
        console.error("Error initializing map layers:", error);
    }
}

/**
 * Create and add the toggle button to the map
 */
function createToggleButton() {
    try {
        // Find the waypoint button to position our toggle next to it
        const waypointButton = document.querySelector('.leaflet-control-container .leaflet-top.leaflet-right');
        
        if (!waypointButton) {
            console.error("Could not find waypoint button container");
            return;
        }
        
        // Create a new control for our toggle
        mapToggleControl = L.control({position: 'topright'});
        
        mapToggleControl.onAdd = function(map) {
            const container = L.DomUtil.create('div', 'leaflet-control leaflet-bar map-layer-control');
            
            // Create the toggle switch HTML
            container.innerHTML = `
                <div style="background: white; padding: 5px; border-radius: 4px; margin-bottom: 10px;">
                    <span class="map-layer-toggle-label">Satellite</span>
                    <label class="map-layer-toggle">
                        <input type="checkbox" id="map-layer-toggle">
                        <span class="map-layer-toggle-slider"></span>
                    </label>
                    <span class="map-layer-toggle-label">Street</span>
                </div>
            `;
            
            // Prevent map click events from propagating through the control
            L.DomEvent.disableClickPropagation(container);
            
            // Add event listener to the toggle switch
            setTimeout(() => {
                const toggleSwitch = container.querySelector('#map-layer-toggle');
                if (toggleSwitch) {
                    toggleSwitch.addEventListener('change', toggleMapLayer);
                }
            }, 100);
            
            return container;
        };
        
        // Add the control to the map
        mapToggleControl.addTo(map);
        
    } catch (error) {
        console.error("Error creating toggle button:", error);
    }
}

/**
 * Toggle between satellite and street map layers
 */
function toggleMapLayer(event) {
    try {
        const isStreetMap = event.target.checked;
        
        // Remove current layer
        if (currentLayer) {
            map.removeLayer(currentLayer);
        }
        
        // Add the selected layer
        if (isStreetMap) {
            streetLayer.addTo(map);
            currentLayer = streetLayer;
        } else {
            satelliteLayer.addTo(map);
            currentLayer = satelliteLayer;
        }
        
        // If we have KML layers, make sure they stay on top
        if (window.kmlLayers && Array.isArray(window.kmlLayers)) {
            window.kmlLayers.forEach(layer => {
                if (layer && map.hasLayer(layer)) {
                    layer.bringToFront();
                }
            });
        }
        
    } catch (error) {
        console.error("Error toggling map layer:", error);
    }
}

/**
 * Initialize offline map support if the required libraries are available
 */
function initOfflineSupport() {
    try {
        // Check if the offline plugin is available
        if (L.tileLayer.offline) {
            // Create offline-enabled layers
            const offlineSatelliteLayer = L.tileLayer.offline(
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
                maxZoom: 19
            });
            
            const offlineStreetLayer = L.tileLayer.offline(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            });
            
            // Replace the regular layers with offline-enabled ones
            satelliteLayer = offlineSatelliteLayer;
            streetLayer = offlineStreetLayer;
            
            // Add the download control
            downloadControl = L.control.offlineMap(satelliteLayer, {
                position: 'topright',
                saveButtonHtml: 'Download Map',
                saveButtonTitle: 'Save current map view for offline use',
                removeButtonHtml: 'Clear Cache',
                removeButtonTitle: 'Clear the offline tile cache'
            }).addTo(map);
            
            console.log("Offline map support initialized");
        } else {
            console.warn("Leaflet.offline plugin not available. Offline functionality disabled.");
        }
    } catch (error) {
        console.error("Error initializing offline support:", error);
    }
}
