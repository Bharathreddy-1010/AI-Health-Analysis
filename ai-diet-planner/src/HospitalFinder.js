import React, { useState, useEffect } from 'react';
import './HospitalFinder.css'; 

const HospitalFinder = () => {
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("Detecting...");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Acquiring GPS location...");

  const [hospitals, setHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All'); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const specialties = ["All", "General", "Cardiology", "Dental", "Eye Care", "Pediatric", "Orthopedic"];

  // --- 1. INITIAL LOAD: TWO-TIER LOCATION DETECTION ---
  useEffect(() => {
    let isMounted = true; 
    setLoading(true);
    setLoadingMessage("Requesting accurate browser location...");

    // TIER 2: IP Fallback (Used if GPS fails or times out)
    const fetchLocationByIP = async () => {
      if (!isMounted) return;
      setLoadingMessage("GPS timed out. Estimating from network IP...");
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error("IP tracking blocked");
        const data = await res.json();
        
        if (data.latitude && data.longitude) {
          setLoadingMessage("Network location found! Identifying city...");
          updateLocation(data.latitude, data.longitude);
        } else {
          throw new Error("Invalid IP data");
        }
      } catch (err) {
        console.error("IP Fallback failed:", err);
        if (isMounted) {
          setError("⚠️ Could not detect your location automatically. Please search manually below.");
          setLoading(false);
          setLocationName("Unknown Location");
        }
      }
    };

    // TIER 1: Browser GPS Attempt
    if (!navigator.geolocation) {
      fetchLocationByIP(); 
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,  // Requests the most accurate GPS possible
      timeout: 10000,            // Gives the browser 10 seconds to find it
      maximumAge: 0              // Forces a fresh location grab
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMounted) return;
        const { latitude, longitude } = position.coords;
        setLoadingMessage("Precise location found! Scanning area...");
        updateLocation(latitude, longitude);
      },
      (err) => {
        // Triggers if user denies permission or if strict GPS times out
        console.warn(`Browser GPS Error (${err.code}): ${err.message}`);
        fetchLocationByIP();
      },
      geoOptions
    );

    return () => { isMounted = false; };
  }, []);

  // --- 2. UPDATE LOCATION & REVERSE GEOCODE (Get City Name) ---
  const updateLocation = async (lat, lng) => {
    setLoading(true);
    setError(null);
    setLocation({ lat, lng });
    
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      
      // Try to extract the most logical city/area name
      const city = geoData.address.city || geoData.address.town || geoData.address.suburb || geoData.address.county || "Your Location";
      setLocationName(city);
      setLoadingMessage(`Scanning ${city} for medical centers...`);
    } catch (e) {
      setLocationName("Custom Location");
      setLoadingMessage(`Scanning area for medical centers...`);
    }
    
    await fetchNearbyHospitals(lat, lng);
  };

  // --- 3. MANUAL SEARCH (Forward Geocode) ---
  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setShowSearch(false);
    setLoadingMessage(`Searching for ${searchQuery}...`);
    
    try {
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(searchUrl);
      const data = await res.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const shortName = display_name.split(',')[0]; 
        setLocationName(shortName);
        setLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
        
        setLoadingMessage(`Scanning ${shortName} for hospitals...`);
        await fetchNearbyHospitals(lat, lon);
      } else {
        alert("City not found! Please try again with a broader area name.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error searching for location. Check your internet connection.");
      setLoading(false);
    }
  };

  // --- 4. FETCH HOSPITALS (Overpass API) ---
  const fetchNearbyHospitals = async (lat, lng) => {
    try {
      // Searches a 10km radius for hospital points AND building footprints
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"](around:10000, ${lat}, ${lng});
          way["amenity"="hospital"](around:10000, ${lat}, ${lng});
          relation["amenity"="hospital"](around:10000, ${lat}, ${lng});
        );
        out center;
      `;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error("API Server overloaded, please try again.");
      
      const data = await response.json();
      
      if (!data.elements || data.elements.length === 0) {
        setHospitals([]);
        setFilteredHospitals([]);
        setLoading(false);
        return;
      }
      
      const enrichedData = data.elements.map(h => {
        const name = h.tags?.name || "Medical Center";
        // Building structures use 'center', simple nodes use 'lat/lon'
        const hLat = h.lat || h.center?.lat || lat;
        const hLon = h.lon || h.center?.lon || lng;

        // Simple keyword matching to assign specialties for UI demo
        let assignedSpecialty = "General";
        const lowerName = name.toLowerCase();
        
        if (lowerName.includes("heart") || lowerName.includes("cardio")) assignedSpecialty = "Cardiology";
        else if (lowerName.includes("dental") || lowerName.includes("smile") || lowerName.includes("tooth")) assignedSpecialty = "Dental";
        else if (lowerName.includes("eye") || lowerName.includes("vision") || lowerName.includes("netra")) assignedSpecialty = "Eye Care";
        else if (lowerName.includes("child") || lowerName.includes("pediatric")) assignedSpecialty = "Pediatric";
        else if (lowerName.includes("ortho") || lowerName.includes("bone")) assignedSpecialty = "Orthopedic";
        else {
            const randomSpecs = ["General", "General", "General", "Cardiology", "Orthopedic"];
            assignedSpecialty = randomSpecs[Math.floor(Math.random() * randomSpecs.length)];
        }

        return { ...h, specialty: assignedSpecialty, lat: hLat, lon: hLon };
      });

      setHospitals(enrichedData);
      setFilteredHospitals(enrichedData);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch hospital data. The map server might be busy.");
      setLoading(false);
    }
  };

  const handleFilterChange = (category) => {
    setActiveFilter(category);
    if (category === 'All') setFilteredHospitals(hospitals);
    else setFilteredHospitals(hospitals.filter(h => h.specialty === category));
  };

  return (
    <div className="hospital-page">
      
      {/* --- AMBIENT FLOATING BACKGROUND --- */}
      <div className="floating-background">
        <div className="bg-glow glow-blue"></div>
        <div className="bg-glow glow-sky"></div>
        <div className="med-shape shape-1">➕</div>
        <div className="med-shape shape-2">🏥</div>
        <div className="med-shape shape-3">💊</div>
        <div className="med-shape shape-4">🩺</div>
        <div className="med-shape shape-5">➕</div>
        <div className="med-shape shape-6">🧬</div>
      </div>

      {/* --- FOREGROUND CONTENT --- */}
      <div className="content-wrapper">
        <header className="hospital-header">
          <span className="hero-badge">✨ AI-Powered Routing</span>
          <h1 className="page-title">Find Specialists</h1>
          
          <div className="location-bar">
            <div className="current-location">
              <span className="loc-icon">📍</span>
              <span className="loc-text">{locationName}</span>
              <button className="btn-change" onClick={() => setShowSearch(!showSearch)}>
                {showSearch ? "Cancel" : "Change Area"}
              </button>
            </div>

            {showSearch && (
              <form onSubmit={handleManualSearch} className="location-search-form">
                <input 
                  type="text" 
                  placeholder="Enter city or zip code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="btn-search">Search</button>
              </form>
            )}
          </div>

          <div className="filter-scroll-container">
            {specialties.map((spec) => (
              <button 
                key={spec}
                className={`filter-pill ${activeFilter === spec ? 'active' : ''}`}
                onClick={() => handleFilterChange(spec)}
              >
                {spec}
              </button>
            ))}
          </div>
        </header>

        <div className="hospital-container">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>{loadingMessage}</p>
            </div>
          )}

          {error && <div className="error-card"><h3>{error}</h3></div>}

          {!loading && !error && filteredHospitals.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🏥</div>
              <h3>No {activeFilter} specialists found</h3>
              <p>Try expanding your search to a larger city or selecting a different specialty.</p>
              <button className="btn-secondary" onClick={() => handleFilterChange('All')}>Show All</button>
            </div>
          )}

          <div className="hospital-grid">
            {filteredHospitals.map((hospital, idx) => (
              <div key={hospital.id || idx} className="hospital-card">
                <div className="card-top">
                  <div className="card-icon">
                      {hospital.specialty === 'Cardiology' ? '🫀' : 
                       hospital.specialty === 'Dental' ? '🦷' : 
                       hospital.specialty === 'Eye Care' ? '👁️' : 
                       hospital.specialty === 'Pediatric' ? '🧸' : '🏥'}
                  </div>
                  <span className="specialty-badge">{hospital.specialty}</span>
                </div>
                
                <div className="card-info">
                  <h3>{hospital.tags?.name || "Medical Center"}</h3>
                  <p className="card-sub">{hospital.tags?.["addr:street"] || "Address available on map"}</p>
                  <div className="tags">
                     <span className="tag distance">Near {locationName}</span>
                  </div>
                </div>

                {/* Fixed Google Maps Link */}
                <button 
                  className="btn-direction" 
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lon}`, '_blank')}
                >
                  Get Directions →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalFinder;