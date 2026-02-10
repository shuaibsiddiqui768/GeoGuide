import { useEffect, useState, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import styles from "./Form.module.css";
import Button from "./Button";
import BackButton from "./BackButton";
import { useUrlPosition } from "../hooks/useUrlPosition";
import Message from "../components/Message";
import Spinner from "../components/Spinner";
import { useCities } from "../contexts/CitiesContext";
import { useTours } from "../contexts/ToursContext";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

//convert ISO country code like IN into its flag emoji
export function convertToEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

//reverse-geocoding API from lat and lng we find the country
const BASE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

function Form() {
  const [lat, lng] = useUrlPosition();
  const { createCity, isLoading } = useCities();
  const { tours, addCityToTour } = useTours();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [isLoadingGeocoding, setIsLoadingGeocoding] = useState(false);
  const [cityName, setCityName] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [emoji, setEmoji] = useState("");
  const [geocodingError, setGeocodingError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTourId, setSelectedTourId] = useState("");
  
  // Image upload state
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  //runs whenever lat and lng changes
  useEffect(
    function () {
      if (!lat && !lng) return;
      async function fetchCityData() {
        try {
          setIsLoadingGeocoding(true);
          setGeocodingError("");
          const res = await fetch(
            `${BASE_URL}?latitude=${lat}&longitude=${lng}`
          );
          const data = await res.json();

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

  // Convert file to base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  // Handle image selection
  function handleImageSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 images
    const validFiles = files.slice(0, 5 - selectedImages.length).filter(file => {
      if (!file.type.startsWith("image/")) return false;
      if (file.size > 5 * 1024 * 1024) return false; // 5MB limit
      return true;
    });

    setSelectedImages(prev => [...prev, ...validFiles]);

    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Remove an image from selection
  function removeImage(index) {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }

  // Upload images to Cloudinary
  async function uploadImages() {
    if (selectedImages.length === 0) return [];

    const token = localStorage.getItem("token");
    const base64Images = await Promise.all(
      selectedImages.map(file => fileToBase64(file))
    );

    const res = await fetch(`${API_BASE}/upload/city-images`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ images: base64Images }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to upload images");
    
    return data.images; // Array of URLs
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    if (!cityName || !date || !lat || !lng) return;

    const isoDate =
      date instanceof Date && !Number.isNaN(date.getTime())
        ? date.toISOString()
        : null;
    if (!isoDate) return;

    try {
      setIsSubmitting(true);

      // Upload images first if any
      let imageUrls = [];
      if (selectedImages.length > 0) {
        setIsUploadingImages(true);
        imageUrls = await uploadImages();
        setIsUploadingImages(false);
      }

      const newCity = {
        cityName,
        country,
        emoji,
        date: isoDate,
        notes,
        position: { lat: Number(lat), lng: Number(lng) },
        images: imageUrls, // Add images to city data
      };

      const createdCity = await createCity(newCity);
      
      // If a tour is selected, add the city to that tour
      if (selectedTourId && createdCity && createdCity._id) {
        try {
          await addCityToTour(selectedTourId, createdCity._id);
        } catch (err) {
          console.error("Failed to add city to tour:", err);
        }
      }
      
      navigate("/app/cities");
    } finally {
      setIsSubmitting(false);
      setIsUploadingImages(false);
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

      {/* Image Upload Section */}
      <div className={styles.row}>
        <label>
          <span className={styles.tourIcon}>📷</span> Add Photos (optional, max 5)
        </label>
        
        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className={styles.imagePreviews}>
            {imagePreviews.map((preview, index) => (
              <div key={index} className={styles.imagePreview}>
                <img src={preview} alt={`Preview ${index + 1}`} />
                <button
                  type="button"
                  className={styles.removeImageBtn}
                  onClick={() => removeImage(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Add Image Button */}
        {selectedImages.length < 5 && (
          <div className={styles.imageUpload}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              multiple
              className={styles.fileInput}
              id="cityImages"
            />
            <label htmlFor="cityImages" className={styles.uploadLabel}>
              <span>+</span> Add Photos
            </label>
          </div>
        )}
      </div>

      {/* Tour Selection Section */}
      <div className={styles.row}>
        <label htmlFor="tour">
          <span className={styles.tourIcon}>🗺️</span> Add to Trip / Tour (optional)
        </label>
        
        {tours.length > 0 ? (
          <select
            id="tour"
            value={selectedTourId}
            onChange={(e) => setSelectedTourId(e.target.value)}
            className={styles.select}
          >
            <option value="">-- No Tour --</option>
            {tours.map((tour) => (
              <option key={tour._id} value={tour._id}>
                {tour.name} ({tour.cities?.length || 0} stops)
              </option>
            ))}
          </select>
        ) : (
          <p className={styles.noToursMessage}>
            No trips found. Create a trip in the 
            <span style={{color: "var(--color-brand--2)", cursor: "pointer", marginLeft: "4px"}} onClick={() => navigate("/app/tours")}>
              Trips section
            </span> first.
          </p>
        )}
      </div>

      <div className={styles.buttons}>
        <Button type="primary" disabled={isSubmitting || isLoading}>
          {isUploadingImages 
            ? "Uploading images..." 
            : isSubmitting 
            ? "Adding..." 
            : "Add"}
        </Button>
        <BackButton />
      </div>
    </form>
  );
}

export default Form;
