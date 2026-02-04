import styles from "./LogoutModal.module.css";

function LogoutModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.icon}>👋</div>
        <h2 className={styles.title}>Logout</h2>
        <p className={styles.message}>Are you sure you want to logout?</p>
        <div className={styles.buttons}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            Yes, Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogoutModal;
