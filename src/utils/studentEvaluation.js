const norm = (v) =>
  String(v ?? "")
    .trim()
    .toLowerCase();

export const buildEvaluationColumns = (subjectsConfig = []) => {
  return subjectsConfig.flatMap((s) => {
    const baseMid = Number(s.maxMid) || 0;
    const baseFinal = Number(s.maxFinal) || 0;
    const ospeMid = s.ospe
      ? s.ospeMaxMid !== undefined && s.ospeMaxMid !== ""
        ? Number(s.ospeMaxMid) || 0
        : baseMid
      : 0;
    const ospeFinal = s.ospe
      ? s.ospeMaxFinal !== undefined && s.ospeMaxFinal !== ""
        ? Number(s.ospeMaxFinal) || 0
        : baseFinal
      : 0;
    const passPercentage = Number(s.passPercentage) || 50;

    if (s.ospe && s.ospeType === "combined") {
      return [
        {
          label: `${s.subject} + OSPE`,
          key: `${s.subject}-combined`,
          isCombined: true,
          subjectBase: s.subject,
          maxMid: baseMid + ospeMid,
          maxFinal: baseFinal + ospeFinal,
          passPercentage,
        },
      ];
    }

    const base = [
      {
        label: s.subject,
        key: s.subject,
        subjectBase: s.subject,
        maxMid: baseMid,
        maxFinal: baseFinal,
        passPercentage,
      },
    ];
    if (s.ospe) {
      base.push({
        label: `${s.subject} + OSPE`,
        key: `${s.subject}-ospe`,
        subjectBase: s.subject,
        isOspeSeparated: true,
        maxMid: ospeMid,
        maxFinal: ospeFinal,
        passPercentage,
      });
    }
    return base;
  });
};

const possibleKeysForSubject = (label) => {
  const l = norm(label);
  if (l.endsWith("+ ospe") || l.includes("+ ospe")) {
    const b = l.replace(/\s*\+\s*ospe\s*$/, "").trim();
    return [l, `${b} + ospe`, `${b}+ospe`, `${b} - ospe`, `${b}-ospe`];
  }
  if (l.endsWith("- ospe") || l.includes("- ospe")) {
    const b = l.replace(/\s*-\s*ospe\s*$/, "").trim();
    return [l, `${b} - ospe`, `${b}-ospe`, `${b} + ospe`, `${b}+ospe`];
  }
  return [l];
};

/**
 * Evaluates whether a student has passed or failed based on completed subjects.
 * Rule: Pass if passed > half of evaluated subjects (or failed < ceil(total/2)).
 */
