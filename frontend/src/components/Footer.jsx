import React from "react";
import styles from "./Footer.module.css";
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaInstagram,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.section}>
          <h2 className={styles.logo}>GeoGuide</h2>
          <p>
            Explore the world with GeoGuide—your personal travel companion. A
            dynamic world map records every city you visit, turning your
            journeys into a visual diary. Relive unforgettable adventures and
            share your global footsteps with friends everywhere.
          </p>
        </div>

        <div className={styles.section}>
          <h3>Quick Links</h3>
          <ul>
            <li>
              <a href="#home">Home</a>
            </li>
            <li>
              <a href="#services">Services</a>
            </li>
            <li>
              <a href="#about">About Us</a>
            </li>
            <li>
              <a href="#contact">Contact</a>
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <h3>Contact</h3>
          <p>Email: ssiddiqui2106@gmail.com</p>
          <p>Phone: +91 1234567890</p>
          <p>Location: India</p>
        </div>

        <div className={styles.section}>
          <h3>Follow Us</h3>
          <div className={styles.socialIcons}>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaFacebookF />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTwitter />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaLinkedinIn />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram />
            </a>
          </div>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <p>© {new Date().getFullYear()} GeoGuide. All rights reserved.</p>
      </div>
    </footer>
  );
}
