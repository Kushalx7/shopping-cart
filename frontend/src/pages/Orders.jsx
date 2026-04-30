import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/api';
import { formatCurrency, formatDate } from '../utils';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await API.get('/orders');
        setOrders(res.data || []);
      } catch (error) {
        setMessage(error.response?.data?.message || 'Please login first to view orders.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <section className="page-stack compact-page">
      <div className="section-header">
        <div>
          <p className="eyebrow">Order history</p>
          <h1>My Orders</h1>
        </div>
        <Link className="btn btn-ghost" to="/">Shop more</Link>
      </div>
      {message && <div className="alert">{message}</div>}
      {loading ? <div className="empty-state">Loading orders...</div> : orders.length === 0 ? (
        <div className="empty-state"><h3>No orders yet</h3><p>Your completed checkout orders will appear here.</p></div>
      ) : (
        <div className="table-card">
          <table>
            <thead><tr><th>Order</th><th>Date</th><th>Payment</th><th>Status</th><th>Total</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id || order.order_id}>
                  <td>#{order.id || order.order_id}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>{order.payment_method}</td>
                  <td><span className="badge">{order.status}</span></td>
                  <td>{formatCurrency(order.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default Orders;
