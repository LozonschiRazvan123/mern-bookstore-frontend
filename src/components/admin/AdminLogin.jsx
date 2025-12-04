import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        navigate('/admin/products');
      } else {
        setError(data.message || 'Eroare la autentificare');
      }
    } catch (err) {
      setError('Eroare de conexiune la server');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="admin-auth-container">
      <div className="admin-auth-box">
        <h2 className="admin-auth-title">Admin Login</h2>
        <form onSubmit={handleSubmit} className="admin-auth-form">
          <div className="admin-form-group">
            <input
              type="email"
              name="email"
              placeholder="Email administrator"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="admin-auth-input"
            />
          </div>
          <div className="admin-form-group">
            <input
              type="password"
              name="password"
              placeholder="Parolă"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="admin-auth-input"
            />
          </div>
          {error && <div className="admin-auth-error">{error}</div>}
          <button
            type="submit"
            className="admin-auth-button"
            disabled={loading}
          >
            {loading ? 'Se conectează...' : 'Login Administrator'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
