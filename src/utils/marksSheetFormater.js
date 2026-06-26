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

        if (!subjectName) return;

        // ✅ OSPE mid columns are now included too — matching is exact-name
        // based (see mergeMidMarksData), so there's no risk of cross-contamination
        // with the base subject's marks anymore.
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

      // ✅ Exact match only — works for both plain subjects and
      // "<Subject> - OSPE" entries, since uploadedMidMap keys are the exact
      // normalized subject names straight from the sheet's header row. No
      // cross-contamination risk because the keys are distinct strings.
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
      // Normalize all keys to lower-case for easier matching
      const rowKeys = Object.keys(row);
      const lowerKeys = rowKeys.map((k) => k.toLowerCase());

      // ---- Find Roll Number column ----
      let rollKey = null;
      // 1. exact match: "Roll Number"
      if (rowKeys.includes("Roll Number")) {
        rollKey = "Roll Number";
      } else {
        // 2. fallback: look for key containing "roll" and "number" or just "roll"
        const idx = lowerKeys.findIndex(
          (k) =>
            k.includes("roll") &&
            (k.includes("number") || k.includes("no") || k.includes("#")),
        );
        if (idx !== -1) rollKey = rowKeys[idx];
      }

      // ---- Find Total Score column ----
      let totalKey = null;
      // 1. exact match: "Total Score"
      if (rowKeys.includes("Total Score")) {
        totalKey = "Total Score";
      } else {
        // 2. fallback: look for key containing "total" and "score" or just "total"
        const idx = lowerKeys.findIndex(
          (k) =>
            k.includes("total") &&
            (k.includes("score") ||
              k.includes("marks") ||
              k.includes("obtained")),
        );
        if (idx !== -1) totalKey = rowKeys[idx];
      }

      // If we can't find both, skip this row
      if (!rollKey || !totalKey) {
        // Optionally log a warning for debugging
        // console.warn("Skipping row: missing roll or total column", row);
        return;
      }

      const rollNo = norm(row[rollKey]);
      // We may also have a "Name" column, but it's not guaranteed. We'll try to get it.
      const nameKey = rowKeys.find(
        (k) => /name/i.test(k) && !/father/i.test(k),
      );
      const name = nameKey ? norm(row[nameKey]) : "";
      const fatherKey = rowKeys.find((k) => /father/i.test(k));
      const fatherName = fatherKey ? norm(row[fatherKey]) : "";

      // Skip rows without a valid roll number (non-empty, digits allowed)
      if (!rollNo) return;

      // Extract total score – it might be a number or string; keep as is
      const totalScore = row[totalKey];
      const finalMark =
        totalScore !== undefined && totalScore !== null && totalScore !== ""
          ? totalScore
          : null;

      allStudents.push({
        rollNo,
        name,
        fatherName,
        subjectName: isOspe
          ? `${String(selectedSubject).trim()} - OSPE`
          : String(selectedSubject).trim(),
        finalMark,
      });
    });
  });

  return allStudents;
}

