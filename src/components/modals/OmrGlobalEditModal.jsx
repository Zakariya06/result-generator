import { useState, useRef } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import {
  LuSettings2,
  LuUpload,
  LuImage,
  LuTrash2,
  LuSave,
  LuCheck,
  LuX,
  LuBuilding2,
  LuCalendar,
  LuBookOpen,
  LuSlidersHorizontal,
} from "react-icons/lu";

export default function OmrGlobalEditModal({
  show,
  onHide,
  globalConfig,
  subjects,
  onSave,
}) {
  const [formData, setFormData] = useState({
    headerTitle: globalConfig.headerTitle || "KMU IHS SWAT",
    instituteName: globalConfig.instituteName || "Institute of Health Sciences, Swat",
    universityName: globalConfig.universityName || "KHYBER MEDICAL UNIVERSITY — PESHAWAR",
    documentBadge: globalConfig.documentBadge || "DETAILED MARKS CERTIFICATE (DMC)",
    session: globalConfig.session || "2024–2025",
    exam: globalConfig.exam || "8th",
    issueDate: globalConfig.issueDate || new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    columnMode: globalConfig.columnMode || "midFinal", // 'midFinal' | 'theoryPrac'

    // Signatures
    preparedByTitle: globalConfig.preparedByTitle || "Prepared By:",
    preparedBySub: globalConfig.preparedBySub || "Assistant Controller",
    preparedBySig: globalConfig.preparedBySig || null,

    checkedByTitle: globalConfig.checkedByTitle || "Checked By:",
    checkedBySub: globalConfig.checkedBySub || "Superintendent Exams",
    checkedBySig: globalConfig.checkedBySig || null,

    controllerTitle: globalConfig.controllerTitle || "Controller of Examinations",
    controllerSub: globalConfig.controllerSub || "Khyber Medical University",
    controllerSig: globalConfig.controllerSig || null,

    // Credit hours per subject
    creditHoursMap: { ...(globalConfig.creditHoursMap || {}) },
  });

  const [activeTab, setActiveTab] = useState("institute"); // 'institute' | 'signatures' | 'credits'

  const fileInputRef1 = useRef(null);
  const fileInputRef2 = useRef(null);
  const fileInputRef3 = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreditChange = (subjectName, value) => {
    setFormData((prev) => ({
      ...prev,
      creditHoursMap: {
        ...prev.creditHoursMap,
        [subjectName]: value,
      },
    }));
  };

  // Convert uploaded image file to Base64
  const handleImageUpload = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, WEBP, or SVG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFormData((prev) => ({
        ...prev,
        [field]: uploadEvent.target.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeSignature = (field) => {
    setFormData((prev) => ({ ...prev, [field]: null }));
  };

  const handleSave = () => {
    onSave(formData);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
      <Modal.Header closeButton className="border-bottom pb-3">
        <div className="d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle"
            style={{ width: "36px", height: "36px" }}
          >
            <LuSlidersHorizontal size={20} />
          </div>
          <div>
            <Modal.Title className="fw-bold mb-0" style={{ fontSize: "17px" }}>
              Global OMR / DMC Settings & Configuration
            </Modal.Title>
            <div className="text-muted" style={{ fontSize: "12px" }}>
              Updates all Detailed Marks Certificates uniformly across the system
            </div>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className="p-0">
        {/* Navigation Tabs */}
        <div className="d-flex border-bottom bg-light px-4 pt-2">
          <button
            type="button"
            className={`btn btn-link text-decoration-none px-3 py-2 fw-semibold ${
              activeTab === "institute"
                ? "text-primary border-bottom border-primary border-3"
                : "text-muted"
            }`}
            style={{ fontSize: "13.5px" }}
            onClick={() => setActiveTab("institute")}
          >
            <LuBuilding2 size={15} className="me-1 mb-1" />
            1. Institute & Session
          </button>

          <button
            type="button"
            className={`btn btn-link text-decoration-none px-3 py-2 fw-semibold ${
              activeTab === "signatures"
                ? "text-primary border-bottom border-primary border-3"
                : "text-muted"
            }`}
            style={{ fontSize: "13.5px" }}
            onClick={() => setActiveTab("signatures")}
          >
            <LuImage size={15} className="me-1 mb-1" />
            2. Three Signatures (Upload)
          </button>

          <button
            type="button"
            className={`btn btn-link text-decoration-none px-3 py-2 fw-semibold ${
              activeTab === "credits"
                ? "text-primary border-bottom border-primary border-3"
                : "text-muted"
            }`}
            style={{ fontSize: "13.5px" }}
            onClick={() => setActiveTab("credits")}
          >
            <LuBookOpen size={15} className="me-1 mb-1" />
            3. Credit Hours & Layout
          </button>
        </div>

        <div className="p-4" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {/* TAB 1: Institute & Certificate Details */}
          {activeTab === "institute" && (
            <div className="d-flex flex-column gap-3">
              <div className="alert alert-primary bg-primary bg-opacity-10 border-primary border-opacity-25 py-2 px-3 mb-2">
                <small className="text-dark">
                  <strong>Institute Header:</strong> These values are printed in the header of each student's DMC.
                </small>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <Form.Label className="fw-semibold small mb-1">
                    Institute Short / Calligraphy Header:
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.headerTitle}
                    onChange={(e) => handleInputChange("headerTitle", e.target.value)}
                    placeholder="e.g. KMU IHS SWAT"
                    className="sc-input"
                  />
                  <small className="text-muted" style={{ fontSize: "11px" }}>
                    Prominent burgundy top header title
                  </small>
                </div>

                <div className="col-md-6">
                  <Form.Label className="fw-semibold small mb-1">
                    Institute of Health Sciences, Swat (Full Name):
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.instituteName}
                    onChange={(e) => handleInputChange("instituteName", e.target.value)}
                    placeholder="e.g. Institute of Health Sciences, Swat"
                    className="sc-input"
                  />
                  <small className="text-muted" style={{ fontSize: "11px" }}>
                    Sub-institute title under main heading
                  </small>
                </div>

                <div className="col-md-6">
                  <Form.Label className="fw-semibold small mb-1">
                    University Name:
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.universityName}
                    onChange={(e) => handleInputChange("universityName", e.target.value)}
                    placeholder="Khyber Medical University — Peshawar"
                    className="sc-input"
                  />
                </div>

                <div className="col-md-6">
                  <Form.Label className="fw-semibold small mb-1">
                    Certificate Badge:
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.documentBadge}
                    onChange={(e) => handleInputChange("documentBadge", e.target.value)}
                    placeholder="DETAILED MARKS CERTIFICATE (DMC)"
                    className="sc-input"
                  />
                </div>

                <div className="col-md-4">
                  <Form.Label className="fw-semibold small mb-1">
                    Academic Session:
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.session}
                    onChange={(e) => handleInputChange("session", e.target.value)}
                    placeholder="e.g. 2024–2025"
                    className="sc-input"
                  />
                </div>

                <div className="col-md-4">
                  <Form.Label className="fw-semibold small mb-1">
                    Examination Name / Semester:
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.exam}
                    onChange={(e) => handleInputChange("exam", e.target.value)}
                    placeholder="e.g. 8th or 3rd Semester, Spring 2026"
                    className="sc-input"
                  />
                </div>

                <div className="col-md-4">
                  <Form.Label className="fw-semibold small mb-1">
                    Issue Date:
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.issueDate}
                    onChange={(e) => handleInputChange("issueDate", e.target.value)}
                    placeholder="e.g. 28 Oct 2026"
                    className="sc-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Three Signatures Upload */}
          {activeTab === "signatures" && (
            <div className="d-flex flex-column gap-4">
              <div className="alert alert-info bg-info bg-opacity-10 border-info border-opacity-25 py-2 px-3 mb-1">
                <small className="text-dark">
                  <strong>Official Signatures:</strong> Upload scanned signature images (PNG with transparent or white background recommended). Once saved, all OMR / DMC sheets will display these signatures.
                </small>
              </div>

              {/* Signature 1: Prepared By */}
              <div className="p-3 border rounded-3 bg-white shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold text-dark mb-0">
                    1. Prepared By: Assistant Controller
                  </h6>
                  {formData.preparedBySig && (
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                      <LuCheck size={12} className="me-1" /> Signature Active
                    </span>
                  )}
                </div>

                <div className="row g-3 align-items-center">
                  <div className="col-md-6">
                    <Form.Label className="small fw-semibold mb-1">Title Designation:</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.preparedByTitle}
                      onChange={(e) => handleInputChange("preparedByTitle", e.target.value)}
                      placeholder="Prepared By:"
                      className="sc-input mb-2"
                    />
                    <Form.Label className="small fw-semibold mb-1">Role / Subtitle:</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.preparedBySub}
                      onChange={(e) => handleInputChange("preparedBySub", e.target.value)}
                      placeholder="Assistant Controller (or Compilation officer)"
                      className="sc-input"
                    />
                  </div>

                  <div className="col-md-6">
                    <Form.Label className="small fw-semibold mb-1">Signature Image:</Form.Label>
                    {formData.preparedBySig ? (
                      <div className="border rounded p-2 text-center bg-light position-relative">
                        <img
                          src={formData.preparedBySig}
                          alt="Prepared By Signature"
                          style={{ maxHeight: "55px", maxWidth: "160px", objectFit: "contain" }}
                        />
                        <button
                          type="button"
                          onClick={() => removeSignature("preparedBySig")}
                          className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-1 p-1"
                          title="Remove signature image"
                        >
                          <LuTrash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef1.current?.click()}
                        className="border border-dashed rounded p-3 text-center bg-light"
                        style={{ cursor: "pointer" }}
                      >
                        <LuUpload size={20} className="text-primary mb-1" />
                        <div className="small fw-semibold text-dark">Click to Upload Signature</div>
                        <div className="text-muted" style={{ fontSize: "11px" }}>PNG, JPG, or SVG</div>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef1}
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleImageUpload(e, "preparedBySig")}
                    />
                  </div>
                </div>
              </div>

              {/* Signature 2: Checked By */}
              <div className="p-3 border rounded-3 bg-white shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold text-dark mb-0">
                    2. Checked By: Superintendent Exams
                  </h6>
                  {formData.checkedBySig && (
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                      <LuCheck size={12} className="me-1" /> Signature Active
                    </span>
                  )}
                </div>

                <div className="row g-3 align-items-center">
                  <div className="col-md-6">
                    <Form.Label className="small fw-semibold mb-1">Title Designation:</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.checkedByTitle}
                      onChange={(e) => handleInputChange("checkedByTitle", e.target.value)}
                      placeholder="Checked By:"
                      className="sc-input mb-2"
                    />
                    <Form.Label className="small fw-semibold mb-1">Role / Subtitle:</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.checkedBySub}
                      onChange={(e) => handleInputChange("checkedBySub", e.target.value)}
                      placeholder="Superintendent Exams (or Regional Director)"
                      className="sc-input"
                    />
                  </div>

                  <div className="col-md-6">
                    <Form.Label className="small fw-semibold mb-1">Signature Image:</Form.Label>
                    {formData.checkedBySig ? (
                      <div className="border rounded p-2 text-center bg-light position-relative">
                        <img
                          src={formData.checkedBySig}
                          alt="Checked By Signature"
                          style={{ maxHeight: "55px", maxWidth: "160px", objectFit: "contain" }}
                        />
                        <button
                          type="button"
                          onClick={() => removeSignature("checkedBySig")}
                          className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-1 p-1"
                          title="Remove signature image"
                        >
                          <LuTrash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef2.current?.click()}
                        className="border border-dashed rounded p-3 text-center bg-light"
                        style={{ cursor: "pointer" }}
                      >
                        <LuUpload size={20} className="text-primary mb-1" />
                        <div className="small fw-semibold text-dark">Click to Upload Signature</div>
                        <div className="text-muted" style={{ fontSize: "11px" }}>PNG, JPG, or SVG</div>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef2}
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleImageUpload(e, "checkedBySig")}
                    />
                  </div>
                </div>
              </div>

              {/* Signature 3: Controller of Examinations */}
              <div className="p-3 border rounded-3 bg-white shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold text-dark mb-0">
                    3. Controller of Examinations Khyber Medical University
                  </h6>
                  {formData.controllerSig && (
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                      <LuCheck size={12} className="me-1" /> Signature Active
                    </span>
                  )}
                </div>

                <div className="row g-3 align-items-center">
                  <div className="col-md-6">
                    <Form.Label className="small fw-semibold mb-1">Title Designation:</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.controllerTitle}
                      onChange={(e) => handleInputChange("controllerTitle", e.target.value)}
                      placeholder="Controller of Examinations"
                      className="sc-input mb-2"
                    />
                    <Form.Label className="small fw-semibold mb-1">Role / Subtitle:</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.controllerSub}
                      onChange={(e) => handleInputChange("controllerSub", e.target.value)}
                      placeholder="Khyber Medical University"
                      className="sc-input"
                    />
                  </div>

                  <div className="col-md-6">
                    <Form.Label className="small fw-semibold mb-1">Signature Image:</Form.Label>
                    {formData.controllerSig ? (
                      <div className="border rounded p-2 text-center bg-light position-relative">
                        <img
                          src={formData.controllerSig}
                          alt="Controller Signature"
                          style={{ maxHeight: "55px", maxWidth: "160px", objectFit: "contain" }}
                        />
                        <button
                          type="button"
                          onClick={() => removeSignature("controllerSig")}
                          className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-1 p-1"
                          title="Remove signature image"
                        >
                          <LuTrash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef3.current?.click()}
                        className="border border-dashed rounded p-3 text-center bg-light"
                        style={{ cursor: "pointer" }}
                      >
                        <LuUpload size={20} className="text-primary mb-1" />
                        <div className="small fw-semibold text-dark">Click to Upload Signature</div>
                        <div className="text-muted" style={{ fontSize: "11px" }}>PNG, JPG, or SVG</div>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef3}
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleImageUpload(e, "controllerSig")}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Credit Hours per Subject & Table Column Mode */}
          {activeTab === "credits" && (
            <div className="d-flex flex-column gap-3">
              <div className="alert alert-secondary bg-light border py-2 px-3">
                <small className="text-dark">
                  <strong>Credit Hours per Subject:</strong> Specify the Credit Hours (e.g. <code>2+1</code>, <code>4+0</code>, <code>3</code>, <code>2</code>) for each subject according to the Nursing & Allied Health Sciences Weightage chart.
                </small>
              </div>

              {/* Table Column Mode Selector */}
              <div className="p-3 border rounded-3 bg-light">
                <Form.Label className="fw-bold small mb-2 d-block">
                  Marks Table Column Layout Mode:
                </Form.Label>
                <div className="d-flex gap-4">
                  <Form.Check
                    type="radio"
                    id="col-mode-midfinal"
                    name="columnMode"
                    label={
                      <span>
                        <strong>Midterm & Final (Exact Layout Requested)</strong>
                        <div className="text-muted small">
                          TOTAL MARKS (Midterm | Final | Total) & OBTAINED MARKS (Midterm | Final | Total)
                        </div>
                      </span>
                    }
                    checked={formData.columnMode === "midFinal"}
                    onChange={() => handleInputChange("columnMode", "midFinal")}
                  />
                  <Form.Check
                    type="radio"
                    id="col-mode-theoryprac"
                    name="columnMode"
                    label={
                      <span>
                        <strong>Theory & Practical (Legacy Layout)</strong>
                        <div className="text-muted small">
                          TOTAL MARKS (Theory | Prac/Oral | Total) & OBTAINED MARKS
                        </div>
                      </span>
                    }
                    checked={formData.columnMode === "theoryPrac"}
                    onChange={() => handleInputChange("columnMode", "theoryPrac")}
                  />
                </div>
              </div>

              {/* Subject Credit Hour Assignments */}
              <div className="table-responsive border rounded-3">
                <table className="table table-sm table-hover mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "45%" }}>Subject Name</th>
                      <th style={{ width: "25%" }}>Configured Max Marks</th>
                      <th style={{ width: "30%" }}>Credit Hours (e.g. 2+1, 3, 4)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(subjects || []).length === 0 ? (
                      <tr>
                        <td colSpan="3" className="text-center py-3 text-muted">
                          No subjects configured yet. Credit hours will be automatically applied once subjects are loaded.
                        </td>
                      </tr>
                    ) : (
                      subjects.map((s, idx) => {
                        const sName = s.subject || s.label || `Subject ${idx + 1}`;
                        const currentVal = formData.creditHoursMap[sName] ?? (s.ospe ? "2+1" : "3");
                        const maxMid = Number(s.maxMid) || 0;
                        const maxFinal = Number(s.maxFinal) || 0;
                        const totalMarks = maxMid + maxFinal;

                        return (
                          <tr key={idx}>
                            <td className="fw-semibold text-dark">{sName}</td>
                            <td className="text-muted small">
                              {totalMarks > 0 ? `${totalMarks} Marks (Mid: ${maxMid}, Final: ${maxFinal})` : "--"}
                            </td>
                            <td>
                              <Form.Control
                                type="text"
                                size="sm"
                                value={currentVal}
                                onChange={(e) => handleCreditChange(sName, e.target.value)}
                                placeholder="e.g. 2+1 or 3"
                                className="sc-input"
                                style={{ width: "130px" }}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
          <span>Save & Apply to All OMRs</span>
        </button>
      </Modal.Footer>
    </Modal>
  );
}
