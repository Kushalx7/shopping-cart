import { useEffect, useMemo, useState } from 'react';
import API from '../api/api';
import { formatCurrency, formatDate, imageSrc } from '../utils';

function ShopOwnerDashboard() {
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', image_url: '' });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fetchMyProducts = async () => {
    try {
      const res = await API.get('/products/my-products');
      setProducts(res.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load products');
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await API.get('/orders/shop-owner');
      setOrders(res.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load seller orders');
    }
  };

  const uploadProductPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);
    setUploading(true);

    try {
      const res = await API.post('/upload/image', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((prev) => ({ ...prev, image_url: res.data.image_url }));
      setMessage('Product photo uploaded');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/products/add', form);
      setMessage(res.data.message || 'Product added');
      setForm({ name: '', description: '', price: '', stock: '', image_url: '' });
      fetchMyProducts();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to add product');
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      const res = await API.put(`/orders/status/${orderId}`, { status });
      setMessage(res.data.message || 'Status updated');
      fetchOrders();
      fetchMyProducts();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Status update failed');
    }
  };

  useEffect(() => {
    fetchMyProducts();
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  const sales = useMemo(() => orders.reduce((sum, order) => sum + Number(order.price || 0) * Number(order.quantity || 0), 0), [orders]);

  return (
    <section className="page-stack compact-page">
      <div className="section-header">
        <div><p className="eyebrow">Seller workspace</p><h1>Shop owner dashboard</h1></div>
      </div>
      {message && <div className="alert toast-alert">{message}</div>}
      <div className="stats-grid">
        <div className="stat-card"><span>Products</span><strong>{products.length}</strong></div>
        <div className="stat-card"><span>Orders</span><strong>{orders.length}</strong></div>
        <div className="stat-card"><span>Sales value</span><strong>{formatCurrency(sales)}</strong></div>
      </div>

      <div className="seller-grid">
        <form className="auth-card seller-form" onSubmit={addProduct}>
          <h2>Add product</h2>
          <label>Product name<input required name="name" placeholder="Product name" value={form.name} onChange={handleChange} /></label>
          <label>Description<textarea name="description" placeholder="Short product description" value={form.description} onChange={handleChange} /></label>
          <label>Price<input required name="price" type="number" min="1" placeholder="Price" value={form.price} onChange={handleChange} /></label>
          <label>Stock<input name="stock" type="number" min="0" placeholder="Available stock" value={form.stock} onChange={handleChange} /></label>
          <label>Product photo<input type="file" accept="image/*" onChange={uploadProductPhoto} /></label>
          {uploading && <p className="muted">Uploading photo...</p>}
          {form.image_url && <img className="upload-preview" src={imageSrc(form.image_url)} alt="Product preview" />}
          <button className="btn btn-primary full" type="submit">Add product</button>
        </form>

        <div className="card-list">
          <h2>My products</h2>
          {products.length === 0 ? <div className="empty-state">No products added yet.</div> : products.map((product) => (
            <article className="line-item" key={product.id}>
              <div className="item-icon photo-icon">{product.image_url ? <img src={imageSrc(product.image_url)} alt={product.name} /> : (product.name?.charAt(0) || 'P')}</div>
              <div><h3>{product.name}</h3><p>{product.description || 'No description'}</p></div>
              <strong>{formatCurrency(product.price)}</strong>
              <span className={Number(product.stock) > 0 ? 'badge success' : 'badge danger'}>{Number(product.stock) > 0 ? `Stock ${product.stock}` : 'Out of stock'}</span>
            </article>
          ))}
        </div>
      </div>

      <div className="table-card">
        <h2>Orders for my products</h2>
        <table>
          <thead><tr><th>Order</th><th>Customer</th><th>Product</th><th>Qty</th><th>Current stock</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={`${order.order_id}-${order.product_name}`}>
                <td>#{order.order_id}</td><td>{order.customer_name}</td><td>{order.product_name}</td><td>{order.quantity}</td><td>{order.current_stock}</td><td>{order.payment_method}</td>
                <td><select value={order.status} onChange={(e) => updateStatus(order.order_id, e.target.value)}><option value="pending">Pending</option><option value="accepted">Accepted</option><option value="packed">Packed</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></td>
                <td>{formatDate(order.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ShopOwnerDashboard;
