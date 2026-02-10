import { useState, useMemo } from "react";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Signup.module.css";
import PageNav from "../components/PageNav";
import Logo from "../components/Logo";
import { useAuth } from "../contexts/AuthContext";
import debounce from "lodash.debounce";

export default function Signup() {
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [usernameStatus, setUsernameStatus] = useState({ 
    checking: false, 
    available: null, 
    error: "" 
  });
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const checkUsernameAvailability = useMemo(
    () => debounce(async (username) => {
      if (username.length < 3) {
        setUsernameStatus({ checking: false, available: null, error: "Too short" });
        return;
      }
      
      const usernameRegex = /^[a-z0-9_]+$/i;
      if (!usernameRegex.test(username)) {
        setUsernameStatus({ checking: false, available: null, error: "Invalid characters" });
        return;
      }

      try {
        setUsernameStatus(prev => ({ ...prev, checking: true, error: "" }));
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/check-username`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        const data = await res.json();
        setUsernameStatus({ 
          checking: false, 
          available: data.available, 
          error: data.available ? "" : "Username already taken" 
        });
      } catch (err) {
        setUsernameStatus({ checking: false, available: null, error: "Failed to check availability" });
      }
    }, 500),
    []
  );

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm({ ...form, [id]: value });
    
    if (id === "username") {
      setUsernameStatus({ checking: true, available: null, error: "" });
      checkUsernameAvailability(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (usernameStatus.available === false) {
      setMsg("Please choose a different username");
      return;
    }

    if (form.username.length < 3) {
      setMsg("Username must be at least 3 characters");
      return;
    }

    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      
      login(data.token, data.user);
      navigate("/app");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <main className={styles.signup}>
      <PageNav />
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Logo and Heading */}
        <div className={styles.header}>
          <Logo />
          <h2 className={styles.title}>Create Account</h2>
          <p className={styles.subtitle}>Start tracking your adventures today</p>
        </div>

        <div className={styles.row}>
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            placeholder="Enter your full name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.row}>
          <label htmlFor="username">Username</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              id="username"
              placeholder="choose_a_username"
              value={form.username}
              onChange={handleChange}
              required
              className={
                usernameStatus.available === true ? styles.valid : 
                usernameStatus.error ? styles.invalid : ""
              }
            />
            {usernameStatus.checking && <span className={styles.statusIcon}>⏳</span>}
            {usernameStatus.available === true && <span className={styles.statusIcon}>✅</span>}
            {usernameStatus.available === false && <span className={styles.statusIcon}>❌</span>}
          </div>
          {usernameStatus.error && (
            <p className={styles.inputError}>{usernameStatus.error}</p>
          )}
        </div>

        <div className={styles.row}>
          {" "}
          <label htmlFor="email">Email address</label>{" "}
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
          />{" "}
        </div>{" "}


        <div className={styles.row}>
          <label htmlFor="password">Password</label>
          <div className={styles.inputWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <HiEyeOff /> : <HiEye />}
            </button>
          </div>
        </div>


        <div>
          {" "}
          <button type="submit" className={styles.button} disabled={loading}>
            {" "}
            {loading ? "Signing up..." : "Signup"}{" "}
          </button>{" "}
        </div>{" "}
        {msg && <p className={styles.message}>{msg}</p>}

        <p className={styles.loginLink}>
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </form>{" "}
    </main>
  );
}
