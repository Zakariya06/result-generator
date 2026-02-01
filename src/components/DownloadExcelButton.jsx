import React, { useMemo } from "react";
import { useSubject } from "../context/SubjectContext";
import { exportMarksSheetXlsx } from "../utils/exportMarksSheetExcel";
import { exportMidMarksheetsByInstituteZip } from "../utils/exportMidMarksheetsByInstituteZip";

export default function DownloadExcelBar() {
  const { subjects, studentsData } = useSubject();

  const disabled = useMemo(
    () => !studentsData || studentsData.length === 0,
    [studentsData],
  );

  const handleDownload = async () => {
    await exportMarksSheetXlsx({
      subjects,
      studentsData,
      fileName: "KMU-Marks-Sheet.xlsx",
    });
  };

  const handleZipDownload = async () => {
    await exportMidMarksheetsByInstituteZip({
      subjects,
      studentsData,
      zipName: "KMU-Mid-Marksheets-Institutes.zip",
    });
  };

  return (
    <>
      <div className="donwloadButton">
        <button
          className="btn btn-success d-block mb-1 ms-auto"
          onClick={handleDownload}
          disabled={disabled}
        >
          Download Excel (.xlsx)
        </button>

        <button
          className="btn btn-danger"
          onClick={handleZipDownload}
          disabled={disabled}
        >
          Download Mid Marksheets (ZIP)
        </button>
      </div>
    </>
  );
}
