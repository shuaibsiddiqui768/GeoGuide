import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./TourItem.module.css";
import { useTours } from "../contexts/ToursContext";
import { useCities } from "../contexts/CitiesContext";

function TourItem({ tour }) {
  const { deleteTour } = useTours();
  const { refetchCities } = useCities();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const cityCount = tour.cities?.length || 0;

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteTour(tour._id);
      // Immediately refresh cities list to remove deleted pins
      if (refetchCities) refetchCities();
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
        <div className={styles.tourInfo}>
          <h3 className={styles.tourName}>{tour.name}</h3>
          {tour.description && (
            <p className={styles.tourDescription}>{tour.description}</p>
          )}
          <span className={styles.tourMeta}>
            {tour.startDate && (
              <span className={styles.dateRange}>
                📅 {new Date(tour.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {tour.endDate && ` - ${new Date(tour.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
              </span>
            )}
            {tour.budget > 0 && (
              <span className={styles.budget}>
                💰 {tour.currency} {tour.budget.toLocaleString()}
              </span>
            )}
            <span className={styles.cityCount}>
              🏙️ {cityCount} {cityCount === 1 ? "city" : "cities"}
            </span>
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
