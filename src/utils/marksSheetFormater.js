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

    // Also add any unmapped midMarks from the uploaded file (e.g. OSPE columns)
    const existingMappedNames = new Set(
      mergedSubjects.map((s) => norm(s?.subject ?? s?.label ?? s?.name ?? ""))
    );

    Object.entries(uploaded.midMarks || {}).forEach(([subjKey, markVal]) => {
      if (markVal === undefined || markVal === null || markVal === "") return;
      const keyNorm = norm(subjKey);
      const isAlreadyIn = Array.from(existingMappedNames).some(
        (existing) =>
          existing === keyNorm ||
          (existing.includes("ospe") === keyNorm.includes("ospe") &&
            existing.replace(/\s*[-+]\s*ospe\s*$/, "").trim() ===
              keyNorm.replace(/\s*[-+]\s*ospe\s*$/, "").trim())
      );
      if (!isAlreadyIn) {
        mergedSubjects.push({
          subject: subjKey,
          mid: markVal,
          final: "",
        });
        updatedMarksCount++;
      }
    });

    return { ...student, subjects: mergedSubjects };
  });

  console.log(`🎯 Merging complete: Matched ${matchedStudentCount} of ${baseData.length} students. Updated ${updatedMarksCount} mid marks values.`);
  console.groupEnd();

  return result;
}

/**
 * Parse OSPE / Final marks from raw array-of-arrays (header:1) format.
 * This is more reliable than the object-keyed parser because it doesn't
 * depend on the first row being the header — it scans ALL rows for the
 * real header row by looking for "Roll Number", "Name", "Total Marks" etc.
 */
export function formatFinalMarksFromRaw(rawFilesData, selectedSubject) {
  const allStudents = [];
  const normStr = (v) => String(v ?? "").trim();
  const normLower = (v) => normStr(v).toLowerCase();

  rawFilesData.forEach((rawSheet) => {
    if (!Array.isArray(rawSheet) || rawSheet.length < 2) return;

    // Find the header row by scanning for a row containing "Roll" and "Name"
    let headerRowIdx = -1;
    let rollCol = -1, nameCol = -1, fatherCol = -1, regCol = -1, marksCol = -1;

    for (let r = 0; r < Math.min(rawSheet.length, 25); r++) {
      const row = rawSheet[r];
      if (!Array.isArray(row)) continue;

      let foundRoll = false, foundName = false;
      let tmpRoll = -1, tmpName = -1, tmpFather = -1, tmpReg = -1, tmpMarks = -1;

      row.forEach((cell, ci) => {
        const t = normLower(cell);
        if (t.includes("roll") && tmpRoll === -1) { tmpRoll = ci; foundRoll = true; }
        if (t.includes("name") && !t.includes("father") && !t.includes("inst") && tmpName === -1) { tmpName = ci; foundName = true; }
        if (t.includes("father") && tmpFather === -1) tmpFather = ci;
        if (t.includes("reg") && tmpReg === -1) tmpReg = ci;
        // Prefer "total marks" over other marks columns
        if (t.includes("total mark") || t === "total marks") { tmpMarks = ci; }
        else if (tmpMarks === -1 && (t === "total" || t === "marks" || t === "final" || t.includes("obtained"))) {
          tmpMarks = ci;
        }
      });

      if (foundRoll && foundName) {
        headerRowIdx = r;
        rollCol = tmpRoll; nameCol = tmpName; fatherCol = tmpFather;
        regCol = tmpReg; marksCol = tmpMarks;
        break;
      }
    }

    if (headerRowIdx === -1) {
      console.warn("formatFinalMarksFromRaw: no header row found in raw sheet");
      return;
    }

    console.log(`formatFinalMarksFromRaw: header at row ${headerRowIdx}, cols: roll=${rollCol} name=${nameCol} father=${fatherCol} reg=${regCol} marks=${marksCol}`);

    // Parse data rows (everything after the header)
    for (let r = headerRowIdx + 1; r < rawSheet.length; r++) {
      const row = rawSheet[r];
      if (!Array.isArray(row)) continue;

      const rollNo = rollCol >= 0 ? normStr(row[rollCol]) : "";
      const name = nameCol >= 0 ? normStr(row[nameCol]) : "";
      const fatherName = fatherCol >= 0 ? normStr(row[fatherCol]) : "";
      const registration = regCol >= 0 ? normStr(row[regCol]) : "";
      const finalMark = marksCol >= 0 ? normStr(row[marksCol]) : "";

      // Skip empty rows or header repetitions
      if (!rollNo && !name && !registration) continue;
      const rLow = rollNo.toLowerCase();
      const nLow = name.toLowerCase();
      if (["roll number", "roll no", "roll #", "s.no", "serial"].includes(rLow) || ["name", "student name"].includes(nLow)) continue;

      allStudents.push({ rollNo, name, fatherName, registration, finalMark: finalMark || "-" });
    }
  });

  console.log(`\u2705 formatFinalMarksFromRaw parsed ${allStudents.length} students for subject "${selectedSubject}"`, allStudents);
  return allStudents;
}

