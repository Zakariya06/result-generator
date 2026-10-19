import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const normalize = (v) => String(v ?? "").trim();
const upper = (v) => normalize(v).toUpperCase();
const norm = (v) => upper(v).toLowerCase();

const hasRA = (rollNumber) => upper(rollNumber).includes("RA");

const isNA = (v) => upper(v) === "NA";

const isBlankMark = (v) => {
  if (v === null || v === undefined) return true;
  const s = String(v).trim();
  return s === "" || s === "-";
};

const parseMark = (v) => {
  if (isBlankMark(v) || isNA(v)) return NaN;
  const n = parseFloat(String(v).trim());
  return Number.isFinite(n) ? n : NaN;
};

const buildColumns = (subjects) =>
  (subjects || []).flatMap((s) => {
    const baseMid = Number(s.maxMid) || 0;
    const baseFinal = Number(s.maxFinal) || 0;
    const base = [
      {
        label: s.subject,
        maxMid: baseMid,
        maxFinal: baseFinal,
      },
    ];
    if (s.ospe) {
      base.push({
        label: `${s.subject} - OSPE`,
        maxMid:
          s.ospeMaxMid !== undefined && s.ospeMaxMid !== ""
            ? Number(s.ospeMaxMid) || 0
            : baseMid,
        maxFinal:
          s.ospeMaxFinal !== undefined && s.ospeMaxFinal !== ""
            ? Number(s.ospeMaxFinal) || 0
            : baseFinal,
      });
    }
    return base;
  });

const possibleKeysForColumn = (label) => {
  const l = norm(label);
  if (l.endsWith("- ospe") || l.includes(" - ospe")) {
    const base = l.replace(/\s*-\s*ospe\s*$/, "").trim();
    return [l, `${base} - ospe`, `${base}-ospe`];
  }
  return [l];
};

const matchSubjectForColumn = (subjectsList = [], colItem) => {
  const keys = possibleKeysForColumn(colItem.label);
  const colNorm = norm(colItem.label);
  const isColOspe = colNorm.includes("ospe");

  return (subjectsList || []).find((s) => {
    if (!s) return false;
    const sName = norm(
      s?.label ?? s?.name ?? s?.subject ?? s?.subjectName ?? s?.title ?? "",
    );
    if (!sName) return false;
    const isSubjOspe = sName.includes("ospe");
    if (isColOspe !== isSubjOspe) return false;
    if (keys.includes(sName)) return true;
    return (
      sName === colNorm ||
      sName.startsWith(colNorm) ||
      colNorm.startsWith(sName)
    );
  });
};

const displayMark = (v) => {
  if (isBlankMark(v)) return "-";
  if (isNA(v)) return "NA";
  return String(v).trim();
};

const BIO_FIELDS = [
  { key: "name", label: "Student Name" },
  { key: "fatherName", label: "Father's Name" },
  { key: "rollNumber", label: "Roll #" },
  { key: "registration", label: "Registration" },
  { key: "institute", label: "Institute" },
  { key: "Discipline", label: "Discipline" },
];

