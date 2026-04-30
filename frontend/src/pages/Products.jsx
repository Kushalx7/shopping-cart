import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/api';
import { formatCurrency, imageSrc } from '../utils';

function Products() {
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await API.get('/products');
      setProducts(res.data || []);
    } catch {
      setMessage('Failed to load products. Please check the backend server.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED addToCart
  const addToCart = async (productId) => {
    const token = localStorage.getItem('token');

    // 🔴 stop if not logged in
    if (!token) {
      setMessage('Please login to add items to cart');
      return;
    }

    try {
      const res = await API.post('/cart/add', {
        product_id: productId,
        quantity: 1
      });

      setMessage(res.data.message || 'Added to cart');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setMessage('Please login to add items to cart');
      } else {
        setMessage(error.response?.data?.message || 'Failed to add item to cart');
      }
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  const filteredProducts = useMemo(() => {
    const term = query.toLowerCase().trim();

    const visible = products.filter((product) =>
      [product.name, product.description].join(' ').toLowerCase().includes(term)
    );

    return [...visible].sort((a, b) => {
      if (sortBy === 'price-low') return Number(a.price) - Number(b.price);
      if (sortBy === 'price-high') return Number(b.price) - Number(a.price);
      if (sortBy === 'stock') return Number(b.stock || 0) - Number(a.stock || 0);
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [products, query, sortBy]);

  const inStock = products.filter((product) => Number(product.stock) > 0).length;

  return (
    <section className="page-stack">
      <div className="hero-section">
        <div>
          <p className="eyebrow">Modern marketplace</p>
          <h1>Discover quality products from trusted sellers.</h1>
          <p className="hero-copy">
            Browse, compare, add to cart, and checkout with live stock protection.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#catalog">Shop catalog</a>
            <Link className="btn btn-ghost" to="/cart">View cart</Link>
          </div>
        </div>

        <div className="hero-card">
          <span>Total products</span>
          <strong>{products.length}</strong>
          <p>{inStock} currently in stock</p>
        </div>
      </div>

      {/* ✅ Improved alert with login button */}
      {message && (
        <div className="alert toast-alert">
          {message}
          {!localStorage.getItem('token') && (
            <Link
              to="/login"
              className="btn btn-primary"
              style={{ marginLeft: '10px' }}
            >
              Login
            </Link>
          )}
        </div>
      )}

      <div className="section-header" id="catalog">
        <div>
          <p className="eyebrow">Catalog</p>
          <h2>Featured products</h2>
        </div>

        <div className="toolbar">
          <input
            type="search"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="featured">Newest</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="stock">Most stock</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading products...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">No matching products found.</div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((product) => {
            const stock = Number(product.stock || 0);

            return (
              <article
                className={`product-card ${stock <= 0 ? 'is-out' : ''}`}
                key={product.id}
              >
                <div className="product-image">
                  {product.image_url ? (
                    <img src={imageSrc(product.image_url)} alt={product.name} />
                  ) : (
                    product.name?.charAt(0) || 'P'
                  )}

                  {stock <= 0 && (
                    <span className="stock-overlay">Out of stock</span>
                  )}
                </div>

                <div className="product-body">
                  <div className="product-title-row">
                    <h3>{product.name}</h3>

                    <span className={stock > 0 ? 'badge success' : 'badge danger'}>
                      {stock > 0 ? `${stock} left` : 'Out of stock'}
                    </span>
                  </div>

                  <p>{product.description || 'No description available.'}</p>

                  <div className="product-footer">
                    <strong>{formatCurrency(product.price)}</strong>

                    <button
                      className="btn btn-primary"
                      disabled={stock <= 0}
                      onClick={() => addToCart(product.id)}
                    >
                      {stock > 0 ? 'Add to cart' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Products;