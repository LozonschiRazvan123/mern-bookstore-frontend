import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CardSidebar.css';
import { API_URL } from '../config';
 
const CardSidebar = ({ isOpen, onClose }) => {
  const [cart, setCart] = useState({
    items: [],
    total: 0,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
 
  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen]);
 
  const fetchCart = async () => {
    try {
      const response = await axios.get('{API_URL}/api/cart');
      if (response.data.success) {
        setCart(response.data.cart);
      }
    } catch (error) {
      console.error('Eroare la încărcarea coșului:', error);
    }
  };
 
  const removeFromCart = async (productId) => {
    try {
      setLoading(true);
      const response = await axios.delete(`{API_URL}/api/cart/${productId}`);
      if (response.data.success) {
        setCart(response.data.cart);
        if (onCartUpdate) {
          onCartUpdate();
        }
      }
    } catch (error) {
      console.error('Eroare la ștergerea din coș:', error);
    } finally {
      setLoading(false);
    }
  };
 
  const handleCheckoutClick = async () => {
    try {
      setProcessingPayment(true);

      const response = await fetch(`{API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: cart.total + 19.99,   // + transport
          cartItems: cart.items,
        }),
      });

      if (!response.ok) {
        throw new Error('Eroare server');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Eroare necunoscută');
      }

      window.location.href = data.sessionUrl;
    } catch (error) {
      console.error('Eroare la crearea sesiunii de checkout:', error);
      alert('Eroare la inițializarea plății: ' + error.message);
      setProcessingPayment(false);
    }
  };


  if (!isOpen) return null;
 
  return (
    <div className="card-sidebar-overlay" onClick={onClose}>
      <div className="card-sidebar" onClick={e => e.stopPropagation()}>
        <div className="card-header">
          <h2>Coșul de cumpărături</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="card-content">
          {cart.items.length === 0 ? (
            <div className="empty-cart">
              <p>Coșul tău este gol</p>
              <span>Adaugă produse din catalog</span>
            </div>
          ) : (
            <div className="cart-items">
              {cart.items.map(item => (
                <div key={item.productId} className="cart-item">
                  <img src={item.imageUrl} alt={item.title} className="item-image" />
                  <div className="item-details">
                    <h4>{item.title}</h4>
                    <div className="item-author">de {item.author}</div>
                    <span className="item-price">{item.price} RON</span>
                    <span className="item-quantity">x {item.quantity}</span>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(item.productId)}
                    disabled={loading}
                  >
                    Șterge
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="cart-summary">
            <div className="total-items">
              Total produse: {cart.totalItems}
            </div>
            <div className="total-price">
              Total: <strong>{cart.total.toFixed(2)} RON</strong>
            </div>
            <button className="checkout-btn">
              Finalizează comanda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default CardSidebar;