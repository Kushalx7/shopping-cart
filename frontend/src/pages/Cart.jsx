import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/api';
import { formatCurrency } from '../utils';

function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setMessage('Please login to view your cart');
      setCart([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await API.get('/cart');
      setCart(res.data || []);
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setMessage('Please login to view your cart');
      } else {
        setMessage(error.response?.data?.message || 'Failed to load cart');
      }
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (cartId) => {
    try {
      const res = await API.delete(`/cart/remove/${cartId}`);
      setMessage(res.data.message || 'Item removed');
      fetchCart();
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setMessage('Please login to manage your cart');
      } else {
        setMessage(error.response?.data?.message || 'Remove failed');
      }
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0),
    [cart]
  );

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <section className="page-stack compact-page">
      <div className="section-header">
        <div>
          <p className="eyebrow">Shopping bag</p>
          <h1>My Cart</h1>
        </div>
        <Link className="btn btn-ghost" to="/">
          Continue shopping
        </Link>
      </div>

      {message && (
        <div className="alert toast-alert">
          {message}
          {!localStorage.getItem('token') && (
            <Link className="btn btn-primary" to="/login" style={{ marginLeft: '10px' }}>
              Login
            </Link>
          )}
        </div>
      )}

      {loading ? (
        <div className="empty-state">Loading cart...</div>
      ) : cart.length === 0 ? (
        <div className="empty-state">
          <h3>Your cart is empty</h3>
          <p>
            {localStorage.getItem('token')
              ? 'Add products to start your order.'
              : 'Please login to view and add products to your cart.'}
          </p>
          {!localStorage.getItem('token') ? (
            <Link className="btn btn-primary" to="/login">
              Login
            </Link>
          ) : (
            <Link className="btn btn-primary" to="/">
              Browse products
            </Link>
          )}
        </div>
      ) : (
        <div className="checkout-layout">
          <div className="card-list">
            {cart.map((item) => (
              <article className="line-item" key={item.id}>
                <div className="item-icon">{item.name?.charAt(0) || 'P'}</div>
                <div>
                  <h3>{item.name}</h3>
                  <p>
                    {formatCurrency(item.price)} × {item.quantity}
                  </p>
                </div>
                <strong>{formatCurrency(Number(item.price) * Number(item.quantity))}</strong>
                <button className="btn btn-danger" onClick={() => removeItem(item.id)}>
                  Remove
                </button>
              </article>
            ))}
          </div>

          <aside className="summary-card">
            <p className="eyebrow">Order summary</p>

            <div className="summary-row">
              <span>Subtotal</span>
              <strong>{formatCurrency(total)}</strong>
            </div>

            <div className="summary-row">
              <span>Delivery</span>
              <strong>Calculated later</strong>
            </div>

            <hr />

            <div className="summary-row total">
              <span>Total</span>
              <strong>{formatCurrency(total)}</strong>
            </div>

            <button className="btn btn-primary full" onClick={() => navigate('/checkout')}>
              Proceed to checkout
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}

export default Cart;