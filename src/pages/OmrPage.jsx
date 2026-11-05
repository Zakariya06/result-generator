import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  LuSlidersHorizontal,
  LuBookOpen,
  LuPencil,
  LuCircleCheck,
  LuTriangleAlert,
  LuX,
  LuSparkles,
  LuFileSpreadsheet,
} from "react-icons/lu";
import {
  parseCreditHours,
  extractCreditHoursFromTitle,
  evaluateSubjectMarks,
  calculateSemesterGpa,
  getOverallGradeFromGpa,
} from "../utils/kmuCreditScheme";
import OmrGlobalEditModal from "../components/modals/OmrGlobalEditModal";
import OmrCandidateEditModal from "../components/modals/OmrCandidateEditModal";
import { saveStudentsToDB } from "../db/studentDB";

const GLOBAL_CONFIG_STORAGE_KEY = "kmu_omr_global_config";

const defaultGlobalConfig = {
  headerTitle: "KMU IHS SWAT",
  instituteName: "Institute of Health Sciences, Swat",
  universityName: "KHYBER MEDICAL UNIVERSITY — PESHAWAR",
  documentBadge: "DETAILED MARKS CERTIFICATE (DMC)",
  session: "2024–2025",
  exam: "8th",
  issueDate: new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }),
  columnMode: "midFinal", // 'midFinal' (Midterm, Final, Total) | 'theoryPrac'

  // Three official signatures
  preparedByTitle: "Prepared By:",
  preparedBySub: "Compilation Officer",
  preparedBySig: null,

  checkedByTitle: "Checked By:",
  checkedBySub: "Regional Director Malakand Region",
  checkedBySig: null,

  controllerTitle: "Controller of Examinations",
  controllerSub: "Khyber Medical University",
  controllerSig: null,

  // Subject credit hours mapping
  creditHoursMap: {},
};

const norm = (v) =>
  String(v ?? "")
    .trim()
    .toLowerCase();

// Match subject label with student's subjects list
function findSubjectMarks(studentSubjects = [], subjectName, isOspe = false) {
  const targetNorm = norm(subjectName);
  const targetLabelMinus = isOspe ? `${targetNorm} - ospe` : targetNorm;
  const targetLabelPlus = isOspe ? `${targetNorm} + ospe` : targetNorm;

  return studentSubjects.find((s) => {
    if (!s) return false;
    const name = norm(
      s.subject ?? s.label ?? s.name ?? s.subjectName ?? s.title ?? ""
    );
    if (!name) return false;
    const itemIsOspe = name.includes("ospe");
    if (isOspe !== itemIsOspe) return false;

    if (name === targetLabelMinus || name === targetLabelPlus) return true;
    if (name.replace(/\s*[-+]\s*ospe$/, "").trim() === targetNorm) return true;
    return false;
  });
}

