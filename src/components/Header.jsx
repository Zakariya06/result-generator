import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/KMU_logo.jpg";
import { useSubject } from "../context/SubjectContext";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearAll } = useSubject();

  const handleLogout = () => {
    localStorage.removeItem("isAuth");
    navigate("/");
  };

  const handleClear = () => {
    clearAll();
    navigate("/");
  };

  return (
    <header className="appHeader">
      <div className="headerLogo">
        <img src={logo} alt="logo" className="kmuLogo" />
      </div>
      <div className="headerRight">
        {location.pathname !== "/" && (
          <button
            onClick={handleLogout}
            className="btn btn-danger"
            style={{ marginTop: "0" }}
          >
            logout
          </button>
        )}

        {location.pathname === "/sheet" && (
          <button
            onClick={handleClear}
            className="btn btn-primary"
            style={{ marginTop: "0", marginLeft: "1rem" }}
          >
            Clear All
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
