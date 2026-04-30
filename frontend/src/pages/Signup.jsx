import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/api';

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', role: 'user' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/signup', form);
      setMessage(res.data.message || 'Account created successfully');
      setTimeout(() => navigate('/login'), 900);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Signup failed');
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
        <p className="eyebrow">Create account</p>
        <h1>Start shopping, selling, or managing from one account.</h1>
        <p>Choose customer for normal shopping or shop owner to access seller tools after login.</p>
      </div>
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Signup</h2>
        {message && <div className="alert toast-alert">{message}</div>}
        <label>Full name<input required name="full_name" placeholder="Full name" value={form.full_name} onChange={handleChange} /></label>
        <label>Email<input required type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} /></label>
        <label>Phone<input required name="phone" placeholder="10 digit phone number" value={form.phone} onChange={handleChange} /></label>
        <label>Account type
          <select required name="role" value={form.role} onChange={handleChange}>
            <option value="user">Customer</option>
            <option value="shop_owner">Shop Owner</option>
          </select>
        </label>
        <label>Password<input required type="password" name="password" placeholder="Example@123" value={form.password} onChange={handleChange} /></label>
        <button className="btn btn-primary full" disabled={loading} type="submit">{loading ? 'Creating...' : 'Create account'}</button>
        <p className="form-note">Already registered? <Link to="/login">Login</Link></p>
      </form>
    </section>
  );
}

export default Signup;
