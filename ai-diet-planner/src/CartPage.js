import React from 'react';
import { Link } from 'react-router-dom';

const CartPage = ({ cart, removeFromCart, onPlaceOrder }) => {
  // Calculate Total
  const totalAmount = cart.reduce((total, item) => total + item.price, 0);

  return (
    <div className="cart-page">
      <div className="cart-container">
        <h1>🛒 Your Shopping Cart</h1>
        
        {cart.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty.</p>
            <Link to="/grocery">
              <button className="btn-primary">Go to Grocery Store</button>
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item, index) => (
                <div key={index} className="cart-item">
                  <div className="item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <p className="item-category">{item.category}</p>
                    <span className="item-price">₹{item.price}</span>
                  </div>
                  <button 
                    className="btn-remove" 
                    onClick={() => removeFromCart(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h2>Order Summary</h2>
              <div className="summary-row">
                <span>Items ({cart.length})</span>
                <span>₹{totalAmount}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>₹40</span>
              </div>
              <hr />
              <div className="summary-row total">
                <span>Total Amount</span>
                <span>₹{totalAmount + 40}</span>
              </div>
              
              {/* UPDATED: Connected to Notification System */}
              <button 
                className="btn-buy-now" 
                onClick={onPlaceOrder}
              >
                Proceed to Buy
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartPage;