export function formatMidMarks(filesData) {
  const allStudents = [];

  console.group("📥 formatMidMarks: Parsing uploaded Mid Marks files");
  console.log("Raw filesData received:", filesData);

  filesData.forEach((sheet, sheetIdx) => {
    if (!Array.isArray(sheet) || sheet.length < 3) {
      console.warn(`Sheet #${sheetIdx} is invalid or has fewer than 3 rows:`, sheet);
      return;
    }

    // 1. Identify which rows contain subject names, mark type (mid), and where student data begins
    let subjectNamesRowIndex = -1;
    let markTypeRowIndex = -1;
    let dataStartIndex = -1;

    for (let r = 0; r < Math.min(sheet.length, 10); r++) {
      const rowVals = Object.values(sheet[r] || {}).map((v) =>
        String(v ?? "").trim().toLowerCase()
      );
      if (rowVals.includes("mid")) {
        markTypeRowIndex = r;
        break;
      }
    }

    if (markTypeRowIndex !== -1) {
      // Typically subject names are on the row above markType row
      subjectNamesRowIndex = Math.max(0, markTypeRowIndex - 1);
      dataStartIndex = markTypeRowIndex + 1;
    } else {
      // Fallback: check standard template (Row index 1 = Subject names, Row index 2 = Mid/Final/Total)
      subjectNamesRowIndex = 1;
      markTypeRowIndex = 2;
      dataStartIndex = 3;
    }

    const subjectNamesRow = sheet[subjectNamesRowIndex] || {};
    const markTypeRow = sheet[markTypeRowIndex] || {};

    const keys = Object.keys(subjectNamesRow);
    const subjectNames = Object.values(subjectNamesRow);
    const markTypes = Object.values(markTypeRow);

    console.log(`Sheet #${sheetIdx}: Detected header at rows [Subject: ${subjectNamesRowIndex}, MarkType: ${markTypeRowIndex}]`);
    console.log("Subject names row values:", subjectNames);
    console.log("Mark types row values:", markTypes);

    const midColumns = [];
    markTypes.forEach((type, idx) => {
      const typeStr = String(type ?? "").trim().toLowerCase();
      if (typeStr === "mid" || typeStr.includes("mid")) {
        // If subject name is in this column or previous merged column
        let subjectName = String(subjectNames[idx] || "").trim();
        if (!subjectName) {
          // Look backwards for merged headers
          for (let prev = idx - 1; prev >= 0; prev--) {
            if (subjectNames[prev]) {
              subjectName = String(subjectNames[prev]).trim();
              break;
            }
          }
        }

        if (subjectName) {
          midColumns.push({ key: keys[idx], subjectName });
        }
      }
    });

    console.log(`Sheet #${sheetIdx} detected mid columns:`, midColumns);

    if (midColumns.length === 0) {
      console.warn(`Sheet #${sheetIdx} has no 'mid' columns found.`);
      return;
    }

    const studentRows = sheet.slice(dataStartIndex);
    console.log(`Sheet #${sheetIdx} processing ${studentRows.length} data rows`);

    studentRows.forEach((row, rowIdx) => {
      const vals = Object.values(row);

      // Support varied column mappings (Roll No, Name, Registration, etc.)
      // First try standard keys
      let rollNo =
        row["Roll No"] ??
        row["Roll #"] ??
        row["roll number"] ??
        row["RollNo"] ??
        vals[1] ??
        "";
      let name =
        row["Name"] ??
        row["Student Name"] ??
        row["name"] ??
        vals[2] ??
        "";
      let fatherName =
        row["Father Name"] ??
        row["Father's Name"] ??
        row["father name"] ??
        vals[3] ??
        "";
      let registration =
        row["Registration"] ??
        row["Reg #"] ??
        row["Reg No"] ??
        row["registration"] ??
        vals[4] ??
        "";
      let institute =
        row["Institute"] ??
        row["institute"] ??
        vals[7] ??
        "";

      rollNo = String(rollNo).trim();
      name = String(name).trim();
      fatherName = String(fatherName).trim();
      registration = String(registration).trim();
      institute = String(institute).trim();

      // Skip header repetitions or empty rows
      if (
        !rollNo ||
        !name ||
        rollNo.toLowerCase() === "roll #" ||
        rollNo.toLowerCase() === "roll no" ||
        name.toLowerCase() === "name"
      ) {
        return;
      }

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

  console.log(`✅ formatMidMarks parsed total ${allStudents.length} student records from Mid file:`, allStudents);
  console.groupEnd();

  return allStudents;
}

export function mergeMidMarksData(baseData, uploadedData) {
  console.group("🔄 mergeMidMarksData: Merging Mid Marks into students");
  console.log("Base student count:", baseData?.length);
  console.log("Uploaded mid records count:", uploadedData?.length);

  const norm = (v) =>
    String(v ?? "")
      .trim()
      .toLowerCase();

  // ── Build lookup maps from uploaded mid data ─────────────────────────
  const byRollNo = new Map();       // digits-only roll → uploaded row
  const byRollExact = new Map();    // exact normalized roll → uploaded row
  const byRegistration = new Map(); // normalized registration → uploaded row
  const byNameFather = new Map();   // "name|fatherName" → uploaded row
  const byName = new Map();         // normalized name → uploaded row

  uploadedData.forEach((s) => {
    const rawRoll = norm(s.rollNo);
    const digitsRoll = rawRoll.replace(/\D/g, "");

    if (digitsRoll) byRollNo.set(digitsRoll, s);
    if (rawRoll) byRollExact.set(rawRoll, s);

    const reg = norm(s.registration);
    if (reg) byRegistration.set(reg, s);

    const name = norm(s.name ?? "");
    const father = norm(s.fatherName ?? "");
    if (name && father) byNameFather.set(`${name}|${father}`, s);
    if (name) byName.set(name, s);
  });

  const namesSimilar = (a, b) => {
    const wordsA = norm(a ?? "").split(/\s+/).filter((w) => w.length > 2);
    const wordsB = norm(b ?? "").split(/\s+/).filter((w) => w.length > 2);
    if (!wordsA.length || !wordsB.length) return true;
    return wordsA.some((wa) =>
      wordsB.some((wb) => wa === wb || wa.startsWith(wb) || wb.startsWith(wa))
    );
  };

  const isRealMatch = (candidate, student) => {
    const nameSim = namesSimilar(candidate.name, student.name ?? "");
    const fatherSim = namesSimilar(candidate.fatherName, student.fatherName ?? "");
    return nameSim || fatherSim;
  };

  const findUploaded = (student) => {
    const rawRoll = norm(student.rollNumber ?? "").split("(")[0].trim();
    const digitsRoll = rawRoll.replace(/\D/g, "");

    // 1. Exact roll string match
    if (rawRoll && byRollExact.has(rawRoll)) {
      const candidate = byRollExact.get(rawRoll);
      if (isRealMatch(candidate, student)) return candidate;
    }

    // 2. Roll digits match
    if (digitsRoll && byRollNo.has(digitsRoll)) {
      const candidate = byRollNo.get(digitsRoll);
      if (isRealMatch(candidate, student)) return candidate;
    }

    // 3. Registration
    const reg = norm(student.registration ?? "");
    if (reg && byRegistration.has(reg)) {
      const candidate = byRegistration.get(reg);
      if (isRealMatch(candidate, student)) return candidate;
    }

    // 4. Name + Father
    const name = norm(student.name ?? "");
    const father = norm(student.fatherName ?? "");
    if (name && father && byNameFather.has(`${name}|${father}`)) {
      return byNameFather.get(`${name}|${father}`);
    }

    // 5. Name only
    if (name && byName.has(name)) {
      const candidate = byName.get(name);
      if (isRealMatch(candidate, student)) return candidate;
    }

    return null;
  };

  // Helper to match uploaded subject keys with a student subject entry
  const matchUploadedMark = (uploadedMidMarks = {}, targetSubjectName = "") => {
    const targetNorm = norm(targetSubjectName);
    const isTargetOspe = targetNorm.includes("ospe");
    const targetClean = targetNorm.replace(/\s*[-+]\s*ospe\s*$/, "").trim();

    for (const [subjKey, markVal] of Object.entries(uploadedMidMarks)) {
      const keyNorm = norm(subjKey);
      const isKeyOspe = keyNorm.includes("ospe");
      const keyClean = keyNorm.replace(/\s*[-+]\s*ospe\s*$/, "").trim();

      // Both are OSPE or both are theory
      if (isTargetOspe === isKeyOspe) {
        if (
          keyNorm === targetNorm ||
          keyClean === targetClean ||
          keyNorm.startsWith(targetClean) ||
          targetNorm.startsWith(keyClean)
        ) {
          return markVal;
        }
      }
    }
    return undefined;
  };

  let matchedStudentCount = 0;
  let updatedMarksCount = 0;

  const result = baseData.map((student) => {
    const uploaded = findUploaded(student);

    if (!uploaded || !uploaded.midMarks) {
      return student;
    }

    matchedStudentCount++;

    const mergedSubjects = (student.subjects || []).map((subj) => {
      const sName =
        subj?.subject ??
        subj?.label ??
        subj?.name ??
        subj?.subjectName ??
        subj?.title ??
        "";

      if (!sName) return subj;

      const midVal = matchUploadedMark(uploaded.midMarks, sName);

      if (midVal !== undefined && midVal !== null && midVal !== "") {
        updatedMarksCount++;
        return {
          ...subj,
          mid: midVal,
        };
      }

      return subj;
    });

    return { ...student, subjects: mergedSubjects };
  });

  console.log(`🎯 Merging complete: Matched ${matchedStudentCount} of ${baseData.length} students. Updated ${updatedMarksCount} mid marks values.`);
  console.groupEnd();

  return result;
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
      const rollNo = norm(
        row["EvalRollNo"] ??
          row["Roll No"] ??
          row["Roll #"] ??
          row["roll number"] ??
          ""
      );
      const name = norm(
        row["FullName"] ?? row["UserName"] ?? row["Name"] ?? row["name"] ?? ""
      );
      const fatherName = norm(
        row["FatherName"] ?? row["Father Name"] ?? row["father name"] ?? ""
      );
      const finalMark =
        row["Corrected"] ??
        row["Obtained Marks"] ??
        row["Final"] ??
        row["Marks"] ??
        row["marks"] ??
        row["final"] ??
        row["Total"] ??
        "";

      if (!rollNo && !name) return;

      allStudents.push({
        rollNo,
        name,
        fatherName,
        finalMark: finalMark !== "" ? finalMark : "-",
      });
    });
  });

  console.log(`formatFinalMarks parsed ${allStudents.length} students for subject "${selectedSubject}":`, allStudents);
  return allStudents;
}