export function collectExceptionReports(subjects, studentsData) {
  const columns = buildColumns(subjects);
  const missingPeriod = [];
  const exceedingMax = [];
  const missingData = [];

  (studentsData || []).forEach((student) => {
    if (!student || typeof student !== "object") return;

    const isRA = hasRA(student.rollNumber);
    const roll = String(student.rollNumber ?? "").split("(")[0].trim();
    const name = student.name || "";
    const institute = student.institute || "";

    const missingFields = BIO_FIELDS.filter((f) => !normalize(student[f.key])).map(
      (f) => f.label,
    );
    if (missingFields.length) {
      missingData.push({
        roll,
        name: name || "-",
        institute: institute || "-",
        missingFields: missingFields.join(", "),
      });
    }

    columns.forEach((col) => {
      const matched = matchSubjectForColumn(student.subjects || [], col);

      if (!matched) {
        // Re-appear students only sit registered papers — unmatched is expected NA
        if (isRA) return;
        missingPeriod.push({
          roll,
          name: name || "-",
          institute: institute || "-",
          subject: col.label,
          period: "Mid",
          value: "-",
          issue: "Missing mid marks",
        });
        missingPeriod.push({
          roll,
          name: name || "-",
          institute: institute || "-",
          subject: col.label,
          period: "Final",
          value: "-",
          issue: "Missing final marks",
        });
        return;
      }

      const periods = [
        { period: "Mid", value: matched.mid, max: col.maxMid },
        { period: "Final", value: matched.final, max: col.maxFinal },
      ];

      periods.forEach(({ period, value, max }) => {
        if (isBlankMark(value)) {
          missingPeriod.push({
            roll,
            name: name || "-",
            institute: institute || "-",
            subject: col.label,
            period,
            value: "-",
            issue: `Missing ${period.toLowerCase()} marks`,
          });
          return;
        }

        if (isNA(value)) {
          missingPeriod.push({
            roll,
            name: name || "-",
            institute: institute || "-",
            subject: col.label,
            period,
            value: "NA",
            issue: `Absent / not available (${period})`,
          });
          return;
        }

        const obtained = parseMark(value);
        if (!isNaN(obtained) && max > 0 && obtained > max) {
          exceedingMax.push({
            roll,
            name: name || "-",
            institute: institute || "-",
            subject: col.label,
            period,
            obtained: displayMark(value),
            maximum: String(max),
            excess: String(obtained - max),
          });
        }
      });
    });
  });

  return { columns, missingPeriod, exceedingMax, missingData };
}

const formatGeneratedAt = () => {
  const d = new Date();
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const addHeaderFooter = (doc, pageWidth, pageHeight) => {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 16, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Khyber Medical University — Exception Reports", 14, 10.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, 10.5, {
      align: "right",
    });

    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 10, pageWidth, 10, "F");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(
      "Confidential — Examination Controller use only",
      14,
      pageHeight - 4,
    );
    doc.text(formatGeneratedAt(), pageWidth - 14, pageHeight - 4, {
      align: "right",
    });
  }
};

const tableTheme = {
  theme: "grid",
  styles: {
    fontSize: 8,
    cellPadding: 2.2,
    overflow: "linebreak",
    valign: "middle",
    textColor: [15, 23, 42],
    lineColor: [226, 232, 240],
    lineWidth: 0.2,
  },
  headStyles: {
    fillColor: [15, 23, 42],
    textColor: [255, 255, 255],
    fontStyle: "bold",
    fontSize: 8,
  },
  alternateRowStyles: { fillColor: [248, 250, 252] },
  margin: { left: 14, right: 14, top: 22, bottom: 14 },
};

function addSectionTitle(doc, title, y) {
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, 14, y);
  return y + 3;
}

function addEmptyNote(doc, text, startY) {
  autoTable(doc, {
    ...tableTheme,
    startY,
    body: [[text]],
    styles: { ...tableTheme.styles, fontStyle: "italic", textColor: [100, 116, 139] },
    theme: "plain",
    showHead: "never",
  });
}

