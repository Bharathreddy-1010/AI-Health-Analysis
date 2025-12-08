import React, { useState } from 'react';

// --- MOCK DATA: REAL HYDERABAD HOSPITALS ---
const hospitalsData = [
  {
    id: 1,
    name: "Apollo Health City",
    specialty: "Cardiology",
    address: "Road No 72, Jubilee Hills, Hyderabad",
    phone: "04023607777", // Clean numbers work best for dialers
    distance: "2.5 km",
    time: "24/7",
    rating: 4.9,
    reviews: 1205,
    status: "Available Now",
    statusColor: "green"
  },
  {
    id: 2,
    name: "Yashoda Hospitals",
    specialty: "Neurology",
    address: "Alexander Rd, Secunderabad, Hyderabad",
    phone: "04045674567",
    distance: "4.1 km",
    time: "24/7",
    rating: 4.8,
    reviews: 980,
    status: "Available Now",
    statusColor: "green"
  },
  {
    id: 3,
    name: "AIG Hospitals",
    specialty: "Internal Medicine",
    address: "Mindspace Rd, Gachibowli, Hyderabad",
    phone: "04042434243",
    distance: "6.5 km",
    time: "24/7",
    rating: 4.9,
    reviews: 3500,
    status: "Busy / Wait Time > 1hr",
    statusColor: "orange"
  },
  {
    id: 4,
    name: "Care Hospitals",
    specialty: "General Practice",
    address: "Road No 1, Banjara Hills, Hyderabad",
    phone: "04061656565",
    distance: "3.0 km",
    time: "24/7",
    rating: 4.6,
    reviews: 750,
    status: "Available Now",
    statusColor: "green"
  },
  {
    id: 5,
    name: "KIMS Hospitals",
    specialty: "Rheumatology",
    address: "Minister Rd, Begumpet, Hyderabad",
    phone: "04044885000",
    distance: "5.2 km",
    time: "9AM - 8PM",
    rating: 4.7,
    reviews: 1120,
    status: "Limited Availability",
    statusColor: "orange"
  },
  {
    id: 6,
    name: "Asian Institute of Nephrology",
    specialty: "Endocrinology", 
    address: "Somajiguda Circle, Hyderabad",
    phone: "04023325555",
    distance: "3.8 km",
    time: "8AM - 9PM",
    rating: 4.5,
    reviews: 310,
    status: "Available Now",
    statusColor: "green"
  },
  {
    id: 7,
    name: "Star Hospitals",
    specialty: "Cardiology",
    address: "Road No 10, Banjara Hills, Hyderabad",
    phone: "04044777700",
    distance: "3.2 km",
    time: "24/7",
    rating: 4.8,
    reviews: 890,
    status: "Available Now",
    statusColor: "green"
  }
];

const specialtiesList = [
  "All Specialties",
  "Endocrinology",
  "Internal Medicine",
  "Rheumatology",
  "Neurology",
  "General Practice",
  "Cardiology",
  "Dermatology"
];

const HospitalFinder = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // --- FILTER LOGIC ---
  const filteredHospitals = hospitalsData.filter(hospital => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          hospital.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === "All Specialties" || hospital.specialty === selectedSpecialty;
    
    return matchesSearch && matchesSpecialty;
  });

  // --- ACTION HANDLERS ---
  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleDirections = (address) => {
    // Encodes the address so it works in a URL
    // e.g., "Road No 1" becomes "Road%20No%201"
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
  };

  return (
    <div className="hospital-page">
      <div className="hospital-header">
        <h1>Find Nearby Hospitals</h1>
        <p>Discover healthcare facilities and specialists near you</p>
      </div>

      {/* --- SEARCH & FILTER BAR --- */}
      <div className="search-container">
        <div className="search-bar-wrapper">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search hospitals or locations..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Dropdown Button */}
        <div className="filter-wrapper">
          <button 
            className={`filter-btn ${isFilterOpen ? 'active' : ''}`} 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            {selectedSpecialty === "All Specialties" ? "Filter by Specialty" : selectedSpecialty} ▾
          </button>

          {/* The Dropdown Menu */}
          {isFilterOpen && (
            <div className="filter-dropdown">
              {specialtiesList.map((spec) => (
                <div 
                  key={spec} 
                  className={`filter-option ${selectedSpecialty === spec ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedSpecialty(spec);
                    setIsFilterOpen(false);
                  }}
                >
                  {spec === "All Specialties" && selectedSpecialty !== "All Specialties" ? "↺ Clear Filter" : spec}
                  {selectedSpecialty === spec && " ✓"}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- HOSPITAL LIST --- */}
      <div className="hospital-list">
        {filteredHospitals.length > 0 ? (
          filteredHospitals.map(hospital => (
            <div className="hospital-card" key={hospital.id}>
              
              {/* Left Side: Info */}
              <div className="hospital-info">
                <div className="hospital-top-row">
                  <h3>{hospital.name}</h3>
                  <span className="specialty-badge">{hospital.specialty}</span>
                </div>
                <div className="hospital-address">📍 {hospital.address}</div>
                <div className="hospital-phone">📞 {hospital.phone}</div>
              </div>

              {/* Middle: Distance/Time */}
              <div className="hospital-meta">
                <div className="meta-item">📍 {hospital.distance} away</div>
                <div className="meta-item">🕒 {hospital.time}</div>
              </div>

              {/* Right Side: Status & Actions */}
              <div className="hospital-actions">
                <span className={`status-badge ${hospital.statusColor}`}>
                  {hospital.status}
                </span>
                
                <div className="rating-row">
                  ⭐ <strong>{hospital.rating}</strong> <span style={{color: '#718096'}}>({hospital.reviews} reviews)</span>
                </div>

                <div className="action-buttons">
                  <button 
                    className="btn-call" 
                    onClick={() => handleCall(hospital.phone)}
                  >
                    📞 Call
                  </button>
                  <button 
                    className="btn-directions" 
                    onClick={() => handleDirections(hospital.address)}
                  >
                    🚀 Directions
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <h3>No hospitals found</h3>
            <p>Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalFinder;