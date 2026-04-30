import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/api';

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setMessage('Login successful');
      if (res.data.user.role === 'admin') navigate('/admin');
      else if (res.data.user.role === 'shop_owner') navigate('/shop-owner');
      else navigate('/user');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <section className="auth-layout">
      <div className="auth-panel">
        <p className="eyebrow">Welcome back</p>
        <h1>Login to manage your shopping experience.</h1>
        <p>Access your cart, orders, seller tools, or admin dashboard from one clean interface.</p>
      </div>
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Login</h2>
        {message && <div className="alert toast-alert">{message}</div>}
        <label>Email address<input required type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} /></label>
        <label>Password<input required type="password" name="password" placeholder="Enter password" value={form.password} onChange={handleChange} /></label>
        <button className="btn btn-primary full" disabled={loading} type="submit">{loading ? 'Signing in...' : 'Login'}</button>
        <p className="form-note">New here? <Link to="/signup">Create an account</Link></p>
      </form>
    </section>
  );
}

export default Login;