export async function exportExceptionReportsPdf({
  subjects,
  studentsData,
  fileName = "KMU-Exception-Reports.pdf",
}) {
  const { missingPeriod, exceedingMax, missingData } = collectExceptionReports(
    subjects,
    studentsData,
  );

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const totalStudents = (studentsData || []).length;
  const uniqueMissingPeriod = new Set(missingPeriod.map((r) => r.roll)).size;
  const uniqueExceeding = new Set(exceedingMax.map((r) => r.roll)).size;
  const uniqueMissingData = new Set(missingData.map((r) => r.roll)).size;

  doc.setFillColor(79, 70, 229);
  doc.rect(0, 16, pageWidth, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Consolidated Marks — Exception Reports", 14, 27);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Examination Controller Dashboard", 14, 32.5);

  autoTable(doc, {
    ...tableTheme,
    startY: 42,
    head: [["Metric", "Count"]],
    body: [
      ["Total candidates in sheet", String(totalStudents)],
      ["Configured papers", String((subjects || []).length)],
      ["Students with missing period marks", String(uniqueMissingPeriod)],
      ["Missing period rows (Mid / Final)", String(missingPeriod.length)],
      ["Students with marks above maximum", String(uniqueExceeding)],
      ["Marks-exceed rows", String(exceedingMax.length)],
      ["Students with missing biodata", String(uniqueMissingData)],
    ],
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 30, halign: "center" },
    },
  });

  let y = (doc.lastAutoTable?.finalY || 70) + 12;
  y = addSectionTitle(
    doc,
    `1. Missing period marks (${missingPeriod.length})`,
    y,
  );

  if (!missingPeriod.length) {
    addEmptyNote(doc, "No missing Mid or Final marks found.", y + 2);
  } else {
    autoTable(doc, {
      ...tableTheme,
      startY: y + 2,
      head: [
        [
          "Roll #",
          "Student Name",
          "Institute",
          "Subject",
          "Period",
          "Value",
          "Issue",
        ],
      ],
      body: missingPeriod.map((r) => [
        r.roll,
        r.name,
        r.institute,
        r.subject,
        r.period,
        r.value,
        r.issue,
      ]),
      columnStyles: {
        4: { cellWidth: 22, halign: "center" },
        5: { cellWidth: 20, halign: "center" },
      },
      didParseCell: (data) => {
        if (data.section !== "body") return;
        if (data.column.index === 5 && String(data.cell.raw) === "NA") {
          data.cell.styles.fillColor = [254, 226, 226];
          data.cell.styles.textColor = [153, 27, 27];
        }
        if (data.column.index === 5 && String(data.cell.raw) === "-") {
          data.cell.styles.fillColor = [254, 243, 199];
          data.cell.styles.textColor = [146, 64, 14];
        }
      },
    });
  }

  y = (doc.lastAutoTable?.finalY || y) + 12;
  if (y > 180) {
    doc.addPage();
    y = 24;
  }
  y = addSectionTitle(
    doc,
    `2. Marks exceeding maximum (${exceedingMax.length})`,
    y,
  );

  if (!exceedingMax.length) {
    addEmptyNote(doc, "No marks exceed the configured maximum.", y + 2);
  } else {
    autoTable(doc, {
      ...tableTheme,
      startY: y + 2,
      head: [
        [
          "Roll #",
          "Student Name",
          "Institute",
          "Subject",
          "Period",
          "Obtained",
          "Maximum",
          "Excess",
        ],
      ],
      body: exceedingMax.map((r) => [
        r.roll,
        r.name,
        r.institute,
        r.subject,
        r.period,
        r.obtained,
        r.maximum,
        r.excess,
      ]),
      didParseCell: (data) => {
        if (data.section !== "body") return;
        if ([5, 7].includes(data.column.index)) {
          data.cell.styles.fillColor = [254, 226, 226];
          data.cell.styles.textColor = [153, 27, 27];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
  }

  y = (doc.lastAutoTable?.finalY || y) + 12;
  if (y > 180) {
    doc.addPage();
    y = 24;
  }
  y = addSectionTitle(
    doc,
    `3. Students with missing data (${missingData.length})`,
    y,
  );

  if (!missingData.length) {
    addEmptyNote(doc, "No students are missing biodata fields.", y + 2);
  } else {
    autoTable(doc, {
      ...tableTheme,
      startY: y + 2,
      head: [["Roll #", "Student Name", "Institute", "Missing fields"]],
      body: missingData.map((r) => [
        r.roll || "-",
        r.name,
        r.institute,
        r.missingFields,
      ]),
    });
  }

  addHeaderFooter(doc, pageWidth, doc.internal.pageSize.getHeight());

  const blob = doc.output("blob");

  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "PDF Document",
            accept: { "application/pdf": [".pdf"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (e) {
      if (e.name === "AbortError") return;
    }
  }

  doc.save(fileName);
}
