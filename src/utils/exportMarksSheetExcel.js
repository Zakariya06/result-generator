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

// ── buildColumns supporting per-subject ospeType ─────────────────────
export const buildColumns = (subjects) =>
  (subjects || []).flatMap((s) => {
    const baseMid = Number(s.maxMid) || 0;
    const baseFinal = Number(s.maxFinal) || 0;
    const ospeMid = s.ospe
      ? (s.ospeMaxMid !== undefined && s.ospeMaxMid !== ""
          ? Number(s.ospeMaxMid) || 0
          : baseMid)
      : 0;
    const ospeFinal = s.ospe
      ? (s.ospeMaxFinal !== undefined && s.ospeMaxFinal !== ""
          ? Number(s.ospeMaxFinal) || 0
          : baseFinal)
      : 0;

    // Combined OSPE
    if (s.ospe && s.ospeType === "combined") {
      return [
        {
          label: `${s.subject} - OSPE`,
          key: `${s.subject}-combined`,
          isCombined: true,
          subjectBase: s.subject,
          maxMid: baseMid,
          maxFinal: baseFinal,
          theoryMaxMid: baseMid,
          theoryMaxFinal: baseFinal,
          ospeMaxMid: 0,
          ospeMaxFinal: 0,
        },
      ];
    }

    // Separated OSPE or no OSPE
    const base = [
      {
        label: s.subject,
        key: s.subject,
        maxMid: baseMid,
        maxFinal: baseFinal,
      },
    ];
    if (s.ospe) {
      base.push({
        label: `${s.subject} - OSPE`,
        key: `${s.subject}-ospe`,
        subjectBase: s.subject,
        isOspeSeparated: true,
        maxMid: ospeMid,
        maxFinal: ospeFinal,
      });
    }
    return base;
  });

const possibleKeysForColumn = (label) => {
  const l = norm(label);
  if (l.endsWith("+ ospe") || l.includes("+ ospe")) {
    const base = l.replace(/\s*\+\s*ospe\s*$/, "").trim();
    return [l, `${base} + ospe`, `${base}+ospe`, `${base} - ospe`, `${base}-ospe`, base];
  }
  if (l.endsWith("- ospe") || l.includes("- ospe")) {
    const base = l.replace(/\s*-\s*ospe\s*$/, "").trim();
    return [l, `${base} - ospe`, `${base}-ospe`, `${base} + ospe`, `${base}+ospe`, base];
  }
  return [l];
};

