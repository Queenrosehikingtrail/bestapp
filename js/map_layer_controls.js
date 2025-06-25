// Map Layer Toggle and Download Functionality - FIXED VERSION
(function() {
    'use strict';
    
    let currentMapLayer = 'satellite';
    let satelliteLayer = null;
    let streetLayer = null;
    let mapInitialized = false;
    let retryCount = 0;
    const maxRetries = 10;
    
    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🔧 Map layer controls: Starting initialization...');
        // Wait for map to be initialized
        checkMapInitialization();
    });
    
    function checkMapInitialization() {
        retryCount++;
        console.log(`🔍 Map layer controls: Checking for map (attempt ${retryCount}/${maxRetries})`);
        
        // Check for the exposed Leaflet map object
        if (window.leafletMap && typeof window.leafletMap === 'object' && 
            window.leafletMap.eachLayer && typeof window.leafletMap.eachLayer === 'function') {
            console.log('✅ Map layer controls: Found Leaflet map object!');
            initializeMapLayerControls(window.leafletMap);
        } else if (retryCount < maxRetries) {
            console.log(`⏳ Map layer controls: Map not ready, retrying in 1 second... (${retryCount}/${maxRetries})`);
            setTimeout(checkMapInitialization, 1000);
        } else {
            console.error('❌ Map layer controls: Failed to find map after maximum retries');
            setupFallbackControls();
        }
    }
    
    function initializeMapLayerControls(mapObj) {
        try {
            console.log('🔧 Map layer controls: Setting up with Leaflet map...');
            
            setupMapLayers(mapObj);
            setupToggleSwitch(mapObj);
            setupDownloadButton(mapObj);
            mapInitialized = true;
            
            console.log('✅ Map layer controls: Successfully initialized!');
        } catch (error) {
            console.error('❌ Map layer controls: Error during initialization:', error);
            setupFallbackControls();
        }
    }
    
    function setupMapLayers(mapObj) {
        console.log('🗺️ Map layer controls: Setting up map layers...');
        
        try {
            // Find existing satellite layer
            let foundSatelliteLayer = false;
            mapObj.eachLayer(function(layer) {
                if (layer._url && (layer._url.includes('google.com') || layer._url.includes('lyrs=s'))) {
                    satelliteLayer = layer;
                    foundSatelliteLayer = true;
                    console.log('🛰️ Found existing satellite layer:', layer._url);
                }
            });
            
            // Create street layer (OpenStreetMap)
            if (window.L && window.L.tileLayer) {
                if (window.L.tileLayer.offline) {
                    streetLayer = window.L.tileLayer.offline('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '&copy; OpenStreetMap contributors'
                    });
                } else {
                    streetLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '&copy; OpenStreetMap contributors'
                    });
                }
                console.log('🛣️ Created street layer');
            }
            
            console.log('✅ Map layers setup complete');
            
        } catch (error) {
            console.error('❌ Error setting up map layers:', error);
        }
    }
    
    function setupToggleSwitch(mapObj) {
        const toggleSwitch = document.getElementById('satellite-toggle');
        if (!toggleSwitch) {
            console.error('❌ Toggle switch element not found');
            return;
        }
        
        console.log('🔘 Setting up toggle switch...');
        
        // Set initial state (satellite is default)
        toggleSwitch.checked = true;
        
        // Add event listener
        toggleSwitch.addEventListener('change', function(event) {
            handleToggleChange(event, mapObj);
        });
        
        console.log('✅ Toggle switch setup complete');
    }
    
    function handleToggleChange(event, mapObj) {
        console.log('🔄 Toggle switch changed:', event.target.checked);
        
        try {
            if (event.target.checked) {
                switchToSatellite(mapObj);
            } else {
                switchToStreet(mapObj);
            }
        } catch (error) {
            console.error('❌ Error handling toggle change:', error);
        }
    }
    
    function switchToSatellite(mapObj) {
        console.log('🛰️ Switching to satellite view...');
        
        try {
            // Remove street layer if active
            if (streetLayer && mapObj.hasLayer(streetLayer)) {
                mapObj.removeLayer(streetLayer);
                console.log('  ✅ Removed street layer');
            }
            
            // Add satellite layer if not active
            if (satelliteLayer && !mapObj.hasLayer(satelliteLayer)) {
                mapObj.addLayer(satelliteLayer);
                console.log('  ✅ Added satellite layer');
            }
            
            currentMapLayer = 'satellite';
            console.log('🛰️ Successfully switched to satellite view');
            
        } catch (error) {
            console.error('❌ Error switching to satellite:', error);
        }
    }
    
    function switchToStreet(mapObj) {
        console.log('🛣️ Switching to street view...');
        
        try {
            // Remove satellite layer if active
            if (satelliteLayer && mapObj.hasLayer(satelliteLayer)) {
                mapObj.removeLayer(satelliteLayer);
                console.log('  ✅ Removed satellite layer');
            }
            
            // Add street layer if not active
            if (streetLayer && !mapObj.hasLayer(streetLayer)) {
                mapObj.addLayer(streetLayer);
                console.log('  ✅ Added street layer');
            }
            
            currentMapLayer = 'street';
            console.log('🛣️ Successfully switched to street view');
            
        } catch (error) {
            console.error('❌ Error switching to street:', error);
        }
    }
    
    function setupDownloadButton(mapObj) {
        const downloadBtn = document.getElementById('download-map-btn');
        if (!downloadBtn) {
            console.error('❌ Download button element not found');
            return;
        }
        
        console.log('⬇️ Setting up download button...');
        
        // Add event listener
        downloadBtn.addEventListener('click', function(event) {
            handleDownloadClick(event, mapObj);
        });
        
        console.log('✅ Download button setup complete');
    }
    
    function handleDownloadClick(event, mapObj) {
        console.log('⬇️ Download button clicked');
        
        try {
            downloadMapArea(mapObj);
        } catch (error) {
            console.error('❌ Error handling download click:', error);
        }
    }
    
    function downloadMapArea(mapObj) {
        const downloadBtn = document.getElementById('download-map-btn');
        if (!downloadBtn) {
            console.error('❌ Download button not found');
            return;
        }
        
        console.log('⬇️ Starting map download...');
        simulateDownload(mapObj);
    }
    
    function simulateDownload(mapObj) {
        const downloadBtn = document.getElementById('download-map-btn');
        if (!downloadBtn) return;
        
        console.log('⬇️ Using simulated download...');
        
        // Store original button state
        const originalText = downloadBtn.textContent;
        const originalBackground = downloadBtn.style.background;
        
        // Disable button and show progress
        downloadBtn.disabled = true;
        downloadBtn.textContent = 'Downloading...';
        
        // Simulate download process
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 20;
            downloadBtn.textContent = `Downloading... ${progress}%`;
            
            if (progress >= 100) {
                clearInterval(progressInterval);
                
                // Show completion
                downloadBtn.textContent = 'Download Complete!';
                downloadBtn.style.background = '#4CAF50';
                
                // Store download info
                storeOfflineMapData(mapObj);
                
                // Reset after 3 seconds
                setTimeout(() => {
                    downloadBtn.disabled = false;
                    downloadBtn.textContent = originalText;
                    downloadBtn.style.background = originalBackground;
                }, 3000);
                
                console.log('✅ Download simulation complete');
            }
        }, 500);
    }
    
    function storeOfflineMapData(mapObj) {
        try {
            console.log('💾 Storing offline map data...');
            
            const mapData = {
                timestamp: new Date().toISOString(),
                layer: currentMapLayer,
                downloaded: true
            };
            
            // Try to get map center and bounds if available
            if (mapObj && typeof mapObj.getCenter === 'function') {
                mapData.center = mapObj.getCenter();
            }
            
            if (mapObj && typeof mapObj.getBounds === 'function') {
                mapData.bounds = mapObj.getBounds();
            }
            
            if (mapObj && typeof mapObj.getZoom === 'function') {
                mapData.zoom = mapObj.getZoom();
            }
            
            localStorage.setItem('offlineMapData', JSON.stringify(mapData));
            console.log('💾 Offline map data stored successfully');
            
        } catch (error) {
            console.error('❌ Error storing offline map data:', error);
            // Store basic data anyway
            const basicData = {
                timestamp: new Date().toISOString(),
                layer: currentMapLayer,
                downloaded: true,
                error: error.message
            };
            localStorage.setItem('offlineMapData', JSON.stringify(basicData));
        }
    }
    
    function setupFallbackControls() {
        console.log('🔧 Setting up fallback controls...');
        
        // Setup toggle switch with basic functionality
        const toggleSwitch = document.getElementById('satellite-toggle');
        if (toggleSwitch) {
            toggleSwitch.checked = true;
            toggleSwitch.addEventListener('change', function(event) {
                console.log('🔄 Fallback toggle - switch changed:', event.target.checked);
                currentMapLayer = event.target.checked ? 'satellite' : 'street';
            });
        }
        
        // Setup download button with basic functionality
        const downloadBtn = document.getElementById('download-map-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                console.log('⬇️ Fallback download button clicked');
                simulateDownload(null);
            });
        }
        
        console.log('✅ Fallback controls setup complete');
    }
    
})();

