import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductAdmin.css';
import { API_URL } from '../config';


const ProductAdmin = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: 'all' });

  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    price: '',
    discountPrice: '',
    stock: '',
    description: '',
    category: '',
    isbn: '',
    publisher: '',
    pages: '',
    year: '',
    imageUrl: '',
    featured: false,
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadProducts();
  }, [navigate]);

  const loadProducts = async (filtersObj = filters) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      const params = new URLSearchParams();
      if (filtersObj.search) params.append('search', filtersObj.search);
      if (filtersObj.status !== 'all') params.append('status', filtersObj.status);

      const response = await fetch(
        `{API_URL}/api/admin/products?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();
      if (data.success) setProducts(data.products);
    } catch (error) {
      console.error('Eroare la încărcarea produselor:', error);
    } finally {
      setLoading(false);
    }
  };

  // Căutare cu delay
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, search: value }));

    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadProducts({ ...filters, search: value });
    }, 400);
  };

  // Filtrare după status
  const handleStatusChange = (value) => {
    const newFilters = { ...filters, status: value };
    setFilters(newFilters);
    loadProducts(newFilters);
  };

  // Păstrează focus pe căutare
  useEffect(() => {
    if (searchInputRef.current) {
      const cursorPosition = searchInputRef.current.selectionStart;
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
      }, 0);
    }
  }, [products]);

  // Curăță timeout-uri
  useEffect(() => {
    return () => clearTimeout(searchTimeoutRef.current);
  }, []);

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      price: '',
      discountPrice: '',
      stock: '',
      description: '',
      category: '',
      isbn: '',
      publisher: '',
      pages: '',
      year: '',
      imageUrl: '',
      featured: false,
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleEdit = (product) => {
    setFormData({
      title: product.title,
      author: product.author,
      price: product.price,
      discountPrice: product.discountPrice || '',
      stock: product.stock,
      description: product.description || '',
      category: product.category || '',
      isbn: product.isbn || '',
      publisher: product.specifications?.publisher || '',
      pages: product.specifications?.pages || '',
      year: product.specifications?.year || '',
      imageUrl: product.imageUrl || '',
      featured: product.featured || false,
    });
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    if (
      formData.discountPrice &&
      parseFloat(formData.discountPrice) >= parseFloat(formData.price)
    ) {
      alert('Prețul redus trebuie să fie mai mic decât prețul original');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingProduct
        ? `{API_URL}/api/admin/products/${editingProduct.id}`
        : `{API_URL}/api/admin/products`;

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        discountPrice:
          formData.discountPrice ? parseFloat(formData.discountPrice) : null,
        stock: parseInt(formData.stock),
        specifications: {
          pages: formData.pages,
          publisher: formData.publisher,
          year: formData.year,
          language: 'Romanian',
          format: 'Paperback',
        },
      };

      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (data.success) {
        resetForm();
        loadProducts();
        alert(editingProduct ? 'Produs actualizat!' : 'Produs adăugat!');
      } else {
        alert(data.message || 'Eroare la salvare');
      }
    } catch (error) {
      console.error('Eroare la salvare:', error);
      alert('Eroare la salvare produs');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Sigur doriți să ștergeți acest produs?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `{API_URL}/api/admin/products/${productId}?permanent=true`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        loadProducts();
        alert('Produs șters!');
      } else {
        alert(data.message || 'Eroare la ștergere');
      }
    } catch (error) {
      console.error('Eroare la ștergere produs:', error);
      alert('Eroare la ștergere produs');
    }
  };

  const handleToggleStatus = async (productId, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `{API_URL}/api/admin/products/${productId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: !currentStatus }),
        }
      );

      const data = await response.json();
      if (data.success) loadProducts();
    } catch (error) {
      console.error('Eroare la schimbare status:', error);
    }
  };

  if (loading && products.length === 0) {
    return <div className="admin-loading">Se încarcă...</div>;
  }

  return (
    <div className="admin-products-container">
      <header className="admin-products-header">
        <h1 className="admin-products-title">Administrare Produse</h1>
        <div className="admin-header-actions">
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => setShowForm(true)}
          >
            + Adaugă Produs
          </button>
          <button className="admin-btn admin-btn-secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <div className="admin-filters-section">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Caută după titlu sau autor..."
          value={filters.search}
          onChange={handleSearchChange}
          className="admin-search-input"
        />

        <select
          value={filters.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="admin-status-filter"
        >
          <option value="all">Toate produsele</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading && products.length > 0 && (
        <div className="admin-search-loading">Se caută...</div>
      )}

      {showForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <h2 className="admin-modal-title">
              {editingProduct ? 'Editare Produs' : 'Produs Nou'}
            </h2>

            <form onSubmit={handleSaveProduct} className="admin-product-form">
              <div className="admin-form-row">
                <input
                  type="text"
                  placeholder="Titlu *"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="admin-form-input"
                />

                <input
                  type="text"
                  placeholder="Autor *"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  required
                  className="admin-form-input"
                />
              </div>

              <div className="admin-form-row">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Preț *"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                  className="admin-form-input"
                />

                <input
                  type="number"
                  step="0.01"
                  placeholder="Preț redus"
                  value={formData.discountPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, discountPrice: e.target.value })
                  }
                  className="admin-form-input"
                />
              </div>

              <div className="admin-form-row">
                <input
                  type="number"
                  placeholder="Stoc *"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  required
                  className="admin-form-input"
                />
              </div>

              <textarea
                placeholder="Descriere"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows="3"
                className="admin-form-textarea"
              />

              <div className="admin-form-row">
                <input
                  type="text"
                  placeholder="Categorie"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="admin-form-input"
                />

                <input
                  type="text"
                  placeholder="ISBN"
                  value={formData.isbn}
                  onChange={(e) =>
                    setFormData({ ...formData, isbn: e.target.value })
                  }
                  className="admin-form-input"
                />
              </div>

              <div className="admin-form-row">
                <input
                  type="text"
                  placeholder="Editura"
                  value={formData.publisher}
                  onChange={(e) =>
                    setFormData({ ...formData, publisher: e.target.value })
                  }
                  className="admin-form-input"
                />
                <input
                  type="text"
                  placeholder="An apariție"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                  className="admin-form-input"
                />
              </div>

              <div className="admin-form-row">
              <input
                type="text"
                placeholder="Pagini"
                value={formData.pages}
                onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                className="admin-form-input"
              />

              <input
                type="text"
                placeholder="URL imagine"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                className="admin-form-input admin-form-input-lg"
              />
              </div>

              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) =>
                    setFormData({ ...formData, featured: e.target.checked })
                  }
                  className="admin-checkbox-input"
                />
                Produs recomandat
              </label>

              <div className="admin-form-actions">
                <button type="submit" className="admin-btn admin-btn-primary">
                  {editingProduct ? 'Actualizează' : 'Adaugă'} Produs
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="admin-btn admin-btn-secondary"
                >
                  Anulează
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-products-grid">
        {products.length === 0 ? (
          <div className="admin-no-products">Nu există produse</div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className={`admin-product-card ${
                !product.isActive ? 'admin-product-inactive' : ''
              }`}
            >
              <div className="admin-product-image">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="admin-product-img"
                  />
                ) : (
                  <div className="admin-image-placeholder">Fără imagine</div>
                )}
              </div>

              <div className="admin-product-info">
                <h3 className="admin-product-title">{product.title}</h3>
                <p className="admin-product-author">{product.author}</p>

                <div className="admin-product-pricing">
                  {product.discountPrice ? (
                    <>
                      <span className="admin-product-original-price">
                        {product.price} RON
                      </span>
                      <span className="admin-product-discount-price">
                        {product.discountPrice} RON
                      </span>
                      <span className="admin-product-discount-badge">
                        -{Math.round((1 - product.discountPrice / product.price) * 100)}%
                      </span>
                    </>
                  ) : (
                    <span className="admin-product-price">{product.price} RON</span>
                  )}
                </div>

                <p className="admin-product-stock">Stoc: {product.stock}</p>
                <p className="admin-product-category">{product.category}</p>
              </div>

              <div className="admin-product-actions">
                <button
                  onClick={() => handleEdit(product)}
                  className="admin-btn admin-btn-edit"
                >
                  Editează
                </button>

                <button
                  onClick={() =>
                    handleToggleStatus(product.id, product.isActive)
                  }
                  className={
                    product.isActive
                      ? 'admin-btn admin-btn-warning'
                      : 'admin-btn admin-btn-success'
                  }
                >
                  {product.isActive ? 'Dezactivează' : 'Activează'}
                </button>

                <button
                  onClick={() => handleDelete(product.id)}
                  className="admin-btn admin-btn-danger"
                >
                  Șterge
                </button>

                {product.featured && (
                  <div className="admin-featured-badge">Recomandat</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductAdmin;