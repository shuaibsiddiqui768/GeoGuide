import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import styles from "./Tour.module.css";
import { useTours } from "../contexts/ToursContext";
import { useAuth } from "../contexts/AuthContext";
import { useSocial } from "../contexts/SocialContext";
import Spinner from "./Spinner";
import Message from "./Message";
import BackButton from "./BackButton";

// Helper to extract country code from flag emoji
function getCountryCodeFromEmoji(emoji) {
  if (!emoji) return null;
  const codePoints = [...emoji]
    .map(char => char.codePointAt(0))
    .filter(cp => cp >= 127462 && cp <= 127487)
    .map(cp => String.fromCharCode(cp - 127397));
  return codePoints.length === 2 ? codePoints.join('').toLowerCase() : null;
}

function Tour() {
  const { id } = useParams();
  const { user } = useAuth();
  const { friends, fetchFriends } = useSocial();
  const { 
    currentTour, 
    getTour, 
    isLoading, 
    removeCityFromTour, 
    setActiveTour, 
    respondToInvite,
    inviteToTour
  } = useTours();

  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteLoading, setInviteLoading] = useState(null);

  useEffect(() => {
    getTour(id);
    fetchFriends();
    // Set this as active tour to show route on map
    setActiveTour?.(id);
    
    return () => {
      // Clear active tour when leaving
      setActiveTour?.(null);
    };
  }, [id, getTour, setActiveTour, fetchFriends]);

  const isOwner = user && currentTour && (
    (user._id && (user._id === currentTour.user?._id || user._id === currentTour.user)) ||
    (user.id && (user.id === currentTour.user?._id || user.id === currentTour.user))
  );

  async function handleInviteFriend(friendId) {
    try {
      setInviteLoading(friendId);
      setInviteError("");
      await inviteToTour(currentTour._id, friendId);
    } catch (err) {
      setInviteError(err.message || "Failed to send invite");
    } finally {
      setInviteLoading(null);
    }
  }

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
        <div className={styles.tourInfo}>
          <h2 className={styles.tourName}>{currentTour.name}</h2>
          <div className={styles.tourMetaHeader}>
            {currentTour.startDate && (
              <span className={styles.metaItem}>
                📅 {formatDate(currentTour.startDate)} 
                {currentTour.endDate && ` — ${formatDate(currentTour.endDate)}`}
              </span>
            )}
            {currentTour.budget > 0 && (
              <span className={styles.metaItem}>
                💰 {currentTour.currency} {currentTour.budget.toLocaleString()}
              </span>
            )}
            <span className={styles.metaItem}>
              🏙️ {tourCities.length} {tourCities.length === 1 ? "Stop" : "Stops"}
            </span>
          </div>
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
                  <div className={styles.cityDetails}>
                    <span className={styles.cityName}>
                      {getCountryCodeFromEmoji(city.emoji) ? (
                        <img 
                          src={`https://flagcdn.com/w40/${getCountryCodeFromEmoji(city.emoji)}.png`} 
                          alt="" 
                          className={styles.miniFlag}
                        />
                      ) : (
                        city.emoji
                      )}{" "}
                      {city.cityName}
                    </span>
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
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>👥 Trip Mates</h3>
                  {isOwner && (
                    <button 
                      className={styles.addParticipantBtn}
                      onClick={() => setIsInviting(!isInviting)}
                    >
                      {isInviting ? "Close" : "+ Invite Friend"}
                    </button>
                   )}
                </div>

                {isInviting && (
                   <div className={styles.inviteFriendSection}>
                     <h4>Select a friend to invite</h4>
                     {inviteError && <p className={styles.inviteError}>{inviteError}</p>}
                     <div className={styles.friendsListSmall}>
                       {friends.length === 0 ? (
                         <p className={styles.noFriends}>No friends found. Add some friends first!</p>
                       ) : (
                         friends.map(friend => {
                           const isAlreadyMember = currentTour.participants.some(p => (p._id || p) === friend._id) || 
                                                  currentTour.pendingInvites.some(p => (p._id || p) === friend._id);
                           const isOwnerOfTrip = (currentTour.user?._id || currentTour.user) === friend._id;

                           if (isOwnerOfTrip) return null;

                           return (
                             <div key={friend._id} className={styles.friendMiniCard}>
                               <div className={styles.friendInfoMini}>
                                 {friend.profileImage ? (
                                   <img src={friend.profileImage} alt={friend.name} className={styles.friendImgMini} />
                                 ) : (
                                   <div className={styles.friendInitialMini}>{friend.name[0]}</div>
                                 )}
                                 <span className={styles.friendNameMini}>{friend.name}</span>
                               </div>
                               <button 
                                 className={styles.miniInviteBtn}
                                 disabled={isAlreadyMember || inviteLoading === friend._id}
                                 onClick={() => handleInviteFriend(friend._id)}
                               >
                                 {inviteLoading === friend._id ? "..." : isAlreadyMember ? "Sent" : "Invite"}
                               </button>
                             </div>
                           )
                         })
                       )}
                     </div>
                   </div>
                )}

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

      <div className={styles.actions}>
        <BackButton />
      </div>
    </div>
  );
}

export default Tour;
