import styles from "./Destination.module.css";

export default function Destinations() {
  return (
    <section className={styles.destinations}>
      <div className={styles.imageGallery}>
        <div className={styles.card}>
          <img src="https://res.cloudinary.com/da8y38ilr/image/upload/w_800,q_auto,f_auto/v1758545855/ymeiwvgqhwxfh01amoll.jpg" alt="The Pyramids of Giza" />
          <div className={styles.overlay}>
            {/* <button className={styles.btn}>View Details</button> */}
            <h3>The Pyramids of Giza</h3>
          </div>
        </div>

        <div className={styles.card}>
          <img src="https://res.cloudinary.com/da8y38ilr/image/upload/w_800,q_auto,f_auto/v1758545854/vakvvvxhdkrxtwht4aze.jpg" alt="Hawa Mahal" />
          <div className={styles.overlay}>
            <h3>Hawa Mahal</h3>
          </div>
        </div>

        <div className={styles.card}>
          <img src="https://res.cloudinary.com/da8y38ilr/image/upload/w_800,q_auto,f_auto/v1758545848/dwukgbu267ph3qlto3go.jpg" alt="Great Wall of China" />
          <div className={styles.overlay}>
            <h3>Great Wall of China</h3>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <h1>Popular Destination</h1>
        <p>
          We bring you the finest recommendations for unforgettable journeys.
          Discover breathtaking landscapes, unspoiled natural beauty, and
          thrilling adventures that leave you with memories to cherish forever.
          From towering mountain peaks to tranquil glacial lakes, every
          destination offers its own unique charm—perfect for travelers seeking
          extraordinary experiences in some of the world’s most spectacular
          locations.
        </p>
      </div>
    </section>
  );
}
