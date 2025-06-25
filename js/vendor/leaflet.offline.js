// leaflet.offline.js - Simplified version for offline map tile storage
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('leaflet'));
    } else {
        factory(L);
    }
}(function (L) {
    // IndexedDB storage for offline tiles
    const dbName = 'leaflet-offline-tiles';
    const storeName = 'tiles';
    let db;

    // Initialize the database
    function initDb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);
            
            request.onupgradeneeded = function(e) {
                db = e.target.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'url' });
                }
            };
            
            request.onsuccess = function(e) {
                db = e.target.result;
                resolve(db);
            };
            
            request.onerror = function(e) {
                console.error('Error opening IndexedDB:', e.target.error);
                reject(e.target.error);
            };
        });
    }

    // Save a tile to IndexedDB
    function saveTile(url, blob) {
        return new Promise((resolve, reject) => {
            if (!db) {
                return initDb().then(() => saveTile(url, blob)).then(resolve).catch(reject);
            }
            
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const item = { url: url, blob: blob, timestamp: Date.now() };
            
            const request = store.put(item);
            
            request.onsuccess = function() {
                resolve();
            };
            
            request.onerror = function(e) {
                console.error('Error saving tile:', e.target.error);
                reject(e.target.error);
            };
        });
    }

    // Get a tile from IndexedDB
    function getTile(url) {
        return new Promise((resolve, reject) => {
            if (!db) {
                return initDb().then(() => getTile(url)).then(resolve).catch(reject);
            }
            
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(url);
            
            request.onsuccess = function(e) {
                if (e.target.result) {
                    resolve(e.target.result.blob);
                } else {
                    resolve(null);
                }
            };
            
            request.onerror = function(e) {
                console.error('Error getting tile:', e.target.error);
                reject(e.target.error);
            };
        });
    }

    // Create a URL from a blob
    function createBlobUrl(blob) {
        return URL.createObjectURL(blob);
    }

    // Offline-enabled tile layer
    L.TileLayer.Offline = L.TileLayer.extend({
        initialize: function(url, options) {
            L.TileLayer.prototype.initialize.call(this, url, options);
            this._url = url;
            initDb();
        },
        
        createTile: function(coords, done) {
            const tile = L.TileLayer.prototype.createTile.call(this, coords, done);
            const url = this.getTileUrl(coords);
            
            getTile(url).then(blob => {
                if (blob) {
                    // Use cached tile
                    tile.src = createBlobUrl(blob);
                } else {
                    // Load from network
                    tile.src = url;
                    
                    // Listen for load to cache the tile
                    tile.addEventListener('load', () => {
                        fetch(url)
                            .then(response => response.blob())
                            .then(blob => saveTile(url, blob))
                            .catch(err => console.error('Error caching tile:', err));
                    });
                }
            }).catch(err => {
                console.error('Error loading tile:', err);
                tile.src = url; // Fallback to network
            });
            
            return tile;
        }
    });

    // Factory method
    L.tileLayer.offline = function(url, options) {
        return new L.TileLayer.Offline(url, options);
    };

    // Download control for saving the current view
    L.Control.OfflineMap = L.Control.extend({
        options: {
            position: 'topleft',
            title: 'Save map for offline use',
            maxZoom: 19,
            saveButtonHtml: 'Download Map',
            saveButtonTitle: 'Save current map view for offline use',
            removeButtonHtml: 'Clear Cache',
            removeButtonTitle: 'Clear the offline tile cache',
            confirmRemovalText: 'Are you sure you want to remove all offline tiles?',
            maxBounds: null
        },
        
        initialize: function(baseLayer, options) {
            L.Util.setOptions(this, options);
            this._baseLayer = baseLayer;
        },
        
        onAdd: function(map) {
            this._map = map;
            const container = L.DomUtil.create('div', 'leaflet-control-offline');
            
            this._createButton(
                this.options.saveButtonHtml,
                this.options.saveButtonTitle,
                'save-button',
                container,
                this._saveTiles.bind(this)
            );
            
            this._createButton(
                this.options.removeButtonHtml,
                this.options.removeButtonTitle,
                'remove-button',
                container,
                this._removeTiles.bind(this)
            );
            
            return container;
        },
        
        _createButton: function(html, title, className, container, fn) {
            const button = L.DomUtil.create('a', className, container);
            button.innerHTML = html;
            button.title = title;
            
            L.DomEvent
                .on(button, 'click', L.DomEvent.stopPropagation)
                .on(button, 'click', L.DomEvent.preventDefault)
                .on(button, 'click', fn, this)
                .on(button, 'dblclick', L.DomEvent.stopPropagation);
                
            return button;
        },
        
        _saveTiles: function() {
            const bounds = this._map.getBounds();
            const zoom = this._map.getZoom();
            const minZoom = zoom - 2 < 0 ? 0 : zoom - 2;
            const maxZoom = zoom + 2 > this.options.maxZoom ? this.options.maxZoom : zoom + 2;
            
            this._downloadStatus = { total: 0, current: 0 };
            
            // Calculate tile coordinates for the current view
            for (let z = minZoom; z <= maxZoom; z++) {
                const northEast = bounds.getNorthEast();
                const southWest = bounds.getSouthWest();
                
                const neTile = this._baseLayer._getTilePos(northEast, z);
                const swTile = this._baseLayer._getTilePos(southWest, z);
                
                for (let x = swTile.x; x <= neTile.x; x++) {
                    for (let y = neTile.y; y <= swTile.y; y++) {
                        const coords = { x: x, y: y, z: z };
                        const url = this._baseLayer.getTileUrl(coords);
                        this._downloadStatus.total++;
                        
                        // Download and save the tile
                        fetch(url)
                            .then(response => response.blob())
                            .then(blob => {
                                saveTile(url, blob);
                                this._downloadStatus.current++;
                                
                                if (this._downloadStatus.current === this._downloadStatus.total) {
                                    alert('Map tiles saved for offline use!');
                                }
                            })
                            .catch(err => {
                                console.error('Error downloading tile:', err);
                                this._downloadStatus.current++;
                            });
                    }
                }
            }
            
            alert(`Downloading ${this._downloadStatus.total} tiles for offline use. This may take a moment.`);
        },
        
        _removeTiles: function() {
            if (confirm(this.options.confirmRemovalText)) {
                indexedDB.deleteDatabase(dbName);
                db = null;
                initDb();
                alert('Offline tile cache cleared.');
            }
        }
    });

    // Factory method
    L.control.offlineMap = function(baseLayer, options) {
        return new L.Control.OfflineMap(baseLayer, options);
    };

    return {
        L: L
    };
}));
