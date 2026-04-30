import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/api';

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await API.post('/auth/login', form);

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      const role = res.data.user?.role;

      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'shop_owner') {
        navigate('/shop-owner');
      } else {
        navigate('/user');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-stack compact-page">
      <div className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h1>Login</h1>

        {message && <div className="alert toast-alert">{message}</div>}

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              required
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </label>

          <label>
            Password
            <input
              required
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
          </label>

          <button className="btn btn-primary full" disabled={loading} type="submit">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="muted">
          Don&apos;t have an account? <Link to="/signup">Create account</Link>
        </p>
      </div>
    </section>
  );
}

export default Login;