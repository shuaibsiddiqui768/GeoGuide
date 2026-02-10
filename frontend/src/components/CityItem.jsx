import { Link } from "react-router-dom";
import styles from "./CityItem.module.css";
import { useCities } from "../contexts/CitiesContext";
import { useAuth } from "../contexts/AuthContext";

const formatDate = (date) => {
  if (!date) return "Unknown date";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
};

// Get country code from emoji flag
function getCountryCodeFromEmoji(emoji) {
  if (!emoji) return null;
  
  // Convert flag emoji to country code
  // Flag emojis are made of regional indicator symbols
  const codePoints = [...emoji]
    .map(char => char.codePointAt(0))
    .filter(cp => cp >= 127462 && cp <= 127487) // Regional indicator range
    .map(cp => String.fromCharCode(cp - 127397));
  
  if (codePoints.length === 2) {
    return codePoints.join('').toLowerCase();
  }
  return null;
}

function CityItem({ city }) {
  const { currentCity, deleteCity } = useCities();
  const { user: authUser } = useAuth();

  const { cityName, emoji, date, _id, position, user: ownerId } = city;

  // Check if current user is the owner
  const isOwner = authUser && (
    (authUser._id === ownerId || authUser._id === ownerId?._id) ||
    (authUser.id === ownerId || authUser.id === ownerId?._id)
  );

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    deleteCity(_id);
  }

  const countryCode = getCountryCodeFromEmoji(emoji);
  
  // Flag image URL from flagcdn.com
  const flagUrl = countryCode 
    ? `https://flagcdn.com/w80/${countryCode}.png`
    : null;

  return (
    <li>
      <Link
        className={`${styles.cityItem} ${
          currentCity?._id === _id ? styles["cityItem--active"] : ""
        }`}
        to={`${_id}?lat=${position.lat}&lng=${position.lng}`}
      >
        {/* Always show flag image or emoji fallback in the list */}
        {flagUrl ? (
          <div className={styles.flagContainer}>
            <img 
              src={flagUrl} 
              alt={`${cityName} flag`} 
              className={styles.flagImage}
              onError={(e) => {
                // Fallback to emoji if flag fails to load
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `<span class="${styles.emoji}">${emoji}</span>`;
              }}
            />
          </div>
        ) : (
          <span className={styles.emoji}>{emoji}</span>
        )}
        <h3 className={styles.name}>{cityName}</h3>
        <time className={styles.date}>({formatDate(date)})</time>
        
        {/* Only owner can delete their pinned city */}
        {isOwner && (
          <button className={styles.deleteBtn} onClick={handleClick}>
            &times;
          </button>
        )}
      </Link>
    </li>
  );
}

export default CityItem;