export function formatFinalMarksOnlineOspe(filesData, selectedSubject) {
  return formatFinalMarks(filesData, selectedSubject);
}

export function formatFinalMarksPhysical(filesData, selectedSubject, { isOspe } = {}) {
  return formatFinalMarks(filesData, selectedSubject);
}

export function mergeFinalMarksData(baseData, uploadedData, targetSubjectLabel) {
  console.group(`🔄 mergeFinalMarksData for "${targetSubjectLabel}"`);
  console.log("Base students:", baseData.length, "Uploaded rows:", uploadedData.length);

  const norm = (v) =>
    String(v ?? "")
      .trim()
      .toLowerCase();

  const byRoll = new Map();
  const byName = new Map();

  uploadedData.forEach((s) => {
    const r = norm(s.rollNo).replace(/\D/g, "");
    if (r) byRoll.set(r, s);
    const n = norm(s.name);
    if (n) byName.set(n, s);
  });

  const targetNorm = norm(targetSubjectLabel);
  const isTargetOspe = targetNorm.includes("ospe");
  const targetClean = targetNorm.replace(/\s*[-+]\s*ospe\s*$/, "").trim();

  let updatedCount = 0;
  let subjectNotFoundCount = 0;

  const merged = baseData.map((student) => {
    const roll = norm(student.rollNumber ?? "").replace(/\D/g, "");
    const name = norm(student.name ?? "");

    const matchedUploaded = (roll && byRoll.get(roll)) || (name && byName.get(name));

    if (!matchedUploaded) return student;

    let foundSubject = false;
    const newSubjects = (student.subjects || []).map((subj) => {
      const sName = norm(
        subj?.subject ?? subj?.label ?? subj?.name ?? subj?.subjectName ?? ""
      );
      const isSubjOspe = sName.includes("ospe");
      const subjClean = sName.replace(/\s*[-+]\s*ospe\s*$/, "").trim();

      if (
        sName === targetNorm ||
        (isTargetOspe === isSubjOspe && (subjClean === targetClean || sName.includes(targetClean)))
      ) {
        foundSubject = true;
        updatedCount++;
        return {
          ...subj,
          final: matchedUploaded.finalMark,
        };
      }
      return subj;
    });

    if (!foundSubject) subjectNotFoundCount++;

    return { ...student, subjects: newSubjects };
  });

  console.log(`Merged final marks: updated ${updatedCount} records.`);
  console.groupEnd();

  return { merged, noMatchCount: 0, subjectNotFoundCount };
}
