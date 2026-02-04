import { Link } from "react-router-dom";
import styles from "./Logo.module.css";

function Logo() {
  return (
    //given logo the link of home to route there
    <Link to="/">
      <img src="https://res.cloudinary.com/da8y38ilr/image/upload/v1758545856/urt9eakivqycpqz3j2ma.png" alt="WorldWise logo" className={styles.logo} />
    </Link>
  );
}

export default Logo;
