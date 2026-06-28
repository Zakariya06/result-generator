import { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";

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

  useEffect(() => {
    if (studentData) {
      // Editing existing student
      setFormData({
        ...emptyStudentBase,
        ...studentData,
      });
    } else {
      // Adding new student: initialize subjects with empty marks
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
    const updatedSubjects = [...formData.subjects];
    updatedSubjects[index] = { ...updatedSubjects[index], [field]: value };
    setFormData((prev) => ({ ...prev, subjects: updatedSubjects }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave(formData); // Simulate network/db delay for loader effect
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>
          {studentData ? "✏️ Edit Student Record" : "➕ Add New Record"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
        <Form>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-bold">Name</Form.Label>
                <Form.Control
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter Name"
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-bold">Father's Name</Form.Label>
                <Form.Control
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  placeholder="Enter Father Name"
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-bold">Roll Number</Form.Label>
                <Form.Control
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  placeholder="Enter Roll Number"
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-bold">Registration</Form.Label>
                <Form.Control
                  name="registration"
                  value={formData.registration}
                  onChange={handleChange}
                  placeholder="Enter Registration"
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-bold">Institute</Form.Label>
                <Form.Control
                  name="institute"
                  value={formData.institute}
                  onChange={handleChange}
                  placeholder="Enter Institute"
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-bold">Discipline</Form.Label>
                <Form.Control
                  name="Discipline"
                  value={formData.Discipline}
                  onChange={handleChange}
                  placeholder="Enter Discipline"
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-bold">Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Regular">Regular</option>
                  <option value="Re-appear">Re-appear</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-bold">Semester</Form.Label>
                <Form.Control
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  placeholder="Enter Semester"
                />
              </Form.Group>
            </div>
          </div>

          <h6 className="mt-4 mb-3 text-primary border-bottom pb-2">
            📚 Subjects Marks
          </h6>
          <div className="row g-2">
            {formData.subjects?.map((subj, idx) => (
              <div
                key={idx}
                className="col-12 mb-2 p-2 bg-light rounded shadow-sm"
              >
                <div className="fw-bold mb-2" style={{ fontSize: "0.9rem" }}>
                  {subj.subject}
                </div>
                <div className="d-flex gap-3">
                  <Form.Group style={{ flex: 1 }}>
                    <Form.Label className="small text-muted">
                      Mid Marks
                    </Form.Label>
                    <Form.Control
                      type="number"
                      size="sm"
                      value={subj.mid}
                      onChange={(e) =>
                        handleSubjectChange(idx, "mid", e.target.value)
                      }
                      placeholder="Mid"
                    />
                  </Form.Group>
                  <Form.Group style={{ flex: 1 }}>
                    <Form.Label className="small text-muted">
                      Final Marks
                    </Form.Label>
                    <Form.Control
                      type="number"
                      size="sm"
                      value={subj.final}
                      onChange={(e) =>
                        handleSubjectChange(idx, "final", e.target.value)
                      }
                      placeholder="Final"
                    />
                  </Form.Group>
                </div>
              </div>
            ))}
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onHide} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Saving...
            </>
          ) : studentData ? (
            "Update Record"
          ) : (
            "Save Record"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
