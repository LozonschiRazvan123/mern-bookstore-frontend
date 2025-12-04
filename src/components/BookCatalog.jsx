import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SearchFilterSort from './SearchFilterSort';
import CardSidebar from './CardSidebar';
import './BookCatalog.css';
import {FaShoppingCart} from 'react-icons/fa';
import { API_URL } from '../config';

 
const BookCatalog = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
 
  useEffect(() => {
    fetchProducts();
    fetchCartTotal();
  }, []);
 
  const fetchProducts = async () => {
    try {
      const response = await
      axios.get(`${API_URL}/api/products`);
      console.log('Răspuns API:', response);
      console.log('Date răspuns:', response.data);
      if (response.data.success) {
        setProducts(response.data.products);
        setFilteredProducts(response.data.products);
      }
    } catch (error) {
      setError('Eroare la încărcarea produselor!');
      console.error('Eroare la obținerea produselor:', error);
    } finally {
      setLoading(false);
    }
  };
 
  const fetchCartTotal = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/cart`);
      if (response.data.success) {
        setCartTotal(response.data.cart.totalItems);
      }
    } catch (error) {
      console.error('Eroare la încărcarea coșului:', error);
    }
  };
 
  const addToCart = async (productId) => {
    try {
      const response = await axios.post(`${API_URL}/api/cart`, {
        productId,
        quantity: 1,
      });
      if (response.data.success) {
        setCartTotal(response.data.cart.totalItems);
        console.log('Produs adăugat în coș:', response.data.cart);
      }
    } catch (error) {
      console.error('Eroare la adăugarea în coș:', error);
      alert('Eroare la adăugarea produsului în coș');
    }
  };
 
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => {
    setIsCartOpen(false);
    fetchCartTotal();
  }

    useEffect(() => {
    const checkRecentPayment = async () => {
      const sessionId = localStorage.getItem('lastCheckoutSession');
      const timestamp = localStorage.getItem('checkoutTimestamp');

      if (sessionId && timestamp) {
        const isRecent = (Date.now() - parseInt(timestamp, 10)) < 300000;
        if (isRecent) {
          try {
            const response = await fetch(`${API_URL}/api/check-payment-status/${sessionId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.paymentStatus === 'paid') {
                await fetch(`{API_URL}/api/clear-cart`, { method: 'POST' });
                fetchCartTotal();
                localStorage.removeItem('lastCheckoutSession');
                localStorage.removeItem('checkoutTimestamp');
              }
            }
          } catch (error) {
            console.error('Error checking payment:', error);
          }
        } else {
          localStorage.removeItem('lastCheckoutSession');
          localStorage.removeItem('checkoutTimestamp');
        }
      }
    };

    checkRecentPayment();
  }, []);
 
  if (loading) return <div className="loading">Se încarcă produsele...</div>;
  if (error) return <div className="error">{error}</div>;
 
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            MERN BookStore
            <span className="version-badge">E-Commerce</span>
          </div>
          <button className="cart-button" onClick={openCart}>
            <FaShoppingCart className="cart-icon" />
            {cartTotal > 0 && (
              <span className="cart-badge">{cartTotal}</span>
            )}
          </button>
        </div>
      </header>
 
      <SearchFilterSort
        products={products}
        onFilteredProducts={setFilteredProducts}
      />
 
      <div className="results-count">
        {filteredProducts.length} produse găsite
      </div>
 
      <div className="products-grid">
        {filteredProducts.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-image-container">
              <img src={product.imageUrl} alt={product.title} className="product-image" />
              <div className="hover-overlay">
                <div className="hover-content">
                  <p><strong>ISBN:</strong> {product.isbn || 'N/A'}</p>
                  <p><strong>Editura:</strong> {product.specifications && product.specifications.publisher || 'N/A'}</p>
                  <p><strong>Pagini:</strong> {product.specifications && product.specifications.pageCount || 'N/A'}</p>
                  <p><strong>An Publicare:</strong> {product.specifications && product.specifications.publicationYear || 'N/A'}</p>
                  <p><strong>Stoc:</strong> {product.stock}</p>
                  {product.rating && (
                    <p><strong>Evaluare:</strong> {'★'.repeat(Math.floor(product.rating))} ({product.reviewCount} recenzii)</p>
                  )}
                  <p className="description"><strong>Descriere:</strong> {product.description}</p>
                </div>
              </div>
            </div>
            <div className="product-info">
              <h3>{product.title}</h3>
              <p className="author">de {product.author}</p>
              <div className="price-section">
                {product.discountPrice ? (
                  <>
                    <span className="original-price">{product.price} RON</span>
                    <span className="current-price">{product.discountPrice} RON</span>
                  </>
                ) : (
                  <span className="current-price">{product.price} RON</span>
                )}
              </div>
              <button
                className="btn btn-primary"
                onClick={() => addToCart(product.id)}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? 'Stoc epuizat' : 'Adaugă în coș'}
              </button>
            </div>
          </div>
        ))}
      </div>
 
      {filteredProducts.length === 0 && (
        <div className="no-products">
          <h2>Nu sunt produse disponibile</h2>
          <p>Magazinul este în curs de actualizare. Reveniți curând!</p>
        </div>
      )}
 
      <CardSidebar isOpen={isCartOpen} onClose={closeCart} />
    </div>
  );
};
 
export default BookCatalog;
 
 