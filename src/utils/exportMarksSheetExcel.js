import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const normalize = (v) => String(v ?? "").trim();
const upper = (v) => normalize(v).toUpperCase();

const hasRA = (rollNumber) => upper(rollNumber).includes("RA");

const parseRollNumber = (value) => {
  if (!value) return null;
  const numeric = Number(String(value).replace(/[^0-9]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
};

// build columns like your UI
export const buildColumns = (subjects) =>
  (subjects || []).flatMap((s) => {
    const base = [{ label: s.subject, key: s.subject }];
    if (s.ospe) base.push({ label: `${s.subject} - OSPE`, key: `${s.subject}-ospe` });
    return base;
  });

// same processedStudents logic you use
export const processStudents = (studentsData) => {
  const sorted = [...(studentsData || [])].sort((a, b) => {
    const aRoll = parseRollNumber(a?.rollNumber);
    const bRoll = parseRollNumber(b?.rollNumber);

    if (aRoll !== null && bRoll !== null) return aRoll - bRoll;
    if (aRoll !== null) return -1;
    if (bRoll !== null) return 1;

    return String(a?.rollNumber || "").localeCompare(String(b?.rollNumber || ""));
  });

  let serial = 0;
  let previousGroupKey = null;

  return sorted.map((student) => {
    const isRA = hasRA(student.rollNumber);
    const institute = upper(student?.institute); // if your field is "institue", change here
    const groupKey = `${institute}__${isRA ? "RA" : "NON_RA"}`;

    serial = previousGroupKey === groupKey ? serial + 1 : 1;
    previousGroupKey = groupKey;

    return { ...student, serial, isRA };
  });
};

export async function exportMarksSheetXlsx({
  subjects,
  studentsData,
  fileName = "KMU-Marks-Sheet.xlsx",
}) {
  const columns = buildColumns(subjects);
  const processedStudents = processStudents(studentsData);

  // Total columns:
  // 7 fixed + (columns.length * 3)
  const totalCols = 7 + columns.length * 3;

  const wb = new ExcelJS.Workbook();
  wb.creator = "KMU Marks Sheet";
  const ws = wb.addWorksheet("Marks Sheet", {
    views: [
      {
        state: "frozen",
        xSplit: 0,
        ySplit: 4, // freeze title+count+2 header rows
      },
    ],
  });

  // Helpers for styling
  const borderAll = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // Column widths
  const baseWidths = [6, 18, 22, 22, 24, 16, 26]; // S#, Roll#, Name, Father, Reg, Discipline, Institute
  for (let c = 1; c <= 7; c++) ws.getColumn(c).width = baseWidths[c - 1];

  // each subject group 3 cols (Mid, Final, Total)
  for (let i = 0; i < columns.length * 3; i++) {
    ws.getColumn(8 + i).width = 10;
  }

  // =========================
  // Title row (merged)
  // =========================
  ws.addRow([]);
  ws.mergeCells(1, 1, 1, totalCols);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = "Khyber Medical University - Peshawar";
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 26;

  // =========================
  // Count row (merged)
  // =========================
  ws.addRow([]);
  ws.mergeCells(2, 1, 2, totalCols);
  const countCell = ws.getCell(2, 1);
  countCell.value = `Total Students: ${processedStudents.length}`;
  countCell.font = { bold: true, size: 12 };
  countCell.alignment = { vertical: "middle", horizontal: "right" };
  ws.getRow(2).height = 18;

  // Spacer row (optional)
  ws.addRow([]);
  ws.mergeCells(3, 1, 3, totalCols);

  // =========================
  // Header rows (2 rows like your table)
  // =========================
  // Row 4 = main headers + subject group merged
  // Row 5 = Mid/Final/Total
  ws.addRow([]); // row 4
  ws.addRow([]); // row 5

  const headerRow1 = 4;
  const headerRow2 = 5;

  const fixedHeaders = [
    { text: "S#", col: 1 },
    { text: "Roll #", col: 2 },
    { text: "Name", col: 3 },
    { text: "Father’s Name", col: 4 },
    { text: "Registration", col: 5 },
    { text: "Discipline", col: 6 },
    { text: "Institute", col: 7 },
  ];

  // Fixed headers merged vertically (rowSpan=2)
  fixedHeaders.forEach((h) => {
    ws.mergeCells(headerRow1, h.col, headerRow2, h.col);
    const cell = ws.getCell(headerRow1, h.col);
    cell.value = h.text;
    cell.font = { bold: true };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });

  // Subject groups
  let startCol = 8;
  columns.forEach((col) => {
    const groupStart = startCol;
    const groupEnd = startCol + 2;

    // merge group header across 3 cols
    ws.mergeCells(headerRow1, groupStart, headerRow1, groupEnd);
    const groupCell = ws.getCell(headerRow1, groupStart);
    groupCell.value = normalize(col.label);
    groupCell.font = { bold: true };
    groupCell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

    // subheaders
    ws.getCell(headerRow2, groupStart).value = "Mid";
    ws.getCell(headerRow2, groupStart + 1).value = "Final";
    ws.getCell(headerRow2, groupStart + 2).value = "Total";

    for (let c = groupStart; c <= groupEnd; c++) {
      const cell = ws.getCell(headerRow2, c);
      cell.font = { bold: true };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    }

    startCol += 3;
  });

  // Style header background + borders
  const headerFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF2F2F2" }, // light gray
  };

  [headerRow1, headerRow2].forEach((r) => {
    const row = ws.getRow(r);
    row.height = 20;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = headerFill;
      cell.border = borderAll;
    });
  });

  // Borders for title/count rows
  [1, 2].forEach((r) => {
    const row = ws.getRow(r);
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = borderAll;
    });
  });

  // =========================
  // Data rows
  // =========================
  const firstDataRow = 6;

  if (processedStudents.length === 0) {
    const demo = {
      serial: 1,
      rollNumber: "KMU-001",
      name: "Student Name",
      fatherName: "Father Name",
      registration: "REG-2024",
      Discipline: "Discipline Name",
      institute: "KMU IHS-Swat",
      subjects: [],
      isRA: false,
    };

    const rowValues = buildRowValues(demo, columns);
    ws.addRow(rowValues);
    styleDataRow(ws, firstDataRow, totalCols, demo.isRA, borderAll);
  } else {
    processedStudents.forEach((student, idx) => {
      const excelRowIndex = firstDataRow + idx;
      const rowValues = buildRowValues(student, columns);
      ws.addRow(rowValues);
      styleDataRow(ws, excelRowIndex, totalCols, student.isRA, borderAll);
    });
  }

  // Auto filter (optional)
  ws.autoFilter = {
    from: { row: headerRow1, column: 1 },
    to: { row: headerRow2, column: totalCols },
  };

  // Write file
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, fileName);
}

