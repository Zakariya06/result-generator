export function formatMidMarks(filesData) {
    const allStudents = [];
  
    filesData.forEach((sheet) => {
      if (!Array.isArray(sheet) || sheet.length < 4) return;
  
      const subjectNamesRow = sheet[1]; // row with subject titles
      const marksTypeRow = sheet[2];    // row with Mid/Final/Total
      const studentsRows = sheet.slice(3);
  
      const subjectHeaders = Object.values(subjectNamesRow);
      const marksTypes = Object.values(marksTypeRow);
  
      // Detect all MID columns
      const subjectIndexes = [];
      marksTypes.forEach((type, index) => {
        if (String(type).toLowerCase() === "mid") {
          subjectIndexes.push(index);
        }
      });
  
      studentsRows.forEach((row) => {
        const values = Object.values(row);
  
        if (!values[1] || !values[2]) return;
  
        const student = {
          rollNo: values[1],
          name: values[2],
          fatherName: values[3],
          registration: values[4],
          papers: {},
        };
  
        subjectIndexes.forEach((midIndex) => {
          const subjectName =
            subjectHeaders[midIndex]?.trim() || `Subject-${midIndex}`;
  
          const finalIndex = midIndex + 1;
          const totalIndex = midIndex + 2;
  
          const paperKey = `Paper-${Math.floor(midIndex / 3) + 1}`;
  
          if (!student.papers[paperKey]) {
            student.papers[paperKey] = {};
          }
  
          student.papers[paperKey][subjectName] = {
            mid: values[midIndex] ?? null,
            final: values[finalIndex] ?? null,
            total: values[totalIndex] ?? null,
          };
        });
  
        allStudents.push(student);
      });
    });
  
    return allStudents;
}


export const mergeMidMarksData = (baseData, uploadedData) => {
    const normalize = (v) => String(v || "").trim().toLowerCase();
  
    const makeKey = (s) =>
      [
        normalize(s.registration),
        normalize(s.name),
        normalize(s.fatherName),
      ].join("|");
  
    // ---------- Build lookup map from uploaded ----------
    const uploadedMap = new Map();
  
    uploadedData.forEach((student) => {
      uploadedMap.set(makeKey(student), student);
    });
  
    // ---------- Merge ----------
    return baseData.map((student) => {
      const uploadedStudent = uploadedMap.get(makeKey(student));
  
      // if no uploaded match → return subjects with NA
      if (!uploadedStudent) {
        return {
          ...student,
          subjects: (student.subjects || []).map((s) => ({
            ...s,
            mid: s.mid || "-",
            final: s.final || "-",
            total: s.total || "-",
          })),
        };
      }
  
      // ---------- Flatten uploaded papers into subject → marks ----------
      const subjectMarksMap = new Map();
  
      Object.values(uploadedStudent.papers || {}).forEach((paper) => {
        Object.entries(paper).forEach(([subjectName, marks]) => {
          subjectMarksMap.set(normalize(subjectName), marks);
        });
      });
  
      // ---------- Fill marks into base subjects ----------
      const mergedSubjects = (student.subjects || []).map((subj) => {
        const marks = subjectMarksMap.get(normalize(subj.subject));
  
        return {
          ...subj,
          mid: marks?.mid ?? "-",
          final: marks?.final ?? "-",
          total: marks?.total ?? "-",
        };
      });
  
      return {
        ...student,
        subjects: mergedSubjects,
      };
    });
  };
  
  
  