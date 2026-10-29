/**
 * KMU Credit Hours Scheme and Grading Regulations
 * Based on official KMU Notifications & Allied Health Sciences Weightage Charts
 */

// Official weightage table from KMU Marks Distribution Table
export const KMU_CREDIT_HOUR_SCHEME = [
  { cr: "0+5", total: 125, midTheory: 0, midPrac: 25, midResearch: 0, finalPrac: 100, finalTheory: 0, finalResearch: 0, passing: 63, label: "0 Theory + 5 Practical/Clinical" },
  { cr: "4+0", total: 100, midTheory: 20, midPrac: 0, midResearch: 0, finalPrac: 0, finalTheory: 80, finalResearch: 0, passing: 50, label: "4 Theory + 0 Practical" },
  { cr: "0+4", total: 100, midTheory: 0, midPrac: 20, midResearch: 0, finalPrac: 80, finalTheory: 0, finalResearch: 0, passing: 50, label: "0 Theory + 4 Practical" },
  { cr: "3+1", total: 100, midTheory: 15, midPrac: 5, midResearch: 0, finalPrac: 20, finalTheory: 60, finalResearch: 0, passing: 50, label: "3 Theory + 1 Practical" },
  { cr: "1+3", total: 100, midTheory: 5, midPrac: 15, midResearch: 0, finalPrac: 20, finalTheory: 60, finalResearch: 0, passing: 50, label: "1 Theory + 3 Practical" },
  { cr: "2+2", total: 100, midTheory: 10, midPrac: 10, midResearch: 0, finalPrac: 40, finalTheory: 40, finalResearch: 0, passing: 50, label: "2 Theory + 2 Practical" },
  { cr: "3+0", total: 75,  midTheory: 15, midPrac: 0, midResearch: 0, finalPrac: 0, finalTheory: 60, finalResearch: 0, passing: 38, label: "3 Theory + 0 Practical" },
  { cr: "0+3", total: 75,  midTheory: 0, midPrac: 15, midResearch: 0, finalPrac: 60, finalTheory: 0, finalResearch: 0, passing: 38, label: "0 Theory + 3 Practical" },
  { cr: "2+1", total: 75,  midTheory: 10, midPrac: 5, midResearch: 0, finalPrac: 20, finalTheory: 40, finalResearch: 0, passing: 38, label: "2 Theory + 1 Practical" },
  { cr: "1.5+1.5", total: 75, midTheory: 7, midPrac: 8, midResearch: 0, finalPrac: 30, finalTheory: 30, finalResearch: 0, passing: 38, label: "1.5 Theory + 1.5 Practical" },
  { cr: "2+0", total: 50,  midTheory: 10, midPrac: 0, midResearch: 0, finalPrac: 0, finalTheory: 40, finalResearch: 0, passing: 25, label: "2 Theory + 0 Practical" },
  { cr: "1+1", total: 50,  midTheory: 5, midPrac: 5, midResearch: 0, finalPrac: 20, finalTheory: 20, finalResearch: 0, passing: 25, label: "1 Theory + 1 Practical" },
  { cr: "1.5+0.5", total: 50, midTheory: 7, midPrac: 3, midResearch: 0, finalPrac: 10, finalTheory: 30, finalResearch: 0, passing: 25, label: "1.5 Theory + 0.5 Practical" },
  { cr: "2.5+0.5", total: 75, midTheory: 12, midPrac: 3, midResearch: 0, finalPrac: 10, finalTheory: 50, finalResearch: 0, passing: 38, label: "2.5 Theory + 0.5 Practical" },
  { cr: "1+0", total: 25,  midTheory: 5, midPrac: 0, midResearch: 0, finalPrac: 0, finalTheory: 20, finalResearch: 0, passing: 13, label: "1 Theory + 0 Practical" },
  { cr: "6", total: 150,   midTheory: 0, midPrac: 0, midResearch: 30, finalPrac: 0, finalTheory: 0, finalResearch: 120, passing: 75, label: "6 Cr. Hr. Research Project" },
  { cr: "4", total: 100,   midTheory: 10, midPrac: 10, midResearch: 0, finalPrac: 0, finalTheory: 80, finalResearch: 0, passing: 50, label: "4 Cr. Hr. Allied Subject" },
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
 * Evaluate subject score according to user-specified passing rules:
 * - When maximum marks are 100: passing requires >= 60. Under 60 is Fail.
 * - When maximum marks are < 100: passing requires >= 50% of maximum marks.
 * - When maximum marks are > 100: passing requires >= 50% of maximum marks.
 *
 * Subject GPA & Letter Grade mapping is based on KMU Fractionalized Grading:
 * - 85+ %: A (4.00)
 * - 80-84%: A- (3.70)
 * - 75-79%: B+ (3.50)
 * - 70-74%: B (3.00)
 * - 64-69%: C+ (2.50)
 * - 60-63%: C (2.00)
 * - 54-59%: D+ (1.30) (if passing threshold met)
 * - 50-53%: D (1.00) (if passing threshold met)
 * - Below passing threshold: F (0.00)
 */
export function evaluateSubjectMarks(obtainedMarks, maxMarks) {
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
      passingMarks: maxMarks === 100 ? 60 : Math.round(maxMarks * 0.5),
    };
  }

  const percentage = (obtainedMarks / maxMarks) * 100;
  const roundedPercentage = Math.round(percentage * 10) / 10;

  // Passing rules:
  // 1. If maxMarks === 100: >= 60 is passing, < 60 is fail
  // 2. If maxMarks !== 100: >= 50% of maxMarks is passing, < 50% is fail
  let isPassed = false;
  let passingMarks = 0;

  if (maxMarks === 100) {
    passingMarks = 60;
    isPassed = obtainedMarks >= 60;
  } else {
    passingMarks = Math.ceil(maxMarks * 0.5);
    isPassed = obtainedMarks >= maxMarks * 0.5;
  }

  if (!isPassed) {
    return {
      isPassed: false,
      grade: "F",
      gpa: 0.0,
      percentage: roundedPercentage,
      passingMarks,
    };
  }

  // Fractionalized KMU grading for passing marks:
  let grade = "C";
  let gpa = 2.0;

  if (percentage >= 90) {
    grade = "A+";
    gpa = 4.0;
  } else if (percentage >= 80) {
    grade = "A";
    gpa = 4.0;
  } else if (percentage >= 75) {
    grade = "B+";
    gpa = 3.5;
  } else if (percentage >= 70) {
    grade = "B";
    gpa = 3.0;
  } else if (percentage >= 64) {
    grade = "C+";
    gpa = 2.5;
  } else if (percentage >= 60) {
    grade = "C";
    gpa = 2.0;
  } else if (percentage >= 54) {
    grade = "D+";
    gpa = 1.3;
  } else if (percentage >= 50) {
    grade = "D";
    gpa = 1.0;
  }

  return {
    isPassed: true,
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
 * Overall letter grade based on Semester GPA
 */
export function getOverallGradeFromGpa(gpa, isPassedOverall) {
  if (!isPassedOverall || gpa < 1.0) return "F";
  if (gpa >= 3.67) return "A";
  if (gpa >= 3.33) return "A-";
  if (gpa >= 3.0) return "B+";
  if (gpa >= 2.67) return "B";
  if (gpa >= 2.33) return "B-";
  if (gpa >= 2.0) return "C+";
  if (gpa >= 1.67) return "C";
  if (gpa >= 1.0) return "D";
  return "F";
}
