const https = require('https');

/**
 * Geospatial resolution service.
 *
 * Coordinates always come from a real source:
 *  1. A curated gazetteer of the cities present in the logistics network.
 *  2. Nominatim (OpenStreetMap) as a cached fallback.
 *
 * A result carries `precision` so the UI can honestly distinguish a
 * street-level fix from a city-level approximation.
 */

const CITY_GAZETTEER = {
    mumbai: { latitude: 19.076, longitude: 72.8777, label: 'Mumbai, India' },
    'navi mumbai': { latitude: 19.033, longitude: 73.0297, label: 'Navi Mumbai, India' },
    thane: { latitude: 19.2183, longitude: 72.9781, label: 'Thane, India' },
    pune: { latitude: 18.5204, longitude: 73.8567, label: 'Pune, India' },
    delhi: { latitude: 28.6139, longitude: 77.209, label: 'Delhi, India' },
    'new delhi': { latitude: 28.6139, longitude: 77.209, label: 'New Delhi, India' },
    noida: { latitude: 28.5355, longitude: 77.391, label: 'Noida, India' },
    gurugram: { latitude: 28.4595, longitude: 77.0266, label: 'Gurugram, India' },
    bangalore: { latitude: 12.9716, longitude: 77.5946, label: 'Bengaluru, India' },
    bengaluru: { latitude: 12.9716, longitude: 77.5946, label: 'Bengaluru, India' },
    hyderabad: { latitude: 17.385, longitude: 78.4867, label: 'Hyderabad, India' },
    chennai: { latitude: 13.0827, longitude: 80.2707, label: 'Chennai, India' },
    kolkata: { latitude: 22.5726, longitude: 88.3639, label: 'Kolkata, India' },
    ahmedabad: { latitude: 23.0225, longitude: 72.5714, label: 'Ahmedabad, India' },
    lucknow: { latitude: 26.8467, longitude: 80.9462, label: 'Lucknow, India' },
    jaipur: { latitude: 26.9124, longitude: 75.7873, label: 'Jaipur, India' },
    surat: { latitude: 21.1702, longitude: 72.8311, label: 'Surat, India' },
    nagpur: { latitude: 21.1458, longitude: 79.0882, label: 'Nagpur, India' },
    indore: { latitude: 22.7196, longitude: 75.8577, label: 'Indore, India' },
    kochi: { latitude: 9.9312, longitude: 76.2673, label: 'Kochi, India' },
    chandigarh: { latitude: 30.7333, longitude: 76.7794, label: 'Chandigarh, India' }
};

const geocodeCache = new Map();

function matchGazetteer(address, city, country) {
    const haystack = [city, address, country].filter(Boolean).join(', ').toLowerCase();

    // Prefer an explicit city field, then longest matching gazetteer name.
    const names = Object.keys(CITY_GAZETTEER).sort((a, b) => b.length - a.length);
    for (const name of names) {
        if (city && city.toLowerCase().includes(name)) {
            return { ...CITY_GAZETTEER[name], precision: 'city' };
        }
    }
    for (const name of names) {
        if (haystack.includes(name)) {
            return { ...CITY_GAZETTEER[name], precision: 'city' };
        }
    }
    return null;
}

function nominatim(query, cacheKey) {
    return new Promise((resolve) => {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
        const req = https.get(
            url,
            { headers: { 'User-Agent': 'Enterprise-SCM-ControlTower/1.0 (ops@controltower.local)' }, timeout: 4000 },
            (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    try {
                        const results = JSON.parse(data);
                        if (Array.isArray(results) && results.length > 0) {
                            const result = {
                                latitude: parseFloat(results[0].lat),
                                longitude: parseFloat(results[0].lon),
                                label: results[0].display_name,
                                precision: results[0].type === 'city' || results[0].type === 'administrative' ? 'city' : 'address'
                            };
                            geocodeCache.set(cacheKey, result);
                            resolve(result);
                        } else {
                            geocodeCache.set(cacheKey, null);
                            resolve(null);
                        }
                    } catch {
                        resolve(null);
                    }
                });
            }
        );
        req.on('timeout', () => {
            req.destroy();
            resolve(null);
        });
        req.on('error', () => resolve(null));
    });
}

async function geocodeAddress(address, city, country) {
    const cacheKey = `${address || ''}|${city || ''}|${country || ''}`.trim();
    if (!cacheKey) return null;
    if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey);

    const local = matchGazetteer(address, city, country);
    if (local) {
        geocodeCache.set(cacheKey, local);
        return local;
    }

    const query = [address, city, country].filter(Boolean).join(', ').trim();
    if (!query) return null;
    return nominatim(query, cacheKey);
}

async function getWarehouseCoordinates(warehouse) {
    if (!warehouse) return null;
    return geocodeAddress(warehouse.address || '', warehouse.city || '', warehouse.country || '');
}

async function getDestinationCoordinates(destinationAddress, city = '', country = 'India') {
    return geocodeAddress(destinationAddress, city, country);
}

/**
 * Great-circle interpolation for a smooth, non-misleading route arc.
 * Endpoints remain the true geocoded coordinates.
 */
function buildRouteGeometry(originLat, originLng, destLat, destLng, segments = 48) {
    const toRad = (d) => (d * Math.PI) / 180;
    const toDeg = (r) => (r * 180) / Math.PI;
    const lat1 = toRad(originLat);
    const lon1 = toRad(originLng);
    const lat2 = toRad(destLat);
    const lon2 = toRad(destLng);

    const d = 2 * Math.asin(
        Math.sqrt(
            Math.sin((lat2 - lat1) / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
        )
    );

    const coordinates = [];
    if (d === 0) return { type: 'LineString', coordinates: [[originLng, originLat], [destLng, destLat]] };

    for (let i = 0; i <= segments; i++) {
        const f = i / segments;
        const a = Math.sin((1 - f) * d) / Math.sin(d);
        const b = Math.sin(f * d) / Math.sin(d);
        const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
        const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
        const z = a * Math.sin(lat1) + b * Math.sin(lat2);
        coordinates.push([toDeg(Math.atan2(y, x)), toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)))]);
    }

    return { type: 'LineString', coordinates };
}

module.exports = {
    geocodeAddress,
    getWarehouseCoordinates,
    getDestinationCoordinates,
    buildRouteGeometry,
    matchGazetteer,
    clearCache: () => geocodeCache.clear()
};
