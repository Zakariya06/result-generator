import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import logo from "../assets/KMU_logo.jpg";
import { useSubject } from "../context/SubjectContext";
import {
  LuLayers,
  LuFileSpreadsheet,
  LuLogOut,
  LuTrash2,
  LuRotateCcw,
  LuShieldCheck,
  LuSparkles,
  LuGraduationCap,
} from "react-icons/lu";
import Modal from "react-bootstrap/Modal";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearAll, clearAllStudents, subjects, studentsData } = useSubject();

  // "dataOnly" | "fullReset" | null
  const [clearModal, setClearModal] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAuthenticated = localStorage.getItem("isAuth") === "true";
  const studentCount = studentsData?.length || 0;
  const subjectCount = subjects?.length || 0;

  const hasUploadedMarks = (studentsData || []).some((student) =>
    (student.subjects || []).some((subj) => {
      const mid = subj?.mid;
      const fin = subj?.final;
      const tot = subj?.total;
      const isNum = (v) =>
        v !== "" && v !== null && v !== undefined && !isNaN(parseFloat(v));
      return isNum(mid) || isNum(fin) || isNum(tot);
    })
  );

  const handleLogout = () => {
    localStorage.removeItem("isAuth");
    navigate("/");
  };

  const handleClearDataOnly = async () => {
    await clearAllStudents();
    setClearModal(null);
  };

  const handleFullReset = async () => {
    await clearAll();
    setClearModal(null);
    navigate("/create-result");
  };

  return (
    <>
      <header className="sc-header">
        <div className="sc-header-left">
          <Link to={isAuthenticated ? "/create-result" : "/"} className="sc-logo-brand">
            <img src={logo} alt="KMU Logo" className="sc-logo-img" />
            <div>
              <div className="sc-brand-title">KMU Examination Suite</div>
              <div className="sc-brand-sub d-flex align-items-center gap-1">
                Khyber Medical University
                <span className="badge bg-light text-muted border px-1 py-0" style={{ fontSize: "10px" }}>
                  v2.0
                </span>
              </div>
            </div>
          </Link>

          {isAuthenticated && (
            <nav className="sc-nav-links ms-3 d-none d-md-flex">
              <Link
                to="/create-result"
                className={`sc-nav-pill ${
                  location.pathname === "/create-result" ? "active" : ""
                }`}
              >
                <LuLayers size={15} />
                Configure Exam
                {subjectCount > 0 && (
                  <span
                    className="badge bg-light text-muted border px-1"
                    style={{ fontSize: "10px" }}
                  >
                    {subjectCount}
                  </span>
                )}
              </Link>

              <Link
                to="/sheet"
                className={`sc-nav-pill ${
                  location.pathname === "/sheet" ? "active" : ""
                }`}
              >
                <LuFileSpreadsheet size={15} />
                Combine Sheet
                {studentCount > 0 && (
                  <span
                    className="badge bg-primary text-white rounded-pill px-1"
                    style={{ fontSize: "10px" }}
                  >
                    {studentCount}
                  </span>
                )}
              </Link>

              {hasUploadedMarks && (
                <Link
                  to="/omr"
                  className={`sc-nav-pill ${
                    location.pathname === "/omr" ? "active" : ""
                  }`}
                >
                  <LuGraduationCap size={15} />
                  DMC / OMR
                  <span
                    className="badge bg-success text-white rounded-pill px-1"
                    style={{ fontSize: "10px" }}
                  >
                    Ready
                  </span>
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="sc-header-right">
          {isAuthenticated ? (
            <>
              {location.pathname === "/sheet" && (
                <div className="d-flex align-items-center gap-2">
                  {/* Kept only Reset Everything button as requested */}
                  <button
                    onClick={() => setClearModal("fullReset")}
                    className="btn-sc btn-sc-destructive btn-sc-sm"
                    title="Full Reset: erases both subjects and all data"
                  >
                    <LuRotateCcw size={14} />
                    <span>Reset Everything</span>
                  </button>
                </div>
              )}

              {/* Administrator Profile Circle with Dropdown Menu */}
              <div className="position-relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowUserDropdown((prev) => !prev)}
                  className="btn p-0 border-0 bg-transparent rounded-circle d-flex align-items-center justify-content-center"
                  style={{ cursor: "pointer" }}
                  title="Administrator Profile"
                >
                  <div
                    className="sc-avatar shadow-sm"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: "#1e293b",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "14px",
                      border: "2px solid #e2e8f0",
                    }}
                  >
                    A
                  </div>
                </button>

                {showUserDropdown && (
                  <div
                    className="position-absolute end-0 mt-2 p-3 rounded-3 shadow-lg bg-white border animate-fade-in"
                    style={{
                      minWidth: "220px",
                      zIndex: 1100,
                    }}
                  >
                    <div className="d-flex align-items-center gap-2 pb-2 mb-2 border-bottom">
                      <div
                        className="sc-avatar"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: "#2563eb",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "700",
                          fontSize: "13px",
                        }}
                      >
                        A
                      </div>
                      <div>
                        <div className="fw-bold text-dark" style={{ fontSize: "13.5px" }}>
                          Administrator
                        </div>
                        <div className="text-muted" style={{ fontSize: "11px" }}>
                          KMU Controller of Exams
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        handleLogout();
                      }}
                      className="btn-sc btn-sc-destructive btn-sc-sm w-100 d-flex align-items-center justify-content-center gap-2 mt-2"
                      style={{ fontSize: "12.5px" }}
                    >
                      <LuLogOut size={14} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: "12px" }}>
              <LuSparkles size={14} className="text-warning" />
              <span>Secure Evaluation System</span>
            </div>
          )}
        </div>
      </header>

      {/* Confirmation Modal for Clear Actions */}
      <Modal
        show={clearModal !== null}
        onHide={() => setClearModal(null)}
        centered
        size="md"
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2" style={{ fontSize: "16px" }}>
            {clearModal === "dataOnly" ? (
              <>
                <LuTrash2 size={18} className="text-danger" />
                <span>Clear Uploaded Table Data?</span>
              </>
            ) : (
              <>
                <LuRotateCcw size={18} className="text-danger" />
                <span>Full Reset (Subjects & All Data)?</span>
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {clearModal === "dataOnly" ? (
            <div>
              <p className="text-muted mb-2" style={{ fontSize: "13.5px" }}>
                This will remove all <strong>{studentCount} candidate records</strong> and
                imported marks from the table.
              </p>
              <div className="p-2 rounded bg-light border text-secondary" style={{ fontSize: "12.5px" }}>
                ✓ Your <strong>{subjectCount} configured subjects</strong> and maximum marks
                thresholds will <strong>remain unchanged</strong> so you can immediately re-upload files.
              </div>
            </div>
          ) : (
            <div>
              <p className="text-muted mb-2" style={{ fontSize: "13.5px" }}>
                This will <strong>completely reset</strong> the application and clear all
                persisted data from your local browser database:
              </p>
              <ul className="text-muted mb-2 ps-3" style={{ fontSize: "13px" }}>
                <li>All {subjectCount} configured subjects & ceiling marks</li>
                <li>All {studentCount} uploaded candidate records & marks</li>
              </ul>
              <div className="p-2 rounded bg-danger bg-opacity-10 border border-danger border-opacity-25 text-danger" style={{ fontSize: "12.5px" }}>
                ⚠️ You will be redirected to the Exam Configuration page to start fresh.
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn-sc btn-sc-secondary btn-sc-sm"
            onClick={() => setClearModal(null)}
          >
            Cancel
          </button>
          <button
            className="btn-sc btn-sc-destructive btn-sc-sm"
            onClick={clearModal === "dataOnly" ? handleClearDataOnly : handleFullReset}
          >
            {clearModal === "dataOnly" ? "Clear Table Data" : "Yes, Reset Everything"}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Header;
