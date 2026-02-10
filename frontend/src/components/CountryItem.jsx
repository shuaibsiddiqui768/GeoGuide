import styles from "./CountryItem.module.css";

// Get country code from emoji flag
function getCountryCodeFromEmoji(emoji) {
  if (!emoji) return null;
  const codePoints = [...emoji]
    .map(char => char.codePointAt(0))
    .filter(cp => cp >= 127462 && cp <= 127487)
    .map(cp => String.fromCharCode(cp - 127397));
  if (codePoints.length === 2) {
    return codePoints.join('').toLowerCase();
  }
  return null;
}

function CountryItem({ country }) {
  const countryCode = getCountryCodeFromEmoji(country.emoji);
  const flagUrl = countryCode 
    ? `https://flagcdn.com/w80/${countryCode}.png`
    : null;

  return (
    <li className={styles.countryItem}>
      {flagUrl ? (
        <img src={flagUrl} alt={country.country} className={styles.flag} />
      ) : (
        <span>{country.emoji}</span>
      )}
      <span>{country.country}</span>
    </li>
  );
}

export default CountryItem;
