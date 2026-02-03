import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import JSZip from "jszip";

const normalize = (v) => String(v ?? "").trim();
const upper = (v) => normalize(v).toUpperCase();
const norm = (v) =>
  String(v ?? "")
    .trim()
    .toLowerCase();

const hasRA = (rollNumber) => upper(rollNumber).includes("RA");

const parseRollNumber = (value) => {
  if (!value) return null;
  const numeric = Number(String(value).replace(/[^0-9]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
};

// ✅ for a column label, return all possible keys to match in student.subjects (OSPE fix)
const possibleKeysForColumn = (label) => {
  const l = norm(label);

  if (l.endsWith("- ospe") || l.includes(" - ospe")) {
    const base = l.replace(/\s*-\s*ospe\s*$/, "");
    return [l, `${base} - ospe`, `${base}-ospe`, base];
  }

  return [l];
};

// build columns like your UI (subject + its ospe column if exists)
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
    const isRAFlag = hasRA(student.rollNumber);
    const institute = upper(student?.institute);
    const groupKey = `${institute}__${isRAFlag ? "RA" : "NON_RA"}`;

    serial = previousGroupKey === groupKey ? serial + 1 : 1;
    previousGroupKey = groupKey;

    return { ...student, serial, isRA: isRAFlag };
  });
};

// ---------- NEW: EXPORT MID-ONLY SHEET (single workbook) ----------
async function createMidOnlyWorkbook({ subjects, studentsData, sheetName = "Mid Marks" }) {
  const columns = buildColumns(subjects);
  const processedStudents = processStudents(studentsData);

  // ✅ Total columns: 8 fixed + (columns.length * 1) [MID ONLY]
  const totalCols = 8 + columns.length;

  const wb = new ExcelJS.Workbook();
  wb.creator = "KMU Mid Marks Sheet";

  const ws = wb.addWorksheet(sheetName, {
    views: [{ state: "frozen", xSplit: 0, ySplit: 4 }],
  });

  const borderAll = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // ✅ column widths (8 fixed)
  const baseWidths = [6, 18, 22, 22, 24, 16, 18, 26];
  for (let c = 1; c <= 8; c++) ws.getColumn(c).width = baseWidths[c - 1];

  // ✅ each subject is ONE column now (Mid only) starts at column 9
  for (let i = 0; i < columns.length; i++) {
    ws.getColumn(9 + i).width = 12;
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

  // Spacer row
  ws.addRow([]);
  ws.mergeCells(3, 1, 3, totalCols);

  // =========================
  // Header rows
  // =========================
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
    { text: "Regular / Re-appear", col: 7 },
    { text: "Institute", col: 8 },
  ];

  // Fixed headers merged vertically (rowSpan=2)
  fixedHeaders.forEach((h) => {
    ws.mergeCells(headerRow1, h.col, headerRow2, h.col);
    const cell = ws.getCell(headerRow1, h.col);
    cell.value = h.text;
    cell.font = { bold: true };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
  });

  // ✅ Subject columns start at 9; row4 = label, row5 = "Mid"
  let startCol = 9;
  columns.forEach((col) => {
    const labelCell = ws.getCell(headerRow1, startCol);
    labelCell.value = normalize(col.label);
    labelCell.font = { bold: true };
    labelCell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

    const midCell = ws.getCell(headerRow2, startCol);
    midCell.value = "Mid";
    midCell.font = { bold: true };
    midCell.alignment = { vertical: "middle", horizontal: "center" };

    startCol += 1;
  });

  // Style header background + borders
  const headerFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF2F2F2" },
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

    const rowValues = buildRowValuesMidOnly(demo, columns);
    ws.addRow(rowValues);
    styleDataRow(ws, firstDataRow, demo.isRA, borderAll);
  } else {
    processedStudents.forEach((student, idx) => {
      const excelRowIndex = firstDataRow + idx;
      const rowValues = buildRowValuesMidOnly(student, columns);
      ws.addRow(rowValues);
      styleDataRow(ws, excelRowIndex, student.isRA, borderAll);
    });
  }

  ws.autoFilter = {
    from: { row: headerRow1, column: 1 },
    to: { row: headerRow2, column: totalCols },
  };

  return wb;
}

// build row values in the exact order of columns (MID ONLY)
function buildRowValuesMidOnly(student, columns) {
  const subjectSet = Array.isArray(student?.subjects)
    ? new Set(
        student.subjects
          .map((s) => {
            if (typeof s === "string") return norm(s);
            return norm(
              s?.label ??
                s?.name ??
                s?.subject ??
                s?.subjectName ??
                s?.title ??
                "",
            );
          })
          .filter(Boolean),
      )
    : null;

  const base = [
    student.serial ?? "",
    student.rollNumber.split("(")[0] ?? "",
    student.name ?? "",
    student.fatherName ?? "",
    student.registration ?? "",
    student.Discipline ?? "",
    student.isRA ? "Re-appear" : "Regular",
    student.institute ?? "",
  ];

  const marksCells = [];
  columns.forEach((col) => {
    const keys = possibleKeysForColumn(col.label);
    const hasSubject = subjectSet ? keys.some((k) => subjectSet.has(k)) : false;

    // ✅ MID only
    const val = subjectSet ? (hasSubject ? "-" : "NA") : "-";
    marksCells.push(val);
  });

  return [...base, ...marksCells];
}

function styleDataRow(ws, rowNumber, isRA, borderAll) {
  const row = ws.getRow(rowNumber);
  row.height = 18;

  const raFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFF4CC" },
  };

  const naFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFC7CE" },
  };

  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = borderAll;
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: false,
    };

    if (String(cell.value ?? "").trim().toUpperCase() === "NA") {
      cell.fill = naFill;
      return;
    }

    if (isRA) {
      cell.fill = raFill;
    }
  });

  ws.getCell(rowNumber, 3).alignment = { vertical: "middle", horizontal: "left" };
  ws.getCell(rowNumber, 4).alignment = { vertical: "middle", horizontal: "left" };
  ws.getCell(rowNumber, 5).alignment = { vertical: "middle", horizontal: "left" };
  ws.getCell(rowNumber, 8).alignment = { vertical: "middle", horizontal: "left" };
}

// ---------- NEW: ZIP EXPORT (one file per institute) ----------
const safeFileName = (name) =>
  String(name || "Institute")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 120);

export async function exportMidMarksheetsByInstituteZip({
  subjects,
  studentsData,
  zipName = "KMU-Mid-Marksheets-Institutes.zip",
}) {
  const list = Array.isArray(studentsData) ? studentsData : [];
  if (list.length === 0) return;

  // group by institute (use normalized key, but keep original label for filename)
  const groups = new Map();
  for (const st of list) {
    const rawInst = normalize(st?.institute || "Unknown Institute");
    const key = norm(rawInst);
    if (!groups.has(key)) groups.set(key, { instituteLabel: rawInst, students: [] });
    groups.get(key).students.push(st);
  }

  const zip = new JSZip();

  for (const [, group] of groups) {
    const wb = await createMidOnlyWorkbook({
      subjects,
      studentsData: group.students,
      sheetName: "Mid Marks",
    });

    const buffer = await wb.xlsx.writeBuffer();

    const file = `${safeFileName(group.instituteLabel)} - Mid Marks.xlsx`;
    zip.file(file, buffer);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });

  // Optional: use Save Picker if available (still downloads ONE zip)
  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    const handle = await window.showSaveFilePicker({
      suggestedName: zipName,
      types: [{ description: "ZIP Archive", accept: { "application/zip": [".zip"] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(zipBlob);
    await writable.close();
    return;
  }

  saveAs(zipBlob, zipName);
}
