import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CsSection from "../components/CsSection";

export default function CreateResult() {
  const navigate = useNavigate();
  const [showCs, setShowCs] = useState(false);

  return (
    <div className="pageCenter">
      <div className="cardLarge" style={{ maxWidth: "600px", width: "100%" }}>
        <h2 className="text-center">Creating Result Info</h2>

        <div className="buttonRow">
          <button
            className="secondaryButton"
            onClick={() => setShowCs(!showCs)}
          >
            Combine Sheet
          </button>

          <button
            className="secondaryButton"
            onClick={() => navigate("/construction")}
          >
            Final Sheet
          </button>
        </div>

        {showCs && <CsSection />}
      </div>
    </div>
  );
}
