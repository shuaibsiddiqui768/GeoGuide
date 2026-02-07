import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./PageNav.module.css";
import Logo from "./Logo";
import { useAuth } from "../contexts/AuthContext";
import { useTours } from "../contexts/ToursContext";
import LogoutModal from "./LogoutModal";

function PageNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const { invites } = useTours();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleMenu() {
    setMenuOpen((open) => !open);
  }

  function toggleUserDropdown() {
    setUserDropdownOpen((open) => !open);
  }

  function handleLogoutClick() {
    setMenuOpen(false);
    setUserDropdownOpen(false);
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

  function handleSettingsClick() {
    setUserDropdownOpen(false);
    setMenuOpen(false);
    navigate("/settings");
  }

  function handleProfileClick() {
    setUserDropdownOpen(false);
    setMenuOpen(false);
    navigate("/profile");
  }

  function handleNotificationsClick() {
    setUserDropdownOpen(false);
    setMenuOpen(false);
    navigate("/notifications");
  }

  function handleFriendsClick() {
    setUserDropdownOpen(false);
    setMenuOpen(false);
    navigate("/friends");
  }

  // Get user initial for avatar
  function getUserInitial() {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
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
            <NavLink to="/search" onClick={() => setMenuOpen(false)}>
              🔍 Search
            </NavLink>
          </li>
          <li>
            {isAuthenticated ? (
              <div className={styles.userMenu} ref={dropdownRef}>
                {/* User Icon */}
                <button
                  className={styles.userIcon}
                  onClick={toggleUserDropdown}
                  aria-label="User menu"
                >
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="Profile"
                      className={styles.userImage}
                    />
                  ) : (
                    <span className={styles.userInitial}>{getUserInitial()}</span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className={styles.userDropdown}>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>
                        {user?.name || user?.email || "User"}
                      </span>
                      <span className={styles.userEmail}>{user?.email}</span>
                    </div>
                    <div className={styles.dropdownDivider}></div>
                    <button
                      className={styles.dropdownItem}
                      onClick={handleProfileClick}
                    >
                      <svg
                        className={styles.dropdownIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Profile
                    </button>
                    <button
                      className={styles.dropdownItem}
                      onClick={handleFriendsClick}
                    >
                      <svg
                        className={styles.dropdownIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      Friends
                    </button>
                    <button
                      className={styles.dropdownItem}
                      onClick={handleNotificationsClick}
                    >
                      <span style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '1.2rem',
                        minWidth: '18px',
                        justifyContent: 'center'
                      }}>
                        🔔
                        {invites.length > 0 && (
                          <span style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            backgroundColor: '#ff6b6b',
                            color: '#fff',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
                            border: '1px solid var(--color-dark--1)'
                          }}>
                            {invites.length}
                          </span>
                        )}
                      </span>
                      Notifications
                    </button>
                    <button
                      className={styles.dropdownItem}
                      onClick={handleSettingsClick}
                    >
                      <svg
                        className={styles.dropdownIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      Settings
                    </button>
                    <button
                      className={`${styles.dropdownItem} ${styles.logoutItem}`}
                      onClick={handleLogoutClick}
                    >
                      <svg
                        className={styles.dropdownIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
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


