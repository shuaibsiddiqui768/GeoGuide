import styles from "./Guide.module.css";
export default function Guide() {
  return (
    <section className={styles.guide}>
      <div className={styles.container}>
        <div className={styles.textBox}>
          <h1>A Traveler's Guide To Breathtaking Viewpoints</h1>
          <p>
            This guide highlights some of the world’s most iconic monuments and
            historic landmarks, taking you on a journey through the stories
            etched in stone, marble, and metal. Each feature showcases a
            different site—from ancient temples that echo with centuries of
            tradition, and grand palaces that reflect the opulence of past
            empires, to towering statues and architectural marvels that
            symbolize human ambition and creativity. Whether you are wandering
            through the majesty of the Taj Mahal, the timeless corridors of the
            Colosseum in Rome, standing , or marveling at the engineering
            brilliance of Machu Picchu.
          </p>
        </div>

        <div className={styles.imageBox}>
          <img
            src="https://res.cloudinary.com/da8y38ilr/image/upload/w_800,q_auto,f_auto/v1758545849/wt7knj3t9vjetzktomjr.jpg"
            alt="Taj Mahal"
          />
        </div>
      </div>
    </section>
  );
}
