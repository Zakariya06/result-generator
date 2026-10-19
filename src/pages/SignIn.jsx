import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/KMU_logo.jpg";
import { LuMail, LuLock, LuArrowRight, LuCircleAlert, LuKeyRound, LuShieldCheck } from "react-icons/lu";

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    setTimeout(() => {
      if (email === "admin@email.com" && password === "admin1234") {
        localStorage.setItem("isAuth", "true");
        navigate("/create-result");
      } else {
        setError("Invalid credentials. Please verify your email and password.");
        setLoading(false);
      }
    }, 400);
  };

  const handleFillDemo = () => {
    setEmail("admin@email.com");
    setPassword("admin1234");
    setError("");
  };

  return (
    <div className="pageCenter">
      <div className="signInCard animate-fade-in">
        <div className="text-center mb-4">
          <img
            src={logo}
            alt="KMU Logo"
            className="mb-3"
            style={{
              width: "68px",
              height: "68px",
              objectFit: "contain",
              padding: "4px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            }}
          />
          <h3 className="fw-bold mb-1" style={{ fontSize: "20px", color: "#0f172a" }}>
            KMU Examination Suite
          </h3>
          <p className="text-muted" style={{ fontSize: "13px" }}>
            Sign in to access examination sheets & generate results
          </p>
        </div>

        {error && (
          <div
            className="d-flex align-items-center gap-2 p-3 mb-4 rounded-3 text-danger"
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              fontSize: "13px",
            }}
          >
            <LuCircleAlert size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label
              className="form-label fw-semibold text-secondary mb-1"
              style={{ fontSize: "12.5px" }}
            >
              Email Address
            </label>
            <div className="position-relative">
              <LuMail
                size={16}
                className="position-absolute text-muted"
                style={{ left: "14px", top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="email"
                placeholder="admin@email.com"
                className="sc-input ps-5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label
              className="form-label fw-semibold text-secondary mb-1"
              style={{ fontSize: "12.5px" }}
            >
              Password
            </label>
            <div className="position-relative">
              <LuLock
                size={16}
                className="position-absolute text-muted"
                style={{ left: "14px", top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="password"
                placeholder="••••••••"
                className="sc-input ps-5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-sc btn-sc-primary w-100 py-2 mb-3"
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <LuArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div
          className="pt-3 mt-3 border-top d-flex align-items-center justify-content-between"
          style={{ fontSize: "12px" }}
        >
          <div className="d-flex align-items-center gap-1 text-muted">
            <LuShieldCheck size={14} className="text-success" />
            <span>KMU Secure Login</span>
          </div>

          <button
            type="button"
            onClick={handleFillDemo}
            className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-1"
            style={{ fontSize: "12px", color: "#4f46e5" }}
          >
            <LuKeyRound size={13} />
            <span>Use Demo Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