export const processStudents = (studentsData) => {
  const sorted = [...(studentsData || [])].sort((a, b) => {
    const aRoll = parseRollNumber(a?.rollNumber);
    const bRoll = parseRollNumber(b?.rollNumber);

    if (aRoll !== null && bRoll !== null) return aRoll - bRoll;
    if (aRoll !== null) return -1;
    if (bRoll !== null) return 1;

    return String(a?.rollNumber || "").localeCompare(
      String(b?.rollNumber || "")
    );
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

function findTheoryEntry(subjects, subjectBase) {
  const baseNorm = norm(subjectBase);
  return (subjects || []).find((s) => {
    if (!s) return false;
    const sName = norm(
      s?.label ?? s?.name ?? s?.subject ?? s?.subjectName ?? s?.title ?? ""
    );
    return sName === baseNorm && !sName.includes("ospe");
  });
}

function findOspeEntry(subjects, subjectBase) {
  const baseNorm = norm(subjectBase);
  return (subjects || []).find((s) => {
    if (!s) return false;
    const sName = norm(
      s?.label ?? s?.name ?? s?.subject ?? s?.subjectName ?? s?.title ?? ""
    );
    return (
      sName.includes("ospe") &&
      (sName.includes(baseNorm) ||
        sName.replace(/\s*[-+]\s*ospe\s*$/, "").trim() === baseNorm)
    );
  });
}

// ── buildRowValues (for full marks sheet) ────────────────────────────
const buildRowValues = (student, columns) => {
  const base = [
    student.serial ?? "",
    String(student.rollNumber ?? "").split("(")[0],
    student.name ?? "",
    student.fatherName ?? "",
    student.registration ?? "",
    student.Discipline ?? "",
    student.isRA ? "Re-appear" : "Regular",
    student.institute ?? "",
  ];

  const marksCells = [];
  const exceedFlags = [];

  columns.forEach((col) => {
    if (col.isCombined) {
      const baseNorm = norm(col.subjectBase);
      const relatedSubjs = (student.subjects || []).filter((s) => {
        if (!s) return false;
        const sName = norm(
          s?.label ?? s?.name ?? s?.subject ?? s?.subjectName ?? s?.title ?? ""
        );
        const clean = sName.replace(/\s*[-+]\s*ospe\s*$/, "").trim();
        return clean === baseNorm || sName === baseNorm;
      });

      const isAnyNA = relatedSubjs.some(
        (s) =>
          String(s?.mid ?? "").toUpperCase() === "NA" ||
          String(s?.final ?? "").toUpperCase() === "NA"
      );

      if (isAnyNA || !relatedSubjs.length) {
        marksCells.push("NA", "NA", "NA");
        exceedFlags.push(false, false, false);
        return;
      }

      let combinedMid = 0;
      let hasMid = false;
      let combinedFinal = 0;
      let hasFinal = false;

      relatedSubjs.forEach((s) => {
        const m = parseFloat(s.mid);
        if (!isNaN(m)) {
          combinedMid += m;
          hasMid = true;
        }
        const f = parseFloat(s.final);
        if (!isNaN(f)) {
          combinedFinal += f;
          hasFinal = true;
        }
      });

      const combinedTotal = (hasMid ? combinedMid : 0) + (hasFinal ? combinedFinal : 0);

      const midExceeds = col.maxMid > 0 && hasMid && combinedMid > col.maxMid;
      const finalExceeds = col.maxFinal > 0 && hasFinal && combinedFinal > col.maxFinal;

      marksCells.push(
        hasMid ? combinedMid : "",
        hasFinal ? combinedFinal : "",
        hasMid || hasFinal ? combinedTotal : ""
      );
      exceedFlags.push(midExceeds, finalExceeds, false);
      return;
    }

    // Separated column
    const keys = possibleKeysForColumn(col.label);

    const matchedSubject = (
      Array.isArray(student.subjects) ? student.subjects : []
    ).find((s) => {
      if (!s) return false;
      const subjectName = norm(
        s?.label ?? s?.name ?? s?.subject ?? s?.subjectName ?? s?.title ?? ""
      );
      return keys.includes(subjectName);
    });

    if (!matchedSubject) {
      marksCells.push("NA", "NA", "NA");
      exceedFlags.push(false, false, false);
    } else {
      const midVal = parseFloat(matchedSubject.mid);
      const finalVal = parseFloat(matchedSubject.final);

      const midExceeds =
        col.maxMid > 0 && !isNaN(midVal) && midVal > col.maxMid;
      const finalExceeds =
        col.maxFinal > 0 && !isNaN(finalVal) && finalVal > col.maxFinal;

      const mid =
        matchedSubject.mid !== "" &&
        matchedSubject.mid !== null &&
        matchedSubject.mid !== undefined
          ? matchedSubject.mid
          : "-";
      const final =
        matchedSubject.final !== "" &&
        matchedSubject.final !== null &&
        matchedSubject.final !== undefined
          ? matchedSubject.final
          : "-";
      const total = computeTotal(matchedSubject);

      marksCells.push(mid, final, total);
      exceedFlags.push(midExceeds, finalExceeds, false);
    }
  });

  return { values: [...base, ...marksCells], exceedFlags };
};

const computeTotal = (subj) => {
  if (!subj) return "NA";
  if (
    String(subj.mid ?? "").toUpperCase() === "NA" ||
    String(subj.final ?? "").toUpperCase() === "NA"
  )
    return "NA";
  const mid = parseFloat(subj.mid);
  const final = parseFloat(subj.final);
  if (!isNaN(mid) && !isNaN(final)) return mid + final;
  return subj.total ?? "-";
};

const styleDataRow = (
  ws,
  rowNumber,
  totalCols,
  isRA,
  borderAll,
  exceedFlags
) => {
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
  const exceedFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFF0000" },
  };
  const exceedFont = { color: { argb: "FFFFFFFF" } };

  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.border = borderAll;
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: false,
    };

    const isMarksCell = colNumber >= 9;
    const exceedIndex = colNumber - 9;

    if (isMarksCell && exceedFlags && exceedFlags[exceedIndex]) {
      cell.fill = exceedFill;
      cell.font = exceedFont;
      return;
    }

    if (
      String(cell.value ?? "")
        .trim()
        .toUpperCase() === "NA"
    ) {
      cell.fill = naFill;
      cell.font = { color: { argb: "FF9B0000" } };
      return;
    }

    if (isRA) cell.fill = raFill;
  });

  [3, 4, 5, 8].forEach((col) => {
    ws.getCell(rowNumber, col).alignment = {
      vertical: "middle",
      horizontal: "left",
    };
  });
};

