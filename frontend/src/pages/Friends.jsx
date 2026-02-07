import { useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./Friends.module.css";
import PageNav from "../components/PageNav";
import Spinner from "../components/Spinner";
import { useSocial } from "../contexts/SocialContext";

function Friends() {
  const {
    friends,
    sentRequests,
    receivedRequests,
    isLoading,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    fetchFriends,
    fetchRequests,
  } = useSocial();

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, [fetchFriends, fetchRequests]);

  async function handleAccept(userId) {
    try {
      await acceptFriendRequest(userId);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleReject(userId) {
    try {
      await rejectFriendRequest(userId);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCancel(userId) {
    try {
      await cancelFriendRequest(userId);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRemove(userId) {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;
    try {
      await removeFriend(userId);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <main className={styles.friends}>
      <PageNav />

      <section className={styles.container}>
        <h1 className={styles.title}>👥 Friends</h1>

        {isLoading ? (
          <div className={styles.loading}>
            <Spinner />
          </div>
        ) : (
          <>
            {/* Received Requests */}
            {receivedRequests.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  📥 Friend Requests ({receivedRequests.length})
                </h2>
                <div className={styles.list}>
                  {receivedRequests.map((user) => (
                    <div key={user._id} className={styles.userCard}>
                      <Link to={`/user/${user.username || user._id}`} className={styles.userLink}>
                        <div className={styles.avatar}>
                          {user.profileImage ? (
                            <img src={user.profileImage} alt={user.name} />
                          ) : (
                            <span>{user.name?.charAt(0)?.toUpperCase()}</span>
                          )}
                        </div>
                        <div className={styles.userInfo}>
                          <h3>{user.name}</h3>
                          {user.username && <span>@{user.username}</span>}
                        </div>
                      </Link>
                      <div className={styles.actions}>
                        <button
                          className={styles.acceptBtn}
                          onClick={() => handleAccept(user._id)}
                        >
                          ✓ Accept
                        </button>
                        <button
                          className={styles.rejectBtn}
                          onClick={() => handleReject(user._id)}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sent Requests */}
            {sentRequests.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  📤 Sent Requests ({sentRequests.length})
                </h2>
                <div className={styles.list}>
                  {sentRequests.map((user) => (
                    <div key={user._id} className={styles.userCard}>
                      <Link to={`/user/${user.username || user._id}`} className={styles.userLink}>
                        <div className={styles.avatar}>
                          {user.profileImage ? (
                            <img src={user.profileImage} alt={user.name} />
                          ) : (
                            <span>{user.name?.charAt(0)?.toUpperCase()}</span>
                          )}
                        </div>
                        <div className={styles.userInfo}>
                          <h3>{user.name}</h3>
                          {user.username && <span>@{user.username}</span>}
                          <p className={styles.pending}>Pending...</p>
                        </div>
                      </Link>
                      <div className={styles.actions}>
                        <button
                          className={styles.cancelBtn}
                          onClick={() => handleCancel(user._id)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                ✅ Your Friends ({friends.length})
              </h2>
              {friends.length > 0 ? (
                <div className={styles.list}>
                  {friends.map((user) => (
                    <div key={user._id} className={styles.userCard}>
                      <Link to={`/user/${user.username || user._id}`} className={styles.userLink}>
                        <div className={styles.avatar}>
                          {user.profileImage ? (
                            <img src={user.profileImage} alt={user.name} />
                          ) : (
                            <span>{user.name?.charAt(0)?.toUpperCase()}</span>
                          )}
                        </div>
                        <div className={styles.userInfo}>
                          <h3>{user.name}</h3>
                          {user.username && <span>@{user.username}</span>}
                          {user.bio && <p className={styles.bio}>{user.bio}</p>}
                        </div>
                      </Link>
                      <div className={styles.actions}>
                        <Link
                          to={`/user/${user.username || user._id}`}
                          className={styles.viewBtn}
                        >
                          View Profile
                        </Link>
                        <button
                          className={styles.removeBtn}
                          onClick={() => handleRemove(user._id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.empty}>
                  <p>No friends yet 🌍</p>
                  <Link to="/search" className={styles.searchLink}>
                    Find travelers to connect!
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default Friends;
