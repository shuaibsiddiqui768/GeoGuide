import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./TourItem.module.css";
import { useTours } from "../contexts/ToursContext";

function TourItem({ tour }) {
  const { deleteTour } = useTours();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const cityCount = tour.cities?.length || 0;

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteTour(tour._id);
    } catch (err) {
      console.error("Failed to delete tour:", err);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  }

  return (
    <li className={styles.tourItem}>
      <Link to={`/app/tours/${tour._id}`} className={styles.tourLink}>
        <div className={styles.tourIcon}>🗺️</div>
        <div className={styles.tourInfo}>
          <h3 className={styles.tourName}>{tour.name}</h3>
          {tour.description && (
            <p className={styles.tourDescription}>{tour.description}</p>
          )}
          <span className={styles.cityCount}>
            {cityCount} {cityCount === 1 ? "city" : "cities"}
          </span>
        </div>
      </Link>

      {/* Delete Button */}
      {!showConfirm ? (
        <button
          className={styles.deleteBtn}
          onClick={() => setShowConfirm(true)}
          title="Delete tour"
        >
          🗑️
        </button>
      ) : (
        <div className={styles.confirmDelete}>
          <button
            className={styles.confirmBtn}
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "..." : "✓"}
          </button>
          <button
            className={styles.cancelBtn}
            onClick={() => setShowConfirm(false)}
          >
            ✕
          </button>
        </div>
      )}
    </li>
  );
}

export default TourItem;
