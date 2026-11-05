/**
 * KMU Credit Hours Scheme and Grading Regulations
 * Based on official KMU Notifications & Allied Health Sciences Weightage Charts
 */

// Official weightage table from KMU Marks Distribution Table
export const KMU_CREDIT_HOUR_SCHEME = [
  { cr: "0+5", total: 125, midTheory: 0, finalTheory: 0, midPrac: 25, finalPrac: 100, passing: 63, hasOspe: true, label: "0+5 (125 Marks • 0 Theory + 5 OSPE)" },
  { cr: "4+0", total: 100, midTheory: 20, finalTheory: 80, midPrac: 0, finalPrac: 0, passing: 50, hasOspe: false, label: "4+0 (100 Marks • 4 Theory + 0 OSPE)" },
  { cr: "0+4", total: 100, midTheory: 0, finalTheory: 0, midPrac: 20, finalPrac: 80, passing: 50, hasOspe: true, label: "0+4 (100 Marks • 0 Theory + 4 OSPE)" },
  { cr: "3+1", total: 100, midTheory: 15, finalTheory: 60, midPrac: 5, finalPrac: 20, passing: 50, hasOspe: true, label: "3+1 (100 Marks • 3 Theory + 1 OSPE)" },
  { cr: "1+3", total: 100, midTheory: 5, finalTheory: 60, midPrac: 15, finalPrac: 20, passing: 50, hasOspe: true, label: "1+3 (100 Marks • 1 Theory + 3 OSPE)" },
  { cr: "2+2", total: 100, midTheory: 10, finalTheory: 40, midPrac: 10, finalPrac: 40, passing: 50, hasOspe: true, label: "2+2 (100 Marks • 2 Theory + 2 OSPE)" },
  { cr: "3+0", total: 75,  midTheory: 15, finalTheory: 60, midPrac: 0, finalPrac: 0, passing: 38, hasOspe: false, label: "3+0 (75 Marks • 3 Theory + 0 OSPE)" },
  { cr: "0+3", total: 75,  midTheory: 0, finalTheory: 0, midPrac: 15, finalPrac: 60, passing: 38, hasOspe: true, label: "0+3 (75 Marks • 0 Theory + 3 OSPE)" },
  { cr: "2+1", total: 75,  midTheory: 10, finalTheory: 40, midPrac: 5, finalPrac: 20, passing: 38, hasOspe: true, label: "2+1 (75 Marks • 2 Theory + 1 OSPE)" },
  { cr: "1.5+1.5", total: 75, midTheory: 7, finalTheory: 30, midPrac: 8, finalPrac: 30, passing: 38, hasOspe: true, label: "1.5+1.5 (75 Marks • 1.5 Theory + 1.5 OSPE)" },
  { cr: "2+0", total: 50,  midTheory: 10, finalTheory: 40, midPrac: 0, finalPrac: 0, passing: 25, hasOspe: false, label: "2+0 (50 Marks • 2 Theory + 0 OSPE)" },
  { cr: "1+1", total: 50,  midTheory: 5, finalTheory: 20, midPrac: 5, finalPrac: 20, passing: 25, hasOspe: true, label: "1+1 (50 Marks • 1 Theory + 1 OSPE)" },
  { cr: "1.5+0.5", total: 50, midTheory: 7, finalTheory: 30, midPrac: 3, finalPrac: 10, passing: 25, hasOspe: true, label: "1.5+0.5 (50 Marks • 1.5 Theory + 0.5 OSPE)" },
  { cr: "2.5+0.5", total: 75, midTheory: 12, finalTheory: 50, midPrac: 3, finalPrac: 10, passing: 38, hasOspe: true, label: "2.5+0.5 (75 Marks • 2.5 Theory + 0.5 OSPE)" },
  { cr: "1+0", total: 25,  midTheory: 5, finalTheory: 20, midPrac: 0, finalPrac: 0, passing: 13, hasOspe: false, label: "1+0 (25 Marks • 1 Theory + 0 OSPE)" },
  { cr: "6", total: 150,   midTheory: 30, finalTheory: 120, midPrac: 0, finalPrac: 0, passing: 75, hasOspe: false, label: "6 (150 Marks • Research Project)" },
  { cr: "4", total: 100,   midTheory: 10, finalTheory: 80, midPrac: 10, finalPrac: 0, passing: 50, hasOspe: true, label: "4 (100 Marks • Allied Subject)" },
];

/**
 * Parses credit hours string like "2+1", "1.5+0.5", "3", "4 Cr. Hr." into numeric sum.
 */
export function parseCreditHours(val) {
  if (val === null || val === undefined) return 3;
  if (typeof val === "number") return isNaN(val) ? 0 : val;

  const str = String(val).replace(/cr\.?\s*hr\.?/gi, "").trim();
  if (!str) return 3;

  if (str.includes("+")) {
    const parts = str.split("+").map((p) => parseFloat(p.trim()) || 0);
    const sum = parts.reduce((acc, curr) => acc + curr, 0);
    return Math.round(sum * 10) / 10;
  }

  const num = parseFloat(str);
  return !isNaN(num) ? num : 3;
}

/**
 * Parses subject title for embedded credit hour indicators like "(4 Cr. Hr.)" or "(2+1)"
 */
export function extractCreditHoursFromTitle(title = "") {
  const match = String(title).match(/\((\d+(?:\.\d+)?(?:\s*\+\s*\d+(?:\.\d+)?)?(?:\s*cr\.?\s*hr\.?)?)\)/i);
  if (match && match[1]) {
    return match[1].replace(/cr\.?\s*hr\.?/gi, "").trim();
  }
  return null;
}