// ── EXPORT FULL MARKS SHEET ───────────────────────────────────────────
export async function exportMarksSheetXlsx({
  subjects,
  studentsData,
  fileName = "KMU-Marks-Sheet.xlsx",
}) {
  const columns = buildColumns(subjects);
  const processedStudents = processStudents(studentsData);
  const totalCols = 8 + columns.length * 3;

  const wb = new ExcelJS.Workbook();
  wb.creator = "KMU Marks Sheet";

  const ws = wb.addWorksheet("Marks Sheet", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 5 }],
  });

  const borderAll = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // Column widths
  const baseWidths = [6, 18, 22, 22, 24, 16, 18, 26];
  for (let c = 1; c <= 8; c++) ws.getColumn(c).width = baseWidths[c - 1];
  for (let i = 0; i < columns.length * 3; i++) ws.getColumn(9 + i).width = 10;

  // Title
  ws.addRow([]);
  ws.mergeCells(1, 1, 1, totalCols);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = "Khyber Medical University - Peshawar";
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 26;

  // Count
  ws.addRow([]);
  ws.mergeCells(2, 1, 2, totalCols);
  const countCell = ws.getCell(2, 1);
  countCell.value = `Total Students: ${processedStudents.length}`;
  countCell.font = { bold: true, size: 12 };
  countCell.alignment = { vertical: "middle", horizontal: "right" };
  ws.getRow(2).height = 18;

  // Spacer
  ws.addRow([]);
  ws.mergeCells(3, 1, 3, totalCols);

  // Headers
  ws.addRow([]);
  ws.addRow([]);
  const headerRow1 = 4;
  const headerRow2 = 5;

  const fixedHeaders = [
    { text: "S#", col: 1 },
    { text: "Roll #", col: 2 },
    { text: "Name", col: 3 },
    { text: "Father's Name", col: 4 },
    { text: "Registration", col: 5 },
    { text: "Discipline", col: 6 },
    { text: "Regular / Re-appear", col: 7 },
    { text: "Institute", col: 8 },
  ];

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

  let startCol = 9;
  columns.forEach((col) => {
    const groupEnd = startCol + 2;
    ws.mergeCells(headerRow1, startCol, headerRow1, groupEnd);
    const groupCell = ws.getCell(headerRow1, startCol);
    groupCell.value = normalize(col.label);
    groupCell.font = { bold: true };
    groupCell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };

    ["Mid", "Final", "Total"].forEach((label, offset) => {
      const cell = ws.getCell(headerRow2, startCol + offset);
      cell.value = label;
      cell.font = { bold: true };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    startCol += 3;
  });

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

  [1, 2].forEach((r) => {
    ws.getRow(r).eachCell({ includeEmpty: true }, (cell) => {
      cell.border = borderAll;
    });
  });

  // Data rows
  const firstDataRow = 6;
  const students =
    processedStudents.length > 0
      ? processedStudents
      : [
          {
            serial: 1,
            rollNumber: "KMU-001",
            name: "Student Name",
            fatherName: "Father Name",
            registration: "REG-2024",
            Discipline: "Discipline Name",
            institute: "KMU IHS-Swat",
            subjects: [],
            isRA: false,
          },
        ];

  students.forEach((student, idx) => {
    const excelRowIndex = firstDataRow + idx;
    const { values, exceedFlags } = buildRowValues(student, columns);
    ws.addRow(values);
    styleDataRow(
      ws,
      excelRowIndex,
      totalCols,
      student.isRA,
      borderAll,
      exceedFlags
    );
  });

  ws.autoFilter = {
    from: { row: headerRow1, column: 1 },
    to: { row: headerRow2, column: totalCols },
  };

  const buffer = await wb.xlsx.writeBuffer();

  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "Excel Workbook",
            accept: {
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                [".xlsx"],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(buffer);
      await writable.close();
      return;
    } catch (e) {
      if (e.name === "AbortError") return;
    }
  }

  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    fileName
  );
}

