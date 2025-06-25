// Track Up / Heading Up Mode Functionality
(function() {
    'use strict';
    
    let trackUpMode = false;
    let currentHeading = 0;
    let mapRotationEnabled = false;
    let trackUpButton = null;
    let trackUpStatusElement = null;
    let watchId = null;
    let lastValidHeading = 0;
    let headingUpdateInterval = null;
    
    // Initialize Track Up functionality when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🧭 Track Up: Starting initialization...');
        initializeTrackUpMode();
    });
    
    function initializeTrackUpMode() {
        // Wait for map to be ready
        const checkMapReady = () => {
            if (window.leafletMap && typeof window.leafletMap === 'object') {
                console.log('✅ Track Up: Map found, setting up Track Up mode...');
                setupTrackUpControls();
                setupHeadingTracking();
            } else {
                console.log('⏳ Track Up: Waiting for map...');
                setTimeout(checkMapReady, 1000);
            }
        };
        checkMapReady();
    }
    
    function setupTrackUpControls() {
        try {
            // Find the track-up-container-compact in the new layout
            const trackUpContainer = document.querySelector('.track-up-container-compact');
            if (!trackUpContainer) {
                console.error('❌ Track Up: Container not found in compact layout');
                return;
            }
            
            // Find the toggle input and status span
            const toggleInput = document.getElementById('track-up-toggle');
            const statusSpan = document.getElementById('track-up-status');
            
            if (!toggleInput || !statusSpan) {
                console.error('❌ Track Up: Toggle input or status span not found');
                return;
            }
            
            // Add event listener
            toggleInput.addEventListener('change', function() {
                trackUpMode = this.checked;
                updateTrackUpMode();
                console.log(`🧭 Track Up: Mode ${trackUpMode ? 'enabled' : 'disabled'}`);
            });
            
            trackUpButton = toggleInput;
            trackUpStatusElement = statusSpan;
            console.log('✅ Track Up: Controls setup successfully with compact layout');
            
        } catch (error) {
            console.error('❌ Track Up: Error setting up controls:', error);
        }
    }
    
    function setupHeadingTracking() {
        if (!navigator.geolocation) {
            console.error('❌ Track Up: Geolocation not supported');
            return;
        }
        
        // Enhanced geolocation options for better heading accuracy
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 1000
        };
        
        // Start watching position for continuous heading updates
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                const heading = position.coords.heading;
                const speed = position.coords.speed;
                
                // Only update heading if we have a valid heading and the user is moving
                if (heading !== null && typeof heading === 'number' && !isNaN(heading)) {
                    if (speed === null || speed > 0.5) { // 0.5 m/s threshold for movement
                        currentHeading = heading;
                        lastValidHeading = heading;
                        
                        if (trackUpMode) {
                            updateMapRotation();
                        }
                        
                        console.log(`🧭 Track Up: Heading updated: ${heading.toFixed(1)}°, Speed: ${speed ? speed.toFixed(1) : 'unknown'} m/s`);
                    }
                } else if (lastValidHeading !== null) {
                    // Use last valid heading if current heading is null
                    currentHeading = lastValidHeading;
                    if (trackUpMode) {
                        updateMapRotation();
                    }
                }
            },
            (error) => {
                console.error('❌ Track Up: Geolocation error:', error);
                updateTrackUpStatus('GPS Error');
            },
            options
        );
        
        console.log('✅ Track Up: Heading tracking started');
    }
    
    function updateMapRotation() {
        if (!window.leafletMap || !trackUpMode) return;
        
        try {
            // Calculate rotation angle (Leaflet uses bearing, which is opposite of heading)
            const rotationAngle = -currentHeading; // Negative because we want to rotate map opposite to heading
            
            // Apply rotation to map container with improved styling
            const mapContainer = window.leafletMap.getContainer();
            if (mapContainer) {
                // MINIMAL scaling to prevent overlay issues - very conservative approach
                const containerRect = mapContainer.getBoundingClientRect();
                const diagonal = Math.sqrt(containerRect.width * containerRect.width + containerRect.height * containerRect.height);
                const maxDimension = Math.max(containerRect.width, containerRect.height);
                
                // ULTRA CONSERVATIVE scaling to eliminate ALL overlay issues
                const baseScale = diagonal / maxDimension;
                const scale = Math.min(baseScale * 1.05, 1.2); // Minimal scaling: 1.05x, max 1.2x
                
                console.log(`🧭 Track Up: Applying ULTRA CONSERVATIVE scaling ${scale.toFixed(2)}x to eliminate overlay`);
                
                // Mobile-specific transform improvements
                const isMobile = window.innerWidth <= 768;
                const transformStyle = isMobile ? 'preserve-3d' : 'flat';
                
                // Apply rotation and minimal scaling
                mapContainer.style.transform = `rotate(${rotationAngle}deg) scale(${scale})`;
                mapContainer.style.transformOrigin = 'center center';
                mapContainer.style.transformStyle = transformStyle;
                mapContainer.style.webkitTransformStyle = transformStyle;
                mapContainer.style.backfaceVisibility = 'hidden';
                mapContainer.style.webkitBackfaceVisibility = 'hidden';
                
                // CRITICAL: Aggressive containment to prevent ANY overlay
                mapContainer.style.background = '#f0f0f0';
                mapContainer.style.border = '2px solid #f0f0f0'; // Add border to hide edges
                mapContainer.parentElement.style.background = '#f0f0f0';
                mapContainer.parentElement.style.overflow = 'hidden';
                mapContainer.parentElement.style.position = 'relative';
                mapContainer.parentElement.style.zIndex = '1';
                mapContainer.parentElement.style.border = '2px solid #f0f0f0';
                mapContainer.parentElement.style.borderRadius = '8px'; // Round corners to hide artifacts
                
                // SUPER AGGRESSIVE: Ensure map doesn't extend beyond container
                const mapParent = mapContainer.parentElement;
                if (mapParent) {
                    mapParent.style.maxHeight = '380px'; // Reduced height for better containment
                    mapParent.style.clipPath = 'inset(10px)'; // Aggressive clipping
                    mapParent.style.backgroundColor = '#f0f0f0';
                    mapParent.style.transformStyle = transformStyle;
                    mapParent.style.webkitTransformStyle = transformStyle;
                    mapParent.style.margin = '10px 0'; // Add margin for safety
                    mapParent.style.boxShadow = 'inset 0 0 20px #f0f0f0'; // Inner shadow to hide corners
                }
                
                // Update UI elements to counter-rotate so they stay readable
                updateUIElementsRotation(-rotationAngle, 1/scale);
                
                // AGGRESSIVE: Remove any default location markers that might appear
                removeDefaultLocationMarkers();
                
                console.log(`🧭 Track Up: Map rotated to ${rotationAngle.toFixed(1)}° with ULTRA CONSERVATIVE scale ${scale.toFixed(2)} (Mobile: ${isMobile})`);
            }
        } catch (error) {
            console.error('❌ Track Up: Error updating map rotation:', error);
        }
    }
    
    function updateUIElementsRotation(counterRotation, counterScale = 1) {
        // Counter-rotate UI elements so they remain readable
        const elementsToCounterRotate = [
            '.leaflet-control',
            '.leaflet-popup'
        ];
        
        elementsToCounterRotate.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (element) {
                    element.style.transform = `rotate(${counterRotation}deg) scale(${counterScale})`;
                    element.style.transformOrigin = 'center center';
                }
            });
        });
        
        // FIXED: Protect custom location indicator from rotation and scaling effects
        const customIndicators = document.querySelectorAll('.custom-location-indicator, .custom-user-location');
        customIndicators.forEach(indicator => {
            if (indicator) {
                // Ensure the custom indicator stays visible and at normal size
                indicator.style.visibility = 'visible !important';
                indicator.style.opacity = '1 !important';
                indicator.style.display = 'block !important';
                indicator.style.zIndex = '1000 !important';
                // CRITICAL: Don't apply any rotation or scaling to custom indicators
                indicator.style.transform = 'none !important';
                indicator.style.transformOrigin = 'center center !important';
                // Ensure parent marker container also doesn't get scaled
                if (indicator.parentElement) {
                    indicator.parentElement.style.transform = 'none !important';
                }
            }
        });
        
        // Also protect the marker containers themselves
        const markerContainers = document.querySelectorAll('.leaflet-marker-pane .leaflet-marker-icon.custom-location-indicator');
        markerContainers.forEach(container => {
            if (container && container.parentElement) {
                container.parentElement.style.transform = 'none !important';
            }
        });
        
        // Ensure Track Up controls remain visible and unrotated
        const trackUpContainer = document.querySelector('.track-up-container-compact');
        if (trackUpContainer) {
            trackUpContainer.style.transform = 'none';
        }
        
        // Ensure main controls container remains visible
        const controlsContainer = document.querySelector('.controls-compact');
        if (controlsContainer) {
            controlsContainer.style.transform = 'none';
        }
    }
    
    function removeDefaultLocationMarkers() {
        // SUPER AGGRESSIVE: Remove all default location markers
        try {
            // Remove by class names
            const defaultMarkers = document.querySelectorAll('.leaflet-marker-icon:not(.custom-location-indicator):not(.custom-user-location)');
            defaultMarkers.forEach(marker => {
                if (marker && marker.parentNode) {
                    marker.parentNode.removeChild(marker);
                    console.log('🗑️ Track Up: Removed default marker');
                }
            });
            
            // Remove by src attributes (yellow arrows, default icons)
            const imageMarkers = document.querySelectorAll('img.leaflet-marker-icon');
            imageMarkers.forEach(marker => {
                const src = marker.src || '';
                if (src.includes('marker-icon') || src.includes('yellow') || src.includes('arrow') || src.includes('location')) {
                    if (marker.parentNode) {
                        marker.parentNode.removeChild(marker);
                        console.log('🗑️ Track Up: Removed image marker with src:', src);
                    }
                }
            });
            
            // Remove marker shadows
            const shadows = document.querySelectorAll('.leaflet-marker-shadow');
            shadows.forEach(shadow => {
                if (shadow && shadow.parentNode) {
                    shadow.parentNode.removeChild(shadow);
                }
            });
            
            // Force hide any remaining markers via CSS
            const allMarkers = document.querySelectorAll('.leaflet-marker-icon');
            allMarkers.forEach(marker => {
                if (!marker.classList.contains('custom-location-indicator') && 
                    !marker.classList.contains('custom-user-location')) {
                    marker.style.display = 'none';
                    marker.style.visibility = 'hidden';
                    marker.style.opacity = '0';
                }
            });
            
        } catch (error) {
            console.error('❌ Track Up: Error removing default markers:', error);
        }
    }
    
    function updateTrackUpMode() {
        if (trackUpMode) {
            updateTrackUpStatus('Track Up Active');
            mapRotationEnabled = true;
            
            // AGGRESSIVE: Remove any default location markers immediately
            removeDefaultLocationMarkers();
            
            // Start continuous heading updates
            if (!headingUpdateInterval) {
                headingUpdateInterval = setInterval(() => {
                    if (trackUpMode && currentHeading !== null) {
                        updateMapRotation();
                        // Periodically remove default markers that might appear
                        removeDefaultLocationMarkers();
                    }
                }, 1000); // Update every second
            }
            
            // Apply current rotation immediately
            updateMapRotation();
        } else {
            updateTrackUpStatus('North Up');
            mapRotationEnabled = false;
            
            // Stop continuous updates
            if (headingUpdateInterval) {
                clearInterval(headingUpdateInterval);
                headingUpdateInterval = null;
            }
            
            // Reset map rotation
            resetMapRotation();
        }
    }
    
    function resetMapRotation() {
        try {
            if (window.leafletMap) {
                const mapContainer = window.leafletMap.getContainer();
                if (mapContainer) {
                    mapContainer.style.transform = 'none';
                    
                    // Reset the parent container styling
                    const mapParent = mapContainer.parentElement;
                    if (mapParent) {
                        mapParent.style.overflow = '';
                        mapParent.style.position = '';
                        mapParent.style.zIndex = '';
                        mapParent.style.backgroundColor = ''; // Reset background color
                    }
                    
                    // Reset UI elements rotation and scaling
                    updateUIElementsRotation(0, 1);
                    
                    console.log('🧭 Track Up: Map rotation reset to North Up');
                }
            }
        } catch (error) {
            console.error('❌ Track Up: Error resetting map rotation:', error);
        }
    }
    
    function updateTrackUpStatus(status) {
        const statusElement = document.getElementById('track-up-status');
        if (statusElement) {
            statusElement.textContent = status;
            
            // Add visual feedback
            if (status === 'Track Up Active') {
                statusElement.style.color = '#2196F3';
                statusElement.style.fontWeight = 'bold';
            } else if (status === 'GPS Error') {
                statusElement.style.color = '#f44336';
                statusElement.style.fontWeight = 'normal';
            } else {
                statusElement.style.color = '#666';
                statusElement.style.fontWeight = 'normal';
            }
        }
    }
    
    // Cleanup function
    function cleanup() {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
        
        if (headingUpdateInterval) {
            clearInterval(headingUpdateInterval);
            headingUpdateInterval = null;
        }
        
        resetMapRotation();
    }
    
    // Expose functions globally for debugging
    window.TrackUpMode = {
        toggle: () => {
            if (trackUpButton) {
                trackUpButton.checked = !trackUpButton.checked;
                trackUpMode = trackUpButton.checked;
                updateTrackUpMode();
            }
        },
        isEnabled: () => trackUpMode,
        getCurrentHeading: () => currentHeading,
        cleanup: cleanup
    };
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
    
    console.log('✅ Track Up: Module loaded successfully');
})();