/**
 * Official KMU Fractionalized Grading System (KMU Notification #KMU (Reg)/2025/3655):
 * Grade | Grade Point  | Percentage in Semester System
 * A     | 3.67 - 4.00  | 85 and above
 * A-    | 3.34 - 3.66  | 80 - 84
 * B+    | 3.01 - 3.33  | 75 - 79
 * B     | 2.67 - 3.00  | 71 - 74
 * B-    | 2.34 - 2.66  | 68 - 70
 * C+    | 2.01 - 2.33  | 64 - 67
 * C     | 1.67 - 2.00  | 61 - 63
 * C-    | 1.31 - 1.66  | 58 - 60
 * D+    | 1.01 - 1.30  | 54 - 57
 * D     | 0.10 - 1.00  | 50 - 53
 * F     | 0.00         | Below 50 (or below user custom pass percentage)
 */
export function getKmuGradeAndGpa(percentage, passPercentage = 50) {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return { grade: "-", gpa: 0.0, isPassed: false };
  }

  const p = Math.round(percentage * 100) / 100;
  const minPass = Number(passPercentage) || 50;

  if (p < minPass) {
    return { grade: "F", gpa: 0.0, isPassed: false };
  }

  let grade = "D";
  let gpa = 0.1;

  if (p >= 85) {
    grade = "A";
    const ratio = Math.min((p - 85) / 15, 1);
    gpa = 3.67 + ratio * (4.00 - 3.67);
  } else if (p >= 80) {
    grade = "A-";
    const ratio = (p - 80) / 4.99;
    gpa = 3.34 + Math.min(ratio, 1) * (3.66 - 3.34);
  } else if (p >= 75) {
    grade = "B+";
    const ratio = (p - 75) / 4.99;
    gpa = 3.01 + Math.min(ratio, 1) * (3.33 - 3.01);
  } else if (p >= 71) {
    grade = "B";
    const ratio = (p - 71) / 3.99;
    gpa = 2.67 + Math.min(ratio, 1) * (3.00 - 2.67);
  } else if (p >= 68) {
    grade = "B-";
    const ratio = (p - 68) / 2.99;
    gpa = 2.34 + Math.min(ratio, 1) * (2.66 - 2.34);
  } else if (p >= 64) {
    grade = "C+";
    const ratio = (p - 64) / 3.99;
    gpa = 2.01 + Math.min(ratio, 1) * (2.33 - 2.01);
  } else if (p >= 61) {
    grade = "C";
    const ratio = (p - 61) / 2.99;
    gpa = 1.67 + Math.min(ratio, 1) * (2.00 - 1.67);
  } else if (p >= 58) {
    grade = "C-";
    const ratio = (p - 58) / 2.99;
    gpa = 1.31 + Math.min(ratio, 1) * (1.66 - 1.31);
  } else if (p >= 54) {
    grade = "D+";
    const ratio = (p - 54) / 3.99;
    gpa = 1.01 + Math.min(ratio, 1) * (1.30 - 1.01);
  } else if (p >= 50) {
    grade = "D";
    const ratio = (p - 50) / 3.99;
    gpa = 0.10 + Math.min(ratio, 1) * (1.00 - 0.10);
  } else {
    grade = "D";
    gpa = 0.10;
  }

  gpa = Math.round(gpa * 100) / 100;
  return { grade, gpa, isPassed: true };
}

/**
 * Evaluate subject score according to user-configured passing percentage (default 50%, range 45%-85%)
 * and KMU Fractionalized Grading Regulations.
 */
export function evaluateSubjectMarks(obtainedMarks, maxMarks, passPercentage = 50) {
  const minPass = Number(passPercentage) || 50;

  if (
    obtainedMarks === null ||
    obtainedMarks === undefined ||
    isNaN(obtainedMarks) ||
    maxMarks <= 0
  ) {
    return {
      isPassed: false,
      grade: "-",
      gpa: 0.0,
      percentage: null,
      passingMarks: Math.ceil(maxMarks * (minPass / 100)),
    };
  }

  const percentage = (obtainedMarks / maxMarks) * 100;
  const roundedPercentage = Math.round(percentage * 10) / 10;
  const passingMarks = Math.ceil(maxMarks * (minPass / 100));

  const { grade, gpa, isPassed } = getKmuGradeAndGpa(roundedPercentage, minPass);

  return {
    isPassed,
    grade,
    gpa,
    percentage: roundedPercentage,
    passingMarks,
  };
}

/**
 * Calculates Semester GPA weighted by credit hours:
 * Semester GPA = sum(Subject GP * Credit Hours) / sum(Credit Hours)
 */
export function calculateSemesterGpa(subjectRows = []) {
  let totalGradePoints = 0;
  let totalCredits = 0;

  subjectRows.forEach((row) => {
    if (row.isNA) return;
    const cr = parseCreditHours(row.creditHours);
    const gpa = Number(row.gpa) || 0;
    if (cr > 0) {
      totalCredits += cr;
      totalGradePoints += gpa * cr;
    }
  });

  if (totalCredits <= 0) return 0.0;
  const calculated = totalGradePoints / totalCredits;
  return Math.round(calculated * 100) / 100;
}

/**
 * Overall letter grade based on Semester GPA per KMU official scale
 */
export function getOverallGradeFromGpa(gpa, isPassedOverall) {
  if (!isPassedOverall || gpa < 0.10) return "F";
  if (gpa >= 3.67) return "A";
  if (gpa >= 3.34) return "A-";
  if (gpa >= 3.01) return "B+";
  if (gpa >= 2.67) return "B";
  if (gpa >= 2.34) return "B-";
  if (gpa >= 2.01) return "C+";
  if (gpa >= 1.67) return "C";
  if (gpa >= 1.31) return "C-";
  if (gpa >= 1.01) return "D+";
  if (gpa >= 0.10) return "D";
  return "F";
}
