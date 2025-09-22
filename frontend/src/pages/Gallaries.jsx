// Uses the same styles as Product
import styles from "./Guides.module.css";
import PageNav from "../components/PageNav"
import Gallery from "../components/Gallery";

export default function Galleries() {
  return (
    <main className={styles.product}>
      <PageNav/>
      <section>
        <Gallery/>
      </section>
    </main>
  );
}
