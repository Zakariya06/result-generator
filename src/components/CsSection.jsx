import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubject } from "../context/SubjectContext";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import {
  LuBookOpen,
  LuSettings2,
  LuTrash2,
  LuArrowRight,
  LuCheck,
  LuX,
  LuCircleAlert,
} from "react-icons/lu";

export default function CsSection() {
  const { subjects: contextSubjects, saveSubjects } = useSubject();
  const navigate = useNavigate();

  const [count, setCount] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [tempSubjects, setTempSubjects] = useState([]);

  useEffect(() => {
    if (contextSubjects?.length) {
      setSubjects(contextSubjects);
      setCount(contextSubjects.length.toString());
    }
  }, [contextSubjects]);

  const handleCountChange = (value) => {
    setCount(value);
    const newSubjects = Array.from({ length: value }, () => ({
      subject: "",
      ospe: false,
      maxMid: "",
      maxFinal: "",
      ospeMaxMid: "",
      ospeMaxFinal: "",
    }));
    setSubjects(newSubjects);
  };

  const updateSubject = (index, key, value) => {
    const updated = [...subjects];
    updated[index][key] = value;
    setSubjects(updated);
  };

  const handleGenerate = () => {
    const hasEmptyField = subjects.some(
      (s) => s.subject.trim() === "" || s.ospe === null,
    );
    if (hasEmptyField) {
      alert("Please enter subject names for all rows.");
      return;
    }
    setTempSubjects(subjects.map((s) => ({ ...s })));
    setShowModal(true);
  };

  const handleModalSave = () => {
    const invalid = tempSubjects.some((s) => {
      if (s.maxMid === "" || s.maxFinal === "") return true;
      if (s.ospe && (s.ospeMaxMid === "" || s.ospeMaxFinal === "")) return true;
      return false;
    });
    if (invalid) {
      alert("Please specify maximum marks for all mid and final fields.");
      return;
    }

    const updated = tempSubjects.map((s) => ({
      ...s,
      maxMid: Number(s.maxMid),
      maxFinal: Number(s.maxFinal),
      ospeMaxMid: s.ospe ? Number(s.ospeMaxMid) : undefined,
      ospeMaxFinal: s.ospe ? Number(s.ospeMaxFinal) : undefined,
    }));

    setSubjects(updated);
    saveSubjects(updated);
    setShowModal(false);
    navigate("/sheet");
  };

  const handleClear = () => {
    setSubjects([]);
    setCount("");
    setShowModal(false);
  };

  return (
    <div className="csSection">
      <div className="mb-4">
        <label
          className="form-label fw-bold text-secondary mb-2"
          style={{ fontSize: "13px" }}
        >
          Number of Examination Papers
        </label>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <select
            className="sc-select"
            style={{ minWidth: "180px" }}
            value={count}
            onChange={(e) => handleCountChange(Number(e.target.value))}
          >
            <option value="">Select Paper Count</option>
            {[...Array(12)].map((_, i) => (
              <option key={i} value={i + 1}>
                {i + 1} {i === 0 ? "Paper" : "Papers"}
              </option>
            ))}
          </select>

          {/* Quick preset chips */}
          <div className="d-flex align-items-center gap-1 ms-2">
            {[4, 5, 6, 8].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleCountChange(n)}
                className={`btn-sc btn-sc-sm ${
                  Number(count) === n ? "btn-sc-dark" : "btn-sc-secondary"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {subjects.length > 0 && (
        <div className="animate-fade-in">
          <div className="table-responsive rounded-3 border mb-3">
            <table className="customTable mb-0">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>#</th>
                  <th>Subject / Course Title</th>
                  <th style={{ width: "200px" }}>Practical / OSPE Component</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((item, index) => (
                  <tr key={index}>
                    <td className="text-center fw-bold text-muted">
                      {index + 1}
                    </td>
                    <td>
                      <div className="position-relative">
                        <LuBookOpen
                          size={15}
                          className="position-absolute text-muted"
                          style={{
                            left: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                          }}
                        />
                        <input
                          className="sc-input ps-4"
                          placeholder="e.g. Adult Health Nursing-I"
                          value={item.subject}
                          onChange={(e) =>
                            updateSubject(index, "subject", e.target.value)
                          }
                          required
                        />
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateSubject(index, "ospe", true)}
                          className={`btn-sc btn-sc-sm ${
                            item.ospe === true
                              ? "btn-sc-success"
                              : "btn-sc-outline"
                          }`}
                          style={{ minWidth: "68px" }}
                        >
                          <LuCheck size={13} />
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSubject(index, "ospe", false)}
                          className={`btn-sc btn-sc-sm ${
                            item.ospe === false
                              ? "btn-sc-dark"
                              : "btn-sc-outline"
                          }`}
                          style={{ minWidth: "68px" }}
                        >
                          <LuX size={13} />
                          No
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between pt-2">
            <button
              className="btn-sc btn-sc-outline text-danger"
              onClick={handleClear}
            >
              <LuTrash2 size={15} />
              Reset All
            </button>

            <button
              className="btn-sc btn-sc-primary"
              onClick={handleGenerate}
            >
              <LuSettings2 size={16} />
              <span>Configure Max Marks & Proceed</span>
              <LuArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Modern Modal for Max Marks */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <div>
            <Modal.Title className="d-flex align-items-center gap-2">
              <LuSettings2 size={18} className="text-primary" />
              Configure Maximum Marks
            </Modal.Title>
            <div className="text-muted" style={{ fontSize: "12.5px" }}>
              Define the maximum score thresholds for Mid and Final assessments
            </div>
          </div>
        </Modal.Header>

        <Modal.Body style={{ maxHeight: "68vh", overflowY: "auto" }}>
          <div className="p-3 mb-3 rounded-3 bg-light border text-muted d-flex align-items-center gap-2" style={{ fontSize: "12.5px" }}>
            <LuCircleAlert size={16} className="text-primary flex-shrink-0" />
            <span>Scores entered above these limits in uploaded spreadsheets will automatically highlight in light red.</span>
          </div>

          <div className="d-flex flex-column gap-3">
            {tempSubjects.map((subj, idx) => (
              <div
                key={idx}
                className="p-3 rounded-3 border bg-white shadow-sm"
              >
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-dark text-white rounded-circle" style={{ width: "22px", height: "22px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}>
                      {idx + 1}
                    </span>
                    <span className="fw-bold text-dark" style={{ fontSize: "14px" }}>
                      {subj.subject || `Subject ${idx + 1}`}
                    </span>
                  </div>
                  {subj.ospe ? (
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1" style={{ fontSize: "11px" }}>
                      Theory + OSPE
                    </span>
                  ) : (
                    <span className="badge bg-light text-muted border px-2 py-1" style={{ fontSize: "11px" }}>
                      Theory Only
                    </span>
                  )}
                </div>

                <div className="row g-3">
                  <div className="col-md-3">
                    <Form.Label className="small fw-semibold text-secondary">
                      Max Mid Marks
                    </Form.Label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      className="sc-input"
                      value={subj.maxMid}
                      onChange={(e) => {
                        const updated = [...tempSubjects];
                        updated[idx].maxMid = e.target.value;
                        setTempSubjects(updated);
                      }}
                      min="0"
                      required
                    />
                  </div>

                  <div className="col-md-3">
                    <Form.Label className="small fw-semibold text-secondary">
                      Max Final Marks
                    </Form.Label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      className="sc-input"
                      value={subj.maxFinal}
                      onChange={(e) => {
                        const updated = [...tempSubjects];
                        updated[idx].maxFinal = e.target.value;
                        setTempSubjects(updated);
                      }}
                      min="0"
                      required
                    />
                  </div>

                  {subj.ospe && (
                    <>
                      <div className="col-md-3">
                        <Form.Label className="small fw-semibold text-secondary">
                          OSPE Max Mid
                        </Form.Label>
                        <input
                          type="number"
                          placeholder="e.g. 20"
                          className="sc-input"
                          value={subj.ospeMaxMid || ""}
                          onChange={(e) => {
                            const updated = [...tempSubjects];
                            updated[idx].ospeMaxMid = e.target.value;
                            setTempSubjects(updated);
                          }}
                          min="0"
                          required
                        />
                      </div>

                      <div className="col-md-3">
                        <Form.Label className="small fw-semibold text-secondary">
                          OSPE Max Final
                        </Form.Label>
                        <input
                          type="number"
                          placeholder="e.g. 20"
                          className="sc-input"
                          value={subj.ospeMaxFinal || ""}
                          onChange={(e) => {
                            const updated = [...tempSubjects];
                            updated[idx].ospeMaxFinal = e.target.value;
                            setTempSubjects(updated);
                          }}
                          min="0"
                          required
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-between">
          <button
            type="button"
            className="btn-sc btn-sc-secondary"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-sc btn-sc-primary"
            onClick={handleModalSave}
          >
            <LuCheck size={16} />
            Save & Open Marks Sheet
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
