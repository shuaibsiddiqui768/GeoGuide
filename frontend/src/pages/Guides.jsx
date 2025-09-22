import styles from "./Guides.module.css";
import PageNav from "../components/PageNav"
import Guide from "../components/Guide";

export default function Guides() {
  return (
    <main className={styles.product}>
      <PageNav/>
      <section>
       <Guide/>
      </section>
    </main>
  );
}
