import React, { useState, useEffect } from 'react';
import './GroceryShop.css'; // Make sure to import the new CSS

// --- MOCK DATA ---
const productsData = [
  { id: 1, name: "Organic Salmon Fillet", price: 650, category: "Proteins", tags: ["omega-3", "anti-inflammatory"], image: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", diet: "Heart Healthy" },
  { id: 2, name: "Free-Range Chicken Breast", price: 280, category: "Proteins", tags: ["high protein", "lean"], image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", diet: "High Protein" },
  { id: 3, name: "Greek Yogurt (Plain)", price: 120, category: "Dairy", tags: ["probiotic", "high protein"], image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", diet: "Weight Management" },
  { id: 4, name: "Fresh Spinach Bundle", price: 45, category: "Vegetables", tags: ["iron-rich", "fiber"], image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", diet: "Weight Management" },
  { id: 5, name: "Organic Broccoli", price: 85, category: "Vegetables", tags: ["fiber-rich", "vitamin-c"], image: "https://frugivore-bucket.s3.amazonaws.com/media/package/img_one/2021-02-24/Broccoli_Yk8ttEN.jpg", diet: "Anti-Inflammatory" },
  { id: 6, name: "Sweet Potatoes (1kg)", price: 60, category: "Vegetables", tags: ["complex carbs", "fiber"], image: "https://foodcare.in/cdn/shop/files/sweetpotato.jpg?v=1725364564", diet: "Diabetes-Friendly" },
  { id: 7, name: "Organic Blueberries", price: 350, category: "Fruits", tags: ["antioxidant", "low sugar"], image: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", diet: "Anti-Inflammatory" },
  { id: 8, name: "Avocados (2 pack)", price: 240, category: "Fruits", tags: ["healthy fats", "fiber-rich"], image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", diet: "Heart Healthy" },
  { id: 9, name: "Quinoa (500g)", price: 299, category: "Grains", tags: ["gluten free", "protein"], image: "https://www.artfrommytable.com/wp-content/uploads/2022/01/instant_pot_quinoa_square.jpg", diet: "Weight Management" },
  { id: 10, name: "Brown Rice (1kg)", price: 95, category: "Grains", tags: ["whole grain", "fiber-rich"], image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", diet: "Diabetes-Friendly" },
  { id: 11, name: "Extra Virgin Olive Oil", price: 850, category: "Oils", tags: ["healthy fats", "anti-inflammatory"], image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", diet: "Heart Healthy" },
  { id: 12, name: "Raw Almonds (250g)", price: 320, category: "Nuts", tags: ["healthy fats", "protein"], image: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", diet: "Heart Healthy" }
];

const categories = ["All", "Proteins", "Vegetables", "Fruits", "Grains", "Dairy", "Oils", "Nuts"];
const dietaryNeeds = ["All Needs", "Low sugar", "Gluten free", "High protein", "Anti-inflammatory", "Low glycemic", "Heart healthy"];

const GroceryShop = ({ addToCart }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDiet, setSelectedDiet] = useState("All Needs");
  const [filteredProducts, setFilteredProducts] = useState(productsData);

  // --- FILTER LOGIC ---
  useEffect(() => {
    let result = productsData;

    if (searchTerm) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "All") {
      result = result.filter(product => product.category === selectedCategory);
    }

    if (selectedDiet !== "All Needs") {
      const lowerDiet = selectedDiet.toLowerCase();
      result = result.filter(product =>
        product.tags.some(tag => tag.includes(lowerDiet.split(" ")[0])) || 
        product.diet.toLowerCase() === lowerDiet
      );
    }

    setFilteredProducts(result);
  }, [searchTerm, selectedCategory, selectedDiet]);

  return (
    <div className="grocery-page-container">
      
      {/* --- AMBIENT 3D GROCERY BACKGROUND --- */}
      <div className="floating-background">
        <div className="bg-glow glow-blue"></div>
        <div className="bg-glow glow-sky"></div>
        <div className="grocery-shape shape-1">🥦</div>
        <div className="grocery-shape shape-2">🍎</div>
        <div className="grocery-shape shape-3">🥑</div>
        <div className="grocery-shape shape-4">🥕</div>
        <div className="grocery-shape shape-5">🐟</div>
        <div className="grocery-shape shape-6">🍋</div>
        <div className="grocery-shape shape-7">🥬</div>
      </div>

      <div className="grocery-content-wrapper">
        
        {/* Header */}
        <div className="grocery-header">
          <span className="hero-badge">🛒 Curated Marketplace</span>
          <h1 className="page-title">Smart Grocery Shopping</h1>
          <p className="page-subtitle">Find fresh, organic products that match your specific dietary requirements.</p>
        </div>

        <div className="grocery-layout">
          {/* --- LEFT SIDEBAR FILTERS --- */}
          <aside className="filters-sidebar">
            <div className="filter-group search-group">
              <h3>🔍 Search</h3>
              <input
                type="text"
                placeholder="Search products..."
                className="filter-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <h3>Categories</h3>
              <div className="category-chips">
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`chip-btn ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h3>Dietary Needs</h3>
              <div className="diet-list">
                {dietaryNeeds.map(diet => (
                  <button
                    key={diet}
                    className={`diet-btn ${selectedDiet === diet ? 'active' : ''}`}
                    onClick={() => setSelectedDiet(diet)}
                  >
                    <span className="diet-dot"></span> {diet}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              className="clear-filters-btn"
              onClick={() => { setSelectedCategory("All"); setSelectedDiet("All Needs"); setSearchTerm(""); }}
            >
              Clear All Filters
            </button>
          </aside>

          {/* --- RIGHT PRODUCT GRID --- */}
          <main className="products-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div className="product-card" key={product.id}>

                  <div className="product-img-container">
                    <img src={product.image} alt={product.name} className="product-img-real" loading="lazy" />
                    <span className="category-badge">{product.category}</span>
                  </div>

                  <div className="product-details">
                    <div className="product-header-row">
                      <h3 className="product-title">{product.name}</h3>
                      <span className="price-tag">₹{product.price}</span>
                    </div>

                    <div className="product-tags">
                      {product.tags.map((tag, i) => (
                        <span key={i} className="p-tag">{tag}</span>
                      ))}
                    </div>

                    <button
                      className="add-cart-btn"
                      onClick={() => addToCart(product)} 
                    >
                      + Add to Cart
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-products">
                <div className="empty-icon">🛒</div>
                <h3>No products found</h3>
                <p>Try adjusting or clearing your filters.</p>
                <button
                  className="btn-primary"
                  onClick={() => { setSelectedCategory("All"); setSelectedDiet("All Needs"); setSearchTerm(""); }}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default GroceryShop;