import { useState } from "react";
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
                Marks Sheet
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
              {hasUploadedMarks && location.pathname !== "/omr" && (
                <button
                  onClick={() => navigate("/omr")}
                  className="btn-sc btn-sc-primary btn-sc-sm d-flex align-items-center gap-1 shadow-sm"
                  title="Generate and view individual Detailed Marks Certificates"
                >
                  <LuGraduationCap size={15} />
                  <span>Generate DMC / OMR</span>
                </button>
              )}

              {location.pathname === "/sheet" && (
                <div className="d-flex align-items-center gap-2">
                  {/* Button 1: Existing Clear All (clears uploaded table data only) */}
                  <button
                    onClick={() => setClearModal("dataOnly")}
                    className="btn-sc btn-sc-outline btn-sc-sm text-secondary"
                    title="Clear uploaded table data only (leaves subjects unchanged)"
                    disabled={studentCount === 0}
                  >
                    <LuTrash2 size={14} className="text-danger" />
                    <span>Clear All</span>
                  </button>

                  {/* Button 2: New Full Reset (clears both subjects and all data) */}
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

              <div className="sc-user-pill d-none d-lg-flex">
                <div className="sc-avatar">A</div>
                <span>Administrator</span>
                <LuShieldCheck size={14} className="text-primary" />
              </div>

              <button
                onClick={handleLogout}
                className="btn-sc btn-sc-outline btn-sc-sm text-secondary"
                title="Sign out of examination portal"
              >
                <LuLogOut size={14} />
                <span className="d-none d-sm-inline">Logout</span>
              </button>
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
