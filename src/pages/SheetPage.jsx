import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DownloadExcelBar from "../components/DownloadExcelButton";
import SheetTable from "../components/SheetTable";
import { useSubject } from "../context/SubjectContext";
import TableHeader from "../components/TableHeader";
import {
  buildEvaluationColumns,
  evaluateStudentPassFail,
  isStudentMissingMid,
  isStudentMissingFinal,
} from "../utils/studentEvaluation";
import {
  LuUsers,
  LuCircleCheck,
  LuTriangleAlert,
  LuFileText,
  LuSearch,
  LuBuilding2,
  LuSparkles,
  LuBookOpen,
  LuX,
  LuGraduationCap,
} from "react-icons/lu";

export default function MarksSheet() {
  const navigate = useNavigate();
  const { studentsData, subjects } = useSubject();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [instituteFilter, setInstituteFilter] = useState("all");

  // Metrics computation
  const metrics = useMemo(() => {
    const list = studentsData || [];
    const total = list.length;

    let regular = 0;
    let reappear = 0;
    const institutes = new Set();

    list.forEach((s) => {
      const isRA = String(s?.rollNumber || "").toUpperCase().includes("RA");
      if (isRA) reappear++;
      else regular++;

      if (s?.institute) {
        institutes.add(String(s.institute).trim());
      }
    });

    // Count passed / failed
    let passed = 0;
    let failed = 0;
    let missingMid = 0;
    let missingFinal = 0;

    // Pass/fail and missing marks tally for overview metrics
    const evalColumns = buildEvaluationColumns(subjects);

    list.forEach((s) => {
      if (isStudentMissingMid(s)) missingMid++;
      if (isStudentMissingFinal(s)) missingFinal++;

      const res = evaluateStudentPassFail(s, evalColumns);
      if (res.isPassed) passed++;
      else if (res.isFailed) failed++;
    });

    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

    return {
      total,
      regular,
      reappear,
      passed,
      failed,
      missingMid,
      missingFinal,
      passRate,
      institutes: Array.from(institutes).sort(),
    };
  }, [studentsData, subjects]);

  const hasUploadedMarks = useMemo(() => {
    return (studentsData || []).some((student) =>
      (student.subjects || []).some((subj) => {
        const isNum = (v) =>
          v !== "" && v !== null && v !== undefined && !isNaN(parseFloat(v));
        return isNum(subj?.mid) || isNum(subj?.final) || isNum(subj?.total);
      })
    );
  }, [studentsData]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setInstituteFilter("all");
  };

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all" || instituteFilter !== "all";

  return (
    <div className="container-fluid px-4 py-4" style={{ maxWidth: "1680px" }}>
      {/* ── Dashboard Header ─────────────────────────────────────── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span
              className="badge bg-light text-primary border px-2 py-1 d-inline-flex align-items-center gap-1"
              style={{ fontSize: "11.5px", fontWeight: "600" }}
            >
              <LuSparkles size={13} />
              Examination Controller Dashboard
            </span>
            <span className="text-muted" style={{ fontSize: "12px" }}>
              Academic Session 2024–2025
            </span>
          </div>
          <h2 className="fw-bold mb-0 text-dark" style={{ fontSize: "24px", letterSpacing: "-0.02em" }}>
            Consolidated Combine Sheet & Analytics
          </h2>
        </div>

        <div className="d-flex align-items-center gap-2">
          {hasUploadedMarks && (
            <button
              onClick={() => navigate("/omr")}
              className="btn-sc btn-sc-primary btn-sc-sm d-flex align-items-center gap-2 shadow-sm"
              style={{ backgroundColor: "#881337", borderColor: "#881337" }}
              title="Open and generate student Detailed Marks Certificates"
            >
              <LuGraduationCap size={16} />
              <span>Generate DMC / OMR</span>
            </button>
          )}

          {subjects?.length > 0 && (
            <span className="badge bg-light text-secondary border px-3 py-2 d-flex align-items-center gap-2" style={{ fontSize: "12.5px" }}>
              <LuBookOpen size={14} className="text-primary" />
              <span>{subjects.length} Papers Configured</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Stat Cards Grid ──────────────────────────────────────── */}
      <div className="sc-stat-grid">
        <div className="sc-stat-card">
          <div>
            <div className="sc-stat-label">Total Candidates</div>
            <div className="sc-stat-value">{metrics.total}</div>
            <div className="sc-stat-sub">
              <LuBuilding2 size={13} />
              <span>{metrics.institutes.length} Affiliated Colleges</span>
            </div>
          </div>
          <div className="sc-stat-icon-wrap sc-stat-icon-blue">
            <LuUsers />
          </div>
        </div>

        <div className="sc-stat-card">
          <div>
            <div className="sc-stat-label">Passed Candidates (P)</div>
            <div className="sc-stat-value text-success">{metrics.passed}</div>
            <div className="sc-stat-sub text-success">
              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-0">
                {metrics.passRate}% Pass Rate
              </span>
            </div>
          </div>
          <div className="sc-stat-icon-wrap sc-stat-icon-green">
            <LuCircleCheck />
          </div>
        </div>

        <div className="sc-stat-card">
          <div>
            <div className="sc-stat-label">Needs Attention (NP)</div>
            <div className="sc-stat-value text-danger">{metrics.failed}</div>
            <div className="sc-stat-sub text-danger">
              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-0">
                {metrics.failed} Failed / Absent
              </span>
            </div>
          </div>
          <div className="sc-stat-icon-wrap sc-stat-icon-red">
            <LuTriangleAlert />
          </div>
        </div>

        <div className="sc-stat-card">
          <div>
            <div className="sc-stat-label">Candidate Types</div>
            <div className="sc-stat-value">
              <span style={{ fontSize: "20px" }}>
                {metrics.regular} <span className="text-muted fw-normal">/</span> {metrics.reappear}
              </span>
            </div>
            <div className="sc-stat-sub">
              <span>{metrics.regular} Regular • {metrics.reappear} Re-appear</span>
            </div>
          </div>
          <div className="sc-stat-icon-wrap sc-stat-icon-amber">
            <LuFileText />
          </div>
        </div>
      </div>

      {/* ── Main Sheet Container Card ────────────────────────────── */}
      <div className="sc-card p-4">
        {/* Uploads and Actions Toolbar */}
        <TableHeader />

        {/* ── Live Search & Filter Bar ────────────────────────────── */}
        {metrics.total > 0 && (
          <div className="sc-toolbar">
            {/* Search Input */}
            <div className="sc-search-wrap">
              <LuSearch className="sc-search-icon" />
              <input
                type="text"
                placeholder="Search candidate, roll #, reg #, institute..."
                className="sc-input sc-input-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="btn btn-link position-absolute p-0 text-muted"
                  style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                >
                  <LuX size={15} />
                </button>
              )}
            </div>

            {/* Status & Marks Completion Filter Dropdown (left of Institute) */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <select
                className="sc-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ minWidth: "210px" }}
              >
                <option value="all">All Candidates ({metrics.total})</option>
                <option value="passed">Passed Candidates ({metrics.passed})</option>
                <option value="failed">Failed Candidates ({metrics.failed})</option>
                <option value="regular">Regular Students ({metrics.regular})</option>
                <option value="reappear">Re-appear Students ({metrics.reappear})</option>
                <option value="missing_mid">⚠️ Missing Mid Marks ({metrics.missingMid})</option>
                <option value="missing_final">⚠️ Missing Final Marks ({metrics.missingFinal})</option>
              </select>

              {/* Institute Filter */}
              {metrics.institutes.length > 1 && (
                <select
                  className="sc-select"
                  value={instituteFilter}
                  onChange={(e) => setInstituteFilter(e.target.value)}
                  style={{ minWidth: "200px" }}
                >
                  <option value="all">All Institutes ({metrics.institutes.length})</option>
                  {metrics.institutes.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              )}

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="btn-sc btn-sc-ghost btn-sc-sm text-muted"
                  title="Reset all filters"
                >
                  <LuX size={14} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Table Container with Custom Scrollbar ───────────────── */}
        <div className="table-responsive table-scroll-container">
          <SheetTable
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            instituteFilter={instituteFilter}
            onResetFilters={handleResetFilters}
          />
        </div>
      </div>

      {/* Floating Download Toolbar */}
      <DownloadExcelBar />
    </div>
  );
}
