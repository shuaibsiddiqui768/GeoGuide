import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import styles from "./Tour.module.css";
import { useTours } from "../contexts/ToursContext";
import { useAuth } from "../contexts/AuthContext";
import Spinner from "./Spinner";
import Message from "./Message";
import BackButton from "./BackButton";

function Tour() {
  const { id } = useParams();
  const { user } = useAuth();
  const { currentTour, getTour, isLoading, removeCityFromTour, setActiveTour, respondToInvite } = useTours();

  useEffect(() => {
    getTour(id);
    // Set this as active tour to show route on map
    setActiveTour?.(id);
    
    return () => {
      // Clear active tour when leaving
      setActiveTour?.(null);
    };
  }, [id, getTour, setActiveTour]);

  async function handleRemoveCity(e, cityId) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await removeCityFromTour(id, cityId);
    } catch (err) {
      console.error("Failed to remove city:", err);
    }
  }

  if (isLoading) return <Spinner />;

  if (!currentTour) return <Message message="Trip not found" />;

  const tourCities = currentTour.cities || [];

  // Format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate trip duration
  const getDuration = () => {
    if (!currentTour.startDate || !currentTour.endDate) return null;
    const start = new Date(currentTour.startDate);
    const end = new Date(currentTour.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} day${days !== 1 ? "s" : ""}`;
  };

  return (
    <div className={styles.tour}>
       {/* Invitation Banner */}
       {currentTour.pendingInvites?.some(p => p._id === user?._id) && (
        <div className={styles.inviteBanner}>
          <p>You have been invited to this trip!</p>
          <div className={styles.bannerActions}>
            <button 
              className={styles.acceptBtn}
              onClick={() => respondToInvite(currentTour._id, "accept")}
            >
              Accept Join
            </button>
            <button 
              className={styles.rejectBtn}
              onClick={() => respondToInvite(currentTour._id, "reject")}
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.tourIcon}>✈️</div>
        <div className={styles.tourInfo}>
          <h2 className={styles.tourName}>{currentTour.name}</h2>
          {currentTour.description && (
            <p className={styles.tourDescription}>{currentTour.description}</p>
          )}
        </div>
      </div>

      {/* Trip Details */}
      <div className={styles.detailsGrid}>
        {/* Dates */}
        {(currentTour.startDate || currentTour.endDate) && (
          <div className={styles.detailCard}>
            <span className={styles.detailIcon}>📅</span>
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Dates</span>
              <span className={styles.detailValue}>
                {formatDate(currentTour.startDate)} 
                {currentTour.endDate && ` - ${formatDate(currentTour.endDate)}`}
              </span>
              {getDuration() && <span className={styles.detailSub}>{getDuration()}</span>}
            </div>
          </div>
        )}

        {/* Budget */}
        {currentTour.budget > 0 && (
          <div className={styles.detailCard}>
            <span className={styles.detailIcon}>💰</span>
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Budget</span>
              <span className={styles.detailValue}>
                {currentTour.currency} {currentTour.budget.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Cities Count */}
        <div className={styles.detailCard}>
          <span className={styles.detailIcon}>🏙️</span>
          <div className={styles.detailContent}>
            <span className={styles.detailLabel}>Destinations</span>
            <span className={styles.detailValue}>
              {tourCities.length} cit{tourCities.length !== 1 ? "ies" : "y"}
            </span>
          </div>
        </div>
      </div>

      {/* Participants Display */}
      {(() => {
        // Combine owner and participants
        const owner = currentTour.user;
        const accepted = currentTour.participants || [];
        const pending = currentTour.pendingInvites || [];
        
        // Filter out owner from participants if present (shouldn't be, but safer)
        const participants = accepted.filter(p => p._id !== owner?._id);
        
        const allMates = owner ? [owner, ...participants] : participants;
        
        return (
          <>
            {/* Accepted Mates */}
            {allMates.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>👥 Trip Mates</h3>
                <div className={styles.participantsList}>
                  {allMates.map((person) => (
                    <div key={person._id} className={styles.participant} title={person.name}>
                      {person.profileImage ? (
                        <img 
                          src={person.profileImage} 
                          alt={person.name} 
                          className={`${styles.participantImg} ${person._id === owner?._id ? styles.ownerImg : ''}`} 
                        />
                      ) : (
                        <div className={`${styles.participantInitial} ${person._id === owner?._id ? styles.ownerInitial : ''}`}>
                          {person.name?.[0]}
                        </div>
                      )}
                      <span className={styles.participantName}>
                        {person.name}
                        {person._id === owner?._id && " 👑"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Invites */}
            {pending.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>⏳ Pending Invites</h3>
                <div className={styles.participantsList}>
                  {pending.map((person) => (
                    <div key={person._id} className={`${styles.participant} ${styles.pendingParticipant}`} title={person.name}>
                       {person.profileImage ? (
                        <img src={person.profileImage} alt={person.name} className={styles.participantImg} style={{ opacity: 0.7 }} />
                      ) : (
                        <div className={styles.participantInitial} style={{ opacity: 0.7 }}>
                          {person.name?.[0]}
                        </div>
                      )}
                      <span className={styles.participantName}>{person.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Route Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          🛤️ Trip Route
        </h3>

        {tourCities.length === 0 ? (
          <p className={styles.emptyMessage}>
            No cities added yet. Click on a city on the map to add it to this
            trip!
          </p>
        ) : (
          <ul className={styles.cityList}>
            {tourCities.map((city, index) => (
              <li key={city._id} className={styles.cityItem}>
                {/* Route indicator */}
                <div className={styles.routeIndicator}>
                  <span className={styles.stopNumber}>{index + 1}</span>
                  {index < tourCities.length - 1 && (
                    <div className={styles.routeLine}></div>
                  )}
                </div>
                
                <Link
                  to={`/app/cities/${city._id}?lat=${city.position?.lat || 0}&lng=${city.position?.lng || 0}`}
                  className={styles.cityLink}
                >
                  {city.images && city.images.length > 0 ? (
                    <div className={styles.thumbnail}>
                      <img src={city.images[0]} alt={city.cityName} />
                    </div>
                  ) : (
                    <span className={styles.emoji}>{city.emoji || "📍"}</span>
                  )}
                  <div className={styles.cityDetails}>
                    <span className={styles.cityName}>{city.cityName}</span>
                    <span className={styles.country}>{city.country}</span>
                    {city.date && (
                      <span className={styles.date}>
                        {new Date(city.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </Link>
                <button
                  className={styles.removeBtn}
                  onClick={(e) => handleRemoveCity(e, city._id)}
                  title="Remove from trip"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.actions}>
        <BackButton />
      </div>
    </div>
  );
}

export default Tour;
