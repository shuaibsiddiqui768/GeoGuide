import { useEffect, useState, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useParams, useNavigate } from "react-router-dom";

import styles from "./Form.module.css";
import Button from "./Button";
import Spinner from "../components/Spinner";
import { useCities } from "../contexts/CitiesContext";
import { useTours } from "../contexts/ToursContext";

const API_BASE = import.meta.env.VITE_API_URL;

function EditCity({ onCancel }) {
  const { id } = useParams();
  const { currentCity, updateCity, isLoading } = useCities();
  const { tours, addCityToTour, removeCityFromTour } = useTours();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Image management state
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]); // File objects
  const [newPreviews, setNewPreviews] = useState([]); // Base64 strings

  // Trip management state
  const [selectedTourId, setSelectedTourId] = useState("");
  const [initialTourId, setInitialTourId] = useState("");

  // Set form state when currentCity loads
  useEffect(() => {
    if (currentCity) {
      if (currentCity.date) setDate(new Date(currentCity.date));
      if (currentCity.notes) setNotes(currentCity.notes);
      if (currentCity.images) setExistingImages(currentCity.images);
      
      // Find which tour this city belongs to (if any)
      const currentTour = tours.find(t => t.cities.some(c => (c._id || c) === id));
      if (currentTour) {
        setSelectedTourId(currentTour._id);
        setInitialTourId(currentTour._id);
      }
    }
  }, [currentCity, tours, id]);

  // Convert file to base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  // Handle new image selection
  function handleImageSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Calculate how many more we can add (max 5 total)
    const currentTotal = existingImages.length + newImages.length;
    const remainingSlots = 5 - currentTotal;
    
    if (remainingSlots <= 0) return;

    const validFiles = files.slice(0, remainingSlots).filter(file => {
      if (!file.type.startsWith("image/")) return false;
      if (file.size > 5 * 1024 * 1024) return false; // 5MB limit
      return true;
    });

    setNewImages(prev => [...prev, ...validFiles]);

    // Generate previews for new files
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewPreviews(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Remove existing image
  function removeExistingImage(index) {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  }

  // Remove new image
  function removeNewImage(index) {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  }

  // Upload images to Cloudinary
  async function uploadImages() {
    if (newImages.length === 0) return [];

    const token = localStorage.getItem("token");
    const base64Images = await Promise.all(
      newImages.map(file => fileToBase64(file))
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

    if (!date) return;

    const isoDate =
      date instanceof Date && !Number.isNaN(date.getTime())
        ? date.toISOString()
        : null;
    if (!isoDate) return;

    try {
      setIsSubmitting(true);

      // Upload new images if any
      let uploadedUrls = [];
      if (newImages.length > 0) {
        setIsUploadingImages(true);
        uploadedUrls = await uploadImages();
        setIsUploadingImages(false);
      }

      // Combine existing images (that weren't deleted) with new uploaded images
      const finalImages = [...existingImages, ...uploadedUrls];

      const updatedData = {
        ...currentCity,
        date: isoDate,
        notes,
        images: finalImages,
      };

      await updateCity(id, updatedData);

      // Handle trip changes
      if (selectedTourId !== initialTourId) {
        // Remove from old tour if it existed
        if (initialTourId) {
          try {
            await removeCityFromTour(initialTourId, id);
          } catch (err) {
            console.error("Failed to remove city from old tour:", err);
          }
        }
        
        // Add to new tour if selected
        if (selectedTourId) {
          try {
            await addCityToTour(selectedTourId, id);
          } catch (err) {
            console.error("Failed to add city to new tour:", err);
          }
        }
      }

      onCancel?.();
    } catch (err) {
        console.error("Update failed", err);
    } finally {
      setIsSubmitting(false);
      setIsUploadingImages(false);
    }
  }

  if (isLoading || !currentCity) return <Spinner />;

  const isFull = existingImages.length + newImages.length >= 5;

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
          value={currentCity.cityName}
          disabled
          className={styles.inputDisabled}
        />
         <span className={styles.flag}>{currentCity.emoji}</span>
      </div>

      <div className={styles.row}>
        <label htmlFor="date">
          When did you go to {currentCity.cityName}?
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
          Notes about your trip to {currentCity.cityName}
        </label>
        <textarea
          id="notes"
          onChange={(e) => setNotes(e.target.value)}
          value={notes}
          placeholder="Optional notes"
          rows={3}
        />
      </div>

      {/* Image Edit Section */}
      <div className={styles.row}>
        <label>
          <span className={styles.tourIcon}>📷</span> Photos (max 5)
        </label>
        
        <div className={styles.imagePreviews}>
          {/* Existing Images */}
          {existingImages.map((url, index) => (
            <div key={`existing-${index}`} className={styles.imagePreview}>
              <img src={url} alt={`Existing ${index + 1}`} />
              <button
                type="button"
                className={styles.removeImageBtn}
                onClick={() => removeExistingImage(index)}
              >
                ✕
              </button>
            </div>
          ))}

          {/* New Previews */}
          {newPreviews.map((preview, index) => (
            <div key={`new-${index}`} className={styles.imagePreview}>
              <img src={preview} alt={`New ${index + 1}`} />
              <button
                type="button"
                className={styles.removeImageBtn}
                onClick={() => removeNewImage(index)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        
        {/* Add Image Button */}
        {!isFull && (
          <div className={styles.imageUpload}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              multiple
              className={styles.fileInput}
              id="cityImagesEdit"
            />
            <label htmlFor="cityImagesEdit" className={styles.uploadLabel}>
              <span>+</span> Add Photos
            </label>
          </div>
        )}
      </div>

      {/* Trip / Tour Selection Section */}
      <div className={styles.row}>
        <label htmlFor="tour">
          <span className={styles.tourIcon}>🗺️</span> Trip / Tour (optional)
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
            ? "Uploading..." 
            : isSubmitting 
            ? "Saving..." 
            : "Save Changes"}
        </Button>
        <Button
            type="back"
            onClick={(e) => {
              e.preventDefault();
              onCancel?.();
            }}
            disabled={isSubmitting}
        >
            &larr; Cancel
        </Button>
      </div>
    </form>
  );
}

export default EditCity;
