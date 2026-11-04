const https = require('https');

/**
 * Geocoding Service
 * Converts addresses to geographic coordinates using Nominatim (OpenStreetMap)
 * Caches results to minimize API calls
 */

const geocodeCache = new Map();

/**
 * Geocode an address using Nominatim
 * Free, no API key required
 */
async function geocodeAddress(address, city, country) {
    const cacheKey = `${address}|${city}|${country}`;

    // Check cache first
    if (geocodeCache.has(cacheKey)) {
        return geocodeCache.get(cacheKey);
    }

    // Build query string
    const query = [address, city, country]
        .filter(Boolean)
        .join(', ')
        .trim();

    if (!query) {
        return null;
    }

    return new Promise((resolve) => {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`;

        https.get(url, { headers: { 'User-Agent': 'Enterprise-SCM-ControlTower' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const results = JSON.parse(data);
                    if (results.length > 0) {
                        const result = {
                            latitude: parseFloat(results[0].lat),
                            longitude: parseFloat(results[0].lon),
                            confidence: 'high'
                        };
                        geocodeCache.set(cacheKey, result);
                        resolve(result);
                    } else {
                        resolve(null);
                    }
                } catch (err) {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

/**
 * Get warehouse coordinates
 * Uses city/country from warehouse record
 */
async function getWarehouseCoordinates(warehouse) {
    if (!warehouse) return null;

    return geocodeAddress(
        warehouse.address || '',
        warehouse.city || '',
        warehouse.country || ''
    );
}

/**
 * Get destination coordinates
 * Uses destination address from shipment
 */
async function getDestinationCoordinates(destinationAddress, city = '', country = '') {
    return geocodeAddress(destinationAddress, city, country);
}

/**
 * Build GeoJSON route between two points
 */
function buildRouteGeometry(originLat, originLng, destLat, destLng) {
    return {
        type: 'LineString',
        coordinates: [
            [originLng, originLat],
            [destLng, destLat]
        ]
    };
}

module.exports = {
    geocodeAddress,
    getWarehouseCoordinates,
    getDestinationCoordinates,
    buildRouteGeometry,
    clearCache: () => geocodeCache.clear()
};
