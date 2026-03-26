import React, { useState, useEffect } from 'react';
import './DoctorBooking.css';

const specialtiesList = ["All", "General Physician", "Cardiology", "Pediatrics", "Orthopedics", "Dermatology", "Dental", "Clinic"];
const timeSlots = ["10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM", "06:00 PM"];

// Fallback images to make the UI look good since map APIs don't provide photos
const doctorImages = [
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1594824432258-3d1f0d36c507?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=500&auto=format&fit=crop&q=60"
];

const DoctorBooking = () => {
  // Location & Search State
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("Detecting...");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Acquiring GPS location...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Doctors & Filters State
  const [doctorsData, setDoctorsData] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [docSearchTerm, setDocSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  
  // Booking Modal State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingStep, setBookingStep] = useState(0); 

  // --- 1. INITIAL LOAD: LOCATION DETECTION ---
  useEffect(() => {
    let isMounted = true; 
    setLoading(true);
    setLoadingMessage("Requesting browser location...");

    const fetchLocationByIP = async () => {
      if (!isMounted) return;
      setLoadingMessage("GPS timed out. Estimating from network...");
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error("IP tracking failed");
        const data = await res.json();
        
        if (data.latitude && data.longitude) {
          updateLocation(data.latitude, data.longitude);
        } else {
          throw new Error("Invalid IP data");
        }
      } catch (err) {
        if (isMounted) {
          setError("⚠️ Could not detect location automatically. Please search below.");
          setLoading(false);
          setLocationName("Unknown Location");
        }
      }
    };

    if (!navigator.geolocation) {
      fetchLocationByIP(); 
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMounted) return;
        updateLocation(position.coords.latitude, position.coords.longitude);
      },
      () => fetchLocationByIP(),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );

    return () => { isMounted = false; };
  }, []);

  // --- 2. UPDATE LOCATION & CITY NAME ---
  const updateLocation = async (lat, lng) => {
    setLoading(true);
    setError(null);
    setLocation({ lat, lng });
    
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      const city = geoData.address.city || geoData.address.town || geoData.address.suburb || "Your Location";
      setLocationName(city);
      setLoadingMessage(`Finding doctors near ${city}...`);
    } catch (e) {
      setLocationName("Custom Location");
      setLoadingMessage(`Scanning area for doctors...`);
    }
    
    await fetchNearbyDoctors(lat, lng);
  };

  // --- 3. MANUAL CITY SEARCH ---
  const handleLocationSearch = async (e) => {
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
        await updateLocation(parseFloat(lat), parseFloat(lon));
      } else {
        alert("City not found! Please try again.");
        setLoading(false);
      }
    } catch (err) {
      alert("Error searching for location.");
      setLoading(false);
    }
  };

  // --- 4. FETCH REAL DOCTORS FROM MAP API ---
  const fetchNearbyDoctors = async (lat, lng) => {
    try {
      // Query OSM for doctors and clinics within a 10km radius
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="doctors"](around:10000, ${lat}, ${lng});
          way["amenity"="doctors"](around:10000, ${lat}, ${lng});
          node["amenity"="clinic"](around:10000, ${lat}, ${lng});
          way["amenity"="clinic"](around:10000, ${lat}, ${lng});
        );
        out center;
      `;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error("API overloaded");
      
      const data = await response.json();
      
      if (!data.elements || data.elements.length === 0) {
        setDoctorsData([]);
        setFilteredDoctors([]);
        setLoading(false);
        return;
      }
      
      const enrichedData = data.elements.map((doc, index) => {
        // Extract real name, or provide a generic fallback
        let rawName = doc.tags?.name || "";
        let finalName = rawName;
        if (!rawName) finalName = doc.tags?.amenity === "clinic" ? "Local Care Clinic" : "Independent Practitioner";
        
        // Ensure doctors have "Dr." in front if it's a person's name
        if (doc.tags?.amenity === "doctors" && !finalName.toLowerCase().includes("clinic") && !finalName.toLowerCase().includes("dr")) {
           finalName = `Dr. ${finalName}`;
        }

        // Determine specialty based on tags or name
        let assignedSpecialty = "General Physician";
        const lowerName = finalName.toLowerCase();
        const tagSpec = (doc.tags?.healthcare_speciality || "").toLowerCase();

        if (lowerName.includes("heart") || tagSpec.includes("cardiology")) assignedSpecialty = "Cardiology";
        else if (lowerName.includes("dental") || lowerName.includes("tooth") || tagSpec.includes("dentistry")) assignedSpecialty = "Dental";
        else if (lowerName.includes("skin") || lowerName.includes("derma")) assignedSpecialty = "Dermatology";
        else if (lowerName.includes("child") || lowerName.includes("ped")) assignedSpecialty = "Pediatrics";
        else if (lowerName.includes("bone") || lowerName.includes("ortho")) assignedSpecialty = "Orthopedics";
        else if (lowerName.includes("clinic") || doc.tags?.amenity === "clinic") assignedSpecialty = "Clinic";

        // Generate realistic simulated data for the UI
        const randomExp = Math.floor(Math.random() * 20) + 3; // 3 to 23 years
        const randomRating = (Math.random() * (5.0 - 4.2) + 4.2).toFixed(1); // 4.2 to 5.0
        const randomReviews = Math.floor(Math.random() * 300) + 20; // 20 to 320 reviews
        const randomFee = Math.floor(Math.random() * 6 + 3) * 100; // 300 to 900 Rs
        const randomImage = doctorImages[index % doctorImages.length];

        // Format physical address
        let address = doc.tags?.["addr:street"] || doc.tags?.["addr:full"] || `${locationName} Area`;

        return {
          id: doc.id,
          name: finalName,
          specialty: assignedSpecialty,
          experience: `${randomExp} Years`,
          rating: randomRating,
          reviews: randomReviews,
          fee: randomFee,
          location: address,
          image: randomImage,
          lat: doc.lat || doc.center?.lat,
          lon: doc.lon || doc.center?.lon
        };
      });

      // Filter out duplicate generic clinics to keep the list clean
      const uniqueDoctors = enrichedData.filter((v,i,a)=>a.findIndex(v2=>(v2.name===v.name))===i);

      setDoctorsData(uniqueDoctors);
      setFilteredDoctors(uniqueDoctors);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch local doctors. Please try again.");
      setLoading(false);
    }
  };

  // --- 5. FILTERING LOGIC ---
  useEffect(() => {
    const results = doctorsData.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(docSearchTerm.toLowerCase()) || doc.specialty.toLowerCase().includes(docSearchTerm.toLowerCase());
      const matchesSpecialty = selectedSpecialty === "All" || doc.specialty === selectedSpecialty;
      return matchesSearch && matchesSpecialty;
    });
    setFilteredDoctors(results);
  }, [docSearchTerm, selectedSpecialty, doctorsData]);


  // --- 6. MODAL HANDLERS ---
  const openBookingModal = (doctor) => {
    setSelectedDoctor(doctor);
    setBookingStep(1);
    setSelectedDate("");
    setSelectedTime("");
  };

  const confirmBooking = () => {
    if (!selectedDate || !selectedTime) return alert("Please select a date and time.");
    setBookingStep(2);
  };

  const closeBooking = () => {
    setBookingStep(0);
    setTimeout(() => setSelectedDoctor(null), 300); 
  };

  return (
    <div className="doctor-page-container">
      
      {/* --- AMBIENT 3D MEDICAL BACKGROUND --- */}
      <div className="floating-background">
        <div className="bg-glow glow-blue"></div>
        <div className="bg-glow glow-sky"></div>
        <div className="doc-shape shape-1">🩺</div>
        <div className="doc-shape shape-2">👨‍⚕️</div>
        <div className="doc-shape shape-3">💊</div>
        <div className="doc-shape shape-4">👩‍⚕️</div>
        <div className="doc-shape shape-5">🏥</div>
        <div className="doc-shape shape-6">🧬</div>
      </div>

      <div className="doctor-content-wrapper">
        
        {/* Header & Location Switcher */}
        <div className="doctor-header">
          <span className="hero-badge">📅 Instant Appointments</span>
          <h1 className="page-title">Find Top Doctors Near You</h1>
          
          {/* LOCATION BAR */}
          <div className="location-bar" style={{ maxWidth: '600px', margin: '15px auto 0 auto', background: 'rgba(255, 255, 255, 0.8)', padding: '15px', borderRadius: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '1.2rem' }}>📍</span>
            <strong style={{ color: '#0f172a', fontSize: '1.1rem' }}>{locationName}</strong>
            <button 
              onClick={() => setShowSearch(!showSearch)}
              style={{ background: 'transparent', color: '#0ea5e9', border: '1px solid #0ea5e9', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {showSearch ? "Cancel" : "Change Area"}
            </button>
          </div>

          {showSearch && (
            <form onSubmit={handleLocationSearch} style={{ display: 'flex', gap: '10px', maxWidth: '400px', margin: '15px auto 0 auto' }}>
              <input 
                type="text" 
                placeholder="Enter city (e.g., Delhi, Mumbai)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }}
              />
              <button type="submit" style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '0 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Search</button>
            </form>
          )}
        </div>

        {/* Filters */}
        <div className="doctor-filters">
          <div className="search-bar-wrapper">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder={`Search doctors in ${locationName}...`} 
              className="doc-search-input"
              value={docSearchTerm}
              onChange={(e) => setDocSearchTerm(e.target.value)}
            />
          </div>
          <div className="specialty-scroll">
            {specialtiesList.map(spec => (
              <button 
                key={spec}
                className={`spec-pill ${selectedSpecialty === spec ? 'active' : ''}`}
                onClick={() => setSelectedSpecialty(spec)}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Doctor Grid / Loading States */}
        <div className="doctor-container" style={{ position: 'relative', minHeight: '300px' }}>
          
          {loading && (
            <div style={{ textAlign: 'center', padding: '50px', background: 'rgba(255,255,255,0.7)', borderRadius: '20px' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px auto' }}></div>
              <p style={{ color: '#0f172a', fontWeight: 'bold' }}>{loadingMessage}</p>
            </div>
          )}

          {error && <div style={{ textAlign: 'center', padding: '50px', color: '#ef4444', background: 'rgba(255,255,255,0.7)', borderRadius: '20px' }}><h3>{error}</h3></div>}

          {!loading && !error && filteredDoctors.length === 0 && (
            <div className="no-doctors">
              <div className="empty-icon" style={{ fontSize: '3rem', marginBottom: '15px' }}>🩺</div>
              <h3 style={{ color: '#0f172a' }}>No {selectedSpecialty !== "All" ? selectedSpecialty : ""} specialists found</h3>
              <p style={{ color: '#64748b' }}>We couldn't find any mapped clinics in this exact area. Try a larger city nearby.</p>
              <button onClick={() => setSelectedSpecialty('All')} style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px' }}>Clear Filters</button>
            </div>
          )}

          {!loading && !error && filteredDoctors.length > 0 && (
            <div className="doctor-grid">
              {filteredDoctors.map(doc => (
                <div className="doctor-card" key={doc.id}>
                  <div className="doc-card-top">
                    <img src={doc.image} alt={doc.name} className="doc-avatar" />
                    <div className="doc-rating">⭐ {doc.rating} <span>({doc.reviews})</span></div>
                  </div>
                  
                  <div className="doc-info">
                    <h3 className="doc-name">{doc.name}</h3>
                    <p className="doc-specialty">{doc.specialty}</p>
                    
                    <div className="doc-stats">
                      <span className="stat"><span className="icon">🎓</span> {doc.experience}</span>
                      <span className="stat"><span className="icon">💳</span> ₹{doc.fee}</span>
                    </div>
                    
                    <p className="doc-location" style={{ fontSize: '0.85rem' }}>📍 {doc.location}</p>
                  </div>

                  <button className="btn-book" onClick={() => openBookingModal(doc)}>
                    Book Appointment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- BOOKING MODAL OVERLAY --- */}
      {bookingStep > 0 && selectedDoctor && (
        <div className="booking-modal-overlay">
          <div className="booking-modal">
            {bookingStep === 1 ? (
              <>
                <button className="close-modal" onClick={closeBooking}>✕</button>
                <div className="modal-header">
                  <img src={selectedDoctor.image} alt={selectedDoctor.name} className="modal-avatar" />
                  <div>
                    <h2>Book Appointment</h2>
                    <p style={{ color: '#0ea5e9', fontWeight: 'bold', margin: '5px 0' }}>{selectedDoctor.name}</p>
                    <p>{selectedDoctor.specialty} • Consultation: ₹{selectedDoctor.fee}</p>
                  </div>
                </div>

                <div className="modal-body">
                  <div className="input-group">
                    <label>Select Date</label>
                    <input 
                      type="date" 
                      className="date-picker" 
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]} 
                    />
                  </div>

                  <div className="input-group">
                    <label>Available Time Slots</label>
                    <div className="time-slots">
                      {timeSlots.map(time => (
                        <button 
                          key={time} 
                          className={`time-pill ${selectedTime === time ? 'active' : ''}`}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn-confirm" onClick={confirmBooking}>
                    Confirm Appointment
                  </button>
                </div>
              </>
            ) : (
              <div className="booking-success">
                <div className="success-icon">🎉</div>
                <h2>Booking Confirmed!</h2>
                <p>Your appointment with <strong>{selectedDoctor.name}</strong> is scheduled for:</p>
                <div className="success-details">
                  📅 {selectedDate} <br/>
                  ⏰ {selectedTime}
                </div>
                <p className="success-subtext">Address: {selectedDoctor.location}</p>
                <button className="btn-done" onClick={closeBooking}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default DoctorBooking;