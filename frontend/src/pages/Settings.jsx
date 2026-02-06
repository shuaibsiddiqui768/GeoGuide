import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Settings.module.css";
import PageNav from "../components/PageNav";
import { useAuth } from "../contexts/AuthContext";

function Settings() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Profile image state
  const [imageLoading, setImageLoading] = useState(false);
  const [imageMsg, setImageMsg] = useState({ text: "", type: "" });

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: "", type: "" });

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState({ text: "", type: "" });

  // Get API base URL from environment
  const API_BASE = import.meta.env.VITE_API_URL;

  // Convert file to base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  // Handle image selection
  async function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setImageMsg({ text: "Please select an image file", type: "error" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageMsg({ text: "Image size must be less than 5MB", type: "error" });
      return;
    }

    setImageLoading(true);
    setImageMsg({ text: "", type: "" });

    try {
      const base64Image = await fileToBase64(file);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/upload/profile-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image: base64Image }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload image");

      // Update user in context
      updateUser({ profileImage: data.profileImage });
      setImageMsg({ text: "Profile image updated!", type: "success" });
    } catch (err) {
      setImageMsg({ text: err.message, type: "error" });
    } finally {
      setImageLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  // Handle image removal
  async function handleRemoveImage() {
    setImageLoading(true);
    setImageMsg({ text: "", type: "" });

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/upload/profile-image`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to remove image");

      // Update user in context
      updateUser({ profileImage: "" });
      setImageMsg({ text: "Profile image removed!", type: "success" });
    } catch (err) {
      setImageMsg({ text: err.message, type: "error" });
    } finally {
      setImageLoading(false);
    }
  }

  // Handle password change
  async function handlePasswordChange(e) {
    e.preventDefault();
    setPasswordMsg({ text: "", type: "" });

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: "New passwords don't match", type: "error" });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({
        text: "Password must be at least 6 characters",
        type: "error",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to change password");

      setPasswordMsg({ text: "Password changed successfully!", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMsg({ text: err.message, type: "error" });
    } finally {
      setPasswordLoading(false);
    }
  }

  // Handle account deletion
  async function handleDeleteAccount() {
    if (!deletePassword) {
      setDeleteMsg({ text: "Please enter your password", type: "error" });
      return;
    }

    setDeleteLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/auth/delete-account`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete account");

      // Logout and redirect to home
      logout();
      navigate("/");
    } catch (err) {
      setDeleteMsg({ text: err.message, type: "error" });
    } finally {
      setDeleteLoading(false);
    }
  }

  // Get user initial for avatar fallback
  function getUserInitial() {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  }

  return (
    <main className={styles.settings}>
      <PageNav />
      <div className={styles.container}>
        <h1 className={styles.title}>Account Settings</h1>

        {/* Profile Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profile Information
          </h2>
          <div className={styles.profileCard}>
            <div className={styles.avatarSection}>
              <div className={styles.avatarWrapper}>
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className={styles.avatarImage}
                  />
                ) : (
                  <div className={styles.avatar}>{getUserInitial()}</div>
                )}
                {imageLoading && (
                  <div className={styles.avatarOverlay}>
                    <div className={styles.spinner}></div>
                  </div>
                )}
              </div>
              <div className={styles.avatarActions}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className={styles.fileInput}
                  id="profileImageInput"
                />
                <label
                  htmlFor="profileImageInput"
                  className={styles.uploadBtn}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Upload Photo
                </label>
                {user?.profileImage && (
                  <button
                    className={styles.removeBtn}
                    onClick={handleRemoveImage}
                    disabled={imageLoading}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Remove
                  </button>
                )}
              </div>
              {imageMsg.text && (
                <p className={`${styles.message} ${styles[imageMsg.type]}`}>
                  {imageMsg.text}
                </p>
              )}
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{user?.name || "User"}</span>
              <span className={styles.profileEmail}>{user?.email}</span>
            </div>
          </div>
        </section>

        {/* Change Password Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Change Password
          </h2>
          <form onSubmit={handlePasswordChange} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {passwordMsg.text && (
              <p className={`${styles.message} ${styles[passwordMsg.type]}`}>
                {passwordMsg.text}
              </p>
            )}
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={passwordLoading}
            >
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </section>

        {/* Danger Zone */}
        <section className={`${styles.section} ${styles.dangerSection}`}>
          <h2 className={styles.sectionTitle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Danger Zone
          </h2>
          <p className={styles.dangerText}>
            Once you delete your account, there is no going back. Please be certain.
          </p>
          
          {!showDeleteConfirm ? (
            <button
              className={styles.dangerBtn}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </button>
          ) : (
            <div className={styles.deleteConfirm}>
              <p>Enter your password to confirm:</p>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your password"
              />
              {deleteMsg.text && (
                <p className={`${styles.message} ${styles.error}`}>
                  {deleteMsg.text}
                </p>
              )}
              <div className={styles.deleteActions}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword("");
                    setDeleteMsg({ text: "", type: "" });
                  }}
                >
                  Cancel
                </button>
                <button
                  className={styles.confirmDeleteBtn}
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Yes, Delete My Account"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Back Button */}
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>
    </main>
  );
}

export default Settings;