// ── MID-ONLY EXPORT (used in zip) ─────────────────────────────────────

export async function createMidOnlyWorkbook({
  subjects,
  studentsData,
  sheetName = "Mid Marks",
}) {
  const columns = buildColumns(subjects);
  const processedStudents = processStudents(studentsData);
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

  const baseWidths = [6, 18, 22, 22, 24, 16, 18, 26];
  for (let c = 1; c <= 8; c++) ws.getColumn(c).width = baseWidths[c - 1];
  for (let i = 0; i < columns.length; i++) {
    ws.getColumn(9 + i).width = 12;
  }

  // Title
  ws.addRow([]);
  ws.mergeCells(1, 1, 1, totalCols);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = "Khyber Medical University - Peshawar";
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 26;

  // Count
  ws.addRow([]);
  ws.mergeCells(2, 1, 2, totalCols);
  const countCell = ws.getCell(2, 1);
  countCell.value = `Total Students: ${processedStudents.length}`;
  countCell.font = { bold: true, size: 12 };
  countCell.alignment = { vertical: "middle", horizontal: "right" };
  ws.getRow(2).height = 18;

  // Spacer
  ws.addRow([]);
  ws.mergeCells(3, 1, 3, totalCols);

  // Headers
  ws.addRow([]);
  ws.addRow([]);
  const headerRow1 = 4;
  const headerRow2 = 5;

  const fixedHeaders = [
    { text: "S#", col: 1 },
    { text: "Roll #", col: 2 },
    { text: "Name", col: 3 },
    { text: "Father's Name", col: 4 },
    { text: "Registration", col: 5 },
    { text: "Discipline", col: 6 },
    { text: "Regular / Re-appear", col: 7 },
    { text: "Institute", col: 8 },
  ];

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

  let startCol = 9;
  columns.forEach((col) => {
    // Subject title in Row 4 (headerRow1)
    const labelCell = ws.getCell(headerRow1, startCol);
    labelCell.value = normalize(col.label);
    labelCell.font = { bold: true };
    labelCell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };

    // Sub-header "Mid" in Row 5 (headerRow2) for upload format compatibility
    const midCell = ws.getCell(headerRow2, startCol);
    midCell.value = "Mid";
    midCell.font = { bold: true };
    midCell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: false,
    };

    startCol += 1;
  });

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

  [1, 2].forEach((r) => {
    ws.getRow(r).eachCell({ includeEmpty: true }, (cell) => {
      cell.border = borderAll;
    });
  });

  // Data rows
  const firstDataRow = 6;
  const students =
    processedStudents.length > 0
      ? processedStudents
      : [
          {
            serial: 1,
            rollNumber: "KMU-001",
            name: "Student Name",
            fatherName: "Father Name",
            registration: "REG-2024",
            Discipline: "Discipline Name",
            institute: "KMU IHS-Swat",
            subjects: [],
            isRA: false,
          },
        ];

  students.forEach((student, idx) => {
    const excelRowIndex = firstDataRow + idx;
    const { values, exceedFlags } = buildRowValuesMidOnly(student, columns);
    ws.addRow(values);
    styleDataRowMidOnly(
      ws,
      excelRowIndex,
      student.isRA,
      borderAll,
      exceedFlags
    );
  });

  ws.autoFilter = {
    from: { row: headerRow1, column: 1 },
    to: { row: headerRow2, column: totalCols },
  };

  return wb;
}

