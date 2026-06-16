export function formatMidMarks(filesData) {
  const allStudents = [];

  filesData.forEach((sheet) => {
    if (!Array.isArray(sheet) || sheet.length < 5) return;

    // ── Identify header rows ──────────────────────────────────────────────
    // row index 1 → subject names row  (SheetJS __rowNum__ 3 → array index 1)
    // row index 2 → mark-type row      (SheetJS __rowNum__ 4 → array index 2)
    const subjectNamesRow = sheet[1]; // { "Khyber Medical...": "S#", __EMPTY: "Roll #", … , __EMPTY_7: "Medicine II", … }
    const markTypeRow = sheet[2]; // { …, __EMPTY_7: "Mid", __EMPTY_8: "Mid", … }

    const keys = Object.keys(subjectNamesRow); // ordered list of keys
    const subjectNames = Object.values(subjectNamesRow); // parallel values
    const markTypes = Object.values(markTypeRow); // parallel mark-type labels

    // Collect the key-index pairs whose mark-type is "mid"
    // (use the key so we can pull the same key from each student row)
    const midColumns = []; // [{ key, subjectName }]
    markTypes.forEach((type, idx) => {
      if (String(type).trim().toLowerCase() === "mid") {
        const subjectName = String(subjectNames[idx] || "").trim();
        if (subjectName) {
          midColumns.push({ key: keys[idx], subjectName });
        }
      }
    });

    if (midColumns.length === 0) return; // nothing to do for this sheet

    // ── Parse student rows (everything after index 2) ────────────────────
    const studentRows = sheet.slice(2); // rows[0] = first student
    studentRows.forEach((row) => {
      const vals = Object.values(row);
      const keys2 = Object.keys(row);

      // Identify the fixed positional columns by their index in the key list
      // S#=0, Roll#=1, Name=2, FatherName=3, Registration=4,
      // Discipline=5, RegularReappear=6, Institute=7
      const rollNo = String(vals[1] || "").trim();
      const name = String(vals[2] || "").trim();
      const fatherName = String(vals[3] || "").trim();
      const registration = String(vals[4] || "").trim();
      const institute = String(vals[7] || "").trim();

      // Skip header/empty rows
      if (!rollNo || !name || isNaN(Number(vals[0]))) return;

      // Build midMarks map: subjectName → mark value
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

  // ── Build lookup maps from uploaded mid-marks data ────────────────────
  // Primary:   rollNo  (digits only, to handle any prefix/suffix differences)
  // Secondary: registration
  const byRollNo = new Map(); // "2685001" → student
  const byRegistration = new Map(); // "2021/kmu/kihsst/dpt/1" → student

  uploadedData.forEach((s) => {
    const roll = norm(s.rollNo).replace(/\D/g, ""); // digits only
    if (roll) byRollNo.set(roll, s);

    const reg = norm(s.registration);
    if (reg) byRegistration.set(reg, s);
  });

  // ── Helper: find uploaded student for a base student ─────────────────
  const findUploaded = (student) => {
    const roll = norm(student.rollNumber).replace(/\D/g, "");
    if (roll && byRollNo.has(roll)) return byRollNo.get(roll);

    const reg = norm(student.registration);
    if (reg && byRegistration.has(reg)) return byRegistration.get(reg);

    return null;
  };

  // ── Merge ─────────────────────────────────────────────────────────────
  return baseData.map((student) => {
    const uploaded = findUploaded(student);

    if (!uploaded || !uploaded.midMarks) {
      // No match found — return student unchanged
      return student;
    }

    // Build a normalised lookup for the uploaded subject names
    const uploadedMidMap = new Map(
      Object.entries(uploaded.midMarks).map(([subjectName, mark]) => [
        norm(subjectName),
        mark,
      ]),
    );

    // Update only the `mid` field of each matching subject
    const mergedSubjects = (student.subjects || []).map((subj) => {
      // Resolve the subject's display name — support multiple key shapes
      const subjectName = norm(
        subj?.subject ??
          subj?.label ??
          subj?.name ??
          subj?.subjectName ??
          subj?.title ??
          "",
      );

      if (!subjectName) return subj;

      // Try exact match first, then strip trailing " - ospe" variants
      let midValue = uploadedMidMap.get(subjectName);

      if (midValue === undefined) {
        // Attempt a loose match: uploaded key contains the subject name
        for (const [uploadedKey, mark] of uploadedMidMap.entries()) {
          if (
            uploadedKey === subjectName ||
            uploadedKey.startsWith(subjectName)
          ) {
            midValue = mark;
            break;
          }
        }
      }

      if (midValue === undefined) {
        // No matching subject in uploaded data — leave subject unchanged
        return subj;
      }

      // ✅ Only update `mid`, never touch `final` or `total`
      return {
        ...subj,
        mid: midValue !== null ? midValue : subj.mid,
      };
    });

    return {
      ...student,
      subjects: mergedSubjects,
    };
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
