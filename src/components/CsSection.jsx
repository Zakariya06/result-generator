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
  LuLayers,
  LuSplit,
  LuClock,
  LuPercent,
} from "react-icons/lu";
import { KMU_CREDIT_HOUR_SCHEME } from "../utils/kmuCreditScheme";

export default function CsSection() {
  const { subjects: contextSubjects, saveSubjects } = useSubject();
  const navigate = useNavigate();

  const [count, setCount] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [tempSubjects, setTempSubjects] = useState([]);

  useEffect(() => {
    if (contextSubjects?.length) {
      setSubjects(
        contextSubjects.map((s) => ({
          ...s,
          creditHours: s.creditHours || (s.ospe ? "2+1" : "3+0"),
          passPercentage: s.passPercentage ?? 50,
          ospeType: s.ospeType || (s.ospe ? "separated" : "combined"),
        }))
      );
      setCount(contextSubjects.length.toString());
    }
  }, [contextSubjects]);

  const handleCountChange = (value) => {
    setCount(value);
    const newSubjects = Array.from({ length: value }, () => ({
      subject: "",
      creditHours: "3+0",
      passPercentage: 50,
      ospe: false,
      ospeType: "separated", // "combined" | "separated"
      maxMid: "15",
      maxFinal: "60",
      ospeMaxMid: "",
      ospeMaxFinal: "",
    }));
    setSubjects(newSubjects);
  };

  const updateSubject = (index, key, value) => {
    const updated = [...subjects];
    updated[index][key] = value;
    if (key === "ospe" && value === true && !updated[index].ospeType) {
      updated[index].ospeType = "separated";
    }
    setSubjects(updated);
  };

  const handleGenerate = () => {
    const hasEmptyField = subjects.some(
      (s) => s.subject.trim() === "" || s.ospe === null
    );
    if (hasEmptyField) {
      alert("Please enter course / subject names for all rows.");
      return;
    }
    // Pre-populate defaults if not present
    setTempSubjects(
      subjects.map((s) => {
        const defaultCr = s.creditHours || (s.ospe ? "2+1" : "3+0");
        const scheme = KMU_CREDIT_HOUR_SCHEME.find((x) => x.cr === defaultCr);
        return {
          ...s,
          creditHours: defaultCr,
          passPercentage: s.passPercentage ?? 50,
          maxMid:
            s.maxMid !== "" && s.maxMid !== undefined
              ? String(s.maxMid)
              : scheme
              ? String(scheme.midTheory)
              : "15",
          maxFinal:
            s.maxFinal !== "" && s.maxFinal !== undefined
              ? String(s.maxFinal)
              : scheme
              ? String(scheme.finalTheory)
              : "60",
          ospeMaxMid:
            s.ospeMaxMid !== "" && s.ospeMaxMid !== undefined
              ? String(s.ospeMaxMid)
              : scheme && scheme.hasOspe
              ? String(scheme.midPrac)
              : "",
          ospeMaxFinal:
            s.ospeMaxFinal !== "" && s.ospeMaxFinal !== undefined
              ? String(s.ospeMaxFinal)
              : scheme && scheme.hasOspe
              ? String(scheme.finalPrac)
              : "",
        };
      })
    );
    setShowModal(true);
  };

  const handleCreditHourChange = (idx, newCr) => {
    const updated = [...tempSubjects];
    const scheme = KMU_CREDIT_HOUR_SCHEME.find((x) => x.cr === newCr);
    updated[idx].creditHours = newCr;

    if (scheme) {
      updated[idx].ospe = scheme.hasOspe;
      if (scheme.hasOspe && !updated[idx].ospeType) {
        updated[idx].ospeType = "separated";
      }
      updated[idx].maxMid = String(scheme.midTheory ?? 0);
      updated[idx].maxFinal = String(scheme.finalTheory ?? 0);
      updated[idx].ospeMaxMid = scheme.hasOspe ? String(scheme.midPrac ?? 0) : "";
      updated[idx].ospeMaxFinal = scheme.hasOspe ? String(scheme.finalPrac ?? 0) : "";
    }
    setTempSubjects(updated);
  };

  const handleModalSave = () => {
    const invalid = tempSubjects.some((s) => {
      if (!s.creditHours) return true;
      if (s.maxMid === "" || s.maxFinal === "") return true;
      if (s.ospe && (s.ospeMaxMid === "" || s.ospeMaxFinal === "")) return true;
      const passP = Number(s.passPercentage);
      if (isNaN(passP) || passP < 45 || passP > 85) return true;
      return false;
    });
    if (invalid) {
      alert(
        "Please ensure all fields are filled: select credit hours, enter valid maximum marks, and set a pass percentage between 45% and 85%."
      );
      return;
    }

    const updated = tempSubjects.map((s) => ({
      ...s,
      creditHours: s.creditHours || (s.ospe ? "2+1" : "3+0"),
      passPercentage: Number(s.passPercentage) || 50,
      maxMid: Number(s.maxMid),
      maxFinal: Number(s.maxFinal),
      ospe: Boolean(s.ospe),
      ospeType: s.ospe ? s.ospeType || "separated" : undefined,
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
                  <th style={{ width: "50px" }}>#</th>
                  <th>Subject / Course Title</th>
                  <th style={{ width: "320px" }}>Practical / OSPE Component</th>
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
                          size={16}
                          className="position-absolute text-muted"
                          style={{
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                          }}
                        />
                        <input
                          className="sc-input"
                          style={{ paddingLeft: "38px" }}
                          placeholder="Enter course / subject title (e.g. Adult Health Nursing-I)"
                          value={item.subject}
                          onChange={(e) =>
                            updateSubject(index, "subject", e.target.value)
                          }
                          required
                        />
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-2">
                        {/* Yes / No Toggle Buttons */}
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

                        {/* OSPE Mode Selection (Visible when Yes is selected) */}
                        {item.ospe && (
                          <div
                            className="d-flex align-items-center gap-2 p-2 rounded-2 border animate-fade-in"
                            style={{
                              backgroundColor: "#f8fafc",
                              borderColor: "#e2e8f0",
                              fontSize: "12px",
                            }}
                          >
                            <span className="text-muted fw-semibold">Mode:</span>
                            <div className="form-check form-check-inline m-0 d-flex align-items-center gap-1">
                              <input
                                className="form-check-input"
                                type="radio"
                                name={`ospeType_${index}`}
                                id={`ospeType_sep_${index}`}
                                value="separated"
                                checked={item.ospeType !== "combined"}
                                onChange={() =>
                                  updateSubject(index, "ospeType", "separated")
                                }
                                style={{ cursor: "pointer" }}
                              />
                              <label
                                className="form-check-label text-dark fw-medium"
                                htmlFor={`ospeType_sep_${index}`}
                                style={{ cursor: "pointer" }}
                              >
                                Separated
                              </label>
                            </div>
                            <div className="form-check form-check-inline m-0 d-flex align-items-center gap-1">
                              <input
                                className="form-check-input"
                                type="radio"
                                name={`ospeType_${index}`}
                                id={`ospeType_comb_${index}`}
                                value="combined"
                                checked={item.ospeType === "combined"}
                                onChange={() =>
                                  updateSubject(index, "ospeType", "combined")
                                }
                                style={{ cursor: "pointer" }}
                              />
                              <label
                                className="form-check-label text-dark fw-medium"
                                htmlFor={`ospeType_comb_${index}`}
                                style={{ cursor: "pointer" }}
                              >
                                Combined
                              </label>
                            </div>
                          </div>
                        )}
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
          <div
            className="p-3 mb-3 rounded-3 bg-light border text-muted d-flex align-items-center gap-2"
            style={{ fontSize: "12.5px" }}
          >
            <LuCircleAlert size={16} className="text-primary flex-shrink-0" />
            <span>
              Select the course credit hours (Theory + OSPE) according to the KMU examination scheme. Maximum marks and passing thresholds will automatically configure.
            </span>
          </div>

          <div className="d-flex flex-column gap-3">
            {tempSubjects.map((subj, idx) => (
              <div
                key={idx}
                className="p-3 rounded-3 border bg-white shadow-sm"
              >
                {/* Top Row: Subject Title on Left, Credit Hours Dropdown on Right */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 border-bottom pb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className="badge bg-dark text-white rounded-circle"
                      style={{
                        width: "22px",
                        height: "22px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span
                      className="fw-bold text-dark"
                      style={{ fontSize: "14.5px" }}
                    >
                      {subj.subject || `Subject ${idx + 1}`}
                    </span>
                    {subj.ospe ? (
                      <span
                        className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1"
                        style={{ fontSize: "11px" }}
                      >
                        {subj.ospeType === "combined"
                          ? "Theory + OSPE (Combined)"
                          : "Theory + OSPE (Separated)"}
                      </span>
                    ) : (
                      <span
                        className="badge bg-light text-muted border px-2 py-1"
                        style={{ fontSize: "11px" }}
                      >
                        Theory Only
                      </span>
                    )}
                  </div>

                  {/* Credit Hours Dropdown on Right */}
                  <div className="d-flex align-items-center gap-2">
                    <LuClock size={15} className="text-primary flex-shrink-0" />
                    <label className="small fw-bold text-secondary mb-0">
                      Credit Hours:
                    </label>
                    <select
                      className="sc-select sc-select-sm"
                      style={{ minWidth: "160px", fontWeight: "600" }}
                      value={subj.creditHours || ""}
                      onChange={(e) => handleCreditHourChange(idx, e.target.value)}
                    >
                      <option value="">Select Cr. Hr.</option>
                      {KMU_CREDIT_HOUR_SCHEME.map((opt) => (
                        <option key={opt.cr} value={opt.cr}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bottom Row: Marks Configuration */}
                <div className="row g-3">
                  <div className="col-md-2 col-6">
                    <Form.Label className="small fw-semibold text-secondary">
                      Mid Marks (Theory)
                    </Form.Label>
                    <input
                      type="number"
                      placeholder="e.g. 15"
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

                  <div className="col-md-2 col-6">
                    <Form.Label className="small fw-semibold text-secondary">
                      Final Marks (Theory)
                    </Form.Label>
                    <input
                      type="number"
                      placeholder="e.g. 60"
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
                      <div className="col-md-2 col-6">
                        <Form.Label className="small fw-semibold text-secondary">
                          OSPE Mid Marks
                        </Form.Label>
                        <input
                          type="number"
                          placeholder="e.g. 5"
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

                      <div className="col-md-2 col-6">
                        <Form.Label className="small fw-semibold text-secondary">
                          OSPE Final Marks
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

                  {/* Subject Pass Percentage Input */}
                  <div className={subj.ospe ? "col-md-4 col-12" : "col-md-4 col-12"}>
                    <Form.Label className="small fw-semibold text-secondary d-flex align-items-center justify-content-between">
                      <span>Pass Threshold (%)</span>
                      <span className="text-muted" style={{ fontSize: "11px" }}>45% – 85%</span>
                    </Form.Label>
                    <div className="input-group">
                      <input
                        type="number"
                        placeholder="50"
                        className="form-control sc-input"
                        value={subj.passPercentage ?? 50}
                        onChange={(e) => {
                          const updated = [...tempSubjects];
                          updated[idx].passPercentage = e.target.value;
                          setTempSubjects(updated);
                        }}
                        min="45"
                        max="85"
                        step="1"
                        required
                      />
                      <span className="input-group-text bg-light text-muted" style={{ fontSize: "13px" }}>
                        %
                      </span>
                    </div>
                  </div>

                  {/* If OSPE, also show quick toggle for separated vs combined */}
                  {subj.ospe && (
                    <div className="col-12 mt-2">
                      <div
                        className="d-flex align-items-center gap-3 p-2 rounded-2 bg-light border"
                        style={{ fontSize: "12px" }}
                      >
                        <span className="fw-semibold text-secondary">OSPE Layout Mode:</span>
                        <div className="form-check form-check-inline m-0">
                          <input
                            className="form-check-input"
                            type="radio"
                            name={`modal_ospeType_${idx}`}
                            id={`modal_ospeType_sep_${idx}`}
                            value="separated"
                            checked={subj.ospeType !== "combined"}
                            onChange={() => {
                              const updated = [...tempSubjects];
                              updated[idx].ospeType = "separated";
                              setTempSubjects(updated);
                            }}
                          />
                          <label
                            className="form-check-label text-dark fw-medium"
                            htmlFor={`modal_ospeType_sep_${idx}`}
                            style={{ cursor: "pointer" }}
                          >
                            Separated Columns (Theory & OSPE standalone)
                          </label>
                        </div>

                        <div className="form-check form-check-inline m-0">
                          <input
                            className="form-check-input"
                            type="radio"
                            name={`modal_ospeType_${idx}`}
                            id={`modal_ospeType_comb_${idx}`}
                            value="combined"
                            checked={subj.ospeType === "combined"}
                            onChange={() => {
                              const updated = [...tempSubjects];
                              updated[idx].ospeType = "combined";
                              setTempSubjects(updated);
                            }}
                          />
                          <label
                            className="form-check-label text-dark fw-medium"
                            htmlFor={`modal_ospeType_comb_${idx}`}
                            style={{ cursor: "pointer" }}
                          >
                            Combined Column (Theory + OSPE summed)
                          </label>
                        </div>
                      </div>
                    </div>
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
            Save & Open Combine Sheet
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
