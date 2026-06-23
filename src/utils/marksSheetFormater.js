export function formatMidMarks(filesData) {
  const allStudents = [];

  filesData.forEach((sheet) => {
    if (!Array.isArray(sheet) || sheet.length < 5) return;

    const subjectNamesRow = sheet[1];
    const markTypeRow = sheet[2];

    const keys = Object.keys(subjectNamesRow);
    const subjectNames = Object.values(subjectNamesRow);
    const markTypes = Object.values(markTypeRow);

    const midColumns = [];
    markTypes.forEach((type, idx) => {
      if (String(type).trim().toLowerCase() === "mid") {
        const subjectName = String(subjectNames[idx] || "").trim();

        // 🚫 Skip OSPE columns entirely — handled by the dedicated OSPE uploader
        if (!subjectName || /-\s*ospe\s*$/i.test(subjectName)) return;

        midColumns.push({ key: keys[idx], subjectName });
      }
    });

    if (midColumns.length === 0) return;

    const studentRows = sheet.slice(2);
    studentRows.forEach((row) => {
      const vals = Object.values(row);

      const rollNo = String(vals[1] || "").trim();
      const name = String(vals[2] || "").trim();
      const fatherName = String(vals[3] || "").trim();
      const registration = String(vals[4] || "").trim();
      const institute = String(vals[7] || "").trim();

      if (!rollNo || !name || isNaN(Number(vals[0]))) return;

      const midMarks = {};
      midColumns.forEach(({ key, subjectName }) => {
        const val = row[key];
        midMarks[subjectName] = val !== undefined && val !== "" ? val : null;
      });

      allStudents.push({
        rollNo,
        name,
        fatherName,
        registration,
        institute,
        midMarks,
      });
    });
  });

  return allStudents;
}

export function mergeMidMarksData(baseData, uploadedData) {
  const norm = (v) =>
    String(v ?? "")
      .trim()
      .toLowerCase();
  const isOspeName = (name) => /-\s*ospe\s*$/i.test(name);

  const byRollNo = new Map();
  const byRegistration = new Map();

  uploadedData.forEach((s) => {
    const roll = norm(s.rollNo).replace(/\D/g, "");
    if (roll) byRollNo.set(roll, s);

    const reg = norm(s.registration);
    if (reg) byRegistration.set(reg, s);
  });

  const findUploaded = (student) => {
    const roll = norm(student.rollNumber).replace(/\D/g, "");
    if (roll && byRollNo.has(roll)) return byRollNo.get(roll);

    const reg = norm(student.registration);
    if (reg && byRegistration.has(reg)) return byRegistration.get(reg);

    return null;
  };

  return baseData.map((student) => {
    const uploaded = findUploaded(student);
    if (!uploaded || !uploaded.midMarks) return student;

    const uploadedMidMap = new Map(
      Object.entries(uploaded.midMarks).map(([subjectName, mark]) => [
        norm(subjectName),
        mark,
      ]),
    );

    const mergedSubjects = (student.subjects || []).map((subj) => {
      const subjectName = norm(
        subj?.subject ??
          subj?.label ??
          subj?.name ??
          subj?.subjectName ??
          subj?.title ??
          "",
      );

      if (!subjectName) return subj;

      // 🚫 Hard stop: this uploader never writes OSPE mid marks
      if (isOspeName(subjectName)) return subj;

      // ✅ Exact match only — no more startsWith loose matching,
      // which was the source of OSPE/base subject cross-contamination.
      const midValue = uploadedMidMap.get(subjectName);

      if (midValue === undefined) return subj;

      return {
        ...subj,
        mid: midValue !== null ? midValue : subj.mid,
      };
    });

    return { ...student, subjects: mergedSubjects };
  });
}

export function formatFinalMarks(filesData, selectedSubject) {
  if (!selectedSubject || !String(selectedSubject).trim()) {
    console.warn("formatFinalMarks: no subject selected");
    return [];
  }

  const allStudents = [];
  const norm = (v) => String(v ?? "").trim();

  filesData.forEach((sheet) => {
    if (!Array.isArray(sheet) || !sheet.length) return;

    sheet.forEach((row) => {
      // Support both direct-row format (KMU HIS style) and header-offset format
      const rollNo = norm(
        row["EvalRollNo"] ??
          row["Roll No"] ??
          row["Roll #"] ??
          row["roll number"] ??
          "",
      );
      const name = norm(
        row["FullName"] ?? row["UserName"] ?? row["Name"] ?? row["name"] ?? "",
      );
      const fatherName = norm(
        row["FatherName"] ?? row["Father Name"] ?? row["father name"] ?? "",
      );
      // "Corrected" = marks obtained; fall back to common alternatives
      const finalMark =
        row["Corrected"] ??
        row["Marks"] ??
        row["Final"] ??
        row["obtained"] ??
        null;

      // Skip completely empty or header rows
      if (!rollNo && !name) return;
      if (isNaN(Number(String(rollNo).replace(/\D/g, ""))) && !name) return;

      allStudents.push({
        rollNo,
        name,
        fatherName,
        subjectName: String(selectedSubject).trim(),
        finalMark: finalMark !== null && finalMark !== "" ? finalMark : null,
      });
    });
  });

  return allStudents;
}

