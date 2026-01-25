import React, { useMemo } from "react";
import { useSubject } from "../context/SubjectContext";
import { exportMarksSheetXlsx } from "../utils/exportMarksSheetExcel";

export default function DownloadExcelBar() {
    const { subjects, studentsData } = useSubject();

    const disabled = useMemo(() => !studentsData || studentsData.length === 0, [studentsData]);

    const handleDownload = async () => {
        await exportMarksSheetXlsx({
            subjects,
            studentsData,
            fileName: "KMU-Marks-Sheet.xlsx",
        });
    };

    return (

        <button
            className="btn btn-success donwloadButton"
            onClick={handleDownload}
            disabled={disabled} 
        >
            Download Excel (.xlsx)
        </button>
    );
}