// ── buildRowValuesMidOnly ─────────────────────────────────────────────
function buildRowValuesMidOnly(student, columns) {
  const base = [
    student.serial ?? "",
    String(student.rollNumber ?? "").split("(")[0],
    student.name ?? "",
    student.fatherName ?? "",
    student.registration ?? "",
    student.Discipline ?? "",
    student.isRA ? "Re-appear" : "Regular",
    student.institute ?? "",
  ];

  const marksCells = [];
  const exceedFlags = [];

  columns.forEach((col) => {
    if (col.isCombined) {
      const theorySubj = findTheoryEntry(student.subjects, col.subjectBase);
      const ospeSubj = findOspeEntry(student.subjects, col.subjectBase);

      const isTheoryNA =
        theorySubj &&
        (String(theorySubj.mid ?? "").toUpperCase() === "NA" ||
          String(theorySubj.final ?? "").toUpperCase() === "NA");
      const isOspeNA =
        ospeSubj &&
        (String(ospeSubj.mid ?? "").toUpperCase() === "NA" ||
          String(ospeSubj.final ?? "").toUpperCase() === "NA");

      if (isTheoryNA || isOspeNA) {
        marksCells.push("NA");
        exceedFlags.push(false);
        return;
      }

      if (!theorySubj && !ospeSubj) {
        marksCells.push("NA");
        exceedFlags.push(false);
        return;
      }

      const tMid = theorySubj ? parseFloat(theorySubj.mid) : NaN;
      const oMid = ospeSubj ? parseFloat(ospeSubj.mid) : NaN;
      const combinedMid = (!isNaN(tMid) ? tMid : 0) + (!isNaN(oMid) ? oMid : 0);
      const midExceeds = col.maxMid > 0 && combinedMid > col.maxMid;
      marksCells.push(combinedMid);
      exceedFlags.push(midExceeds);
      return;
    }

    const keys = possibleKeysForColumn(col.label);

    const matchedSubject = (
      Array.isArray(student.subjects) ? student.subjects : []
    ).find((s) => {
      if (!s) return false;
      const subjectName = norm(
        s?.label ?? s?.name ?? s?.subject ?? s?.subjectName ?? s?.title ?? ""
      );
      return keys.includes(subjectName);
    });

    if (!matchedSubject) {
      marksCells.push("NA");
      exceedFlags.push(false);
    } else {
      const midVal = parseFloat(matchedSubject.mid);
      const midExceeds =
        col.maxMid > 0 && !isNaN(midVal) && midVal > col.maxMid;
      marksCells.push(matchedSubject.mid ?? "-");
      exceedFlags.push(midExceeds);
    }
  });

  return { values: [...base, ...marksCells], exceedFlags };
}

function styleDataRowMidOnly(ws, rowNumber, isRA, borderAll, exceedFlags) {
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
  const exceedFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFF0000" },
  };
  const exceedFont = { color: { argb: "FFFFFFFF" } };

  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.border = borderAll;
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: false,
    };

    const isMarksCell = colNumber >= 9;
    const exceedIndex = colNumber - 9;

    if (isMarksCell && exceedFlags && exceedFlags[exceedIndex]) {
      cell.fill = exceedFill;
      cell.font = exceedFont;
      return;
    }

    if (
      String(cell.value ?? "")
        .trim()
        .toUpperCase() === "NA"
    ) {
      cell.fill = naFill;
      cell.font = { color: { argb: "FF9B0000" } };
      return;
    }

    if (isRA) {
      cell.fill = raFill;
    }
  });

  [3, 4, 5, 8].forEach((col) => {
    ws.getCell(rowNumber, col).alignment = {
      vertical: "middle",
      horizontal: "left",
    };
  });
}

// ── ZIP EXPORT FOR MID-ONLY SHEETS ────────────────────────────────────
export async function exportMidMarksheetsByInstituteZip({
  subjects,
  studentsData,
  zipName = "KMU-Mid-Marksheets-Institutes.zip",
}) {
  const list = Array.isArray(studentsData) ? studentsData : [];
  if (list.length === 0) return;

  const groups = new Map();
  for (const st of list) {
    const rawInst = normalize(st?.institute || "Unknown Institute");
    const key = norm(rawInst);
    if (!groups.has(key))
      groups.set(key, { instituteLabel: rawInst, students: [] });
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
    const fileName = `${safeFileName(group.instituteLabel)} - Mid Marks.xlsx`;
    zip.file(fileName, buffer);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });

  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: zipName,
        types: [
          {
            description: "ZIP Archive",
            accept: { "application/zip": [".zip"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(zipBlob);
      await writable.close();
      return;
    } catch (e) {
      if (e.name === "AbortError") return;
    }
  }

  saveAs(zipBlob, zipName);
}

const safeFileName = (name) =>
  String(name || "Institute")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 120);
