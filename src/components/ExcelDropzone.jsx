import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { FiUploadCloud } from "react-icons/fi";

export default function ExcelDropzone({ label, onData, multiple = true }) {
  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!acceptedFiles || acceptedFiles.length === 0) return;

      const allData = [];

      for (const file of acceptedFiles) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        allData.push({ fileName: file.name, data: json });
      }

      onData(allData); // returns array of objects [{ fileName, data }]
    },
    [onData]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
  });

  return (
    <div className="dropzoneWrapper">
      <label className="labelText mb-2">{label}</label>

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? "active" : ""}`}
      >
        <input {...getInputProps()} />
        <FiUploadCloud className="dropzoneIcon" />
        <p className="dropzoneText">
          {isDragActive
            ? "Drop the Excel file(s) here..."
            : "Drag & drop Excel file(s) here, or click to browse"}
        </p>
        <span className="dropzoneHint">Only .xlsx or .xls files</span>
      </div>
    </div>
  );
}
