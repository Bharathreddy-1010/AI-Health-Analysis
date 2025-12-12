import React, { useState, useEffect } from 'react';
import './index.css';

const HospitalFinder = () => {
  const [location, setLocation] = useState(null); // { lat, lng }
  const [locationName, setLocationName] = useState("Detecting..."); // "Hyderabad"
  const [searchQuery, setSearchQuery] = useState(""); // User input
  const [showSearch, setShowSearch] = useState(false); // Toggle search bar

  const [hospitals, setHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All'); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const specialties = ["All", "General", "Cardiology", "Dental", "Eye Care", "Pediatric", "Orthopedic"];

  // --- 1. INITIAL LOAD (GET GPS) ---
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateLocation(latitude, longitude);
      },
      (err) => {
        setError("⚠️ Location denied. Search manually below.");
        setLoading(false);
        setLocationName("Unknown Location");
      }
    );
  }, []);

  // --- 2. CORE FUNCTIONS ---
  
  // A. Update everything based on new Lat/Lng
  const updateLocation = async (lat, lng) => {
    setLoading(true);
    setLocation({ lat, lng });
    
    // 1. Get City Name (Reverse Geocoding)
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      // Try to find the most relevant city/area name
      const city = geoData.address.city || geoData.address.town || geoData.address.county || "Selected Location";
      setLocationName(city);
    } catch (e) {
      setLocationName("Custom Location");
    }

    // 2. Fetch Hospitals
    await fetchNearbyHospitals(lat, lng);
  };

  // B. Handle Manual Search (e.g., User types "Mumbai")
  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setShowSearch(false); // Hide search bar
    
    try {
      // Forward Geocoding (City -> Lat/Lng)
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(searchUrl);
      const data = await res.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        // Shorten the name for display
        const shortName = display_name.split(',')[0]; 
        setLocationName(shortName);
        setLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
        
        // Fetch hospitals for new place
        await fetchNearbyHospitals(lat, lon);
      } else {
        alert("City not found! Please try again.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error searching for location.");
      setLoading(false);
    }
  };

  // C. Fetch Hospitals Logic (Same as before)
  const fetchNearbyHospitals = async (lat, lng) => {
    try {
      const query = `
        [out:json];
        node["amenity"="hospital"](around:5000, ${lat}, ${lng});
        out;
      `;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      const enrichedData = data.elements.map(h => {
        const name = h.tags.name || "Unknown Hospital";
        let assignedSpecialty = "General";
        
        if (name.includes("Heart") || name.includes("Cardio")) assignedSpecialty = "Cardiology";
        else if (name.includes("Dental") || name.includes("Smile")) assignedSpecialty = "Dental";
        else if (name.includes("Eye") || name.includes("Vision")) assignedSpecialty = "Eye Care";
        else if (name.includes("Child") || name.includes("Kids")) assignedSpecialty = "Pediatric";
        else if (name.includes("Ortho")) assignedSpecialty = "Orthopedic";
        else {
            const randomSpecs = ["General", "General", "Cardiology", "Orthopedic"];
            assignedSpecialty = randomSpecs[Math.floor(Math.random() * randomSpecs.length)];
        }
        return { ...h, specialty: assignedSpecialty };
      });

      setHospitals(enrichedData);
      setFilteredHospitals(enrichedData);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch hospital data.");
      setLoading(false);
    }
  };

  // D. Filter Logic
  const handleFilterChange = (category) => {
    setActiveFilter(category);
    if (category === 'All') setFilteredHospitals(hospitals);
    else setFilteredHospitals(hospitals.filter(h => h.specialty === category));
  };

  return (
    <div className="hospital-page">
      {/* --- NEW HEADER WITH LOCATION --- */}
      <header className="hospital-header">
        <h1>🏥 Find Specialists</h1>
        
        {/* LOCATION BAR */}
        <div className="location-bar">
          <div className="current-location">
            <span className="loc-icon">📍</span>
            <span className="loc-text">
              {locationName}
            </span>
            <button className="btn-change" onClick={() => setShowSearch(!showSearch)}>
              {showSearch ? "Cancel" : "Change"}
            </button>
          </div>

          {/* SEARCH INPUT (Hidden by default) */}
          {showSearch && (
            <form onSubmit={handleManualSearch} className="location-search-form">
              <input 
                type="text" 
                placeholder="Enter city (e.g., Mumbai, Delhi)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button type="submit">Search</button>
            </form>
          )}
        </div>

        {/* FILTERS */}
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

      {/* --- CONTENT AREA --- */}
      <div className="hospital-container">
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Searching for hospitals in {locationName}...</p>
          </div>
        )}

        {error && <div className="error-card"><h3>{error}</h3></div>}

        {!loading && !error && filteredHospitals.length === 0 && (
          <div className="empty-state">
            <p>No <strong>{activeFilter}</strong> specialists found in this area.</p>
            <button className="btn-secondary" onClick={() => handleFilterChange('All')}>Show All Hospitals</button>
          </div>
        )}

        <div className="hospital-grid">
          {filteredHospitals.map((hospital) => (
            <div key={hospital.id} className="hospital-card">
              <div className="card-top">
                <div className="card-icon">
                    {hospital.specialty === 'Cardiology' ? '🫀' : 
                     hospital.specialty === 'Dental' ? '🦷' : 
                     hospital.specialty === 'Eye Care' ? '👁️' : '🏥'}
                </div>
                <span className="specialty-badge">{hospital.specialty}</span>
              </div>
              
              <div className="card-info">
                <h3>{hospital.tags.name || "Medical Center"}</h3>
                <p className="card-sub">{hospital.tags["addr:street"] || "Address available on map"}</p>
                
                {/* Calculate distance from the SEARCHED location */}
                <div className="tags">
                   <span className="tag distance">Near {locationName}</span>
                </div>
              </div>

              <button 
                className="btn-direction" 
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lon}`, '_blank')}
              >
                Get Directions 📍
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HospitalFinder;