// build row values in the exact order of columns
function buildRowValues(student, columns) {
  // ✅ FIX: subjects can be strings OR objects, build set properly
  const subjectSet = Array.isArray(student?.subjects)
    ? new Set(
        student.subjects
          .map((s) => {
            if (typeof s === "string") return String(s).trim().toLowerCase();
            return String(
              s?.label ?? s?.name ?? s?.subject ?? s?.subjectName ?? s?.title ?? ""
            )
              .trim()
              .toLowerCase();
          })
          .filter(Boolean)
      )
    : null;

  const base = [
    student.serial ?? "",
    student.rollNumber ?? "",
    student.name ?? "",
    student.fatherName ?? "",
    student.registration ?? "",
    student.Discipline ?? "",
    student.institute ?? "",
  ];

  const marksCells = [];
  columns.forEach((col) => {
    const label = String(col.label).trim().toLowerCase();
    const val = subjectSet ? (subjectSet.has(label) ? "-" : "NA") : "-";
    marksCells.push(val, val, val); // Mid/Final/Total
  });

  return [...base, ...marksCells];
}

function styleDataRow(ws, rowNumber, totalCols, isRA, borderAll) {
  const row = ws.getRow(rowNumber);
  row.height = 18;

  const raFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFF4CC" }, // soft yellow
  };

  const naFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFC7CE" }, // light red
  };

  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = borderAll;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false };

    // ✅ NA cells red (priority)
    if (String(cell.value ?? "").trim().toUpperCase() === "NA") {
      cell.fill = naFill;
      return;
    }

    // ✅ RA row highlight (only if not NA)
    if (isRA) {
      cell.fill = raFill;
    }
  });

  // Align some columns left for readability
  ws.getCell(rowNumber, 3).alignment = { vertical: "middle", horizontal: "left" }; // Name
  ws.getCell(rowNumber, 4).alignment = { vertical: "middle", horizontal: "left" }; // Father
  ws.getCell(rowNumber, 5).alignment = { vertical: "middle", horizontal: "left" }; // Registration
  ws.getCell(rowNumber, 7).alignment = { vertical: "middle", horizontal: "left" }; // Institute
}
