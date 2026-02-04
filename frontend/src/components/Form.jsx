import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import styles from "./Form.module.css";
import Button from "./Button";
import BackButton from "./BackButton";
import { useUrlPosition } from "../hooks/useUrlPosition";
import Message from "../components/Message";
import Spinner from "../components/Spinner";
import { useCities } from "../contexts/CitiesContext";
import { useNavigate } from "react-router-dom";

//convert ISO country code like IN into its flag emoji
export function convertToEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());//adding 127462 beacuse "Regional indicator symbols" starts from it 
  return String.fromCodePoint(...codePoints);//Turns those code points into actual Unicode characters.
}

//reverse-geocoding API from lat and lng we find the country
const BASE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

function Form() {
  const [lat, lng] = useUrlPosition();
  const { createCity, isLoading } = useCities();
  const navigate = useNavigate();//for url manipulation

  const [isLoadingGeocoding, setIsLoadingGeocoding] = useState(false);
  const [cityName, setCityName] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [emoji, setEmoji] = useState("");
  const [geocodingError, setGeocodingError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  //runs whenever lat and lng changes
  useEffect(
    function () {
      if (!lat && !lng) return;
      async function fetchCityData() {
        try {
          setIsLoadingGeocoding(true);
          setGeocodingError("");
          // call reverse-geocode api
          const res = await fetch(
            `${BASE_URL}?latitude=${lat}&longitude=${lng}`
          );
          const data = await res.json();

          //if country code missing returns invalid
          if (!data.countryCode)
            throw new Error(
              "That doesn't seem to be a city. Click somewhere else"
            );

          setCityName(data.city || data.locality || "");
          setCountry(data.countryName);
          setEmoji(convertToEmoji(data.countryCode));
        } catch (err) {
          setGeocodingError(err.message);
        } finally {
          setIsLoadingGeocoding(false);
        }
      }
      fetchCityData();
    },
    [lat, lng]
  );

async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    if (!cityName || !date || !lat || !lng) return;

    // Ensure valid date string and numeric coords
    const isoDate =
      date instanceof Date && !Number.isNaN(date.getTime())
        ? date.toISOString()
        : null;
    if (!isoDate) return;

    const newCity = {
      cityName,
      country,
      emoji,
      date: isoDate,
      notes,
      position: { lat: Number(lat), lng: Number(lng) }, // ensure numbers
    };

    try {
      setIsSubmitting(true);
      await createCity(newCity);
      navigate("/app/cities");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingGeocoding) return <Spinner />;

  if (!lat && !lng)
    return <Message message="Start by clicking somewhere on the map" />;

  if (geocodingError) return <Message message={geocodingError} />;

  return (
    <form
      className={`${styles.form}${
        isLoading || isSubmitting ? " " + styles.loading : ""
      }`}
      onSubmit={handleSubmit}
    >
      <div className={styles.row}>
        <label htmlFor="cityName">City name</label>
        <input
          id="cityName"
          onChange={(e) => setCityName(e.target.value)}
          value={cityName}
          placeholder="City"
        />
        <span className={styles.flag}>{emoji}</span>
      </div>

      <div className={styles.row}>
        <label htmlFor="date">
          When did you go to {cityName || "the city"}?
        </label>
        <DatePicker
          id="date"
          onChange={(val) => setDate(val)}
          selected={date}
          dateFormat="dd/MM/yyyy"
          maxDate={new Date()}
          isClearable={false}
          placeholderText="Select date visited"
        />
      </div>

      <div className={styles.row}>
        <label htmlFor="notes">
          Notes about your trip to {cityName || "the city"}
        </label>
        <textarea
          id="notes"
          onChange={(e) => setNotes(e.target.value)}
          value={notes}
          placeholder="Optional notes"
          rows={3}
        />
      </div>

      <div className={styles.buttons}>
        <Button type="primary" disabled={isSubmitting || isLoading}>
          {isSubmitting ? "Adding..." : "Add"}
        </Button>
        <BackButton />
      </div>
    </form>
  );
}

export default Form;
