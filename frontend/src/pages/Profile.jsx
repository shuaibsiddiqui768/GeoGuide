import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Profile.module.css";
import PageNav from "../components/PageNav";
import Spinner from "../components/Spinner";
import { useAuth } from "../contexts/AuthContext";
import { useCities } from "../contexts/CitiesContext";
import { useTours } from "../contexts/ToursContext";

const API_BASE = import.meta.env.VITE_API_URL;

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

function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { cities, isLoading: citiesLoading } = useCities();
  const { tours, isLoading: toursLoading } = useTours();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Filter states
  const [filterCity, setFilterCity] = useState("");
  const [filterCountry, setFilterCountry] = useState("");

  // Fetch fresh user profile data
  useEffect(() => {
    async function fetchProfile() {
      if (!isAuthenticated) return;
      
      try {
        setIsLoadingProfile(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          setProfileData(data.user || data);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    
    fetchProfile();
  }, [isAuthenticated]);

  // Calculate stats
  const totalCities = cities.length;
  const totalCountries = [...new Set(cities.map(c => c.country))].length;
  const totalTrips = tours.length;
  
  // Get unique cities and countries for filter options
  const uniqueCities = useMemo(() => 
    [...new Set(cities.map(c => c.cityName))].sort(),
    [cities]
  );
  
  const uniqueCountries = useMemo(() => 
    [...new Set(cities.map(c => c.country))].filter(Boolean).sort(),
    [cities]
  );
  
  // Get all photos from cities with filter support
  const allPhotos = useMemo(() => {
    return cities
      .filter(c => {
        if (filterCity && c.cityName !== filterCity) return false;
        if (filterCountry && c.country !== filterCountry) return false;
        return c.images && c.images.length > 0;
      })
      .flatMap(c => c.images.map(img => ({ 
        url: img, 
        city: c.cityName,
        country: c.country,
        emoji: c.emoji
      })));
  }, [cities, filterCity, filterCountry]);

  // Get user initial
  function getUserInitial() {
    const displayUser = profileData || user;
    if (displayUser?.name) return displayUser.name.charAt(0).toUpperCase();
    if (displayUser?.email) return displayUser.email.charAt(0).toUpperCase();
    return "U";
  }

  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  // Clear filters
  function clearFilters() {
    setFilterCity("");
    setFilterCountry("");
  }

  const displayUser = profileData || user;
  const isLoading = isLoadingProfile || citiesLoading || toursLoading;
  const hasActiveFilters = filterCity || filterCountry;

  if (isLoading && !displayUser) {
    return (
      <main className={styles.profile}>
        <PageNav />
        <div className={styles.loadingContainer}>
          <Spinner />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.profile}>
      <PageNav />
      
      <section className={styles.profileContainer}>
        {/* Profile Header */}
        <div className={styles.header}>
          <div className={styles.avatar}>
            {displayUser?.profileImage ? (
              <img src={displayUser.profileImage} alt="Profile" />
            ) : (
              <span className={styles.initial}>{getUserInitial()}</span>
            )}
          </div>
          
          <div className={styles.userInfo}>
            <h1 className={styles.name}>{displayUser?.name || "Traveler"}</h1>
            {displayUser?.username && (
              <span className={styles.userHandle}>@{displayUser.username}</span>
            )}
            <p className={styles.email}>{displayUser?.email}</p>
            <p className={styles.bio}>
              {displayUser?.bio || "✈️ Exploring the world one city at a time"}
            </p>
            {displayUser?.createdAt && (
              <p className={styles.memberSince}>
                🗓️ Member since {formatDate(displayUser.createdAt)}
              </p>
            )}
          </div>

          <button 
            className={styles.editBtn}
            onClick={() => navigate("/settings")}
          >
            ✏️ Edit Profile
          </button>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🏙️</span>
            <span className={styles.statNumber}>{totalCities}</span>
            <span className={styles.statLabel}>Cities Visited</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🌎</span>
            <span className={styles.statNumber}>{totalCountries}</span>
            <span className={styles.statLabel}>Countries</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>✈️</span>
            <span className={styles.statNumber}>{totalTrips}</span>
            <span className={styles.statLabel}>Trips</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>👥</span>
            <span className={styles.statNumber}>{displayUser?.friends?.length || 0}</span>
            <span className={styles.statLabel}>Friends</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📷</span>
            <span className={styles.statNumber}>{allPhotos.length}</span>
            <span className={styles.statLabel}>Photos</span>
          </div>
        </div>

        {/* Recent Cities - Moved Up */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>📍 Recent Cities</h2>
            {cities.length > 0 && (
              <Link to="/app/cities" className={styles.viewAll}>
                View All →
              </Link>
            )}
          </div>
          {cities.length > 0 ? (
            <div className={styles.cityGrid}>
              {cities.slice(0, 6).map((city) => {
                const countryCode = getCountryCodeFromEmoji(city.emoji);
                const flagUrl = countryCode 
                  ? `https://flagcdn.com/w80/${countryCode}.png`
                  : null;
                
                return (
                  <Link 
                    key={city._id} 
                    className={styles.cityCard}
                    to={`/app/cities/${city._id}?lat=${city.position?.lat || 0}&lng=${city.position?.lng || 0}`}
                  >
                    {city.images && city.images.length > 0 ? (
                      <img src={city.images[0]} alt={city.cityName} className={styles.cityImage} />
                    ) : flagUrl ? (
                      <div className={styles.flagContainer}>
                        <img 
                          src={flagUrl} 
                          alt={`${city.country} flag`} 
                          className={styles.flagImage}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className={styles.cityEmoji}>{city.emoji}</div>
                    )}
                    <span className={styles.cityName}>{city.cityName}</span>
                    <span className={styles.cityCountry}>{city.country}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className={styles.emptyMessage}>
              No cities visited yet. Start exploring! 🗺️
            </p>
          )}
        </div>

        {/* Recent Trips - Moved Up */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>✈️ Recent Trips</h2>
            {tours.length > 0 && (
              <Link to="/app/tours" className={styles.viewAll}>
                View All →
              </Link>
            )}
          </div>
          {tours.length > 0 ? (
            <div className={styles.tripGrid}>
              {tours.slice(0, 4).map((tour) => (
                <Link 
                  key={tour._id} 
                  className={styles.tripCard}
                  to={`/app/tours/${tour._id}`}
                >
                  <span className={styles.tripIcon}>🗺️</span>
                  <span className={styles.tripName}>{tour.name}</span>
                  <span className={styles.tripCities}>
                    {tour.cities?.length || 0} cities
                  </span>
                  {tour.startDate && (
                    <span className={styles.tripDate}>
                      {formatDate(tour.startDate)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.emptyMessage}>
              No trips planned yet. Create your first adventure! ✨
            </p>
          )}
        </div>

        {/* Photo Gallery with Filters */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>📸 Photo Gallery</h2>
            {hasActiveFilters && (
              <button onClick={clearFilters} className={styles.clearFilters}>
                Clear Filters ✕
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className={styles.filterBar}>
            <div className={styles.filterGroup}>
              <label>Filter by City:</label>
              <select 
                value={filterCity} 
                onChange={(e) => setFilterCity(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Cities</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <label>Filter by Country:</label>
              <select 
                value={filterCountry} 
                onChange={(e) => setFilterCountry(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Countries</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>

          {allPhotos.length > 0 ? (
            <>
              <div className={styles.photoGrid}>
                {allPhotos.slice(0, 12).map((photo, index) => (
                  <div 
                    key={index} 
                    className={styles.photoCard}
                    onClick={() => setSelectedImage(photo)}
                  >
                    <img src={photo.url} alt={photo.city} />
                    <span className={styles.photoCity}>{photo.city}</span>
                  </div>
                ))}
              </div>
              {allPhotos.length > 12 && (
                <p className={styles.morePhotos}>
                  And {allPhotos.length - 12} more photos...
                </p>
              )}
            </>
          ) : (
            <p className={styles.emptyMessage}>
              {hasActiveFilters 
                ? "No photos match your filters. Try adjusting them! 🔍"
                : "No photos uploaded yet. Add some memories! 📷"}
            </p>
          )}
        </div>

        {/* Image Lightbox */}
        {selectedImage && (
          <div 
            className={styles.lightbox}
            onClick={() => setSelectedImage(null)}
          >
            <div className={styles.lightboxContent}>
              <img src={selectedImage.url} alt={selectedImage.city} />
              <p className={styles.lightboxCaption}>
                {selectedImage.city}, {selectedImage.country}
              </p>
              <button 
                className={styles.closeLightbox}
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default Profile;