export default function OmrPage() {
  const navigate = useNavigate();
  const { subjects, studentsData, setStudentsData } = useSubject();

  // Global Config state
  const [globalConfig, setGlobalConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(GLOBAL_CONFIG_STORAGE_KEY);
      if (saved) {
        return { ...defaultGlobalConfig, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to load global OMR config from storage:", e);
    }
    return defaultGlobalConfig;
  });

  // Modals state
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'pass' | 'fail' | 'regular' | 'reappear'
  const [instituteFilter, setInstituteFilter] = useState("all");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [progressText, setProgressText] = useState("");

  const dmcRefs = useRef({});

  // Persist globalConfig
  const handleSaveGlobalConfig = (newConfig) => {
    setGlobalConfig(newConfig);
    try {
      localStorage.setItem(GLOBAL_CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.error("Failed to persist global OMR config:", e);
    }
  };

  // Save individual candidate edits
  const handleSaveCandidate = async (updatedStudent) => {
    const updatedList = (studentsData || []).map((s) => {
      const matchRoll = norm(s.rollNumber) === norm(updatedStudent.rollNumber);
      const matchReg = norm(s.registration) === norm(updatedStudent.registration);
      if (matchRoll || (s.registration && matchReg)) {
        return { ...s, ...updatedStudent };
      }
      return s;
    });

    setStudentsData(updatedList);
    try {
      await saveStudentsToDB(updatedList);
    } catch (err) {
      console.error("Failed to save student edits to DB:", err);
    }
  };

  // Compile candidate evaluation data
  const candidateResults = useMemo(() => {
    return (studentsData || []).map((student, studentIndex) => {
      const isRA = String(student?.rollNumber || "")
        .toUpperCase()
        .includes("RA");
      const studentSubjects = student.subjects || [];

      let totalMaxMarks = 0;
      let totalObtainedMarks = 0;

      let totalMidMax = 0;
      let totalMidObtained = 0;
      let totalFinalMax = 0;
      let totalFinalObtained = 0;

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

        const subjectMidMax = theoryMidMax + ospeMidMax;
        const subjectFinalMax = theoryFinalMax + ospeFinalMax;
        const subjectMaxTotal = theoryMax + pracMax;

        // Credit Hours Resolution: uses credit hours configured by user in the Max Marks modal
        const userCustomCredits = student?.customCreditHours?.[subjectTitle];
        const globalSubjectCredits = globalConfig?.creditHoursMap?.[subjectTitle];
        const titleEmbeddedCredits = extractCreditHoursFromTitle(subjectTitle);

        let resolvedCredits = cfg.creditHours || userCustomCredits || globalSubjectCredits || titleEmbeddedCredits;
        if (!resolvedCredits) {
          if (subjectMaxTotal === 125) resolvedCredits = "0+5";
          else if (subjectMaxTotal === 100) resolvedCredits = hasOspe ? "3+1" : "4+0";
          else if (subjectMaxTotal === 75) resolvedCredits = hasOspe ? "2+1" : "3+0";
          else if (subjectMaxTotal === 50) resolvedCredits = hasOspe ? "1+1" : "2+0";
          else if (subjectMaxTotal === 25) resolvedCredits = "1+0";
          else if (subjectMaxTotal === 150) resolvedCredits = "6";
          else resolvedCredits = hasOspe ? "2+1" : "3+0";
        }

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

        let theoryMidObt = null;
        let theoryFinalObt = null;
        let theoryObtained = null;

        if (theoryRecord && !isTheoryNA) {
          const mid = parseFloat(theoryRecord.mid);
          const fin = parseFloat(theoryRecord.final);
          if (!isNaN(mid)) theoryMidObt = mid;
          if (!isNaN(fin)) theoryFinalObt = fin;

          if (!isNaN(mid) && !isNaN(fin)) {
            theoryObtained = mid + fin;
          } else if (isRA && !isNaN(fin)) {
            theoryObtained = fin;
          } else if (!isNaN(parseFloat(theoryRecord.total))) {
            theoryObtained = parseFloat(theoryRecord.total);
          }
        }

        let pracMidObt = null;
        let pracFinalObt = null;
        let pracObtained = null;

        if (hasOspe && ospeRecord && !isOspeNA) {
          const mid = parseFloat(ospeRecord.mid);
          const fin = parseFloat(ospeRecord.final);
          if (!isNaN(mid)) pracMidObt = mid;
          if (!isNaN(fin)) pracFinalObt = fin;

          if (!isNaN(mid) && !isNaN(fin)) {
            pracObtained = mid + fin;
          } else if (isRA && !isNaN(fin)) {
            pracObtained = fin;
          } else if (!isNaN(parseFloat(ospeRecord.total))) {
            pracObtained = parseFloat(ospeRecord.total);
          }
        }

        let subjectMidObtained = null;
        if (theoryMidObt !== null || pracMidObt !== null) {
          subjectMidObtained = (theoryMidObt || 0) + (pracMidObt || 0);
        }

        let subjectFinalObtained = null;
        if (theoryFinalObt !== null || pracFinalObt !== null) {
          subjectFinalObtained = (theoryFinalObt || 0) + (pracFinalObt || 0);
        }

        let subjectTotalObtained = null;
        if (theoryObtained !== null || pracObtained !== null) {
          hasAnyMarks = true;
          subjectTotalObtained = (theoryObtained || 0) + (pracObtained || 0);
        }

        const isSubjectApplicable = !isNotEnrolled;
        let evalResult = { isPassed: false, grade: "-", gpa: 0.0, percentage: null };

        if (isSubjectApplicable && subjectTotalObtained !== null && subjectMaxTotal > 0) {
          evalResult = evaluateSubjectMarks(
            subjectTotalObtained,
            subjectMaxTotal,
            cfg.passPercentage
          );

          applicableSubjectsCount++;
          if (evalResult.isPassed) {
            passedSubjectsCount++;
          } else {
            failedSubjectsCount++;
          }

          totalMaxMarks += subjectMaxTotal;
          totalObtainedMarks += subjectTotalObtained;

          totalMidMax += subjectMidMax;
          totalMidObtained += subjectMidObtained || 0;
          totalFinalMax += subjectFinalMax;
          totalFinalObtained += subjectFinalObtained || 0;

          totalTheoryMax += theoryMax;
          totalTheoryObtained += theoryObtained || 0;
          totalPracMax += pracMax;
          totalPracObtained += pracObtained || 0;
        } else if (isSubjectApplicable && (isTheoryNA || isOspeNA)) {
          applicableSubjectsCount++;
          failedSubjectsCount++;
          totalMaxMarks += subjectMaxTotal;
          totalMidMax += subjectMidMax;
          totalFinalMax += subjectFinalMax;
          totalTheoryMax += theoryMax;
          totalPracMax += pracMax;
        }

        const isCombined = hasOspe && cfg.ospeType === "combined";
        const displayTitle = isCombined ? `${subjectTitle} + OSPE` : subjectTitle;

        return {
          title: displayTitle,
          hasOspe,
          creditHours: resolvedCredits,
          // Midterm & Final columns (User requested layout)
          midMax: subjectMidMax,
          finalMax: subjectFinalMax,
          totalMax: subjectMaxTotal,
          midObtained: isNotEnrolled
            ? "NA"
            : isTheoryNA && (!hasOspe || isOspeNA)
            ? "NA"
            : subjectMidObtained !== null
            ? subjectMidObtained
            : "-",
          finalObtained: isNotEnrolled
            ? "NA"
            : isTheoryNA && (!hasOspe || isOspeNA)
            ? "NA"
            : subjectFinalObtained !== null
            ? subjectFinalObtained
            : "-",
          // Theory & Prac columns (Legacy layout)
          theoryMax: isCombined ? subjectMaxTotal : theoryMax,
          pracMax: isCombined ? "--" : (hasOspe ? pracMax : "--"),
          theoryObtained: isCombined
            ? (isTheoryNA || isOspeNA ? "NA" : subjectTotalObtained !== null ? subjectTotalObtained : "-")
            : (isTheoryNA ? "NA" : theoryObtained !== null ? theoryObtained : "-"),
          pracObtained: isCombined || !hasOspe
            ? "--"
            : isOspeNA
            ? "NA"
            : pracObtained !== null
            ? pracObtained
            : "-",
          // Total
          totalObtained: isNotEnrolled
            ? "NA"
            : subjectTotalObtained !== null
            ? subjectTotalObtained
            : isTheoryNA || isOspeNA
            ? "NA"
            : "-",
          gpa: evalResult.gpa,
          grade: evalResult.grade,
          isPassed: evalResult.isPassed,
          isNA: isNotEnrolled,
          inWords:
            subjectTotalObtained !== null
              ? numberToWords(subjectTotalObtained)
              : isTheoryNA || isOspeNA || isNotEnrolled
              ? "Not Applicable"
              : "-",
        };
      });

      // Overall Candidate Evaluation
      const totalCreditHoursSum = subjectRows.reduce(
        (acc, r) => acc + (r.isNA ? 0 : parseCreditHours(r.creditHours)),
        0
      );

      const semesterGpa = calculateSemesterGpa(subjectRows);

      // Rule: Pass if passed > half of applicable subjects
      const isPassed =
        hasAnyMarks &&
        applicableSubjectsCount > 0 &&
        passedSubjectsCount > applicableSubjectsCount / 2;

      const overallGrade = hasAnyMarks
        ? getOverallGradeFromGpa(semesterGpa, isPassed)
        : "-";

      return {
        student,
        serial: studentIndex + 1,
        rollNumber: String(student?.rollNumber || "").split("(")[0].trim(),
        name: student?.name || "Candidate Name",
        fatherName: student?.fatherName || "Father's Name",
        registration: student?.registration || "-",
        institute: student?.institute || globalConfig.instituteName || "KMU Institute of Health Sciences, Swat",
        discipline: student?.Discipline || "Health Sciences",
        semester: student?.semester || globalConfig.exam || "8th",
        isRA,
        subjectRows,
        summary: {
          totalCreditHours: totalCreditHoursSum,
          totalMidMax,
          totalMidObtained,
          totalFinalMax,
          totalFinalObtained,
          totalTheoryMax,
          totalTheoryObtained,
          totalPracMax,
          totalPracObtained,
          totalMaxMarks,
          totalObtainedMarks,
          semesterGpa,
          inWords: numberToWords(totalObtainedMarks),
        },
        hasAnyMarks,
        applicableSubjectsCount,
        passedSubjectsCount,
        failedSubjectsCount,
        isPassed,
        grade: overallGrade,
      };
    });
  }, [studentsData, subjects, globalConfig]);

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

      if (statusFilter === "pass" && !item.isPassed) return false;
      if (statusFilter === "fail" && item.isPassed) return false;
      if (statusFilter === "regular" && item.isRA) return false;
      if (statusFilter === "reappear" && !item.isRA) return false;

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
    const regular = candidateResults.filter((c) => !c.isRA).length;
    const reappear = candidateResults.filter((c) => c.isRA).length;
    return { total, passed, failed, regular, reappear };
  }, [candidateResults]);

  // Export All as Multi-Page PDF
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

  // Export Single DMC as PDF
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

  const isMidFinalLayout = globalConfig.columnMode !== "theoryPrac";

  return (
    <div className="omr-page-wrapper">
      {/* ── Top Fixed Navigation Bar ── */}
      <div className="omr-top-nav no-print">
        <div className="container-fluid px-4 py-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            {/* Left: Back & Title */}
            <div className="d-flex align-items-center gap-3">
              <button
                onClick={() => navigate("/sheet")}
                className="btn-sc btn-sc-outline btn-sc-sm d-flex align-items-center gap-2"
                title="Return to Combine Sheet Dashboard"
              >
                <LuArrowLeft size={16} />
                <span>Back to Combine Sheet</span>
              </button>
              <div>
                <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: "18px" }}>
                  Detailed Marks Certificates (DMC / OMR)
                </h4>
                <div className="text-muted" style={{ fontSize: "12px" }}>
                  Official KMU Examination Records • {filteredCandidates.length} Candidates Loaded
                </div>
              </div>
            </div>

            {/* Right: Actions, Global Edit, Print, Export */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Edit All OMR Entries Button */}
              <button
                type="button"
                onClick={() => setShowGlobalModal(true)}
                className="btn btn-warning btn-sm d-flex align-items-center gap-1 shadow-sm fw-semibold text-dark"
                title="Edit Institute name and upload 3 official signatures"
              >
                <LuSlidersHorizontal size={15} />
                <span>Edit All OMR Entries</span>
              </button>

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

            <div className={institutesList.length > 1 ? "col-md-4" : "col-md-6"}>
              <select
                className="sc-select w-100"
                style={{ fontSize: "13px" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Candidates ({stats.total})</option>
                <option value="pass">Passed Candidates ({stats.passed})</option>
                <option value="fail">Failed Candidates ({stats.failed})</option>
                <option value="regular">Regular Students ({stats.regular})</option>
                <option value="reappear">Re-appear Students ({stats.reappear})</option>
              </select>
            </div>

            {institutesList.length > 1 && (
              <div className="col-md-4">
                <select
                  className="sc-select py-1 w-100"
                  style={{ fontSize: "13px" }}
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
                {/* Action Toolbar above each individual DMC */}
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
                    <span className="text-muted small ms-2">
                      Total Cr: <strong>{candidate.summary.totalCreditHours}</strong> | GPA:{" "}
                      <strong className="text-primary">{candidate.summary.semesterGpa.toFixed(2)}</strong>
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {/* Individual Edit Button */}
                    <button
                      type="button"
                      onClick={() => setEditingCandidate(candidate)}
                      className="btn-dmc-action"
                      title="Edit this individual candidate's DMC details and marks"
                    >
                      <LuPencil size={13} className="text-primary" />
                      <span>Edit DMC</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadSinglePdf(candidate)}
                      className="btn-dmc-action"
                      title="Download this single DMC as PDF"
                    >
                      <LuDownload size={13} />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>

                {/* ── Authentic A4 DMC Document ── */}
                <div
                  ref={(el) => (dmcRefs.current[refKey] = el)}
                  className="dmc-sheet-page"
                >
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
                        <div className="dmc-calligraphy-title">
                          {globalConfig.headerTitle || "KMU IHS SWAT"}
                        </div>
                        <div className="dmc-sub-institution">
                          {globalConfig.instituteName || "INSTITUTE OF HEALTH SCIENCES, SWAT"}
                        </div>
                        <div className="dmc-university-name">
                          {globalConfig.universityName || "KHYBER MEDICAL UNIVERSITY — PESHAWAR"}
                        </div>
                        <div className="dmc-document-badge">
                          {globalConfig.documentBadge || "DETAILED MARKS CERTIFICATE (DMC)"}
                        </div>
                      </div>

                      <div className="dmc-header-right">
                        <div className="dmc-meta-box">
                          <div>
                            <strong>Session:</strong> {globalConfig.session || "2024–2025"}
                          </div>
                          <div>
                            <strong>Exam:</strong> {candidate.semester || globalConfig.exam || "8th"}
                          </div>
                          <div>
                            <strong>Issue Date:</strong> {globalConfig.issueDate}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="dmc-divider-gold" />

                    {/* Student Info Box */}
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

                    {/* Marks Table: Final Term Layout (Final, Total, LG, GPA) */}
                    <table className="dmc-marks-table">
                      <thead>
                        <tr>
                          <th rowSpan="2" className="text-start" style={{ width: "22%" }}>
                            Subject
                          </th>
                          <th rowSpan="2" className="text-center" style={{ width: "8%" }}>
                            Cr. hours
                          </th>
                          <th colSpan="2" className="text-center group-header">
                            TOTAL MARKS
                          </th>
                          <th colSpan="2" className="text-center group-header">
                            OBTAINED MARKS
                          </th>
                          <th rowSpan="2" className="text-center" style={{ width: "6%" }}>
                            LG
                          </th>
                          <th rowSpan="2" className="text-center" style={{ width: "7%" }}>
                            GPA
                          </th>
                          <th rowSpan="2" className="text-center" style={{ width: "7%" }}>
                            Status
                          </th>
                          <th rowSpan="2" className="text-start" style={{ width: "22%" }}>
                            In words
                          </th>
                        </tr>
                        <tr>
                          <th className="text-center sub-th">Final</th>
                          <th className="text-center sub-th">Total</th>
                          <th className="text-center sub-th">Final</th>
                          <th className="text-center sub-th">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidate.subjectRows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            <td className="subject-title-cell">{row.title}</td>
                            <td className="text-center fw-semibold text-secondary">
                              {row.creditHours}
                            </td>

                            <td className="text-center">{row.finalMax}</td>
                            <td className="text-center fw-semibold">{row.totalMax}</td>

                            <td className="text-center">{row.finalObtained}</td>
                            <td className="text-center fw-bold">{row.totalObtained}</td>

                            {/* LG (Letter Grade) Column per KMU Grading System */}
                            <td className="text-center fw-bold">
                              {row.isNA ? (
                                <span className="dmc-na-pill">NA</span>
                              ) : row.totalObtained !== "-" ? (
                                <span
                                  className={
                                    row.isPassed ? "text-dark" : "text-danger fw-bold"
                                  }
                                >
                                  {row.grade}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>

                            {/* GPA column */}
                            <td className="text-center fw-semibold">
                              {row.isNA ? (
                                <span className="dmc-na-pill">NA</span>
                              ) : row.totalObtained !== "-" ? (
                                <span
                                  className={
                                    row.isPassed ? "text-dark" : "text-danger fw-bold"
                                  }
                                >
                                  {row.gpa.toFixed(2)}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>

                            {/* Status */}
                            <td className="text-center">
                              {row.isNA ? (
                                <span className="dmc-na-pill">NA</span>
                              ) : row.totalObtained !== "-" ? (
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
                          <td className="fw-bold">Total</td>
                          <td className="text-center fw-bold text-dark">
                            {candidate.summary.totalCreditHours}
                          </td>

                          <td className="text-center fw-bold">
                            {candidate.summary.totalFinalMax}
                          </td>
                          <td className="text-center fw-bold">
                            {candidate.summary.totalMaxMarks}
                          </td>

                          <td className="text-center fw-bold">
                            {candidate.summary.totalFinalObtained}
                          </td>
                          <td className="text-center fw-bold text-dark">
                            {candidate.summary.totalObtainedMarks}
                          </td>

                          {/* Overall LG Grade */}
                          <td className="text-center fw-bold text-dark">
                            {candidate.grade}
                          </td>

                          {/* Summary GPA Column */}
                          <td className="text-center fw-bold text-primary">
                            {candidate.summary.semesterGpa.toFixed(2)}
                          </td>

                          <td className="text-center fw-bold">
                            <span
                              className={
                                candidate.isPassed
                                  ? "dmc-status-badge dmc-status-pass"
                                  : "dmc-status-badge dmc-status-fail"
                              }
                            >
                              {candidate.isPassed ? "PASS" : "FAIL"}
                            </span>
                          </td>

                          <td className="in-words-cell fw-bold">
                            {candidate.summary.inWords}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Official Signatures Area: Supports uploaded signature images */}
                    <div className="dmc-signatures-area">
                      {/* 1. Prepared By */}
                      <div className="sig-block">
                        <div className="sig-line">
                          {globalConfig.preparedBySig ? (
                            <img
                              src={globalConfig.preparedBySig}
                              alt="Prepared By Signature"
                              className="sig-img"
                            />
                          ) : (
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
                          )}
                        </div>
                        <div className="sig-title">
                          {globalConfig.preparedByTitle || "Prepared By:"}
                        </div>
                        <div className="sig-sub">
                          {globalConfig.preparedBySub || "Assistant Controller"}
                        </div>
                      </div>

                      {/* 2. Checked By */}
                      <div className="sig-block">
                        <div className="sig-line">
                          {globalConfig.checkedBySig ? (
                            <img
                              src={globalConfig.checkedBySig}
                              alt="Checked By Signature"
                              className="sig-img"
                            />
                          ) : null}
                        </div>
                        <div className="sig-title">
                          {globalConfig.checkedByTitle || "Checked By:"}
                        </div>
                        <div className="sig-sub">
                          {globalConfig.checkedBySub || "Superintendent Exams"}
                        </div>
                      </div>

                      {/* 3. Controller of Examinations */}
                      <div className="sig-block">
                        <div className="sig-line">
                          {globalConfig.controllerSig ? (
                            <img
                              src={globalConfig.controllerSig}
                              alt="Controller Signature"
                              className="sig-img"
                            />
                          ) : (
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
                          )}
                        </div>
                        <div className="sig-title">
                          {globalConfig.controllerTitle || "Controller of Examinations"}
                        </div>
                        <div className="sig-sub">
                          {globalConfig.controllerSub || "Khyber Medical University"}
                        </div>
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

      {/* ── Global OMR Settings Modal ── */}
      {showGlobalModal && (
        <OmrGlobalEditModal
          show={showGlobalModal}
          onHide={() => setShowGlobalModal(false)}
          globalConfig={globalConfig}
          subjects={subjects}
          onSave={handleSaveGlobalConfig}
        />
      )}

      {/* ── Individual Candidate Edit Modal ── */}
      {editingCandidate && (
        <OmrCandidateEditModal
          show={Boolean(editingCandidate)}
          onHide={() => setEditingCandidate(null)}
          candidate={editingCandidate}
          subjects={subjects}
          globalConfig={globalConfig}
          onSave={handleSaveCandidate}
        />
      )}

      {/* ── Floating Export Button in Bottom Right ── */}
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
