import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getUser, imageSrc } from '../utils';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = getUser();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="site-header">
      <nav className="navbar">
        <Link className="brand" to="/" aria-label="ShopSphere home">
          <span className="brand-mark">S</span>
          <span>
            <strong>ShopSphere</strong>
            <small>Smart shopping system</small>
          </span>
        </Link>

        <div className="nav-links">
          <NavLink to="/">Products</NavLink>
          <NavLink to="/cart">Cart</NavLink>
          {token && <NavLink to="/orders">Orders</NavLink>}
          {token && <NavLink to="/profile">Profile</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          {user?.role === 'shop_owner' && <NavLink to="/shop-owner">Seller</NavLink>}
          {token && user?.role === 'user' && <NavLink to="/user">Dashboard</NavLink>}
        </div>

        <div className="nav-actions">
          {!token ? (
            <>
              <Link className="btn btn-ghost" to="/login">
                Login
              </Link>
              <Link className="btn btn-primary" to="/signup">
                Create account
              </Link>
            </>
          ) : (
            <>
              <Link className="user-pill account-pill" to="/profile">
                <span className="profile-avatar tiny">
                  {user?.profile_photo ? (
                    <img
                      src={imageSrc(user.profile_photo)}
                      alt={user?.full_name || 'Profile'}
                    />
                  ) : (
                    user?.full_name?.charAt(0) || 'A'
                  )}
                </span>
                {user?.full_name || 'Account'}
              </Link>

              <button className="btn btn-dark" onClick={logout}>
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;