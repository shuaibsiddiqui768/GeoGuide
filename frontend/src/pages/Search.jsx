import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./Search.module.css";
import PageNav from "../components/PageNav";
import { useSocial } from "../contexts/SocialContext";
import { useAuth } from "../contexts/AuthContext";

function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const { searchUsers, sendFriendRequest, cancelFriendRequest } = useSocial();
  const { isAuthenticated } = useAuth();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        const results = await searchUsers(searchQuery.trim());
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  async function handleSendRequest(userId) {
    try {
      setActionLoading(userId);
      await sendFriendRequest(userId);
      // Update local state
      setSearchResults(prev =>
        prev.map(u =>
          u._id === userId ? { ...u, status: "request_sent" } : u
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelRequest(userId) {
    try {
      setActionLoading(userId);
      await cancelFriendRequest(userId);
      // Update local state
      setSearchResults(prev =>
        prev.map(u =>
          u._id === userId ? { ...u, status: "stranger" } : u
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  }

  function getStatusButton(user) {
    const isLoading = actionLoading === user._id;

    switch (user.status) {
      case "friends":
        return (
          <Link to={`/user/${user.username || user._id}`} className={styles.friendsBtn}>
            ✓ Friends
          </Link>
        );
      case "request_sent":
        return (
          <button
            className={styles.pendingBtn}
            onClick={() => handleCancelRequest(user._id)}
            disabled={isLoading}
          >
            {isLoading ? "..." : "✓ Request Sent"}
          </button>
        );
      case "request_received":
        return (
          <Link to={`/user/${user.username || user._id}`} className={styles.acceptBtn}>
            Accept Request
          </Link>
        );
      default:
        return (
          <button
            className={styles.addBtn}
            onClick={() => handleSendRequest(user._id)}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "+ Add Friend"}
          </button>
        );
    }
  }

  return (
    <main className={styles.search}>
      <PageNav />

      <section className={styles.searchContainer}>
        <h1 className={styles.title}>🔍 Search Travelers</h1>
        <p className={styles.subtitle}>
          Find friends, explore trips, and discover new destinations
        </p>

        <div className={styles.searchForm}>
          <input
            type="text"
            placeholder="Search by username or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {isSearching && <span className={styles.searchingIndicator}>🔄</span>}
        </div>

        {!isAuthenticated && (
          <div className={styles.loginPrompt}>
            <p>Please <Link to="/login">login</Link> to search for travelers</p>
          </div>
        )}

        <div className={styles.results}>
          {searchResults.length > 0 && (
            <div className={styles.resultsList}>
              {searchResults.map((user) => (
                <div key={user._id} className={styles.userCard}>
                  <Link to={`/user/${user.username || user._id}`} className={styles.userLink}>
                    <div className={styles.userAvatar}>
                      {user.profileImage ? (
                        <img src={user.profileImage} alt={user.name} />
                      ) : (
                        <span>{user.name?.charAt(0)?.toUpperCase() || "U"}</span>
                      )}
                    </div>
                    <div className={styles.userInfo}>
                      <h3 className={styles.userName}>{user.name}</h3>
                      {user.username && (
                        <span className={styles.userHandle}>@{user.username}</span>
                      )}
                      {user.bio && (
                        <p className={styles.userBio}>{user.bio}</p>
                      )}
                    </div>
                  </Link>
                  <div className={styles.userAction}>
                    {getStatusButton(user)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
            <p className={styles.noResults}>No users found for "{searchQuery}"</p>
          )}

          {!searchQuery && isAuthenticated && (
            <div className={styles.placeholder}>
              <p>🌍 Start typing to find travelers!</p>
              <div className={styles.suggestions}>
                <span className={styles.suggestionTitle}>Try searching for:</span>
                <div className={styles.tags}>
                  <button onClick={() => setSearchQuery("travel")}>travel</button>
                  <button onClick={() => setSearchQuery("explorer")}>explorer</button>
                  <button onClick={() => setSearchQuery("adventure")}>adventure</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Search;