export function formatFinalMarks(filesData, selectedSubject) {
  if (!selectedSubject || !String(selectedSubject).trim()) {
    console.warn("formatFinalMarks: no subject selected");
    return [];
  }

  const allStudents = [];
  const normStr = (v) => String(v ?? "").trim();
  const normLower = (v) => normStr(v).toLowerCase();

  filesData.forEach((sheet, sheetIdx) => {
    if (!Array.isArray(sheet) || !sheet.length) return;

    // STEP 1: Find the header row index and map column indices/keys
    let headerRowIndex = -1;
    let colKeyMap = {
      rollNo: null,
      name: null,
      fatherName: null,
      registration: null,
      finalMark: null,
    };

    // Scan up to the first 25 rows to find the row that contains header labels
    for (let r = 0; r < Math.min(sheet.length, 25); r++) {
      const row = sheet[r];
      if (!row || typeof row !== "object") continue;

      const entries = Object.entries(row);
      let foundRoll = false;
      let foundName = false;
      const currentMap = {
        rollNo: null,
        name: null,
        fatherName: null,
        registration: null,
        finalMark: null,
      };

      entries.forEach(([key, val]) => {
        const valText = normLower(val);
        const keyText = normLower(key);

        // 1. Roll Number
        if (
          valText.includes("roll") ||
          keyText.includes("roll") ||
          valText === "evalrollno" ||
          keyText === "evalrollno"
        ) {
          currentMap.rollNo = key;
          foundRoll = true;
        }

        // 2. Name
        if (
          (valText.includes("name") || keyText.includes("name")) &&
          !valText.includes("father") &&
          !keyText.includes("father") &&
          !valText.includes("inst") &&
          !keyText.includes("inst")
        ) {
          currentMap.name = key;
          foundName = true;
        }

        // 3. Father Name
        if (valText.includes("father") || keyText.includes("father")) {
          currentMap.fatherName = key;
        }

        // 4. Registration
        if (valText.includes("reg") || keyText.includes("reg")) {
          currentMap.registration = key;
        }

        // 5. Total Marks / Marks / Final / Obtained
        if (
          valText.includes("total mark") ||
          keyText.includes("total mark") ||
          valText === "total marks" ||
          keyText === "total marks" ||
          valText.includes("obtained mark") ||
          keyText.includes("obtained mark") ||
          valText === "final" ||
          keyText === "final" ||
          valText === "corrected" ||
          keyText === "corrected" ||
          valText === "total" ||
          keyText === "total" ||
          valText === "marks" ||
          keyText === "marks"
        ) {
          // If we found "total marks", prioritize it over generic "total"
          if (
            valText.includes("total mark") ||
            keyText.includes("total mark") ||
            !currentMap.finalMark
          ) {
            currentMap.finalMark = key;
          }
        }
      });

      if (foundRoll || (foundName && currentMap.fatherName)) {
        headerRowIndex = r;
        colKeyMap = currentMap;
        break;
      }
    }

    const dataStartIndex = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;
    const dataRows = sheet.slice(dataStartIndex);

    dataRows.forEach((row) => {
      let rollNo = "";
      let name = "";
      let fatherName = "";
      let registration = "";
      let finalMark = "";

      if (headerRowIndex !== -1) {
        if (colKeyMap.rollNo) rollNo = normStr(row[colKeyMap.rollNo]);
        if (colKeyMap.name) name = normStr(row[colKeyMap.name]);
        if (colKeyMap.fatherName) fatherName = normStr(row[colKeyMap.fatherName]);
        if (colKeyMap.registration) registration = normStr(row[colKeyMap.registration]);
        if (colKeyMap.finalMark) finalMark = normStr(row[colKeyMap.finalMark]);
      }

      // Fallback matching if keys were formatted directly on the object
      if (!rollNo || !name || finalMark === "") {
        const entries = Object.entries(row);
        for (const [k, v] of entries) {
          const kLower = normLower(k);
          const vStr = normStr(v);
          if (!rollNo && (kLower.includes("roll") || kLower === "evalrollno")) {
            rollNo = vStr;
          } else if (!name && kLower.includes("name") && !kLower.includes("father")) {
            name = vStr;
          } else if (!fatherName && kLower.includes("father")) {
            fatherName = vStr;
          } else if (!registration && kLower.includes("reg")) {
            registration = vStr;
          } else if (
            finalMark === "" &&
            (kLower.includes("total mark") ||
              kLower.includes("obtained") ||
              kLower === "final" ||
              kLower === "marks" ||
              kLower === "total" ||
              kLower === "corrected")
          ) {
            finalMark = vStr;
          }
        }
      }

      // Skip header repetitions or empty rows
      if (!rollNo && !name && !registration) {
        return;
      }
      const rLower = rollNo.toLowerCase();
      const nLower = name.toLowerCase();
      if (
        rLower === "roll number" ||
        rLower === "roll no" ||
        rLower === "roll #" ||
        rLower === "s.no" ||
        nLower === "name" ||
        nLower === "student name"
      ) {
        return;
      }

      allStudents.push({
        rollNo,
        name,
        fatherName,
        registration,
        finalMark: finalMark !== "" ? finalMark : "-",
      });
    });
  });

  console.log(`✅ formatFinalMarks parsed ${allStudents.length} students for subject "${selectedSubject}":`, allStudents);
  return allStudents;
}

