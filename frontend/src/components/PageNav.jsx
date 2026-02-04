import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./PageNav.module.css";
import Logo from "./Logo";
import { useAuth } from "../contexts/AuthContext";
import LogoutModal from "./LogoutModal";

function PageNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function toggleMenu() {
    setMenuOpen((open) => !open);
  }

  function handleLogoutClick() {
    setMenuOpen(false);
    setShowLogoutModal(true);
  }

  function handleConfirmLogout() {
    logout();
    setShowLogoutModal(false);
    navigate("/");
  }

  function handleCancelLogout() {
    setShowLogoutModal(false);
  }

  return (
    <>
      <nav className={styles.nav}>
        <Logo />

        {/* Hamburger Button */}
        <button className={styles.menuToggle} onClick={toggleMenu}>
          ☰
        </button>

        {/* Collapsible Menu (all routes) */}
        <ul className={`${styles.menu} ${menuOpen ? styles.open : ""}`}>
          <li>
            <NavLink to="/" onClick={() => setMenuOpen(false)}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/gallery" onClick={() => setMenuOpen(false)}>
              Gallery
            </NavLink>
          </li>
          <li>
            <NavLink to="/guide" onClick={() => setMenuOpen(false)}>
              Guide
            </NavLink>
          </li>
          <li>
            {isAuthenticated ? (
              <button
                className={styles.ctaLink}
                onClick={handleLogoutClick}
              >
                Logout
              </button>
            ) : (
              <NavLink
                to="/login"
                className={styles.ctaLink}
                onClick={() => setMenuOpen(false)}
              >
                Login
              </NavLink>
            )}
          </li>
        </ul>
      </nav>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </>
  );
}

export default PageNav;


