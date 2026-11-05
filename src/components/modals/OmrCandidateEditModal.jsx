import { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import {
  LuUser,
  LuPencil,
  LuSave,
  LuCheck,
  LuTrash2,
  LuPlus,
  LuBookOpen,
  LuGraduationCap,
} from "react-icons/lu";
import {
  parseCreditHours,
  evaluateSubjectMarks,
  calculateSemesterGpa,
  getOverallGradeFromGpa,
} from "../../utils/kmuCreditScheme";

export default function OmrCandidateEditModal({
  show,
  onHide,
  candidate,
  subjects,
  globalConfig,
  onSave,
}) {
  const [studentInfo, setStudentInfo] = useState({
    name: "",
    fatherName: "",
    rollNumber: "",
    registration: "",
    institute: "",
    discipline: "",
    semester: "",
    isRA: false,
  });

  const [subjectRows, setSubjectRows] = useState([]);

  useEffect(() => {
    if (!candidate) return;

    setStudentInfo({
      name: candidate.name || "",
      fatherName: candidate.fatherName || "",
      rollNumber: candidate.rollNumber || "",
      registration: candidate.registration || "",
      institute: candidate.institute || "",
      discipline: candidate.discipline || "",
      semester: candidate.semester || "",
      isRA: Boolean(candidate.isRA),
    });

    // Populate subject rows from candidate.subjectRows
    const rows = (candidate.subjectRows || []).map((row) => ({
      title: row.title,
      creditHours: row.creditHours || (globalConfig?.creditHoursMap?.[row.title] ?? "3"),
      midMax: Number(row.midMax) || 0,
      finalMax: Number(row.finalMax) || 0,
      totalMax: Number(row.totalMax) || 0,
      midObtained: row.midObtained === "NA" || row.midObtained === "-" ? "" : row.midObtained,
      finalObtained: row.finalObtained === "NA" || row.finalObtained === "-" ? "" : row.finalObtained,
      isNA: Boolean(row.isNA),
    }));

    setSubjectRows(rows);
  }, [candidate, globalConfig, show]);

  const handleInfoChange = (field, value) => {
    setStudentInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubjectChange = (index, field, value) => {
    const updated = [...subjectRows];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-update totalMax if midMax or finalMax changes
    if (field === "midMax" || field === "finalMax") {
      const mid = Number(field === "midMax" ? value : updated[index].midMax) || 0;
      const fin = Number(field === "finalMax" ? value : updated[index].finalMax) || 0;
      updated[index].totalMax = mid + fin;
    }

    setSubjectRows(updated);
  };

  // Live evaluation of candidate rows
  const evaluatedRows = subjectRows.map((row) => {
    const midNum = parseFloat(row.midObtained);
    const finNum = parseFloat(row.finalObtained);
    let totalObt = NaN;

    if (!isNaN(midNum) && !isNaN(finNum)) {
      totalObt = midNum + finNum;
    } else if (!isNaN(midNum)) {
      totalObt = midNum;
    } else if (!isNaN(finNum)) {
      totalObt = finNum;
    }

    const maxMarks = Number(row.totalMax) || (Number(row.midMax) + Number(row.finalMax)) || 0;
    const matchCfg = (subjects || []).find(
      (s) =>
        s.subject &&
        (norm(s.subject) === norm(row.title) || norm(row.title).includes(norm(s.subject)))
    );
    const passP = matchCfg?.passPercentage ?? 50;

    const evalResult = !row.isNA && !isNaN(totalObt)
      ? evaluateSubjectMarks(totalObt, maxMarks, passP)
      : { isPassed: false, grade: "-", gpa: 0.0, percentage: null };

    return {
      ...row,
      totalObt: isNaN(totalObt) ? (row.isNA ? "NA" : "-") : totalObt,
      gpa: evalResult.gpa,
      grade: evalResult.grade,
      isPassed: evalResult.isPassed,
    };
  });

  const liveTotalCredits = evaluatedRows.reduce(
    (acc, r) => acc + (r.isNA ? 0 : parseCreditHours(r.creditHours)),
    0
  );
  const liveSemesterGpa = calculateSemesterGpa(evaluatedRows);

  const passedCount = evaluatedRows.filter((r) => !r.isNA && r.isPassed).length;
  const applicableCount = evaluatedRows.filter((r) => !r.isNA).length;
  const isCandidatePassed = applicableCount > 0 && passedCount > applicableCount / 2;
  const overallGrade = getOverallGradeFromGpa(liveSemesterGpa, isCandidatePassed);

  const handleSave = () => {
    // Reconstruct student data object
    const updatedStudent = {
      ...(candidate.student || {}),
      name: studentInfo.name,
      fatherName: studentInfo.fatherName,
      rollNumber: studentInfo.rollNumber,
      registration: studentInfo.registration,
      institute: studentInfo.institute,
      Discipline: studentInfo.discipline,
      semester: studentInfo.semester,
      status: studentInfo.isRA ? "Re-appear" : "Regular",
      // Save subjects with mid and final marks
      subjects: subjectRows.map((r) => ({
        subject: r.title,
        mid: r.isNA ? "NA" : r.midObtained,
        final: r.isNA ? "NA" : r.finalObtained,
        creditHours: r.creditHours,
        total: !isNaN(parseFloat(r.midObtained)) && !isNaN(parseFloat(r.finalObtained))
          ? parseFloat(r.midObtained) + parseFloat(r.finalObtained)
          : undefined,
      })),
      customCreditHours: subjectRows.reduce((acc, r) => {
        acc[r.title] = r.creditHours;
        return acc;
      }, {}),
    };

    onSave(updatedStudent);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered backdrop="static">
      <Modal.Header closeButton className="border-bottom pb-3">
        <div className="d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle"
            style={{ width: "36px", height: "36px" }}
          >
            <LuPencil size={18} />
          </div>
          <div>
            <Modal.Title className="fw-bold mb-0" style={{ fontSize: "17px" }}>
              Edit DMC Record: {candidate?.name} ({candidate?.rollNumber})
            </Modal.Title>
            <div className="text-muted" style={{ fontSize: "12px" }}>
              Modify individual student details, subject marks, and credit hours
            </div>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className="p-4" style={{ maxHeight: "75vh", overflowY: "auto" }}>
        {/* Candidate Personal Details */}
        <div className="p-3 bg-light rounded-3 border mb-4">
          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
            <LuUser size={16} className="text-primary" />
            <span>Candidate Credentials</span>
          </h6>

          <div className="row g-3">
            <div className="col-md-3">
              <Form.Label className="small fw-semibold mb-1">Student Name:</Form.Label>
              <Form.Control
                type="text"
                value={studentInfo.name}
                onChange={(e) => handleInfoChange("name", e.target.value)}
                className="sc-input"
              />
            </div>

            <div className="col-md-3">
              <Form.Label className="small fw-semibold mb-1">Father's Name:</Form.Label>
              <Form.Control
                type="text"
                value={studentInfo.fatherName}
                onChange={(e) => handleInfoChange("fatherName", e.target.value)}
                className="sc-input"
              />
            </div>

            <div className="col-md-3">
              <Form.Label className="small fw-semibold mb-1">Roll Number:</Form.Label>
              <Form.Control
                type="text"
                value={studentInfo.rollNumber}
                onChange={(e) => handleInfoChange("rollNumber", e.target.value)}
                className="sc-input"
              />
            </div>

            <div className="col-md-3">
              <Form.Label className="small fw-semibold mb-1">Registration #:</Form.Label>
              <Form.Control
                type="text"
                value={studentInfo.registration}
                onChange={(e) => handleInfoChange("registration", e.target.value)}
                className="sc-input"
              />
            </div>

            <div className="col-md-4">
              <Form.Label className="small fw-semibold mb-1">Institute Name:</Form.Label>
              <Form.Control
                type="text"
                value={studentInfo.institute}
                onChange={(e) => handleInfoChange("institute", e.target.value)}
                className="sc-input"
              />
            </div>

            <div className="col-md-3">
              <Form.Label className="small fw-semibold mb-1">Discipline / Class:</Form.Label>
              <Form.Control
                type="text"
                value={studentInfo.discipline}
                onChange={(e) => handleInfoChange("discipline", e.target.value)}
                className="sc-input"
              />
            </div>

            <div className="col-md-3">
              <Form.Label className="small fw-semibold mb-1">Examination / Semester:</Form.Label>
              <Form.Control
                type="text"
                value={studentInfo.semester}
                onChange={(e) => handleInfoChange("semester", e.target.value)}
                className="sc-input"
              />
            </div>

            <div className="col-md-2">
              <Form.Label className="small fw-semibold mb-1">Candidate Type:</Form.Label>
              <Form.Select
                value={studentInfo.isRA ? "reappear" : "regular"}
                onChange={(e) => handleInfoChange("isRA", e.target.value === "reappear")}
                className="sc-select"
              >
                <option value="regular">Regular</option>
                <option value="reappear">Re-appear</option>
              </Form.Select>
            </div>
          </div>
        </div>

        {/* Subjects & Marks Table */}
        <div className="border rounded-3 overflow-hidden">
          <div className="bg-light px-3 py-2 border-bottom d-flex align-items-center justify-content-between">
            <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <LuBookOpen size={16} className="text-primary" />
              <span>Subject Marks & Credit Hours</span>
            </h6>
            <div className="text-muted small">
              Live Total Credits: <strong>{liveTotalCredits}</strong> | Semester GPA:{" "}
              <strong className="text-primary">{liveSemesterGpa.toFixed(2)}</strong> ({overallGrade})
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-sm table-bordered mb-0 align-middle">
              <thead className="table-light text-center">
                <tr>
                  <th style={{ width: "24%" }} className="text-start">Subject Name</th>
                  <th style={{ width: "12%" }}>Cr. Hours</th>
                  <th style={{ width: "10%" }}>Mid Max</th>
                  <th style={{ width: "11%" }}>Mid Obtained</th>
                  <th style={{ width: "10%" }}>Final Max</th>
                  <th style={{ width: "11%" }}>Final Obtained</th>
                  <th style={{ width: "8%" }}>Total Max</th>
                  <th style={{ width: "8%" }}>Total Obt</th>
                  <th style={{ width: "6%" }}>GPA</th>
                </tr>
              </thead>
              <tbody>
                {evaluatedRows.map((row, idx) => (
                  <tr key={idx} className={row.isNA ? "table-light text-muted" : ""}>
                    <td>
                      <input
                        type="text"
                        value={row.title}
                        onChange={(e) => handleSubjectChange(idx, "title", e.target.value)}
                        className="form-control form-control-sm border-0 fw-semibold"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.creditHours}
                        onChange={(e) => handleSubjectChange(idx, "creditHours", e.target.value)}
                        placeholder="2+1 or 3"
                        className="form-control form-control-sm text-center"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.midMax}
                        onChange={(e) => handleSubjectChange(idx, "midMax", e.target.value)}
                        className="form-control form-control-sm text-center"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.midObtained}
                        placeholder={row.isNA ? "NA" : "Marks"}
                        onChange={(e) => handleSubjectChange(idx, "midObtained", e.target.value)}
                        className="form-control form-control-sm text-center"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.finalMax}
                        onChange={(e) => handleSubjectChange(idx, "finalMax", e.target.value)}
                        className="form-control form-control-sm text-center"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.finalObtained}
                        placeholder={row.isNA ? "NA" : "Marks"}
                        onChange={(e) => handleSubjectChange(idx, "finalObtained", e.target.value)}
                        className="form-control form-control-sm text-center"
                      />
                    </td>
                    <td className="text-center fw-bold">{row.totalMax}</td>
                    <td className="text-center fw-bold">{row.totalObt}</td>
                    <td className="text-center">
                      <span
                        className={`badge ${
                          row.isPassed
                            ? "bg-success bg-opacity-10 text-success"
                            : "bg-danger bg-opacity-10 text-danger"
                        }`}
                      >
                        {row.gpa.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Status Overview Banner */}
        <div className="d-flex align-items-center justify-content-between p-3 mt-3 rounded-3 border bg-light">
          <div className="d-flex align-items-center gap-4">
            <div>
              <span className="text-muted small d-block">Total Credit Hours:</span>
              <strong className="fs-6 text-dark">{liveTotalCredits} Cr. Hr.</strong>
            </div>
            <div>
              <span className="text-muted small d-block">Overall GPA:</span>
              <strong className="fs-6 text-primary">{liveSemesterGpa.toFixed(2)}</strong>
            </div>
            <div>
              <span className="text-muted small d-block">Overall Grade:</span>
              <strong className="fs-6 text-dark">{overallGrade}</strong>
            </div>
          </div>

          <div>
            <span
              className={`badge fs-6 px-3 py-2 ${
                isCandidatePassed ? "bg-success" : "bg-danger"
              }`}
            >
              {isCandidatePassed ? "STATUS: PASS" : "STATUS: FAIL"}
            </span>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="border-top px-4 py-2 bg-light">
        <button
          type="button"
          onClick={onHide}
          className="btn-sc btn-sc-outline btn-sc-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="btn-sc btn-sc-primary btn-sc-sm d-flex align-items-center gap-1"
        >
          <LuSave size={15} />
          <span>Save Changes & Recalculate</span>
        </button>
      </Modal.Footer>
    </Modal>
  );
}
