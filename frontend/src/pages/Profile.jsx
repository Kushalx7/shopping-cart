import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import { getUser, imageSrc } from '../utils';

function Profile() {
  const navigate = useNavigate();
  const storedUser = getUser();
  const userId = storedUser?.id;
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    profile_photo: '',
    currentPassword: '',
    newPassword: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    API.get(`/profile/${userId}`)
      .then((res) => {
        setForm({
          full_name: res.data.full_name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          profile_photo: res.data.profile_photo || '',
          currentPassword: '',
          newPassword: '',
        });
      })
      .catch((error) => setMessage(error.response?.data?.message || 'Failed to load profile'));
  }, [userId, navigate]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const uploadProfilePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);
    setUploading(true);

    try {
      const res = await API.post('/upload/image', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((prev) => ({ ...prev, profile_photo: res.data.image_url }));
      setMessage('Profile photo uploaded. Click Save changes to keep it.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const payload = { ...form };
      if (!payload.newPassword) {
        delete payload.currentPassword;
        delete payload.newPassword;
      }

      const res = await API.put(`/profile/${userId}`, payload);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
      setMessage(res.data.message || 'Profile updated successfully');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Profile update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-stack compact-page">
      <div className="section-header">
        <div>
          <p className="eyebrow">My profile</p>
          <h1>Manage your account</h1>
        </div>
      </div>

      <div className="profile-layout">
        <aside className="profile-summary">
          <div className="profile-avatar large">
            {form.profile_photo ? <img src={imageSrc(form.profile_photo)} alt="Profile" /> : (form.full_name || 'U').charAt(0)}
          </div>
          <h2>{form.full_name || 'Your profile'}</h2>
          <p>{storedUser?.role?.replace('_', ' ')}</p>
          <span className="badge success">Real photo upload supported</span>
        </aside>

        <form className="auth-card profile-form" onSubmit={handleSubmit}>
          <h2>Edit profile</h2>
          {message && <div className="alert toast-alert">{message}</div>}
          <label>Full name<input required name="full_name" value={form.full_name} onChange={handleChange} /></label>
          <label>Email<input required type="email" name="email" value={form.email} onChange={handleChange} /></label>
          <label>Phone<input required name="phone" value={form.phone} onChange={handleChange} /></label>
          <label>Profile photo<input type="file" accept="image/*" onChange={uploadProfilePhoto} /></label>
          {uploading && <p className="muted">Uploading photo...</p>}
          <div className="form-divider" />
          <h3>Change password</h3>
          <label>Current password<input type="password" name="currentPassword" placeholder="Required only when changing password" value={form.currentPassword} onChange={handleChange} /></label>
          <label>New password<input type="password" name="newPassword" placeholder="NewPassword@123" value={form.newPassword} onChange={handleChange} /></label>
          <button className="btn btn-primary full" disabled={loading} type="submit">{loading ? 'Saving...' : 'Save changes'}</button>
        </form>
      </div>
    </section>
  );
}

export default Profile;
