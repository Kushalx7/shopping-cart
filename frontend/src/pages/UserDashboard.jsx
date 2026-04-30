import { Link } from 'react-router-dom';
import { getUser } from '../utils';

function UserDashboard() {
  const user = getUser();

  return (
    <section className="page-stack compact-page">
      <div className="hero-section dashboard-hero">
        <div>
          <p className="eyebrow">Customer dashboard</p>
          <h1>Welcome, {user?.full_name || 'Customer'}.</h1>
          <p className="hero-copy">Track your shopping activity and jump back into the marketplace.</p>
        </div>
        <div className="hero-card small-card">
          <span>Account type</span>
          <strong>{user?.role || 'guest'}</strong>
          <p>{user?.email || 'Login required'}</p>
        </div>
      </div>
      <div className="quick-grid">
        <Link className="quick-card" to="/"><strong>Browse products</strong><span>Find new items</span></Link>
        <Link className="quick-card" to="/cart"><strong>My cart</strong><span>Review selected items</span></Link>
        <Link className="quick-card" to="/orders"><strong>My orders</strong><span>Track purchases</span></Link>
      </div>
    </section>
  );
}

export default UserDashboard;
