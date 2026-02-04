import styles from "./Sidebar.module.css";
import Logo from "./Logo";
import AppNav from "./AppNav";
import { Outlet } from "react-router-dom";

function Sidebar() {
  return (
    <div className={styles.sidebar}>
      <Logo />
      <AppNav />

      {/* help to render the child nested routes of AppLayout (city,country etc) */}
      <Outlet />

      <footer className={styles.footer}>
        <p className={styles.copyright}>
          &copy;Copyright {new Date().getFullYear()} by GeoGuide.
        </p>
      </footer>
    </div>
  );
}

export default Sidebar;