export const evaluateStudentPassFail = (student, columns = []) => {
  let passedCount = 0;
  let failedCount = 0;
  let hasEvaluatedMarks = false;

  const isRA = Boolean(
    student.isRA ||
      String(student.rollNumber || "").toLowerCase().includes("ra") ||
      String(student.status || "").toLowerCase() === "re-appear"
  );

  columns.forEach((item) => {
    let obtained = NaN;
    const maxTotal = (item.maxMid || 0) + (item.maxFinal || 0);
    const passThreshold = maxTotal * ((item.passPercentage || 50) / 100);

    if (item.isCombined) {
      const baseNorm = norm(item.subjectBase);
      const theorySubj = (student.subjects || []).find((s) => {
        if (!s) return false;
        const sName = norm(
          s?.label ?? s?.name ?? s?.subject ?? s?.subjectName ?? s?.title ?? ""
        );
        return sName === baseNorm && !sName.includes("ospe");
      });

      const ospeSubj = (student.subjects || []).find((s) => {
        if (!s) return false;
        const sName = norm(
          s?.label ?? s?.name ?? s?.subject ?? s?.subjectName ?? s?.title ?? ""
        );
        return (
          sName.includes("ospe") &&
          (sName.includes(baseNorm) ||
            sName.replace(/\s*[-+]\s*ospe\s*$/, "").trim() === baseNorm)
        );
      });

      const tMid = theorySubj ? parseFloat(theorySubj.mid) : NaN;
      const tFinal = theorySubj ? parseFloat(theorySubj.final) : NaN;
      const oMid = ospeSubj ? parseFloat(ospeSubj.mid) : NaN;
      const oFinal = ospeSubj ? parseFloat(ospeSubj.final) : NaN;

      const isTheoryNA =
        theorySubj &&
        (String(theorySubj.mid ?? "").toUpperCase() === "NA" ||
          String(theorySubj.final ?? "").toUpperCase() === "NA");
      const isOspeNA =
        ospeSubj &&
        (String(ospeSubj.mid ?? "").toUpperCase() === "NA" ||
          String(ospeSubj.final ?? "").toUpperCase() === "NA");

      // Skip un-enrolled / NA
      if ((!theorySubj && !ospeSubj) || (isTheoryNA && isOspeNA)) return;

      // Only evaluate if final marks are entered (not pending)
      const hasFinalUploaded = !isNaN(tFinal) || !isNaN(oFinal);
      if (!hasFinalUploaded && !isRA) return;

      const combinedMid = (!isNaN(tMid) ? tMid : 0) + (!isNaN(oMid) ? oMid : 0);
      const combinedFinal = (!isNaN(tFinal) ? tFinal : 0) + (!isNaN(oFinal) ? oFinal : 0);
      obtained = combinedMid + combinedFinal;
    } else {
      const keys = possibleKeysForSubject(item.label);
      const matched = (student.subjects || []).find((s) => {
        if (!s) return false;
        const sName = norm(
          s?.label ?? s?.name ?? s?.subject ?? s?.subjectName ?? s?.title ?? ""
        );
        return keys.includes(sName);
      });

      if (!matched) return;

      const isSubjNA =
        String(matched.mid ?? "").toUpperCase() === "NA" ||
        String(matched.final ?? "").toUpperCase() === "NA";
      if (isSubjNA) return;

      const mid = parseFloat(matched.mid);
      const final = parseFloat(matched.final);

      // Only evaluate if final marks are entered (or RA student who only has final)
      if (isNaN(final) && !isRA) return;

      if (!isNaN(mid) && !isNaN(final)) {
        obtained = mid + final;
      } else if (!isNaN(final) && isRA) {
        obtained = final;
      } else if (!isNaN(parseFloat(matched.total))) {
        obtained = parseFloat(matched.total);
      }
    }

    if (!isNaN(obtained) && maxTotal > 0) {
      hasEvaluatedMarks = true;
      if (obtained < passThreshold) {
        failedCount++;
      } else {
        passedCount++;
      }
    }
  });

  const totalEvaluated = passedCount + failedCount;
  if (!hasEvaluatedMarks || totalEvaluated === 0) {
    return { isPassed: false, isFailed: false, isPending: true, passedCount: 0, failedCount: 0 };
  }

  const isFailed = failedCount >= Math.ceil(totalEvaluated / 2);
  const isPassed = !isFailed;

  return { isPassed, isFailed, isPending: false, passedCount, failedCount };
};

/**
 * Checks if a student is missing mid marks.
 * True only for regular students who have NO mid marks entered at all across all subjects.
 */
export const isStudentMissingMid = (student) => {
  const isRA = Boolean(
    student.isRA ||
      String(student.rollNumber || "").toLowerCase().includes("ra") ||
      String(student.status || "").toLowerCase() === "re-appear"
  );
  if (isRA) return false;

  const sList = student.subjects || [];
  if (!sList.length) return true;

  const hasAnyMid = sList.some((s) => {
    if (!s) return false;
    const v = s.mid;
    if (v === "" || v === null || v === undefined || v === "-") return false;
    if (String(v).toUpperCase() === "NA") return false;
    return !isNaN(parseFloat(v));
  });

  return !hasAnyMid;
};

/**
 * Checks if a student is missing final marks.
 * True for students who have NO final marks entered at all across all subjects.
 */
export const isStudentMissingFinal = (student) => {
  const sList = student.subjects || [];
  if (!sList.length) return true;

  const hasAnyFinal = sList.some((s) => {
    if (!s) return false;
    const v = s.final;
    if (v === "" || v === null || v === undefined || v === "-") return false;
    if (String(v).toUpperCase() === "NA") return false;
    return !isNaN(parseFloat(v));
  });

  return !hasAnyFinal;
};
