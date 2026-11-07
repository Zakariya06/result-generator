/* ================================
   Helpers
=============================== */

const normalize = (value = "") => value.toString().trim().toLowerCase();

// Same RA detection used in SheetTable — kept in one place so both files agree.
const isReAppearRoll = (rollNumber) =>
  String(rollNumber || "")
    .toUpperCase()
    .includes("RA");

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
          subjects.push({
            subject: value, // subject name/value
            mid: "",
            final: "",
          });
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
          case "status":
            student.status = value;
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

// mergeFileData
export const mergeFileData = (file1Data, file2Data) => {
  const map = new Map();

  // Build a composite key from registration + name + fatherName
  const makeKey = (s) => {
    if (!s) return "";
    return [
      normalize(s.registration),
      normalize(s.name),
      normalize(s.fatherName),
    ].join("|");
  };

  file2Data.forEach((s) => {
    if (s.registration && s.name && s.fatherName) {
      map.set(makeKey(s), s);
    }
  });

  return file1Data.map((student1) => {
    if (!student1.registration || !student1.name || !student1.fatherName) {
      return student1;
    }

    const key = makeKey(student1);
    const match = map.get(key);

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

export const ensureSubjectEntries = (studentsData, subjectsConfig) => {
  if (!subjectsConfig?.length) return studentsData;

  const norm = (v) =>
    String(v ?? "")
      .trim()
      .toLowerCase();

  return (studentsData || []).map((student) => {
    if (isReAppearRoll(student.rollNumber)) return student;

    let existing = Array.isArray(student.subjects) ? [...student.subjects] : [];

    subjectsConfig.forEach((cfg) => {
      const baseName = String(cfg.subject || "").trim();
      if (!baseName) return;

      const baseNorm = norm(baseName);
      const ospeName = `${baseName} - OSPE`;
      const ospeNorm = norm(ospeName);
      const ospePlusNorm = norm(`${baseName} + OSPE`);

      if (cfg.ospe && cfg.ospeType === "combined") {
        // COMBINED OSPE:
        // Must only have single combined entry "${baseName} - OSPE"
        const theoryIdx = existing.findIndex((s) => {
          const n = norm(s?.subject ?? s?.label ?? s?.name ?? "");
          return n === baseNorm;
        });

        const ospeIdx = existing.findIndex((s) => {
          const n = norm(s?.subject ?? s?.label ?? s?.name ?? "");
          return n === ospeNorm || n === ospePlusNorm;
        });

        if (theoryIdx !== -1 && ospeIdx !== -1) {
          // Merge theory into ospe entry and remove separated theory
          const tSub = existing[theoryIdx];
          const oSub = existing[ospeIdx];
          existing[ospeIdx] = {
            ...oSub,
            subject: ospeName,
            mid: oSub.mid || tSub.mid || "",
            final: oSub.final || tSub.final || "",
          };
          existing.splice(theoryIdx, 1);
        } else if (theoryIdx !== -1 && ospeIdx === -1) {
          // Convert theory into combined ospeName
          existing[theoryIdx] = {
            ...existing[theoryIdx],
            subject: ospeName,
          };
        } else if (theoryIdx === -1 && ospeIdx !== -1) {
          existing[ospeIdx].subject = ospeName;
        } else {
          // Neither existed, add combined
          existing.push({ subject: ospeName, mid: "", final: "" });
        }
      } else {
        // SEPARATED OSPE OR THEORY ONLY
        const hasBase = existing.some((s) => {
          const n = norm(s?.subject ?? s?.label ?? s?.name ?? "");
          return n === baseNorm;
        });
        if (!hasBase) {
          existing.push({ subject: baseName, mid: "", final: "" });
        }

        if (cfg.ospe) {
          const hasOspe = existing.some((s) => {
            const n = norm(s?.subject ?? s?.label ?? s?.name ?? "");
            return n === ospeNorm || n === ospePlusNorm;
          });
          if (!hasOspe) {
            existing.push({ subject: ospeName, mid: "", final: "" });
          }
        }
      }
    });

    return { ...student, subjects: existing };
  });
};
