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
  LuClock,
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
          creditHours: s.creditHours || "",
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
      creditHours: "",
      passPercentage: 50,
      ospe: false,
      ospeType: "separated", // "combined" | "separated"
      maxMid: "",
      maxFinal: "70",
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

    setTempSubjects(
      subjects.map((s) => {
        return {
          ...s,
          creditHours: s.creditHours || "",
          passPercentage: s.passPercentage ?? 50,
          maxMid: s.maxMid !== "" && s.maxMid !== undefined ? String(s.maxMid) : "",
          maxFinal: s.maxFinal !== "" && s.maxFinal !== undefined ? String(s.maxFinal) : "70",
          ospeMaxMid: s.ospeMaxMid !== "" && s.ospeMaxMid !== undefined ? String(s.ospeMaxMid) : "",
          ospeMaxFinal: s.ospeMaxFinal !== "" && s.ospeMaxFinal !== undefined ? String(s.ospeMaxFinal) : "",
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
      const isCombined = updated[idx].ospe && updated[idx].ospeType === "combined";

      if (isCombined) {
        // Combined OSPE: Only two fields (Mid & Final)
        updated[idx].maxMid = String((scheme.midTheory ?? 0) + (scheme.midPrac ?? 0) || 15);
        updated[idx].maxFinal = "70";
        updated[idx].ospeMaxMid = "";
        updated[idx].ospeMaxFinal = "";
      } else if (updated[idx].ospe) {
        // Separated OSPE: Theory Mid/Final + OSPE Mid/Final
        updated[idx].maxMid = String(scheme.midTheory ?? 15);
        updated[idx].maxFinal = "70";
        updated[idx].ospeMaxMid = String(scheme.midPrac || 10);
        updated[idx].ospeMaxFinal = String(scheme.finalPrac || 20);
      } else {
        // Theory Only
        updated[idx].maxMid = String(scheme.midTheory || 15);
        updated[idx].maxFinal = "70";
        updated[idx].ospeMaxMid = "";
        updated[idx].ospeMaxFinal = "";
      }

      updated[idx].passPercentage = 50;
    }
    setTempSubjects(updated);
  };

  const handleModalSave = () => {
    const invalid = tempSubjects.some((s) => {
      if (!s.creditHours) return true;
      if (s.maxMid === "" || s.maxFinal === "") return true;
      if (s.ospe && s.ospeType === "separated" && (s.ospeMaxMid === "" || s.ospeMaxFinal === "")) {
        return true;
      }
      const passP = Number(s.passPercentage);
      if (isNaN(passP) || passP < 30 || passP > 90) return true;
      return false;
    });

    if (invalid) {
      alert(
        "Please ensure Credit Hours are selected and valid marks are entered for each subject."
      );
      return;
    }

    const updated = tempSubjects.map((s) => {
      const isCombined = s.ospe && s.ospeType === "combined";
      return {
        ...s,
        creditHours: s.creditHours || "",
        passPercentage: Number(s.passPercentage) || 50,
        maxMid: Number(s.maxMid),
        maxFinal: Number(s.maxFinal),
        ospe: Boolean(s.ospe),
        ospeType: s.ospe ? s.ospeType || "separated" : undefined,
        ospeMaxMid: s.ospe && !isCombined ? Number(s.ospeMaxMid) : undefined,
        ospeMaxFinal: s.ospe && !isCombined ? Number(s.ospeMaxFinal) : undefined,
      };
    });

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
              Define credit hours and assessment maximum marks
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
              Select the course credit hours (e.g. 1+0, 2+0, 2+1, 3+0) to configure maximum marks.
            </span>
          </div>

          <div className="d-flex flex-column gap-3">
            {tempSubjects.map((subj, idx) => {
              const isCombined = subj.ospe && subj.ospeType === "combined";
              const isSeparated = subj.ospe && subj.ospeType === "separated";

              return (
                <div
                  key={idx}
                  className="p-3 rounded-3 border bg-white shadow-sm"
                >
                  {/* Top Header: Subject Number, Name, OSPE Badge, and Credit Hours Dropdown */}
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2 border-bottom pb-2">
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
                          {isCombined
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

                    {/* Simple Credit Hours Dropdown */}
                    <div className="d-flex align-items-center gap-2">
                      <LuClock size={15} className="text-primary flex-shrink-0" />
                      <label
                        className="small fw-semibold text-secondary mb-0"
                        style={{ whiteSpace: "nowrap", fontSize: "12px" }}
                      >
                        Credit Hours:
                      </label>
                      <select
                        className="sc-select sc-select-sm"
                        style={{ minWidth: "130px", fontWeight: "600", fontSize: "13px" }}
                        value={subj.creditHours || ""}
                        onChange={(e) => handleCreditHourChange(idx, e.target.value)}
                      >
                        <option value="">Select Cr. Hr.</option>
                        {KMU_CREDIT_HOUR_SCHEME.map((opt) => (
                          <option key={opt.cr} value={opt.cr}>
                            {opt.cr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Below Area: ONLY show marks inputs once Credit Hours is selected */}
                  {!subj.creditHours ? (
                    <div
                      className="py-2 text-center text-muted fst-italic"
                      style={{ fontSize: "12.5px" }}
                    >
                      Please select Credit Hours above to view and configure marks.
                    </div>
                  ) : (
                    <div className="d-flex flex-wrap align-items-end justify-content-center gap-3 pt-2 animate-fade-in">
                      {/* If COMBINED OSPE or THEORY ONLY: Show only Mid Marks and Final Marks */}
                      {isCombined || !subj.ospe ? (
                        <>
                          <div style={{ width: "115px", flexShrink: 0 }}>
                            <label
                              className="d-block text-center mb-1"
                              style={{
                                fontSize: "11.5px",
                                fontWeight: "600",
                                color: "#475569",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Mid Marks
                            </label>
                            <input
                              type="number"
                              className="sc-input text-center"
                              style={{ height: "36px", fontSize: "13px" }}
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

                          <div style={{ width: "115px", flexShrink: 0 }}>
                            <label
                              className="d-block text-center mb-1"
                              style={{
                                fontSize: "11.5px",
                                fontWeight: "600",
                                color: "#475569",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Final Marks
                            </label>
                            <input
                              type="number"
                              className="sc-input text-center"
                              style={{ height: "36px", fontSize: "13px" }}
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
                        </>
                      ) : (
                        /* If SEPARATED OSPE: Show Theory Mid, Theory Final, OSPE Mid, OSPE Final */
                        <>
                          <div style={{ width: "105px", flexShrink: 0 }}>
                            <label
                              className="d-block text-center mb-1"
                              style={{
                                fontSize: "11.5px",
                                fontWeight: "600",
                                color: "#475569",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Theory Mid
                            </label>
                            <input
                              type="number"
                              className="sc-input text-center"
                              style={{ height: "36px", fontSize: "13px" }}
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

                          <div style={{ width: "105px", flexShrink: 0 }}>
                            <label
                              className="d-block text-center mb-1"
                              style={{
                                fontSize: "11.5px",
                                fontWeight: "600",
                                color: "#475569",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Theory Final
                            </label>
                            <input
                              type="number"
                              className="sc-input text-center"
                              style={{ height: "36px", fontSize: "13px" }}
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

                          <div style={{ width: "105px", flexShrink: 0 }}>
                            <label
                              className="d-block text-center mb-1"
                              style={{
                                fontSize: "11.5px",
                                fontWeight: "600",
                                color: "#475569",
                                whiteSpace: "nowrap",
                              }}
                            >
                              OSPE Mid
                            </label>
                            <input
                              type="number"
                              className="sc-input text-center"
                              style={{ height: "36px", fontSize: "13px" }}
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

                          <div style={{ width: "105px", flexShrink: 0 }}>
                            <label
                              className="d-block text-center mb-1"
                              style={{
                                fontSize: "11.5px",
                                fontWeight: "600",
                                color: "#475569",
                                whiteSpace: "nowrap",
                              }}
                            >
                              OSPE Final
                            </label>
                            <input
                              type="number"
                              className="sc-input text-center"
                              style={{ height: "36px", fontSize: "13px" }}
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

                      {/* Small Pass % Input (2 digits) */}
                      <div style={{ width: "85px", flexShrink: 0 }}>
                        <label
                          className="d-block text-center mb-1"
                          style={{
                            fontSize: "11.5px",
                            fontWeight: "600",
                            color: "#475569",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Pass %
                        </label>
                        <div className="input-group" style={{ height: "36px" }}>
                          <input
                            type="number"
                            className="form-control sc-input text-center px-1"
                            style={{ height: "36px", fontSize: "13px" }}
                            value={subj.passPercentage ?? 50}
                            onChange={(e) => {
                              const updated = [...tempSubjects];
                              updated[idx].passPercentage = e.target.value;
                              setTempSubjects(updated);
                            }}
                            min="30"
                            max="90"
                            step="1"
                            required
                          />
                          <span
                            className="input-group-text bg-light text-muted px-2"
                            style={{ fontSize: "11px" }}
                          >
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
