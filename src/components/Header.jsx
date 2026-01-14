import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/KMU_logo.jpg";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("isAuth");
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
            className="primaryButton"
            style={{ marginTop: "0" }}
          >
            logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
