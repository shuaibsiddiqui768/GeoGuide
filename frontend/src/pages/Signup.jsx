import { useState } from "react";
import styles from "../pages/Signup.module.css";
import PageNav from "../components/PageNav";
export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const handleChange = (e) =>
    setForm({ ...form, [e.target.id]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      setMsg("Signup successful. Please log in.");
      setForm({ name: "", email: "", password: "" });
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className={styles.signup}>
      {" "}
      <PageNav />{" "}
      <form className={styles.form} onSubmit={handleSubmit}>
        {" "}
        <div className={styles.row}>
          {" "}
          <label htmlFor="name">Full Name</label>{" "}
          <input
            type="text"
            id="name"
            placeholder="Enter your full name"
            value={form.name}
            onChange={handleChange}
          />{" "}
        </div>{" "}
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
          {" "}
          <label htmlFor="password">Password</label>{" "}
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
          />{" "}
        </div>{" "}
        <div>
          {" "}
          <button type="submit" className={styles.button} disabled={loading}>
            {" "}
            {loading ? "Signing up..." : "Signup"}{" "}
          </button>{" "}
        </div>{" "}
        {msg && <p>{msg}</p>}{" "}
      </form>{" "}
    </main>
  );
}
