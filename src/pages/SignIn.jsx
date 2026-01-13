import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (email === "admin@email.com" && password === "admin1234") {
      localStorage.setItem("isAuth", "true");
      navigate("/create-result");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="pageCenter">
      <form className="signInCard" onSubmit={handleSubmit}>
        <h2>Sign In</h2>

        {error && <p className="errorText">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="inputField"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="inputField"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="primaryButton">Login</button>
      </form>
    </div>
  );
}
