import { useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSubject } from "../context/SubjectContext";
import logo from "../assets/KMU_logo.jpg";
import numberToWords from "../utils/numberToWords";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  LuArrowLeft,
  LuDownload,
  LuPrinter,
  LuSearch,
  LuFilter,
  LuCircleCheck,
  LuTriangleAlert,
  LuGraduationCap,
  LuUsers,
  LuBuilding2,
  LuSparkles,
  LuX,
  LuChevronRight,
  LuFileText,
} from "react-icons/lu";

// Grade computation according to KMU grading scale
function getGrade(percentage) {
  if (isNaN(percentage)) return "-";
  if (percentage >= 85) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 75) return "B+";
  if (percentage >= 70) return "B";
  if (percentage >= 65) return "C+";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

const norm = (v) =>
  String(v ?? "")
    .trim()
    .toLowerCase();

// Match a column subject label with student's subjects
function findSubjectMarks(studentSubjects = [], subjectName, isOspe = false) {
  const targetNorm = norm(subjectName);
  const targetLabel = isOspe ? `${targetNorm} - ospe` : targetNorm;

  return studentSubjects.find((s) => {
    if (!s) return false;
    const name = norm(
      s.subject ?? s.label ?? s.name ?? s.subjectName ?? s.title ?? ""
    );
    if (!name) return false;
    const itemIsOspe = name.includes("ospe");
    if (isOspe !== itemIsOspe) return false;

    if (name === targetLabel) return true;
    if (name.replace(/\s*-\s*ospe$/, "").trim() === targetNorm) return true;
    return false;
  });
}

