import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CsSection from "../components/CsSection";
import { LuLayers, LuFileSpreadsheet, LuArrowRight, LuSparkles } from "react-icons/lu";

export default function CreateResult() {
  const navigate = useNavigate();
  const [showCs, setShowCs] = useState(false);

  return (
    <div className="pageCenter" style={{ padding: "2.5rem 1rem" }}>
      <div
        className="sc-card animate-fade-in"
        style={{ maxWidth: showCs ? "860px" : "720px", width: "100%", padding: "32px" }}
      >
        <div className="text-center mb-4 pb-2 border-bottom">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-light border mb-2 text-primary" style={{ fontSize: "12px", fontWeight: "600" }}>
            <LuSparkles size={13} />
            <span>Result Generation Workspace</span>
          </div>
          <h2 className="fw-bold mb-1" style={{ fontSize: "22px", color: "#0f172a" }}>
            Select Result Configuration Mode
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
            Choose whether to prepare a consolidated marks sheet or configure finalized results
          </p>
        </div>

        {!showCs ? (
          <div className="row g-3 py-2">
            <div className="col-md-6">
              <div
                onClick={() => setShowCs(true)}
                className="p-4 rounded-3 border h-100 d-flex flex-column justify-content-between"
                style={{
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#4f46e5";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(79, 70, 229, 0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div>
                  <div
                    className="sc-stat-icon-wrap sc-stat-icon-blue mb-3"
                    style={{ width: "48px", height: "48px", borderRadius: "10px" }}
                  >
                    <LuLayers size={24} />
                  </div>
                  <h5 className="fw-bold mb-2" style={{ fontSize: "16px", color: "#0f172a" }}>
                    Combine Sheet
                  </h5>
                  <p className="text-muted" style={{ fontSize: "13px", lineHeight: "1.5" }}>
                    Configure multiple subjects, specify OSPE requirements, define ceiling marks,
                    and generate combined evaluation sheets.
                  </p>
                </div>
                <div className="d-flex align-items-center text-primary fw-semibold pt-2" style={{ fontSize: "13px" }}>
                  <span>Configure Papers</span>
                  <LuArrowRight size={15} className="ms-1" />
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div
                onClick={() => navigate("/construction")}
                className="p-4 rounded-3 border h-100 d-flex flex-column justify-content-between"
                style={{
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#0f172a";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(15, 23, 42, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div>
                  <div
                    className="sc-stat-icon-wrap sc-stat-icon-amber mb-3"
                    style={{ width: "48px", height: "48px", borderRadius: "10px" }}
                  >
                    <LuFileSpreadsheet size={24} />
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <h5 className="fw-bold mb-0" style={{ fontSize: "16px", color: "#0f172a" }}>
                      Final Sheet
                    </h5>
                    <span className="badge bg-warning text-dark border px-2 py-0" style={{ fontSize: "10px" }}>
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-muted" style={{ fontSize: "13px", lineHeight: "1.5" }}>
                    Standard finalized result gazettes with university grading scales, GPA
                    calculations, and registrar sign-off sections.
                  </p>
                </div>
                <div className="d-flex align-items-center text-secondary fw-semibold pt-2" style={{ fontSize: "13px" }}>
                  <span>View Details</span>
                  <LuArrowRight size={15} className="ms-1" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary text-white rounded-pill px-2 py-1">Step 1</span>
                <span className="fw-semibold text-secondary" style={{ fontSize: "13px" }}>
                  Define Paper Structure & OSPE Options
                </span>
              </div>
              <button
                onClick={() => setShowCs(false)}
                className="btn-sc btn-sc-ghost btn-sc-sm"
              >
                Change Mode
              </button>
            </div>
            <CsSection />
          </div>
        )}
      </div>
    </div>
  );
}
