import { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import {
  LuPencil,
  LuUserPlus,
  LuSave,
  LuUser,
  LuBookOpen,
  LuGraduationCap,
  LuCheck,
} from "react-icons/lu";

const emptyStudentBase = {
  name: "",
  fatherName: "",
  rollNumber: "",
  registration: "",
  institute: "",
  Discipline: "",
  status: "Regular",
  semester: "",
  Region: "",
  examType: "",
  subjectType: "",
};

export default function StudentFormModal({
  show,
  onHide,
  studentData,
  subjects,
  onSave,
}) {
  const [formData, setFormData] = useState(emptyStudentBase);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info"); // "info" | "marks"

  useEffect(() => {
    if (studentData) {
      setFormData({
        ...emptyStudentBase,
        ...studentData,
      });
    } else {
      const initialSubjects = subjects.flatMap((s) => {
        const arr = [{ subject: s.subject, mid: "", final: "" }];
        if (s.ospe) {
          arr.push({ subject: `${s.subject} - OSPE`, mid: "", final: "" });
        }
        return arr;
      });

      setFormData({
        ...emptyStudentBase,
        isRA: false,
        subjects: initialSubjects,
      });
    }
  }, [studentData, subjects, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...(formData.subjects || [])];
    updatedSubjects[index] = { ...updatedSubjects[index], [field]: value };
    setFormData((prev) => ({ ...prev, subjects: updatedSubjects }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <div>
          <Modal.Title className="d-flex align-items-center gap-2">
            {studentData ? (
              <>
                <LuPencil size={18} className="text-primary" />
                <span>Edit Candidate Record</span>
              </>
            ) : (
              <>
                <LuUserPlus size={18} className="text-primary" />
                <span>Add Candidate Record</span>
              </>
            )}
          </Modal.Title>
          <div className="text-muted" style={{ fontSize: "12.5px" }}>
            {studentData
              ? `Updating enrollment & evaluation for ${studentData.name || "candidate"}`
              : "Register a new student entry into the active examination sheet"}
          </div>
        </div>
      </Modal.Header>

      <div className="px-4 pt-3 border-bottom bg-light">
        <div className="sc-filter-tabs" style={{ maxWidth: "280px" }}>
          <button
            type="button"
            className={`sc-filter-btn flex-fill d-flex align-items-center justify-content-center gap-1 ${
              activeTab === "info" ? "active" : ""
            }`}
            onClick={() => setActiveTab("info")}
          >
            <LuUser size={14} />
            <span>Candidate Info</span>
          </button>
          <button
            type="button"
            className={`sc-filter-btn flex-fill d-flex align-items-center justify-content-center gap-1 ${
              activeTab === "marks" ? "active" : ""
            }`}
            onClick={() => setActiveTab("marks")}
          >
            <LuBookOpen size={14} />
            <span>Subject Marks ({formData.subjects?.length || 0})</span>
          </button>
        </div>
      </div>

      <Modal.Body style={{ maxHeight: "65vh", overflowY: "auto" }}>
        {activeTab === "info" ? (
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Label className="small fw-semibold text-secondary">
                Candidate Full Name
              </Form.Label>
              <input
                className="sc-input"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Muhammad Ali"
                required
              />
            </div>

            <div className="col-md-6">
              <Form.Label className="small fw-semibold text-secondary">
                Father's Name
              </Form.Label>
              <input
                className="sc-input"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
                placeholder="e.g. Ahmad Khan"
                required
              />
            </div>

            <div className="col-md-6">
              <Form.Label className="small fw-semibold text-secondary">
                Roll Number
              </Form.Label>
              <input
                className="sc-input font-monospace"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                placeholder="e.g. 2024-KMU-102"
                required
              />
            </div>

            <div className="col-md-6">
              <Form.Label className="small fw-semibold text-secondary">
                Registration Number
              </Form.Label>
              <input
                className="sc-input font-monospace"
                name="registration"
                value={formData.registration}
                onChange={handleChange}
                placeholder="e.g. 2024-KMU-REG-01"
              />
            </div>

            <div className="col-md-6">
              <Form.Label className="small fw-semibold text-secondary">
                Institute / Affiliated College
              </Form.Label>
              <input
                className="sc-input"
                name="institute"
                value={formData.institute}
                onChange={handleChange}
                placeholder="e.g. KMU IHS Swat"
                required
              />
            </div>

            <div className="col-md-6">
              <Form.Label className="small fw-semibold text-secondary">
                Discipline / Department
              </Form.Label>
              <input
                className="sc-input"
                name="Discipline"
                value={formData.Discipline}
                onChange={handleChange}
                placeholder="e.g. BS Nursing (Generic)"
              />
            </div>

            <div className="col-md-6">
              <Form.Label className="small fw-semibold text-secondary">
                Candidate Status
              </Form.Label>
              <select
                className="sc-select w-100"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Regular">Regular</option>
                <option value="Re-appear">Re-appear</option>
              </select>
            </div>

            <div className="col-md-6">
              <Form.Label className="small fw-semibold text-secondary">
                Semester / Session
              </Form.Label>
              <input
                className="sc-input"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                placeholder="e.g. 4th Semester"
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="row g-2">
              {formData.subjects?.map((subj, idx) => (
                <div
                  key={idx}
                  className="col-12 p-3 bg-white rounded-3 border mb-2 shadow-sm"
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="fw-bold text-dark" style={{ fontSize: "13.5px" }}>
                      {subj.subject}
                    </div>
                    {subj.subject.includes("- OSPE") ? (
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-0" style={{ fontSize: "10.5px" }}>
                        OSPE
                      </span>
                    ) : (
                      <span className="badge bg-light text-muted border px-2 py-0" style={{ fontSize: "10.5px" }}>
                        Theory
                      </span>
                    )}
                  </div>
                  <div className="d-flex gap-3">
                    <div style={{ flex: 1 }}>
                      <label className="form-label small text-muted mb-1">
                        Mid Marks
                      </label>
                      <input
                        type="number"
                        className="sc-input py-1"
                        value={subj.mid}
                        onChange={(e) =>
                          handleSubjectChange(idx, "mid", e.target.value)
                        }
                        placeholder="e.g. 25"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="form-label small text-muted mb-1">
                        Final Marks
                      </label>
                      <input
                        type="number"
                        className="sc-input py-1"
                        value={subj.final}
                        onChange={(e) =>
                          handleSubjectChange(idx, "final", e.target.value)
                        }
                        placeholder="e.g. 40"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <button
          type="button"
          className="btn-sc btn-sc-secondary"
          onClick={onHide}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="button"
          className="btn-sc btn-sc-primary"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <>
              <Spinner size="sm" className="me-2" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <LuCheck size={16} />
              <span>{studentData ? "Update Record" : "Save Record"}</span>
            </>
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
