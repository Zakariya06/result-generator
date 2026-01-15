import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { FiUploadCloud } from "react-icons/fi";

export default function ExcelDropzone({ label, onData }) {
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    onData(json);
  }, [onData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
  });

  return (
    <div className="dropzoneWrapper">
      <label className="labelText">{label}</label>

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? "active" : ""}`}
      >
        <input {...getInputProps()} />

        <FiUploadCloud className="dropzoneIcon" />

        <p className="dropzoneText">
          {isDragActive
            ? "Drop the Excel file here..."
            : "Drag & drop Excel file here, or click to browse"}
        </p>

        <span className="dropzoneHint">Only .xlsx or .xls files</span>
      </div>
    </div>
  );
}
