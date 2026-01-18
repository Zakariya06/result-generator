/* ================================
   Helpers
================================ */
const normalize = (value = "") => value.toString().trim().toLowerCase();

export const transformExcelData = (rawData, fileName) => {
  if (!rawData || rawData.length < 4) return [];

  const semester = rawData[0]?.["Amal College of Nursing"] || "";
  const examType = rawData[1]?.["Amal College of Nursing"] || "";
  const subjectType = rawData[2]?.["Amal College of Nursing"] || "";
  const institute =
    Object.keys(rawData[0] || {})[0] || "Amal College of Nursing";

  const columnNames = Object.values(rawData[3] || {});

  return rawData.slice(4).map((row) => {
    const values = Object.values(row);
    const student = {};

    columnNames.forEach((col, i) => {
      const key = normalize(col);
      const value = values[i] || "";

      switch (key) {
        case "name":
          student.name = value;
          break;
        case "father name":
        case "father’s name":
          student.fatherName = value;
          break;
        case "registration":
        case "registration no":
        case "registration number":
          student.registration = value;
          break;
        case "roll number":
        case "roll #":
          student.rollNumber = value;
          break;
        case "s.no":
        case "s#":
        case "serial":
          student.serial = value;
          break;
        default:
          student[col] = value;
      }
    });

    student.institute = institute;
    student.semester = semester;
    student.examType = examType;
    student.subjectType = subjectType;
    student.fileName = fileName;

    return student;
  });
};

export const transformStudentListFiles = (allFilesData) => {
  const students = [];

  allFilesData.forEach(({ fileName, data }) => {
    if (!data?.length) return;

    data.forEach((row) => {
      const student = {};
      const subjects = [];

      Object.entries(row).forEach(([key, value]) => {
        if (!value) return;

        const k = normalize(key);

        if (k.includes("subject")) {
          subjects.push(value);
          return;
        }

        switch (k) {
          case "name":
            student.name = value;
            break;
          case "father name":
          case "father’s name":
            student.fatherName = value;
            break;
          case "registration":
          case "registration no":
          case "registration number":
            student.registration = value;
            break;
          case "roll number":
          case "roll #":
            student.rollNumber = value;
            break;
          case "serial":
          case "s#":
            student.serial = value;
            break;
          case "semester":
            student.semester = value;
            break;
          case "institute":
            student.institute = value;
            break;
          default:
            student[key] = value;
        }
      });

      if (subjects.length) student.subjects = subjects;
      student.fileName = fileName;

      students.push(student);
    });
  });

  return students;
};

export const mergeFileData = (file1Data, file2Data) => {
  const map = new Map();

  file2Data.forEach((s) => {
    if (s.registration) {
      map.set(normalize(s.registration), s);
    }
  });

  return file1Data.map((student1) => {
    const regKey = student1.registration
      ? normalize(student1.registration)
      : "";
    const match = regKey ? map.get(regKey) : null;

    if (!match) return student1;

    const rollNumber =
      student1.rollNumber && String(student1.rollNumber).trim()
        ? student1.rollNumber
        : match.rollNumber;

    return {
      ...student1,
      ...match,
      rollNumber,
      subjects: [
        ...new Set([...(student1.subjects || []), ...(match.subjects || [])]),
      ],
    };
  });
};
