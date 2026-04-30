import { useEffect, useMemo, useState } from 'react';
import API from '../api/api';
import { formatCurrency, formatDate, getUser, imageSrc } from '../utils';

const emptyEdit = {
  id: '',
  full_name: '',
  email: '',
  phone: '',
  role: 'user',
  profile_photo: '',
};

const emptyProductEdit = {
  id: '',
  name: '',
  price: '',
  stock: '',
  discount_percent: '',
};

function AdminDashboard() {
  const currentUser = getUser();

  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const [editUser, setEditUser] = useState(emptyEdit);
  const [editProduct, setEditProduct] = useState(emptyProductEdit);

  const [message, setMessage] = useState('');
  const [savingUser, setSavingUser] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load users');
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await API.get('/admin/orders');
      setOrders(res.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load orders');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await API.get('/admin/products');
      setProducts(res.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load products');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchOrders();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage('');
    }, 3500);

    return () => clearTimeout(timer);
  }, [message]);

  const revenue = useMemo(() => {
    return orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  }, [orders]);

  const shopOwners = useMemo(() => {
    return users.filter((user) => user.role === 'shop_owner').length;
  }, [users]);

  const pendingOrders = useMemo(() => {
    return orders.filter((order) => order.status === 'pending').length;
  }, [orders]);

  const deliveredOrders = useMemo(() => {
    return orders.filter((order) => order.status === 'delivered').length;
  }, [orders]);

  const startEditUser = (user) => {
    setEditUser({
      id: user.id,
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'user',
      profile_photo: user.profile_photo || '',
    });
    setMessage('');
  };

  const handleUserChange = (e) => {
    setEditUser({
      ...editUser,
      [e.target.name]: e.target.value,
    });
  };

  const saveUser = async (e) => {
    e.preventDefault();

    if (!editUser.id) {
      setMessage('Please select a user first');
      return;
    }

    setSavingUser(true);

    try {
      const res = await API.put(`/admin/users/${editUser.id}`, editUser);
      setMessage(res.data.message || 'User updated successfully');
      setEditUser(emptyEdit);
      await fetchUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || 'User update failed');
    } finally {
      setSavingUser(false);
    }
  };

  const deleteUser = async (user) => {
    if (Number(currentUser?.id) === Number(user.id)) {
      setMessage('You cannot delete your own admin account');
      return;
    }

    if (!window.confirm(`Delete ${user.full_name}? This also removes related data.`)) return;

    try {
      const res = await API.delete(`/admin/users/${user.id}`);
      setMessage(res.data.message || 'User deleted successfully');
      await fetchUsers();
      await fetchOrders();
    } catch (error) {
      setMessage(error.response?.data?.message || 'User delete failed');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await API.put(`/admin/orders/${orderId}/status`, { status });
      setMessage(res.data.message || 'Order status updated');
      await fetchOrders();
      await fetchProducts();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const startEditProduct = (product) => {
    setEditProduct({
      id: product.id,
      name: product.name || '',
      price: product.price || '',
      stock: product.stock || '',
      discount_percent: product.discount_percent || 0,
    });
    setMessage('');
  };

  const handleProductChange = (e) => {
    setEditProduct({
      ...editProduct,
      [e.target.name]: e.target.value,
    });
  };

  const saveProduct = async (e) => {
    e.preventDefault();

    if (!editProduct.id) {
      setMessage('Please select a product first');
      return;
    }

    const discount = Number(editProduct.discount_percent || 0);

    if (discount < 0 || discount > 100) {
      setMessage('Discount must be between 0 and 100');
      return;
    }

    setSavingProduct(true);

    try {
      const res = await API.put(`/admin/products/${editProduct.id}`, {
        name: editProduct.name,
        price: editProduct.price,
        stock: editProduct.stock,
        discount_percent: discount,
      });

      setMessage(res.data.message || 'Product updated successfully');
      setEditProduct(emptyProductEdit);
      await fetchProducts();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Product update failed');
    } finally {
      setSavingProduct(false);
    }
  };

  return (
    <section className="page-stack compact-page admin-page">
      <div className="section-header">
        <div>
          <p className="eyebrow">Admin control center</p>
          <h1>Platform overview</h1>
        </div>
      </div>

      {message && <div className="alert toast-alert">{message}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <span>Users</span>
          <strong>{users.length}</strong>
        </div>

        <div className="stat-card">
          <span>Shop owners</span>
          <strong>{shopOwners}</strong>
        </div>

        <div className="stat-card">
          <span>Revenue</span>
          <strong>{formatCurrency(revenue)}</strong>
        </div>

        <div className="stat-card">
          <span>Pending orders</span>
          <strong>{pendingOrders}</strong>
        </div>

        <div className="stat-card">
          <span>Delivered</span>
          <strong>{deliveredOrders}</strong>
        </div>
      </div>

      <div className="panel-grid admin-grid">
        <div className="table-card">
          <h2>All users</h2>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="profile-avatar small">
                          {user.profile_photo ? (
                            <img src={imageSrc(user.profile_photo)} alt={user.full_name} />
                          ) : (
                            user.full_name?.charAt(0)
                          )}
                        </div>
                        <strong>{user.full_name}</strong>
                      </div>
                    </td>

                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>
                      <span className="badge">{user.role}</span>
                    </td>
                    <td>{formatDate(user.created_at)}</td>

                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-ghost mini"
                          type="button"
                          onClick={() => startEditUser(user)}
                        >
                          Edit
                        </button>

                        <button
                          className="btn btn-danger mini"
                          type="button"
                          disabled={Number(currentUser?.id) === Number(user.id)}
                          onClick={() => deleteUser(user)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan="6">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {editUser.id ? (
          <form className="auth-card admin-edit-card" onSubmit={saveUser}>
            <h2>Edit user</h2>

            <label>
              Full name
              <input
                required
                name="full_name"
                value={editUser.full_name}
                onChange={handleUserChange}
              />
            </label>

            <label>
              Email
              <input
                required
                type="email"
                name="email"
                value={editUser.email}
                onChange={handleUserChange}
              />
            </label>

            <label>
              Phone
              <input
                required
                name="phone"
                value={editUser.phone}
                onChange={handleUserChange}
              />
            </label>

            <label>
              Role
              <select
                required
                name="role"
                value={editUser.role}
                onChange={handleUserChange}
              >
                <option value="user">User</option>
                <option value="shop_owner">Shop Owner</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <label>
              Profile photo URL
              <input
                name="profile_photo"
                value={editUser.profile_photo}
                onChange={handleUserChange}
              />
            </label>

            <button className="btn btn-primary full" disabled={savingUser} type="submit">
              {savingUser ? 'Saving...' : 'Save user'}
            </button>

            <button
              className="btn btn-ghost full"
              type="button"
              onClick={() => setEditUser(emptyEdit)}
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="auth-card admin-edit-card">
            <h2>Select a user</h2>
            <p>Click Edit beside any user to update name, email, phone, role, or profile photo.</p>
          </div>
        )}
      </div>

      <div className="panel-grid admin-grid">
        <div className="table-card">
          <h2>Product discounts</h2>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Discount</th>
                  <th>Final Price</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const discount = Number(product.discount_percent || 0);
                  const price = Number(product.price || 0);
                  const finalPrice = price - (price * discount) / 100;

                  return (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                      </td>
                      <td>{formatCurrency(price)}</td>
                      <td>
                        {Number(product.stock || 0) <= 0 ? (
                          <span className="badge danger">Out of stock</span>
                        ) : (
                          product.stock
                        )}
                      </td>
                      <td>{discount}%</td>
                      <td>{formatCurrency(finalPrice)}</td>
                      <td>
                        <button
                          className="btn btn-ghost mini"
                          type="button"
                          onClick={() => startEditProduct(product)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {products.length === 0 && (
                  <tr>
                    <td colSpan="6">No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {editProduct.id ? (
          <form className="auth-card admin-edit-card" onSubmit={saveProduct}>
            <h2>Edit product</h2>

            <label>
              Product name
              <input
                required
                name="name"
                value={editProduct.name}
                onChange={handleProductChange}
              />
            </label>

            <label>
              Price
              <input
                required
                type="number"
                min="0"
                step="0.01"
                name="price"
                value={editProduct.price}
                onChange={handleProductChange}
              />
            </label>

            <label>
              Stock
              <input
                required
                type="number"
                min="0"
                name="stock"
                value={editProduct.stock}
                onChange={handleProductChange}
              />
            </label>

            <label>
              Discount %
              <input
                required
                type="number"
                min="0"
                max="100"
                step="0.01"
                name="discount_percent"
                value={editProduct.discount_percent}
                onChange={handleProductChange}
              />
            </label>

            <button className="btn btn-primary full" disabled={savingProduct} type="submit">
              {savingProduct ? 'Saving...' : 'Save product'}
            </button>

            <button
              className="btn btn-ghost full"
              type="button"
              onClick={() => setEditProduct(emptyProductEdit)}
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="auth-card admin-edit-card">
            <h2>Select a product</h2>
            <p>Click Edit beside any product to update stock, price, or discount.</p>
          </div>
        )}
      </div>

      <div className="table-card">
        <h2>Live order monitor</h2>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Update</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => {
                const orderId = order.order_id || order.id;

                return (
                  <tr key={orderId}>
                    <td>#{orderId}</td>
                    <td>{order.customer_name || order.full_name || order.email || 'Unknown'}</td>
                    <td>{formatCurrency(order.total_amount)}</td>
                    <td>
                      <span className="badge">{order.payment_method || 'N/A'}</span>
                    </td>
                    <td>
                      <span className={`badge ${order.status === 'delivered' ? 'success' : ''}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>
                      <select
                        value={order.status || 'pending'}
                        onChange={(e) => updateOrderStatus(orderId, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                );
              })}

              {orders.length === 0 && (
                <tr>
                  <td colSpan="7">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;