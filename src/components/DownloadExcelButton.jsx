import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubject } from "../context/SubjectContext";
import { exportMarksSheetXlsx } from "../utils/exportMarksSheetExcel";
import { exportMidMarksheetsByInstituteZip } from "../utils/exportMidMarksheetsByInstituteZip";
import { exportExceptionReportsPdf } from "../utils/exportExceptionReportsPdf";
import {
  LuFileSpreadsheet,
  LuArchive,
  LuFileText,
  LuSparkles,
  LuGraduationCap,
} from "react-icons/lu";

export default function DownloadExcelBar() {
  const navigate = useNavigate();
  const { subjects, studentsData } = useSubject();
  const [downloading, setDownloading] = useState(false);

  const disabled = useMemo(
    () => !studentsData || studentsData.length === 0,
    [studentsData],
  );

  const hasUploadedMarks = useMemo(() => {
    return (studentsData || []).some((student) =>
      (student.subjects || []).some((subj) => {
        const isNum = (v) =>
          v !== "" && v !== null && v !== undefined && !isNaN(parseFloat(v));
        return isNum(subj?.mid) || isNum(subj?.final) || isNum(subj?.total);
      })
    );
  }, [studentsData]);

  if (disabled) return null;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await exportMarksSheetXlsx({
        subjects,
        studentsData,
        fileName: "KMU-Marks-Sheet.xlsx",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleZipDownload = async () => {
    try {
      setDownloading(true);
      await exportMidMarksheetsByInstituteZip({
        subjects,
        studentsData,
        zipName: "KMU-Mid-Marksheets-Institutes.zip",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleGenerateReports = async () => {
    try {
      setDownloading(true);
      await exportExceptionReportsPdf({
        subjects,
        studentsData,
        fileName: "KMU-Exception-Reports.pdf",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="sc-download-bar">
      <div className="d-flex align-items-center gap-2 me-2 border-end pe-3 text-secondary" style={{ fontSize: "12.5px", fontWeight: "600" }}>
        <LuSparkles size={14} className="text-primary" />
        <span>Ready to Export</span>
        <span className="badge bg-light text-dark border px-2 py-0" style={{ fontSize: "11px" }}>
          {studentsData.length} records
        </span>
      </div>

      {hasUploadedMarks && (
        <button
          className="btn-sc btn-sc-primary btn-sc-sm d-flex align-items-center gap-1 shadow-sm"
          onClick={() => navigate("/omr")}
          style={{ backgroundColor: "#881337", borderColor: "#881337" }}
          title="Generate and view individual Detailed Marks Certificates (DMC / OMR)"
        >
          <LuGraduationCap size={15} />
          <span>Create OMR / DMC</span>
        </button>
      )}

      <button
        className="btn-sc btn-sc-outline btn-sc-sm"
        onClick={handleDownload}
        disabled={downloading}
        title="Download full marksheet as Excel (.xlsx)"
      >
        <LuFileSpreadsheet size={15} />
        <span>Export Excel</span>
      </button>

      <button
        className="btn-sc btn-sc-outline btn-sc-sm"
        onClick={handleZipDownload}
        disabled={downloading}
        title="Download individual institute mid-marks sheets in ZIP"
      >
        <LuArchive size={15} />
        <span>Institute Mid (ZIP)</span>
      </button>

      <button
        className="btn-sc btn-sc-dark btn-sc-sm"
        onClick={handleGenerateReports}
        disabled={downloading}
        title="Download PDF of missing periods, marks over max, and incomplete records"
      >
        <LuFileText size={15} />
        <span>Generate Reports</span>
      </button>
    </div>
  );
}
