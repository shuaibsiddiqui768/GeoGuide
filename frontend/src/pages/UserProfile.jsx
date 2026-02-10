import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import styles from "./UserProfile.module.css";
import PageNav from "../components/PageNav";
import Spinner from "../components/Spinner";
import { useSocial } from "../contexts/SocialContext";

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

function UserProfile() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const {
    getUserProfile,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    removeFriend,
  } = useSocial();

  const [profile, setProfile] = useState(null);
  const [cities, setCities] = useState([]);
  const [tours, setTours] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Slider State
  const [showLightbox, setShowLightbox] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [filterCity, setFilterCity] = useState(null);
  const [isTripsExpanded, setIsTripsExpanded] = useState(false);
  const [isCitiesExpanded, setIsCitiesExpanded] = useState(false);
  const [visiblePhotosLimit, setVisiblePhotosLimit] = useState(4);

  // Fetch profile and data
  useEffect(() => {
    async function fetchProfileData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // 1. Get Profile Info
        const data = await getUserProfile(identifier);
        if (!data) {
          setError("User not found");
          return;
        }
        setProfile(data);

        // 2. If friends, self, or public - fetch their cities and tours
        if (data.status === "friends" || data.status === "self" || data.isPublic) {
          await Promise.all([
            fetchUserCities(data._id),
            fetchUserTours(data._id)
          ]);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfileData();
  }, [identifier, getUserProfile]);

  async function fetchUserCities(userId) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/cities?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCities(data.data || data || []);
      }
    } catch (err) {
      console.error("Failed to fetch cities:", err);
    }
  }

  async function fetchUserTours(userId) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/tours?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTours(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch tours:", err);
    }
  }

  async function handleSendRequest() {
    try {
      setActionLoading(true);
      const result = await sendFriendRequest(profile._id);
      setProfile(prev => ({ ...prev, status: result.status }));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelRequest() {
    try {
      setActionLoading(true);
      await cancelFriendRequest(profile._id);
      setProfile(prev => ({ ...prev, status: "stranger" }));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAccept() {
    try {
      setActionLoading(true);
      await acceptFriendRequest(profile._id);
      setProfile(prev => ({ ...prev, status: "friends" }));
      await Promise.all([
        fetchUserCities(profile._id),
        fetchUserTours(profile._id)
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemove() {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;
    try {
      setActionLoading(true);
      await removeFriend(profile._id);
      setProfile(prev => ({ ...prev, status: "stranger" }));
      setCities([]);
      setTours([]);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  function getInitial() {
    return profile?.name?.charAt(0)?.toUpperCase() || "U";
  }

  // Collect all photos from cities
  const allPhotos = cities
    ? cities.flatMap(city => (city.images || []).map(img => ({
        url: img,
        cityName: city.cityName,
        country: city.country
      })))
    : [];

  const filteredPhotos = filterCity 
    ? allPhotos.filter(p => p.cityName === filterCity)
    : allPhotos;

  // Reset photo limit when filter changes
  useEffect(() => {
    setVisiblePhotosLimit(4);
  }, [filterCity]);

  const totalCountries = [...new Set(cities.map(c => c.country))].length;

  // Slider controls
  function openLightbox(index) {
    setActiveIndex(index);
    setShowLightbox(true);
    document.body.style.overflow = "hidden"; // Prevent scrolling
  }

  const closeLightbox = useCallback(() => {
    setShowLightbox(false);
    document.body.style.overflow = "auto";
  }, []);

  const prevPhoto = useCallback((e) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? filteredPhotos.length - 1 : prev - 1));
  }, [filteredPhotos.length]);

  const nextPhoto = useCallback((e) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === filteredPhotos.length - 1 ? 0 : prev + 1));
  }, [filteredPhotos.length]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (!showLightbox) return;
      if (e.key === "ArrowLeft") prevPhoto(e);
      if (e.key === "ArrowRight") nextPhoto(e);
      if (e.key === "Escape") closeLightbox();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLightbox, prevPhoto, nextPhoto, closeLightbox]);

  function renderActionButton() {
    if (actionLoading) {
      return <button className={styles.loadingBtn} disabled>Loading...</button>;
    }

    switch (profile?.status) {
      case "self":
        return (
          <button className={styles.editBtn} onClick={() => navigate("/settings")}>
            ✏️ Edit Profile
          </button>
        );
      case "friends":
        return (
          <button className={styles.removeBtn} onClick={handleRemove}>
            Remove Friend
          </button>
        );
      case "request_sent":
        return (
          <button className={styles.cancelBtn} onClick={handleCancelRequest}>
            Cancel Request
          </button>
        );
      case "request_received":
        return (
          <div className={styles.requestActions}>
            <button className={styles.acceptBtn} onClick={handleAccept}>
              ✓ Accept
            </button>
            <button className={styles.rejectBtn} onClick={handleCancelRequest}>
              ✕ Reject
            </button>
          </div>
        );
      default:
        return (
          <button className={styles.addBtn} onClick={handleSendRequest}>
            + Add Friend
          </button>
        );
    }
  }

  if (isLoading) {
    return (
      <main className={styles.userProfile}>
        <PageNav />
        <div className={styles.loading}>
          <Spinner />
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className={styles.userProfile}>
        <PageNav />
        <div className={styles.error}>
          <h2>😕 {error || "User not found"}</h2>
          <Link to="/search" className={styles.backLink}>
            ← Back to Search
          </Link>
        </div>
      </main>
    );
  }

  const canSeeDetails = profile.status === "friends" || profile.status === "self" || profile.isPublic;

  return (
    <main className={styles.userProfile}>
      <PageNav />

      <section className={styles.container}>
        {/* Profile Header */}
        <div className={styles.header}>
          <div className={styles.avatar}>
            {profile.profileImage ? (
              <img src={profile.profileImage} alt={profile.name} />
            ) : (
              <span>{getInitial()}</span>
            )}
          </div>

          <div className={styles.info}>
            <h1 className={styles.name}>{profile.name}</h1>
            {profile.username && (
              <span className={styles.username}>@{profile.username}</span>
            )}
            {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
            {profile.createdAt && (
              <p className={styles.memberSince}>
                🗓️ Member since {formatDate(profile.createdAt)}
              </p>
            )}
          </div>

          <div className={styles.action}>
            {renderActionButton()}
          </div>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{profile.friendsCount || 0}</span>
            <span className={styles.statLabel}>Friends</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{cities.length}</span>
            <span className={styles.statLabel}>Cities</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{totalCountries}</span>
            <span className={styles.statLabel}>Countries</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{tours.length}</span>
            <span className={styles.statLabel}>Trips</span>
          </div>
        </div>

        {!canSeeDetails ? (
          <div className={styles.private}>
            <span className={styles.lockIcon}>🔒</span>
            <h2>This profile is private</h2>
            <p>Send a friend request to see their travel details</p>
          </div>
        ) : (
          <div className={styles.content}>
            {/* Recent Trips */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>✈️ Recent Trips</h2>
                  {tours.length > 2 && (
                    <button 
                      className={styles.toggleBtn}
                      onClick={() => setIsTripsExpanded(!isTripsExpanded)}
                    >
                      {isTripsExpanded ? "Show Less" : `View All (${tours.length})`}
                    </button>
                  )}
                </div>
                {tours.length > 0 ? (
                  <div className={styles.tripList}>
                    {(isTripsExpanded ? tours : tours.slice(0, 2)).map(tour => (
                      <div key={tour._id} className={styles.tripCard}>
                        <div className={styles.tripInfo}>
                          <h3>{tour.name}</h3>
                          <p>{tour.description}</p>
                          <span className={styles.tripDate}>
                            {tour.startDate ? new Date(tour.startDate).toLocaleDateString() : 'TBA'} - 
                            {tour.endDate ? new Date(tour.endDate).toLocaleDateString() : 'TBA'}
                          </span>
                        </div>
                        <div className={styles.tripCities}>
                          {tour.cities?.map(city => (
                            <span key={city._id} className={styles.cityBadge}>{city.cityName}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noDataText}>No trips shared yet.</p>
                )}
              </div>

            {/* Cities Section */}
            {cities.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>📍 Visited Cities</h2>
                  {cities.length > 8 && (
                    <button 
                      className={styles.toggleBtn}
                      onClick={() => setIsCitiesExpanded(!isCitiesExpanded)}
                    >
                      {isCitiesExpanded ? "Show Less" : `View All (${cities.length})`}
                    </button>
                  )}
                </div>
                <div className={styles.cityGrid}>
                  {(isCitiesExpanded ? cities : cities.slice(0, 8)).map((city) => {
                    const countryCode = getCountryCodeFromEmoji(city.emoji);
                    const flagUrl = countryCode 
                      ? `https://flagcdn.com/w80/${countryCode}.png`
                      : null;

                    return (
                      <div 
                        key={city._id} 
                        className={`${styles.cityCard} ${filterCity === city.cityName ? styles.selectedCity : ""}`}
                        onClick={() => setFilterCity(city.cityName === filterCity ? null : city.cityName)}
                        style={{ cursor: "pointer" }}
                      >
                        {flagUrl ? (
                          <div className={styles.flagContainerMini}>
                            <img src={flagUrl} alt={city.country} className={styles.flagImgMini} />
                          </div>
                        ) : (
                          <span className={styles.cityEmoji}>{city.emoji}</span>
                        )}
                        <div className={styles.cityInfo}>
                          <span className={styles.cityName}>{city.cityName}</span>
                          <span className={styles.cityCountry}>{city.country}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Photos Section */}
            <div className={styles.section}>
              <div className={styles.sectionTitleHeader}>
                <h2 className={styles.sectionTitle}>
                  📸 Photos {filterCity && ` - ${filterCity}`}
                </h2>
                {filterCity && (
                  <button 
                    className={styles.clearFilterBtn}
                    onClick={() => setFilterCity(null)}
                  >
                    Show All
                  </button>
                )}
              </div>
              
              {filteredPhotos.length > 0 ? (
                <>
                  <div className={styles.photoGrid}>
                    {filteredPhotos.slice(0, visiblePhotosLimit).map((photo, i) => (
                      <div key={i} className={styles.photoCard} onClick={() => openLightbox(i)}>
                        <img src={photo.url} alt={`${photo.cityName}, ${photo.country}`} />
                        <div className={styles.photoOverlay}>
                          <span>{photo.cityName}, {photo.country}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {visiblePhotosLimit < filteredPhotos.length && (
                    <div className={styles.loadMoreContainer}>
                      <button 
                        className={styles.viewMoreBtn}
                        onClick={() => setVisiblePhotosLimit(prev => prev + 4)}
                      >
                        View More Photos ({filteredPhotos.length - visiblePhotosLimit} left)
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className={styles.noDataText}>
                  {filterCity ? `No photos found for ${filterCity}.` : "No images uploaded yet."}
                </p>
              )}
            </div>

            {cities.length === 0 && tours.length === 0 && (
              <div className={styles.empty}>
                <p>No travel activity found for this user.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Fullscreen Photo Lightbox/Slider */}
      {showLightbox && filteredPhotos.length > 0 && (
        <div className={styles.lightbox} onClick={closeLightbox}>
          <button className={styles.closeBtn} onClick={closeLightbox}>✕</button>
          
          <button className={styles.navBtnPrev} onClick={prevPhoto}>
            ‹
          </button>
          
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <img 
              src={filteredPhotos[activeIndex].url} 
              alt={filteredPhotos[activeIndex].cityName} 
              className={styles.lightboxImg}
            />
            <div className={styles.lightboxCaption}>
              <h3>{filteredPhotos[activeIndex].cityName}, {filteredPhotos[activeIndex].country}</h3>
              <p>{activeIndex + 1} / {filteredPhotos.length}</p>
            </div>
          </div>
          
          <button className={styles.navBtnNext} onClick={nextPhoto}>
            ›
          </button>
        </div>
      )}
    </main>
  );
}

export default UserProfile;