export function mergeFinalMarksData(baseData, uploadedData, selectedSubject) {
  const norm = (v) =>
    String(v ?? "")
      .trim()
      .toLowerCase();

  const normSubject = (v) => norm(v).replace(/\s+/g, " ");

  const targetSubject = normSubject(selectedSubject);

  // ── Build lookup maps from uploaded data ──────────────────────────────
  const byRollNo = new Map(); // digits-only roll → uploaded row
  const byName = new Map(); // normalised full-name → uploaded row (fallback)

  uploadedData.forEach((s) => {
    const roll = norm(s.rollNo).replace(/\D/g, "");
    if (roll) byRollNo.set(roll, s);

    const name = norm(s.name);
    if (name) byName.set(name, s);
  });

  // ── Helper: find uploaded row for a base student ──────────────────────
  const findUploaded = (student) => {
    const roll = norm(student.rollNumber ?? "").replace(/\D/g, "");
    if (roll && byRollNo.has(roll)) return byRollNo.get(roll);

    const reg = norm(student.registration ?? "").replace(/\D/g, "");
    if (reg && byRollNo.has(reg)) return byRollNo.get(reg);

    const name = norm(student.name ?? "");
    if (name && byName.has(name)) return byName.get(name);

    return null;
  };

  let noMatchCount = 0; // students with no uploaded data row
  let subjectNotFoundCount = 0; // students where subject wasn't in their list

  const merged = baseData.map((student) => {
    const uploaded = findUploaded(student);

    if (!uploaded) {
      noMatchCount++;
      return student; // no uploaded row — leave unchanged
    }

    // Check if this student has the target subject in their subjects list
    const subjects = student.subjects || [];
    const subjectIndex = subjects.findIndex((subj) => {
      const subjectName = normSubject(
        subj?.subject ??
          subj?.label ??
          subj?.name ??
          subj?.subjectName ??
          subj?.title ??
          "",
      );
      // Exact match first, then prefix/contains match
      return (
        subjectName === targetSubject ||
        subjectName.startsWith(targetSubject) ||
        targetSubject.startsWith(subjectName)
      );
    });

    if (subjectIndex === -1) {
      subjectNotFoundCount++;
      return student; // subject not in this student's list — leave unchanged
    }

    // ✅ Only update `final` for the matched subject
    const updatedSubjects = subjects.map((subj, idx) => {
      if (idx !== subjectIndex) return subj;
      return {
        ...subj,
        final:
          uploaded.finalMark !== null && uploaded.finalMark !== undefined
            ? uploaded.finalMark
            : subj.final,
      };
    });

    return {
      ...student,
      subjects: updatedSubjects,
    };
  });

  return { merged, noMatchCount, subjectNotFoundCount };
}

export function formatFinalMarksPhysical(
  filesData,
  selectedSubject,
  { isOspe = false } = {},
) {
  if (!selectedSubject || !String(selectedSubject).trim()) {
    console.warn("formatFinalMarksPhysical: no subject selected");
    return [];
  }

  const norm = (v) => String(v ?? "").trim();
  const allStudents = [];

  filesData.forEach((sheet) => {
    if (!Array.isArray(sheet) || !sheet.length) return;

    sheet.forEach((row) => {
      const rollNo = norm(
        row["Roll No"] ??
          row["Roll #"] ??
          row["RollNumber"] ??
          row["roll number"] ??
          "",
      );
      const name = norm(
        row["Name"] ?? row["Student Name"] ?? row["name"] ?? "",
      );
      const fatherName = norm(row["Father Name"] ?? row["Father's Name"] ?? "");
      const marks =
        row["Marks"] ??
        row["Obtained"] ??
        row["Total Marks"] ??
        row["OSPE Marks"] ??
        null;

      if (!rollNo && !name) return;

      allStudents.push({
        rollNo,
        name,
        fatherName,
        subjectName: isOspe
          ? `${String(selectedSubject).trim()} - OSPE`
          : String(selectedSubject).trim(),
        finalMark: marks !== null && marks !== "" ? marks : null,
      });
    });
  });

  return allStudents;
}

export function formatFinalMarksOnlineOspe(filesData, selectedSubject) {
  return formatFinalMarks(
    filesData,
    `${String(selectedSubject).trim()} - OSPE`,
  );
}
