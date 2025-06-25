// Custom User Location Indicator - SIMPLIFIED AND FIXED
// This creates a visible round indicator that appears correctly on the map

(function() {
    'use strict';
    
    let customLocationMarker = null;
    let customLocationCircle = null;
    
    // Create custom location indicator - SIMPLIFIED
    function createCustomLocationIndicator(lat, lng, heading = null) {
        if (!window.leafletMap) return;
        
        // Remove existing custom markers
        removeCustomLocationIndicator();
        
        // Create a simple, reliable circular marker
        const customIcon = L.divIcon({
            className: 'custom-location-indicator',
            html: `
                <div style="
                    width: 20px;
                    height: 20px;
                    background: #FF4444;
                    border: 3px solid #FFFFFF;
                    border-radius: 50%;
                    box-shadow: 0 0 10px rgba(255, 68, 68, 0.8);
                    position: absolute;
                    z-index: 1000;
                    transform: none !important;
                ">
                    <div style="
                        width: 8px;
                        height: 8px;
                        background: #FFFFFF;
                        border-radius: 50%;
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                    "></div>
                </div>
            `,
            iconSize: [26, 26],
            iconAnchor: [13, 13]
        });
        
        // Create the marker with high z-index
        customLocationMarker = L.marker([lat, lng], {
            icon: customIcon,
            zIndexOffset: 1000
        }).addTo(window.leafletMap);
        
        // Create a subtle accuracy circle
        customLocationCircle = L.circle([lat, lng], {
            radius: 30, // 30 meter accuracy circle
            fillColor: '#FF4444',
            fillOpacity: 0.1,
            color: '#FF4444',
            weight: 1,
            opacity: 0.3
        }).addTo(window.leafletMap);
        
        console.log('🎯 Custom location indicator created at:', lat, lng);
        
        // Ensure marker stays visible and properly positioned
        setTimeout(() => {
            protectMarkerFromRotation();
        }, 100);
    }
    
    // Protect marker from rotation effects
    function protectMarkerFromRotation() {
        if (customLocationMarker) {
            const markerElement = customLocationMarker.getElement();
            if (markerElement) {
                markerElement.style.zIndex = '1000';
                markerElement.style.position = 'absolute';
                markerElement.style.transform = 'none !important';
                markerElement.style.webkitTransform = 'none !important';
                markerElement.classList.add('custom-user-location');
                
                // Ensure the inner div also doesn't get rotated
                const innerDiv = markerElement.querySelector('div');
                if (innerDiv) {
                    innerDiv.style.transform = 'none !important';
                    innerDiv.style.webkitTransform = 'none !important';
                }
            }
        }
    }
    
    // Remove custom location indicator
    function removeCustomLocationIndicator() {
        if (customLocationMarker && window.leafletMap) {
            window.leafletMap.removeLayer(customLocationMarker);
            customLocationMarker = null;
        }
        if (customLocationCircle && window.leafletMap) {
            window.leafletMap.removeLayer(customLocationCircle);
            customLocationCircle = null;
        }
    }
    
    // Update custom location indicator position
    function updateCustomLocationIndicator(lat, lng, heading = null) {
        if (customLocationMarker) {
            customLocationMarker.setLatLng([lat, lng]);
            protectMarkerFromRotation();
        }
        if (customLocationCircle) {
            customLocationCircle.setLatLng([lat, lng]);
        }
    }
    
    // SIMPLIFIED: Override location tracking with direct approach
    function enhanceLocationTracking() {
        // Wait for the map to be ready
        const checkMap = setInterval(() => {
            if (window.leafletMap) {
                clearInterval(checkMap);
                
                // Override the trackUserLocation function directly
                if (window.trackUserLocation) {
                    const originalTrackLocation = window.trackUserLocation;
                    window.trackUserLocation = function() {
                        const trackBtn = document.getElementById('track-location-btn');
                        if (trackBtn) {
                            trackBtn.textContent = 'Tracking...';
                            trackBtn.disabled = true;
                        }
                        
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                                function(position) {
                                    const lat = position.coords.latitude;
                                    const lng = position.coords.longitude;
                                    
                                    console.log('📍 Location found:', lat, lng);
                                    
                                    // CRITICAL: Set map view FIRST
                                    if (window.leafletMap) {
                                        window.leafletMap.setView([lat, lng], 16);
                                    }
                                    
                                    // Remove any existing default markers
                                    removeDefaultLocationMarkers();
                                    
                                    // Create our custom indicator AFTER setting view
                                    setTimeout(() => {
                                        createCustomLocationIndicator(lat, lng, position.coords.heading);
                                    }, 200);
                                    
                                    // Update button
                                    if (trackBtn) {
                                        trackBtn.textContent = '📍 Where Am I';
                                        trackBtn.disabled = false;
                                    }
                                },
                                function(error) {
                                    console.error('Geolocation error:', error);
                                    if (trackBtn) {
                                        trackBtn.textContent = '📍 Where Am I';
                                        trackBtn.disabled = false;
                                    }
                                },
                                {
                                    enableHighAccuracy: true,
                                    timeout: 15000,
                                    maximumAge: 60000
                                }
                            );
                        }
                    };
                }
                
                console.log('🎯 Custom location indicator system initialized');
            }
        }, 100);
    }
    
    // Remove default location markers
    function removeDefaultLocationMarkers() {
        if (!window.leafletMap) return;
        
        // Remove all existing markers that might be default location indicators
        window.leafletMap.eachLayer(function(layer) {
            if (layer instanceof L.Marker && layer !== customLocationMarker) {
                // Check if this is likely a default location marker
                const element = layer.getElement();
                if (element && !element.classList.contains('custom-location-indicator')) {
                    window.leafletMap.removeLayer(layer);
                    console.log('🗑️ Removed default location marker');
                }
            }
        });
    }
    
    // Continuous protection for the marker
    function continuousProtection() {
        setInterval(() => {
            if (customLocationMarker) {
                protectMarkerFromRotation();
            }
        }, 2000);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            enhanceLocationTracking();
            continuousProtection();
        });
    } else {
        enhanceLocationTracking();
        continuousProtection();
    }
    
    // Export functions for external use
    window.createCustomLocationIndicator = createCustomLocationIndicator;
    window.removeCustomLocationIndicator = removeCustomLocationIndicator;
    window.updateCustomLocationIndicator = updateCustomLocationIndicator;
    
})();