export function formatFinalMarksOnlineOspe(filesData, selectedSubject, rawFilesData) {
  // If rawFilesData (array-of-arrays) is provided, use it for more reliable OSPE parsing
  if (rawFilesData && Array.isArray(rawFilesData) && rawFilesData.length) {
    const result = formatFinalMarksFromRaw(rawFilesData, selectedSubject);
    if (result.length > 0) return result;
    // Fall through to object-keyed parser if raw parsing returned nothing
  }
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

  const cleanDigits = (v) => norm(v).replace(/\D/g, "");
  const cleanReg = (v) => norm(v).replace(/[^a-z0-9]/gi, "");

  // Build lookup maps from uploaded final / OSPE data
  const byRollNo = new Map();       // digits-only roll → uploaded row
  const byRollExact = new Map();    // exact normalized roll → uploaded row
  const byRegistration = new Map(); // normalized registration → uploaded row
  const byNameFather = new Map();   // "name|fatherName" → uploaded row
  const byName = new Map();         // normalized name → uploaded row

  uploadedData.forEach((s) => {
    const rawRoll = norm(s.rollNo).split("(")[0].trim();
    const digitsRoll = cleanDigits(rawRoll);

    if (digitsRoll) byRollNo.set(digitsRoll, s);
    if (rawRoll) byRollExact.set(rawRoll, s);

    const reg = cleanReg(s.registration);
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
    const digitsRoll = cleanDigits(rawRoll);

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

    // 3. Registration match
    const reg = cleanReg(student.registration ?? "");
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

  const targetNorm = norm(targetSubjectLabel);
  const isTargetOspe = targetNorm.includes("ospe");
  const targetClean = targetNorm.replace(/\s*[-+]\s*ospe\s*$/, "").trim();

  let updatedCount = 0;
  let subjectNotFoundCount = 0;

  const merged = baseData.map((student) => {
    const matchedUploaded = findUploaded(student);

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
        (isTargetOspe === isSubjOspe &&
          (subjClean === targetClean ||
            sName.includes(targetClean) ||
            targetClean.includes(subjClean)))
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

    if (!foundSubject) {
      subjectNotFoundCount++;
      // Auto-append subject entry for the matched student so OSPE and final marks are never lost
      newSubjects.push({
        subject: targetSubjectLabel,
        mid: "",
        final: matchedUploaded.finalMark,
      });
      updatedCount++;
    }

    return { ...student, subjects: newSubjects };
  });

  console.log(`Merged final marks: updated ${updatedCount} records.`);
  console.groupEnd();

  return { merged, noMatchCount: 0, subjectNotFoundCount };
}