// ── OSPE final marks (online sheets, e.g. KMU HIS Swat export) ──────────
export function formatFinalMarksOnlineOspe(filesData, selectedSubject) {
  if (!selectedSubject || !String(selectedSubject).trim()) {
    console.warn("formatFinalMarksOnlineOspe: no subject selected");
    return [];
  }

  const norm = (v) => String(v ?? "").trim();
  const allStudents = [];

  filesData.forEach((sheet) => {
    if (!Array.isArray(sheet) || !sheet.length) return;

    // ── Find the header row dynamically (don't assume a fixed index) ──
    const headerRowIndex = sheet.findIndex((row) => {
      const vals = Object.values(row).map((v) => String(v ?? "").toLowerCase());
      const hasRoll = vals.some((v) => /roll/.test(v));
      const hasName = vals.some((v) => /name/.test(v));
      const hasTotal = vals.some((v) => /total/.test(v));
      return hasRoll && hasName && hasTotal;
    });

    if (headerRowIndex === -1) {
      console.warn(
        "formatFinalMarksOnlineOspe: header row not found in sheet, skipping",
      );
      return;
    }

    const headerRow = sheet[headerRowIndex];
    const headerEntries = Object.entries(headerRow); // [key, label]

    const findKey = (matcher) => {
      const entry = headerEntries.find(([, label]) =>
        matcher(String(label ?? "").toLowerCase()),
      );
      return entry ? entry[0] : null;
    };

    const rollKey = findKey((l) => /roll/.test(l));
    const nameKey = findKey((l) => /name/.test(l) && !/father/.test(l));
    const fatherKey = findKey((l) => /father/.test(l));
    const regKey = findKey((l) => /registration/.test(l));
    // Prefer a column explicitly called "total marks"; fall back to anything with "total"
    const totalKey =
      findKey((l) => /total.*marks/.test(l)) || findKey((l) => /total/.test(l));

    if (!rollKey && !nameKey) return; // can't identify students in this sheet
    if (!totalKey) {
      console.warn(
        "formatFinalMarksOnlineOspe: total marks column not found, skipping sheet",
      );
      return;
    }

    const dataRows = sheet.slice(headerRowIndex + 1);

    dataRows.forEach((row) => {
      const rollNo = norm(rollKey ? row[rollKey] : "");
      const name = norm(nameKey ? row[nameKey] : "");
      const fatherName = norm(fatherKey ? row[fatherKey] : "");
      const registration = norm(regKey ? row[regKey] : "");
      const totalRaw = totalKey ? row[totalKey] : null;

      if (!rollNo && !name) return; // skip blank/footer rows

      allStudents.push({
        rollNo,
        name,
        fatherName,
        registration,
        subjectName: `${String(selectedSubject).trim()} - OSPE`,
        finalMark:
          totalRaw !== undefined && totalRaw !== null && totalRaw !== ""
            ? totalRaw
            : null,
      });
    });
  });

  return allStudents;
}

// ── Generic merge for final marks (handles BOTH plain and OSPE targets) ──
export function mergeFinalMarksData(baseData, uploadedData, selectedSubject) {
  const norm = (v) =>
    String(v ?? "")
      .trim()
      .toLowerCase();

  const normSubject = (v) => norm(v).replace(/\s+/g, " ");
  const targetSubject = normSubject(selectedSubject);
  const isOspeTarget = /-\s*ospe\s*$/i.test(targetSubject);

  // ── Build lookup maps from uploaded data ──────────────────────────────
  const byRollNo = new Map(); // digits-only roll → uploaded row
  const byRegistration = new Map(); // digits-only registration → uploaded row
  const byNameFather = new Map(); // "name|fatherName" → uploaded row
  const byName = new Map(); // normalised full-name → uploaded row (last fallback)

  uploadedData.forEach((s) => {
    const roll = norm(s.rollNo).replace(/\D/g, "");
    if (roll) byRollNo.set(roll, s);

    const reg = norm(s.registration).replace(/\D/g, "");
    if (reg) byRegistration.set(reg, s);

    const name = norm(s.name);
    const father = norm(s.fatherName);
    if (name && father) byNameFather.set(`${name}|${father}`, s);
    if (name) byName.set(name, s);
  });

  // ── Helper: find uploaded row for a base student ──────────────────────
  const findUploaded = (student) => {
    const roll = norm(student.rollNumber ?? "").replace(/\D/g, "");
    if (roll && byRollNo.has(roll)) return byRollNo.get(roll);

    const reg = norm(student.registration ?? "").replace(/\D/g, "");
    if (reg && byRegistration.has(reg)) return byRegistration.get(reg);

    const name = norm(student.name ?? "");
    const father = norm(student.fatherName ?? "");
    if (name && father && byNameFather.has(`${name}|${father}`)) {
      return byNameFather.get(`${name}|${father}`);
    }

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
      if (!subjectName) return false;

      const subjectIsOspe = /-\s*ospe\s*$/i.test(subjectName);

      // 🚫 CRITICAL FIX: never cross the OSPE <-> non-OSPE boundary.
      // This is what was causing OSPE uploads to overwrite the plain subject's final.
      if (isOspeTarget !== subjectIsOspe) return false;

      // Exact match first, then prefix/contains match (now safe — both sides
      // are guaranteed to be on the same OSPE/non-OSPE side already)
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