import { useParams } from "react-router-dom";
import styles from "./City.module.css";
import { useEffect, useState, useRef } from "react";
import { useCities } from "../contexts/CitiesContext";
import Spinner from "../components/Spinner";
import BackButton from "./BackButton";
import EditCity from "./EditCity";

import { useAuth } from "../contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL;

const formatDate = (date) => {
  if (!date) return "Unknown date";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(d);
};

// Helper to get flag emoji country code
function getCountryCodeFromEmoji(emoji) {
  if (!emoji) return null;
  const codePoints = [...emoji]
    .map(char => char.codePointAt(0))
    .filter(cp => cp >= 127462 && cp <= 127487)
    .map(cp => String.fromCharCode(cp - 127397));
  return codePoints.length === 2 ? codePoints.join('').toLowerCase() : null;
}

function City() {
  const { id } = useParams();
  const { user: authUser } = useAuth();
  const { getCity, currentCity, isLoading, updateCity } = useCities();
  
  // Check if current user has edit permissions (either owner or tour participant)
  const canEdit = currentCity?.canEdit;
  const isOwner = canEdit; // Renaming usage for compatibility with existing UI logic
  const [selectedImage, setSelectedImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (id) {
       getCity(id);
       setIsEditing(false);
    }
  }, [id, getCity]);

  // Convert file to base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  // Handle quick image upload
  async function handleQuickUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const existingImages = currentCity.images || [];
    const remainingSlots = 5 - existingImages.length;
    
    if (remainingSlots <= 0) {
      alert("Maximum 5 images allowed per city");
      return;
    }

    // Filter valid files
    const validFiles = files.slice(0, remainingSlots).filter(file => {
      if (!file.type.startsWith("image/")) return false;
      if (file.size > 5 * 1024 * 1024) return false;
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      setIsUploading(true);

      // Convert to base64
      const base64Images = await Promise.all(
        validFiles.map(file => fileToBase64(file))
      );

      // Upload to server
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/upload/city-images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ images: base64Images }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload");

      // Update city with new images
      const newImages = [...existingImages, ...data.images];
      await updateCity(id, { ...currentCity, images: newImages });

    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  if (isLoading || !currentCity) return <Spinner />;

  // Render Edit Form if in edit mode
  if (isEditing) {
      return <EditCity key={id} onCancel={() => setIsEditing(false)} />;
  }

  const { cityName, emoji, date, notes, images } = currentCity;
  const canAddMore = !images || images.length < 5;

  return (
    <div className={styles.city}>
      <div className={styles.row}>
        <h6>City name</h6>
        <h3>
          {getCountryCodeFromEmoji(emoji) ? (
            <img 
              src={`https://flagcdn.com/w40/${getCountryCodeFromEmoji(emoji)}.png`} 
              alt="flag" 
              className={styles.flagImage}
            />
          ) : (
            <span className={styles.emoji}>{emoji}</span>
          )}{" "}
          {cityName}
        </h3>
      </div>

      <div className={styles.row}>
        <h6>You went to {cityName} on</h6>
        <p>{formatDate(date)}</p>
      </div>

      {notes && (
        <div className={styles.row}>
          <h6>Your notes</h6>
          <p>{notes}</p>
        </div>
      )}

      {/* Photo Gallery Section */}
      <div className={styles.row}>
        <div className={styles.photoHeader}>
          <h6>Photos {images?.length > 0 && `(${images.length}/5)`}</h6>
          {isOwner && canAddMore && (
            <label className={styles.addPhotoBtn}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleQuickUpload}
                accept="image/*"
                multiple
                style={{ display: "none" }}
                disabled={isUploading}
              />
              {isUploading ? "Uploading..." : "+ Add Photos"}
            </label>
          )}
        </div>
        
        {images && images.length > 0 ? (
          <div className={styles.imageGallery}>
            {images.map((img, index) => (
              <div
                key={index}
                className={styles.imageThumb}
                onClick={() => setSelectedImage(img)}
              >
                <img src={img} alt={`${cityName} ${index + 1}`} />
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noPhotos}>
            No photos yet. Add some memories!
          </p>
        )}
      </div>

      {/* Image Modal/Lightbox */}
      {selectedImage && (
        <div
          className={styles.imageModal}
          onClick={() => setSelectedImage(null)}
        >
          <div className={styles.modalContent}>
            <img src={selectedImage} alt={cityName} />
            <button
              className={styles.closeModal}
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className={styles.row}>
        <h6>Learn more</h6>
        <a
          href={`https://en.wikipedia.org/wiki/${encodeURIComponent(cityName)}`}
          target="_blank"
          rel="noreferrer"
        >
          Check out {cityName} on Wikipedia &rarr;
        </a>
      </div>

      {/* Action Buttons */}
      <div className={styles.buttons}>
        {isOwner && (
          <button 
              className={`${styles.btn} ${styles.editBtn}`}
              onClick={() => setIsEditing(true)}
          >
              ✏️ Edit City
          </button>
        )}
        <BackButton />
      </div>
    </div>
  );
}

export default City;
