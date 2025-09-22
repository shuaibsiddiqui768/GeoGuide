import { Link } from "react-router-dom";
import PageNav from "../components/PageNav";
import styles from "./Homepage.module.css";
import Destination from "../components/Destination";
import Guide from "../components/Guide";
import Gallery from "../components/Gallery";
import Blog from "../components/Blog";
import Footer from "../components/Footer";

export default function Homepage() {
  return (
    <>
      {/* Hero Section */}
      <main className={styles.homepage}>
        <PageNav />
        <section>
          <h1>
            You travel the world.
            <br />
            GeoGuide keeps track of your adventures.
          </h1>
          <h2>
            A world map that tracks your footsteps into every city you can think
            of. Never forget your wonderful experiences, and show your friends
            how you have wandered the world.
          </h2>
          <Link to="/app" className="cta">
            Start Tracking Now
          </Link>
        </section>
      </main>

      <section>
        <Destination />
      </section>

      <section>
        <Guide />
      </section>
      <section>
        <Gallery />
      </section>
      <section>
        <Blog />
      </section>
      <section>
        <Footer />
      </section>
    </>
  );
}
