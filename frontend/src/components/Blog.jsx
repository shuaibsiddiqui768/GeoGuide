import styles from "./Blog.module.css";

export default function Blog() {
  return (
    <section className={styles.blog}>
      <div className={styles.header}>
        <h1>Blogs</h1>
        <p>
          Discover The Beauty, Challenge, And Tranquility That Come With
          Venturing Into High Altitudes. Mountain Adventures" Is Your Ultimate
          Guide
        </p>
      </div>

      <div className={styles.blogGrid}>
        <div className={styles.card}>
          <img
            src="https://res.cloudinary.com/da8y38ilr/image/upload/w_800,q_auto,f_auto/v1758545856/syeajj0zwnceumctdocz.jpg"
            alt="Machu Picchu"
          />
          <div className={styles.cardBody}>
            <h3>Machu Picchu: The Lost City of the Incas</h3>
            <p>
              Hidden high in the misty Andes mountains of Peru lies one of the
              world’s most breathtaking wonders—Machu Picchu, often called the
              “Lost City of the Incas.” Built in the 15th century and later
              abandoned, this UNESCO World Heritage Site continues to fascinate
              historians, archaeologists, and travelers alike.
            </p>
            <button>Read More</button>
          </div>
        </div>

        <div className={styles.card}>
          <img
            src="https://res.cloudinary.com/da8y38ilr/image/upload/w_800,q_auto,f_auto/v1758545856/udjybfvbab7asicvcuam.jpg"
            alt="Northern Lights"
          />
          <div className={styles.cardBody}>
            <h3>Chasing the Northern Lights: Norway’s Aurora Borealis</h3>
            <p>
              Few natural wonders are as magical and awe-inspiring as the Aurora
              Borealis, and Norway stands as one of the best places on Earth to
              witness this breathtaking spectacle. Dancing ribbons of green,
              pink, and violet light paint the night sky, turning the darkness
              into a living canvas of color and movement
            </p>
            <button>Read More</button>
          </div>
        </div>

        <div className={styles.card}>
          <img
            src="https://res.cloudinary.com/da8y38ilr/image/upload/w_800,q_auto,f_auto/v1758545860/yqjmjejnqxbqtwjzvjch.jpg"
            alt="Burj Khalifa"
          />
          <div className={styles.cardBody}>
            <h3>Burj Khalifa: Touching the Skies of Dubai</h3>
            <p>
              Experience the world’s tallest skyscraper, Burj Khalifa—an
              architectural marvel offering breathtaking views, luxury
              experiences, and Dubai’s vibrant spirit. From its observation
              decks to fine dining, every moment promises wonder, innovation,
              and unforgettable memories in the heart of the city.
            </p>
            <button>Read More</button>
          </div>
        </div>
      </div>
    </section>
  );
}
