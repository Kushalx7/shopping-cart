import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/api';

function Checkout() {
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [message, setMessage] = useState('');
  const [placing, setPlacing] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await API.get('/cart');
      setCartItems(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage('');
    }, 3500);

    return () => clearTimeout(timer);
  }, [message]);

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.quantity || 1);
  }, 0);

  const hasOutOfStockItem = cartItems.some((item) => Number(item.stock || 0) <= 0);

  const hasInsufficientStock = cartItems.some((item) => {
    return Number(item.quantity || 1) > Number(item.stock || 0);
  });

  const placeOrder = async () => {
    if (cartItems.length === 0) {
      setMessage('Your cart is empty');
      return;
    }

    if (hasOutOfStockItem || hasInsufficientStock) {
      setMessage('Some items are out of stock or exceed available stock');
      return;
    }

    setPlacing(true);

    try {
      const res = await API.post('/orders/place', {
        payment_method: paymentMethod,
      });

      setMessage(res.data.message || 'Order placed successfully');

      setTimeout(() => {
        navigate('/orders');
      }, 900);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Order failed');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <section className="auth-layout">
        <div className="auth-card">
          <h2>Loading checkout...</h2>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-layout">
      <div className="auth-panel">
        <p className="eyebrow">Secure checkout</p>
        <h1>Choose payment method</h1>
        <p>Review your cart and confirm your preferred payment option.</p>
      </div>

      <div className="auth-card">
        {message && <div className="alert toast-alert">{message}</div>}

        {cartItems.length === 0 ? (
          <div className="empty-state">
            <h2>Your cart is empty</h2>
            <p>Add products before placing an order.</p>
            <Link className="btn btn-primary" to="/products">
              Browse products
            </Link>
          </div>
        ) : (
          <>
            <div className="checkout-summary">
              <h2>Order summary</h2>

              {cartItems.map((item) => (
                <div className="checkout-item" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      Qty: {item.quantity} | Stock: {item.stock}
                    </p>

                    {Number(item.stock || 0) <= 0 && (
                      <small className="danger-text">Out of stock</small>
                    )}

                    {Number(item.quantity || 1) > Number(item.stock || 0) && (
                      <small className="danger-text">
                        Quantity exceeds available stock
                      </small>
                    )}
                  </div>

                  <strong>
                    NPR{' '}
                    {(
                      Number(item.price || 0) * Number(item.quantity || 1)
                    ).toLocaleString()}
                  </strong>
                </div>
              ))}

              <div className="checkout-total">
                <span>Total</span>
                <strong>NPR {subtotal.toLocaleString()}</strong>
              </div>
            </div>

            <div className="payment-options">
              <label
                className={
                  paymentMethod === 'cod'
                    ? 'payment-card selected'
                    : 'payment-card'
                }
              >
                <input
                  type="radio"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>
                  <strong>Cash on delivery</strong>
                  <small>Pay when your order arrives.</small>
                </span>
              </label>

              <label
                className={
                  paymentMethod === 'card'
                    ? 'payment-card selected'
                    : 'payment-card'
                }
              >
                <input
                  type="radio"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>
                  <strong>Card payment</strong>
                  <small>Mark this order for card payment.</small>
                </span>
              </label>
            </div>

            <button
              className="btn btn-primary full"
              disabled={placing || hasOutOfStockItem || hasInsufficientStock}
              onClick={placeOrder}
            >
              {placing ? 'Placing order...' : 'Place order'}
            </button>
          </>
        )}
      </div>
    </section>
  );
}

export default Checkout;