export default function OmrPage() {
  const navigate = useNavigate();
  const { subjects, studentsData } = useSubject();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'pass' | 'fail' | 'regular' | 'reappear'
  const [instituteFilter, setInstituteFilter] = useState("all");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [progressText, setProgressText] = useState("");

  const dmcRefs = useRef({});

  // Compile candidate evaluation data
  const candidateResults = useMemo(() => {
    return (studentsData || []).map((student, studentIndex) => {
      const isRA = String(student?.rollNumber || "")
        .toUpperCase()
        .includes("RA");
      const studentSubjects = student.subjects || [];

      let totalMaxMarks = 0;
      let totalObtainedMarks = 0;
      let totalTheoryMax = 0;
      let totalTheoryObtained = 0;
      let totalPracMax = 0;
      let totalPracObtained = 0;

      let applicableSubjectsCount = 0;
      let passedSubjectsCount = 0;
      let failedSubjectsCount = 0;
      let hasAnyMarks = false;

      // Map through each configured subject
      const subjectRows = (subjects || []).map((cfg) => {
        const subjectTitle = cfg.subject;
        const hasOspe = Boolean(cfg.ospe);

        const theoryMidMax = Number(cfg.maxMid) || 0;
        const theoryFinalMax = Number(cfg.maxFinal) || 0;
        const theoryMax = theoryMidMax + theoryFinalMax;

        const ospeMidMax = hasOspe
          ? (Number(cfg.ospeMaxMid) ?? theoryMidMax) || 0
          : 0;
        const ospeFinalMax = hasOspe
          ? (Number(cfg.ospeMaxFinal) ?? theoryFinalMax) || 0
          : 0;
        const pracMax = hasOspe ? ospeMidMax + ospeFinalMax : 0;
        const subjectMaxTotal = theoryMax + pracMax;

        // Find theory record
        const theoryRecord = findSubjectMarks(studentSubjects, subjectTitle, false);
        // Find OSPE record
        const ospeRecord = hasOspe
          ? findSubjectMarks(studentSubjects, subjectTitle, true)
          : null;

        // Check for NA
        const isTheoryNA =
          !theoryRecord ||
          String(theoryRecord?.mid ?? "").toUpperCase() === "NA" ||
          String(theoryRecord?.final ?? "").toUpperCase() === "NA";

        const isOspeNA =
          hasOspe &&
          (!ospeRecord ||
            String(ospeRecord?.mid ?? "").toUpperCase() === "NA" ||
            String(ospeRecord?.final ?? "").toUpperCase() === "NA");

        // If Re-appear student and not registered in this subject
        const isNotEnrolled = isRA && !theoryRecord && !ospeRecord;

        let theoryObtained = null;
        let pracObtained = null;
        let subjectTotalObtained = null;

        if (theoryRecord && !isTheoryNA) {
          const mid = parseFloat(theoryRecord.mid);
          const fin = parseFloat(theoryRecord.final);
          if (!isNaN(mid) && !isNaN(fin)) {
            theoryObtained = mid + fin;
          } else if (!isNaN(parseFloat(theoryRecord.total))) {
            theoryObtained = parseFloat(theoryRecord.total);
          }
        }

        if (hasOspe && ospeRecord && !isOspeNA) {
          const mid = parseFloat(ospeRecord.mid);
          const fin = parseFloat(ospeRecord.final);
          if (!isNaN(mid) && !isNaN(fin)) {
            pracObtained = mid + fin;
          } else if (!isNaN(parseFloat(ospeRecord.total))) {
            pracObtained = parseFloat(ospeRecord.total);
          }
        }

        if (theoryObtained !== null || pracObtained !== null) {
          hasAnyMarks = true;
          subjectTotalObtained = (theoryObtained || 0) + (pracObtained || 0);
        }

        const isSubjectApplicable = !isNotEnrolled;
        let isSubjectPassed = false;
        let subjectPercentage = null;

        if (isSubjectApplicable && subjectTotalObtained !== null && subjectMaxTotal > 0) {
          subjectPercentage = (subjectTotalObtained / subjectMaxTotal) * 100;
          // Rule: 50% or more passes the subject
          isSubjectPassed = subjectPercentage >= 50;

          applicableSubjectsCount++;
          if (isSubjectPassed) {
            passedSubjectsCount++;
          } else {
            failedSubjectsCount++;
          }

          totalMaxMarks += subjectMaxTotal;
          totalObtainedMarks += subjectTotalObtained;
          totalTheoryMax += theoryMax;
          totalTheoryObtained += theoryObtained || 0;
          totalPracMax += pracMax;
          totalPracObtained += pracObtained || 0;
        } else if (isSubjectApplicable && (isTheoryNA || isOspeNA)) {
          // Absent or NA in applicable exam
          applicableSubjectsCount++;
          failedSubjectsCount++;
          totalMaxMarks += subjectMaxTotal;
        }

        return {
          title: subjectTitle,
          hasOspe,
          theoryMax,
          pracMax: hasOspe ? pracMax : "--",
          totalMax: subjectMaxTotal,
          theoryObtained: isTheoryNA
            ? "NA"
            : theoryObtained !== null
            ? theoryObtained
            : "-",
          pracObtained: !hasOspe
            ? "--"
            : isOspeNA
            ? "NA"
            : pracObtained !== null
            ? pracObtained
            : "-",
          totalObtained: isNotEnrolled
            ? "NA"
            : subjectTotalObtained !== null
            ? subjectTotalObtained
            : isTheoryNA
            ? "NA"
            : "-",
          percentage:
            subjectPercentage !== null ? Math.round(subjectPercentage) : null,
          isPassed: isSubjectPassed,
          isNA: isNotEnrolled,
          inWords:
            subjectTotalObtained !== null
              ? numberToWords(subjectTotalObtained)
              : isTheoryNA || isNotEnrolled
              ? "Not Applicable"
              : "-",
        };
      });

      // Overall Candidate Pass / Fail Rule:
      // "if a student have pass more then half subject then it will be pass if not then it will be fail"
      const overallPercentage =
        totalMaxMarks > 0 ? (totalObtainedMarks / totalMaxMarks) * 100 : 0;

      // Pass if passed > half of applicable subjects
      const isPassed =
        hasAnyMarks &&
        applicableSubjectsCount > 0 &&
        passedSubjectsCount > applicableSubjectsCount / 2;

      const grade = hasAnyMarks ? getGrade(overallPercentage) : "-";

      return {
        student,
        serial: studentIndex + 1,
        rollNumber: String(student?.rollNumber || "").split("(")[0].trim(),
        name: student?.name || "Candidate Name",
        fatherName: student?.fatherName || "Father's Name",
        registration: student?.registration || "-",
        institute: student?.institute || "KMU Institute of Health Sciences, Swat",
        discipline: student?.Discipline || "Health Sciences",
        semester: student?.semester || "Annual Examination",
        isRA,
        subjectRows,
        summary: {
          totalTheoryMax,
          totalTheoryObtained,
          totalPracMax,
          totalPracObtained,
          totalMaxMarks,
          totalObtainedMarks,
          percentage: Math.round(overallPercentage * 10) / 10,
          inWords: numberToWords(totalObtainedMarks),
        },
        hasAnyMarks,
        applicableSubjectsCount,
        passedSubjectsCount,
        failedSubjectsCount,
        isPassed,
        grade,
      };
    });
  }, [studentsData, subjects]);

  // Unique institutes for filter
  const institutesList = useMemo(() => {
    const set = new Set();
    candidateResults.forEach((c) => {
      if (c.institute) set.add(c.institute);
    });
    return Array.from(set).sort();
  }, [candidateResults]);

  // Filtered candidate results
  const filteredCandidates = useMemo(() => {
    return candidateResults.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = norm(searchQuery);
        const nameMatch = norm(item.name).includes(q);
        const rollMatch = norm(item.rollNumber).includes(q);
        const regMatch = norm(item.registration).includes(q);
        const fatherMatch = norm(item.fatherName).includes(q);
        const instMatch = norm(item.institute).includes(q);
        if (!nameMatch && !rollMatch && !regMatch && !fatherMatch && !instMatch) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter === "pass" && !item.isPassed) return false;
      if (statusFilter === "fail" && item.isPassed) return false;
      if (statusFilter === "regular" && item.isRA) return false;
      if (statusFilter === "reappear" && !item.isRA) return false;

      // 3. Institute Filter
      if (instituteFilter !== "all" && item.institute !== instituteFilter) {
        return false;
      }

      return true;
    });
  }, [candidateResults, searchQuery, statusFilter, instituteFilter]);

  // Overall statistics
  const stats = useMemo(() => {
    const total = candidateResults.length;
    const passed = candidateResults.filter((c) => c.isPassed).length;
    const failed = candidateResults.filter((c) => !c.isPassed && c.hasAnyMarks).length;
    return { total, passed, failed };
  }, [candidateResults]);

  // Download all or filtered DMCs as a single multi-page PDF
  const handleDownloadAllPdf = async () => {
    if (filteredCandidates.length === 0) {
      alert("No student DMC records to export.");
      return;
    }

    try {
      setGeneratingPdf(true);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const totalPages = filteredCandidates.length;

      for (let i = 0; i < totalPages; i++) {
        const candidate = filteredCandidates[i];
        setProgressText(`Rendering DMC ${i + 1} of ${totalPages} (${candidate.name})...`);

        const elem = dmcRefs.current[candidate.student.rollNumber || candidate.serial];
        if (!elem) continue;

        if (i > 0) {
          pdf.addPage();
        }

        const canvas = await html2canvas(elem, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 1024,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      }

      setProgressText("Packaging PDF file...");
      pdf.save("KMU-IHS-Swat-DMC-Sheets.pdf");
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Error generating PDF. You can also use the browser Print option to Save as PDF.");
    } finally {
      setGeneratingPdf(false);
      setProgressText("");
    }
  };

  // Download a single candidate DMC
  const handleDownloadSinglePdf = async (candidate) => {
    try {
      const elem = dmcRefs.current[candidate.student.rollNumber || candidate.serial];
      if (!elem) return;

      const canvas = await html2canvas(elem, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      pdf.save(`DMC-${candidate.rollNumber}-${candidate.name}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Error exporting single DMC.");
    }
  };

  return (
    <div className="omr-page-wrapper">
      {/* ── Top Fixed Navigation & Filter Bar ── */}
      <div className="omr-top-nav no-print">
        <div className="container-fluid px-4 py-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            {/* Left: Back & Title */}
            <div className="d-flex align-items-center gap-3">
              <button
                onClick={() => navigate("/sheet")}
                className="btn-sc btn-sc-outline btn-sc-sm d-flex align-items-center gap-2"
                title="Return to Marks Sheet Dashboard"
              >
                <LuArrowLeft size={16} />
                <span>Back to Sheet</span>
              </button>
              <div>
                <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: "18px" }}>
                  Detailed Marks Certificates (DMC / OMR)
                </h4>
                <div className="text-muted" style={{ fontSize: "12px" }}>
                  Official University Grade Sheets • {filteredCandidates.length} Candidates Loaded
                </div>
              </div>
            </div>

            {/* Right: Quick Stats & Print */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                {stats.passed} Passed
              </span>
              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1">
                {stats.failed} Failed
              </span>

              <button
                type="button"
                onClick={() => window.print()}
                className="btn-sc btn-sc-outline btn-sc-sm d-flex align-items-center gap-1"
                title="Print all DMCs or Save to PDF via Browser"
              >
                <LuPrinter size={15} />
                <span>Print All</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadAllPdf}
                disabled={generatingPdf || filteredCandidates.length === 0}
                className="btn-sc btn-sc-primary btn-sc-sm d-flex align-items-center gap-1"
              >
                <LuDownload size={15} />
                <span>{generatingPdf ? "Rendering PDF..." : "Export All PDF"}</span>
              </button>
            </div>
          </div>

          {/* Search and Filters Strip */}
          <div className="row g-2 align-items-center mt-2 pt-2 border-top">
            <div className="col-md-4">
              <div className="position-relative">
                <LuSearch
                  size={15}
                  className="position-absolute text-muted"
                  style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type="text"
                  placeholder="Search candidate by name, roll #, reg #..."
                  className="sc-input ps-5 py-1"
                  style={{ fontSize: "13px" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="btn btn-link position-absolute p-0 text-muted"
                    style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                  >
                    <LuX size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-5">
              <div className="sc-filter-tabs">
                <button
                  type="button"
                  className={`sc-filter-btn ${statusFilter === "all" ? "active" : ""}`}
                  onClick={() => setStatusFilter("all")}
                >
                  All ({stats.total})
                </button>
                <button
                  type="button"
                  className={`sc-filter-btn ${statusFilter === "pass" ? "active" : ""}`}
                  onClick={() => setStatusFilter("pass")}
                >
                  Passed ({stats.passed})
                </button>
                <button
                  type="button"
                  className={`sc-filter-btn ${statusFilter === "fail" ? "active" : ""}`}
                  onClick={() => setStatusFilter("fail")}
                >
                  Failed ({stats.failed})
                </button>
                <button
                  type="button"
                  className={`sc-filter-btn ${statusFilter === "regular" ? "active" : ""}`}
                  onClick={() => setStatusFilter("regular")}
                >
                  Regular
                </button>
                <button
                  type="button"
                  className={`sc-filter-btn ${statusFilter === "reappear" ? "active" : ""}`}
                  onClick={() => setStatusFilter("reappear")}
                >
                  Re-appear
                </button>
              </div>
            </div>

            {institutesList.length > 1 && (
              <div className="col-md-3">
                <select
                  className="sc-select py-1 w-100"
                  style={{ fontSize: "12.5px" }}
                  value={instituteFilter}
                  onChange={(e) => setInstituteFilter(e.target.value)}
                >
                  <option value="all">All Institutes ({institutesList.length})</option>
                  {institutesList.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PDF Generation Progress Overlay ── */}
      {generatingPdf && (
        <div className="pdf-generation-overlay">
          <div className="pdf-modal-box">
            <div className="spinner-border text-primary mb-3" role="status" />
            <h5 className="fw-bold mb-1">Generating High-Quality DMC PDF</h5>
            <p className="text-muted small mb-0">{progressText || "Please wait..."}</p>
          </div>
        </div>
      )}

      {/* ── Main DMC List Container ── */}
      <div className="omr-container">
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-5 my-5 bg-white rounded-3 border p-5 shadow-sm">
            <LuTriangleAlert size={48} className="text-warning mb-3 opacity-75" />
            <h4 className="fw-bold text-dark">No Candidate Records Found</h4>
            <p className="text-muted mb-3" style={{ maxWidth: "480px", margin: "0 auto" }}>
              {studentsData?.length === 0
                ? "Please upload candidate sheets and subject marks in the main sheet first."
                : "No candidates match your current search or filter criteria. Try clearing filters."}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setInstituteFilter("all");
              }}
              className="btn-sc btn-sc-outline btn-sc-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredCandidates.map((candidate, idx) => {
            const refKey = candidate.student.rollNumber || candidate.serial;

            return (
              <div key={refKey} className="dmc-card-wrapper">
                {/* Action header bar above each individual DMC (visible on screen only) */}
                <div className="dmc-card-toolbar no-print">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-dark text-white rounded-pill px-2 py-1">
                      #{idx + 1}
                    </span>
                    <strong className="text-dark" style={{ fontSize: "14px" }}>
                      {candidate.name} ({candidate.rollNumber})
                    </strong>
                    <span
                      className={`badge ${
                        candidate.isPassed
                          ? "bg-success bg-opacity-10 text-success border border-success border-opacity-25"
                          : "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25"
                      } px-2 py-0`}
                    >
                      {candidate.isPassed ? "PASS" : "FAIL"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadSinglePdf(candidate)}
                    className="btn-sc btn-sc-outline btn-sc-sm d-flex align-items-center gap-1"
                    title="Download this single DMC as PDF"
                  >
                    <LuDownload size={14} />
                    <span>Download PDF</span>
                  </button>
                </div>

                {/* ── Authentic A4 DMC Document ── */}
                <div
                  ref={(el) => (dmcRefs.current[refKey] = el)}
                  className="dmc-sheet-page"
                >
                  {/* Outer double border framing */}
                  <div className="dmc-sheet-inner">
                    {/* Header with Calligraphy Title & Logo */}
                    <div className="dmc-header">
                      <div className="dmc-header-left">
                        <div className="dmc-logo-box">
                          <img
                            src={logo}
                            alt="KMU Logo"
                            className="dmc-kmu-logo"
                          />
                        </div>
                      </div>

                      <div className="dmc-header-center">
                        {/* Elegant Calligraphy Title */}
                        <div className="dmc-calligraphy-title">
                          KMU IHS Swat
                        </div>
                        <div className="dmc-sub-institution">
                          Institute of Health Sciences, Swat
                        </div>
                        <div className="dmc-university-name">
                          Khyber Medical University — Peshawar
                        </div>
                        <div className="dmc-document-badge">
                          DETAILED MARKS CERTIFICATE (DMC)
                        </div>
                      </div>

                      <div className="dmc-header-right">
                        <div className="dmc-meta-box">
                          <div>
                            <strong>Session:</strong> 2024–2025
                          </div>
                          <div>
                            <strong>Exam:</strong> {candidate.semester}
                          </div>
                          <div>
                            <strong>Issue Date:</strong>{" "}
                            {new Date().toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="dmc-divider-gold" />

                    {/* Student Info Box (Layout modeled exactly from reference image) */}
                    <table className="dmc-student-info-table">
                      <tbody>
                        <tr>
                          <td className="info-label" style={{ width: "16%" }}>
                            Reg: No/ID:
                          </td>
                          <td className="info-value" style={{ width: "34%" }}>
                            {candidate.registration} / {candidate.rollNumber}
                          </td>
                          <td className="info-label" style={{ width: "16%" }}>
                            Examination:
                          </td>
                          <td className="info-value" style={{ width: "34%" }}>
                            {candidate.semester}
                          </td>
                        </tr>
                        <tr>
                          <td className="info-label">Student Name:</td>
                          <td className="info-value fw-bold text-dark">
                            {candidate.name}
                          </td>
                          <td className="info-label">Candidate Type:</td>
                          <td className="info-value">
                            <span className={candidate.isRA ? "ra-text" : "reg-text"}>
                              {candidate.isRA ? "Re-appear" : "Regular"}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="info-label">Father Name:</td>
                          <td className="info-value">{candidate.fatherName}</td>
                          <td className="info-label">Discipline / Class:</td>
                          <td className="info-value">{candidate.discipline}</td>
                        </tr>
                        <tr>
                          <td className="info-label">Institute:</td>
                          <td className="info-value" colSpan="3">
                            {candidate.institute}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Marks Table (Exact columns matching user image) */}
                    <table className="dmc-marks-table">
                      <thead>
                        <tr>
                          <th rowSpan="2" className="text-start" style={{ width: "28%" }}>
                            Subject
                          </th>
                          <th colSpan="3" className="text-center group-header">
                            Total Marks
                          </th>
                          <th colSpan="3" className="text-center group-header">
                            Obtained Marks
                          </th>
                          <th rowSpan="2" className="text-center" style={{ width: "8%" }}>
                            %
                          </th>
                          <th rowSpan="2" className="text-center" style={{ width: "8%" }}>
                            Status
                          </th>
                          <th rowSpan="2" className="text-start" style={{ width: "24%" }}>
                            In words
                          </th>
                        </tr>
                        <tr>
                          <th className="text-center sub-th">Theory</th>
                          <th className="text-center sub-th">Prac/Oral</th>
                          <th className="text-center sub-th">Total</th>
                          <th className="text-center sub-th">Theory</th>
                          <th className="text-center sub-th">Prac/Oral</th>
                          <th className="text-center sub-th">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidate.subjectRows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            <td className="subject-title-cell">{row.title}</td>
                            <td className="text-center">{row.theoryMax}</td>
                            <td className="text-center">{row.pracMax}</td>
                            <td className="text-center fw-semibold">{row.totalMax}</td>

                            <td className="text-center">{row.theoryObtained}</td>
                            <td className="text-center">{row.pracObtained}</td>
                            <td className="text-center fw-bold">
                              {row.totalObtained}
                            </td>

                            <td className="text-center">
                              {row.percentage !== null ? `${row.percentage}%` : "-"}
                            </td>
                            <td className="text-center">
                              {row.isNA ? (
                                <span className="dmc-na-pill">NA</span>
                              ) : row.percentage !== null ? (
                                <span
                                  className={
                                    row.isPassed ? "dmc-pass-text" : "dmc-fail-text"
                                  }
                                >
                                  {row.isPassed ? "Pass" : "Fail"}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="in-words-cell">{row.inWords}</td>
                          </tr>
                        ))}

                        {/* Summary / Totals Row */}
                        <tr className="dmc-summary-row">
                          <td className="fw-bold">Summary / Total</td>
                          <td className="text-center fw-bold">
                            {candidate.summary.totalTheoryMax}
                          </td>
                          <td className="text-center fw-bold">
                            {candidate.summary.totalPracMax || "--"}
                          </td>
                          <td className="text-center fw-bold">
                            {candidate.summary.totalMaxMarks}
                          </td>

                          <td className="text-center fw-bold">
                            {candidate.summary.totalTheoryObtained}
                          </td>
                          <td className="text-center fw-bold">
                            {candidate.summary.totalPracObtained || "--"}
                          </td>
                          <td className="text-center fw-bold text-dark">
                            {candidate.summary.totalObtainedMarks}
                          </td>

                          <td className="text-center fw-bold">
                            {candidate.summary.percentage}%
                          </td>
                          <td className="text-center fw-bold">
                            <span
                              className={
                                candidate.isPassed ? "dmc-pass-text" : "dmc-fail-text"
                              }
                            >
                              {candidate.isPassed ? "Pass" : "Fail"}
                            </span>
                          </td>
                          <td className="in-words-cell fw-bold">
                            {candidate.summary.inWords}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Overall Results & Remarks Bar */}
                    <div className="dmc-result-bar">
                      <div className="result-stat-item">
                        <span className="result-label">Percentage:</span>
                        <span className="result-val-underline">
                          {candidate.summary.percentage}%
                        </span>
                      </div>

                      <div className="result-stat-item">
                        <span className="result-label">Grade:</span>
                        <span className="result-val-underline">
                          {candidate.grade}
                        </span>
                      </div>

                      <div className="result-stat-item">
                        <span className="result-label">Remarks:</span>
                        <span className="result-remarks-wrap">
                          {candidate.isPassed ? (
                            <span className="dmc-pass-stamp">Pass</span>
                          ) : (
                            /* CIRCLED ARROW AROUND FAIL - as requested by user */
                            <div className="dmc-fail-circle-container">
                              <span className="dmc-fail-text-boxed">FAIL</span>
                              {/* Hand-drawn circular ring with arrow */}
                              <svg
                                className="dmc-circle-arrow-svg"
                                viewBox="0 0 110 52"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                {/* Hand-drawn irregular oval circle */}
                                <ellipse
                                  cx="55"
                                  cy="26"
                                  rx="50"
                                  ry="22"
                                  stroke="#dc2626"
                                  strokeWidth="2.5"
                                  strokeDasharray="300"
                                  strokeDashoffset="10"
                                  strokeLinecap="round"
                                  transform="rotate(-2 55 26)"
                                />
                                {/* Dynamic Arrow pointing directly into the circle */}
                                <path
                                  d="M 98 12 L 106 18 L 102 26"
                                  stroke="#dc2626"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Signatures & Footer Area */}
                    <div className="dmc-signatures-area">
                      <div className="sig-block">
                        <div className="sig-line">
                          {/* Authentic signature sketch */}
                          <svg
                            width="90"
                            height="30"
                            viewBox="0 0 100 35"
                            className="sig-sketch"
                          >
                            <path
                              d="M5 25 C 20 5, 30 35, 45 15 C 60 -5, 70 30, 95 20"
                              fill="none"
                              stroke="#1e3a8a"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                        <div className="sig-title">Prepared By:</div>
                        <div className="sig-sub">Assistant Controller</div>
                      </div>

                      <div className="sig-block">
                        <div className="sig-line" />
                        <div className="sig-title">Checked By:</div>
                        <div className="sig-sub">Superintendent Exams</div>
                      </div>

                      <div className="sig-block">
                        <div className="sig-line">
                          {/* Controller signature sketch */}
                          <svg
                            width="110"
                            height="35"
                            viewBox="0 0 110 40"
                            className="sig-sketch"
                          >
                            <path
                              d="M10 28 C 30 5, 25 38, 55 12 C 75 -2, 85 35, 105 18 M 40 25 L 80 25"
                              fill="none"
                              stroke="#881337"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                        <div className="sig-title">Controller of Examinations</div>
                        <div className="sig-sub">Khyber Medical University</div>
                      </div>
                    </div>

                    <div className="dmc-footer-note">
                      Note: Errors & omissions are accepted (E&OE). This Detailed Marks Certificate is issued without alteration or erasure.
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Floating Download Button in Bottom Right ── */}
      {filteredCandidates.length > 0 && (
        <div className="omr-floating-bar no-print">
          <div className="d-flex align-items-center gap-3">
            <div className="d-none d-sm-block">
              <div className="fw-bold" style={{ fontSize: "13px", color: "#0f172a" }}>
                Export Ready
              </div>
              <div className="text-muted" style={{ fontSize: "11px" }}>
                {filteredCandidates.length} Student DMC(s)
              </div>
            </div>

            <button
              onClick={handleDownloadAllPdf}
              disabled={generatingPdf}
              className="btn-sc btn-sc-primary d-flex align-items-center gap-2 px-3 py-2 shadow-lg"
              title="Download all DMCs in one PDF"
            >
              <LuDownload size={18} />
              <span className="fw-bold">
                {generatingPdf ? "Rendering PDF..." : "Download All OMR / DMC (PDF)"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
