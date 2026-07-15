import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubject } from "../context/SubjectContext";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

export default function CsSection() {
  const { subjects: contextSubjects, saveSubjects } = useSubject();
  const navigate = useNavigate();

  const [count, setCount] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [tempSubjects, setTempSubjects] = useState([]); // for modal editing

  // Load existing subjects from context on mount
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
      ospe: null,
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

  // Open modal after validation
  const handleGenerate = () => {
    const hasEmptyField = subjects.some(
      (s) => s.subject.trim() === "" || s.ospe === null,
    );
    if (hasEmptyField) {
      alert("Please fill all subject names and select OSPE for each.");
      return;
    }
    // Copy current subjects to temp for editing in modal
    setTempSubjects(subjects.map((s) => ({ ...s })));
    setShowModal(true);
  };

  // Save changes from modal
  const handleModalSave = () => {
    // Validate max marks
    const invalid = tempSubjects.some((s) => {
      if (s.maxMid === "" || s.maxFinal === "") return true;
      if (s.ospe && (s.ospeMaxMid === "" || s.ospeMaxFinal === "")) return true;
      return false;
    });
    if (invalid) {
      alert("Please fill all max marks fields (and OSPE ones if applicable).");
      return;
    }

    // Convert to numbers
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
      <label className="labelText">How many paper you have</label>

      <select
        className="inputField"
        value={count}
        onChange={(e) => handleCountChange(Number(e.target.value))}
      >
        <option value="">Select</option>
        {[...Array(10)].map((_, i) => (
          <option key={i} value={i + 1}>
            {i + 1}
          </option>
        ))}
      </select>

      {subjects.length > 0 && (
        <>
          <table className="customTable">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>Subject</th>
                <th>OSPE</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <input
                      className="tableInput"
                      placeholder="Enter subject"
                      value={item.subject}
                      onChange={(e) =>
                        updateSubject(index, "subject", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <div className="radioGroup">
                      <label>
                        <input
                          type="radio"
                          name={`ospe-${index}`}
                          checked={item.ospe === true}
                          onChange={() => updateSubject(index, "ospe", true)}
                          className="me-1"
                        />
                        Yes
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={`ospe-${index}`}
                          checked={item.ospe === false}
                          onChange={() => updateSubject(index, "ospe", false)}
                          className="me-1"
                        />
                        No
                      </label>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="buttonRow" style={{ marginTop: "1rem" }}>
            <button className="secondaryButton" onClick={handleGenerate}>
              Generate Subject
            </button>
            <button className="secondaryButton" onClick={handleClear}>
              Clear
            </button>
          </div>
        </>
      )}

      {/* Bootstrap Modal for max marks */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="md"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Configure Max Marks</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {tempSubjects.map((subj, idx) => (
            <div key={idx} className="mb-4 border-bottom pb-3">
              <h6 className="fw-bold">
                {subj.subject} {subj.ospe ? "(with OSPE)" : ""}
              </h6>
              <div className="row g-2">
                <div className="col-md-3">
                  <Form.Label>Max Mid</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g. 50"
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
                  <Form.Label>Max Final</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g. 50"
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
                      <Form.Label>OSPE Max Mid</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="e.g. 20"
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
                      <Form.Label>OSPE Max Final</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="e.g. 20"
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
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleModalSave}>
            Save & Generate Sheet
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
