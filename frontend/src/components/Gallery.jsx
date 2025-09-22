import styles from "./Gallery.module.css";

export default function Gallery() {
  return (
    <section className={styles.gallerySection}>
      <div className={styles.galleryContainer}>
        <h1 className={styles.galleryTitle}>Popular Places Gallery</h1>
        <div className={styles.galleryGrid}>
          <img
            src="https://res.cloudinary.com/da8y38ilr/image/upload/w_800,q_auto,f_auto/v1758545856/nmb1nhkxzsdwthblu3pt.jpg"
            alt="Gallery 1"
            className={styles.galleryImage}
          />
          
          <img
            src="https://res.cloudinary.com/da8y38ilr/image/upload/w_800,q_auto,f_auto/v1758545846/wkhcvv3qrqksyg7gk0dh.jpg"
            alt="Gallery 2"
            className={styles.galleryImage}
          />
          <img
            src="https://res.cloudinary.com/da8y38ilr/image/upload/w_800,q_auto,f_auto/v1758545848/jlm09yzyedfebgdsbrdv.jpg"
            alt="Gallery 3"
            className={styles.galleryImage}
          />
          <img
            src="https://res.cloudinary.com/da8y38ilr/image/upload/w_800,q_auto,f_auto/v1758545854/xeg9i3lmyktkwlosskms.jpg"
            alt="Gallery 4"
            className={styles.galleryImage}
          />
          <img
            src="https://res.cloudinary.com/da8y38ilr/image/upload/w_800,q_auto,f_auto/v1758546379/vtowj7koxu5zdsrfxhn6.jpg"
            alt="Gallery 5"
            className={styles.galleryImage}
          />
          <img
            src="https://res.cloudinary.com/da8y38ilr/image/upload/w_800,q_auto,f_auto/v1758545850/cexzczgzamjyegrr2gft.jpg"
            alt="Gallery 6"
            className={styles.galleryImage}
          />
          <img
            src="https://res.cloudinary.com/da8y38ilr/image/upload/w_800,q_auto,f_auto/v1758545854/gchelimvo9zkom3uid4r.jpg"
            alt="Gallery 6"
            className={styles.galleryImage}
          />
          <img
            src="https://res.cloudinary.com/da8y38ilr/image/upload/w_800,q_auto,f_auto/v1758545852/bz7f3ophsk1g5f8txs4k.jpg"
            alt="Gallery 6"
            className={styles.galleryImage}
          />
        </div>
      </div>
    </section>
  );
}
