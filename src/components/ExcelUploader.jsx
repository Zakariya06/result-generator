import React, { useState } from "react";
import * as XLSX from "xlsx";

export default function ExcelMultiUploader() {
  const [filesData, setFilesData] = useState([]);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    const allFilesData = [];

    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const sheets = workbook.SheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          raw: true,
          defval: "",
        });

        return {
          sheetName,
          rows,
          rawSheet: sheet, // for formulas access
        };
      });

      allFilesData.push({
        fileName: file.name,
        sheets,
      });
    }

    setFilesData(allFilesData);
  };
 

  return (
    <div style={{ padding: 20 }}>
      <h1>📊 Multiple Excel Upload (Advanced)</h1>

      <input type="file" multiple accept=".xlsx,.xls" onChange={handleFiles} />

      {filesData.map((file, fileIndex) => (
        <div key={fileIndex} style={{ marginTop: 30 }}>
          <h2>📁 {file.fileName}</h2>

          {file.sheets.map((sheet, sheetIndex) => (
            <div key={sheetIndex} style={{ marginTop: 15 }}>
              <h3>📄 Sheet: {sheet.sheetName}</h3>

              <table border="1" cellPadding="6">
                <tbody>
                  {sheet.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => {
                        const cellRef = XLSX.utils.encode_cell({
                          r: rIdx,
                          c: cIdx,
                        });
                        const cellObj = sheet.rawSheet[cellRef];

                        return (
                          <td key={cIdx}>
                            {cellObj?.f
                              ? `=${cellObj.f}` // formula
                              : cellObj?.v ?? ""}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
