import { useState, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./TourList.module.css";
import { useTours } from "../contexts/ToursContext";
import { useSocial } from "../contexts/SocialContext";
import Spinner from "./Spinner";
import Message from "./Message";
import TourItem from "./TourItem";

function TourList() {
  const { tours, invites, respondToInvite, isLoading, error, createTour } = useTours();
  const { friends } = useSocial();
  const [showForm, setShowForm] = useState(false);
  const [tourName, setTourName] = useState("");
  const [tourDescription, setTourDescription] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedFriends, setSelectedFriends] = useState([]);

  const currencies = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD"];

  async function handleCreateTour(e) {
    e.preventDefault();
    if (!tourName.trim()) {
      setFormError("Please enter a trip name");
      return;
    }

    setIsCreating(true);
    setFormError("");

    try {
      await createTour({
        name: tourName.trim(),
        description: tourDescription.trim(),
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        budget: budget ? Number(budget) : 0,
        currency,
        participants: selectedFriends,
      });
      // Reset form
      setTourName("");
      setTourDescription("");
      setStartDate(null);
      setEndDate(null);
      setBudget("");
      setCurrency("USD");
      setSelectedFriends([]);
      setShowForm(false);
    } catch (err) {
      setFormError(err.message || "Failed to create trip");
    } finally {
      setIsCreating(false);
    }
  }

  if (isLoading) return <Spinner />;

  if (error) return <Message message={error} />;

  return (
    <div className={styles.tourList}>
      {/* Create Trip Button */}
      <button
        className={styles.createBtn}
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? (
          <>
            <span className={styles.icon}>✕</span> Cancel
          </>
        ) : (
          <>
            <span className={styles.icon}>+</span> Create New Trip
          </>
        )}
      </button>

      {/* Create Trip Form */}
      {showForm && (
        <form className={styles.form} onSubmit={handleCreateTour}>
          <div className={styles.inputGroup}>
            <label htmlFor="tourName">Trip Name *</label>
            <input
              type="text"
              id="tourName"
              placeholder="e.g., Europe Summer 2025"
              value={tourName}
              onChange={(e) => setTourName(e.target.value)}
              autoFocus
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="tourDescription">Description (optional)</label>
            <textarea
              id="tourDescription"
              placeholder="Add a description for your trip..."
              value={tourDescription}
              onChange={(e) => setTourDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Date Range */}
          <div className={styles.dateRow}>
            <div className={styles.inputGroup}>
              <label>Start Date</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                placeholderText="Start date"
                dateFormat="dd/MM/yyyy"
                className={styles.datePicker}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>End Date</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                placeholderText="End date"
                dateFormat="dd/MM/yyyy"
                className={styles.datePicker}
              />
            </div>
          </div>

          {/* Budget */}
          <div className={styles.budgetRow}>
            <div className={styles.inputGroup}>
              <label>Budget (optional)</label>
              <input
                type="number"
                placeholder="e.g., 5000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min="0"
                className={styles.budgetInput}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={styles.currencySelect}
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Friend Selection */}
          {friends.length > 0 && (
            <div className={styles.inputGroup}>
              <label>Invite Friends</label>
              <div className={styles.friendPicker}>
                {friends.map((friend) => (
                  <label
                    key={friend._id}
                    className={`${styles.friendChip} ${
                      selectedFriends.includes(friend._id)
                        ? styles.selected
                        : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFriends.includes(friend._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFriends([...selectedFriends, friend._id]);
                        } else {
                          setSelectedFriends(
                            selectedFriends.filter((id) => id !== friend._id)
                          );
                        }
                      }}
                      hidden
                    />
                    {friend.profileImage ? (
                      <img
                        src={friend.profileImage}
                        alt={friend.name}
                        className={styles.friendImg}
                      />
                    ) : (
                      <div className={styles.friendInitial}>
                        {friend.name[0]}
                      </div>
                    )}
                    <span className={styles.friendName}>{friend.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {formError && <p className={styles.error}>{formError}</p>}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isCreating}
          >
            {isCreating ? "Creating..." : "Create Trip"}
          </button>
        </form>
      )}

      {/* Invitations Section */}
      {invites.length > 0 && (
        <div className={styles.invitesSection}>
          <h3 className={styles.sectionTitle}>📬 Trip Invitations</h3>
          <div className={styles.invitesList}>
            {invites.map((invite) => (
              <div key={invite._id} className={styles.inviteCard}>
                <div className={styles.inviteInfo}>
                  <span className={styles.inviteIcon}>✈️</span>
                  <div>
                    <h4 className={styles.inviteName}>{invite.name}</h4>
                    <p className={styles.inviteSender}>
                      Invited by{" "}
                      <strong>
                        {invite.user?.name || "Unknown"}
                        {console.log(invite)}
                      </strong>
                    </p>
                  </div>
                </div>
                <div className={styles.inviteActions}>
                  <button
                    className={styles.acceptBtn}
                    onClick={() => respondToInvite(invite._id, "accept")}
                  >
                    Accept
                  </button>
                  <button
                    className={styles.rejectBtn}
                    onClick={() => respondToInvite(invite._id, "reject")}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trips List */}
      {tours.length === 0 && invites.length === 0 ? (
        <Message message="No trips yet. Create your first trip to organize your travels! ✈️" />
      ) : (
        <ul className={styles.list}>
          {tours.map((tour) => (
            <TourItem key={tour._id} tour={tour} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default TourList;
