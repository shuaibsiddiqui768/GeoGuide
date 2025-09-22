import { useState } from "react";
import { NavLink } from "react-router-dom";
import styles from "./PageNav.module.css";
import Logo from "./Logo";

function PageNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  function toggleMenu() {
    setMenuOpen((open) => !open);
  }
  return (
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
          <NavLink
            to="/login"
            className={styles.ctaLink}
            onClick={() => setMenuOpen(false)}
          >
            Login
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/signup"
            className={styles.ctaLink}
            onClick={() => setMenuOpen(false)}
          >
            Signup
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
export default PageNav;
