import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CsSection from "../components/CsSection";

export default function CreateResult() {
  const navigate = useNavigate();
  const [showCs, setShowCs] = useState(false);

  return (
    <div className="pageCenter">
      <div className="cardLarge">
        <h2>Creating Result Info</h2>

        <div className="buttonRow">
          <button
            className="secondaryButton"
            onClick={() => setShowCs(!showCs)}
          >
            CS
          </button>

          <button
            className="secondaryButton"
            onClick={() => navigate("/construction")}
          >
            MS
          </button>
        </div>

        {showCs && <CsSection />}
      </div>
    </div>
  );
}
