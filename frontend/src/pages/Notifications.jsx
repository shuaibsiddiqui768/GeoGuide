import { useEffect } from "react";
import styles from "./Notifications.module.css";
import PageNav from "../components/PageNav";
import { useTours } from "../contexts/ToursContext";
import Spinner from "../components/Spinner";
import Message from "../components/Message";

function Notifications() {
  const { invites, respondToInvite, fetchInvites, isLoading } = useTours();

  useEffect(() => {
    // Fetch immediately on mount to ensure fresh data
    fetchInvites();
  }, [fetchInvites]);

  if (isLoading && invites.length === 0) return <Spinner />;

  return (
    <main className={styles.notificationsPage}>
      <PageNav />
      
      <section className={styles.content}>
        <div className={styles.header}>
            <h1>Notifications</h1>
            {invites.length > 0 && <span className={styles.badge}>{invites.length}</span>}
        </div>

        {invites.length === 0 ? (
          <Message message="You have no new notifications at the moment." />
        ) : (
          <div className={styles.invitesList}>
            {invites.map((invite) => (
              <div key={invite._id} className={styles.inviteCard}>
                <div className={styles.inviteInfo}>
                  <div className={styles.iconWrapper}>
                    <span className={styles.inviteIcon}>✈️</span>
                  </div>
                  <div className={styles.details}>
                    <h3 className={styles.tourName}>{invite.name}</h3>
                    <p className={styles.sender}>
                      Invited by <strong>{invite.user?.name || "Unknown"}</strong>
                    </p>
                    <p className={styles.date}>
                        {new Date(invite.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className={styles.actions}>
                  <button
                    className={styles.acceptBtn}
                    onClick={() => respondToInvite(invite._id, "accept")}
                  >
                    Accept Join
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
        )}
      </section>
    </main>
  );
}

export default Notifications;
