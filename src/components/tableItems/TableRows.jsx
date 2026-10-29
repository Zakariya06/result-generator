import React from "react";
import { useSubject } from "../../context/SubjectContext";

const TableRows = (props) => {
  const { processedStudents, columns } = props;
  const { setEditingStudent } = useSubject();

  const norm = (v) =>
    String(v ?? "")
      .trim()
      .toLowerCase();

  // Helper to match a student subject item with a column definition
  const matchSubjectForColumn = (subjectsList = [], colItem) => {
    const colLabelNorm = norm(colItem.label);
    const colBaseNorm = norm(colItem.subjectBase || colItem.label);
    const isColOspe = colItem.isOspeSeparated || colLabelNorm.includes("ospe");

    return subjectsList.find((s) => {
      if (!s) return false;
      const sName = norm(
        s?.label ?? s?.name ?? s?.subject ?? s?.subjectName ?? s?.title ?? ""
      );
      if (!sName) return false;
      const isSubjOspe = sName.includes("ospe");

      // 1. Differentiate between OSPE column and Theory column
      if (isColOspe !== isSubjOspe) return false;

      // 2. Direct string equality check
      if (sName === colLabelNorm) return true;

      // 3. Clean string match removing +/- ospe
      const sClean = sName.replace(/\s*[-+]\s*ospe\s*$/, "").trim();
      const colClean = colLabelNorm.replace(/\s*[-+]\s*ospe\s*$/, "").trim();

      if (sClean === colClean || sClean === colBaseNorm) return true;
      if (sName === colBaseNorm) return true;

      return false;
    });
  };

  // Find theory subject for a combined column
  const findTheorySubject = (subjectsList = [], subjectBase) => {
    const baseNorm = norm(subjectBase);
    return subjectsList.find((s) => {
      if (!s) return false;
      const sName = norm(
        s?.label ?? s?.name ?? s?.subject ?? s?.subjectName ?? s?.title ?? ""
      );
      if (!sName || sName.includes("ospe")) return false;
      return (
        sName === baseNorm ||
        sName.startsWith(baseNorm) ||
        baseNorm.startsWith(sName)
      );
    });
  };

  // Find OSPE subject for a combined column
  const findOspeSubject = (subjectsList = [], subjectBase) => {
    const baseNorm = norm(subjectBase);
    return subjectsList.find((s) => {
      if (!s) return false;
      const sName = norm(
        s?.label ?? s?.name ?? s?.subject ?? s?.subjectName ?? s?.title ?? ""
      );
      if (!sName || !sName.includes("ospe")) return false;
      const clean = sName.replace(/\s*[-+]\s*ospe\s*$/, "").trim();
      return (
        clean === baseNorm ||
        clean.startsWith(baseNorm) ||
        baseNorm.startsWith(clean)
      );
    });
  };

  const computeTotal = (subj) => {
    if (!subj) return "-";
    if (
      String(subj.mid ?? "").toUpperCase() === "NA" ||
      String(subj.final ?? "").toUpperCase() === "NA"
    )
      return "NA";
    const mid = parseFloat(subj.mid);
    const final = parseFloat(subj.final);
    if (!isNaN(mid) && !isNaN(final)) return mid + final;
    return subj.total ?? "-";
  };

  const renderCell = (value, extraClass = "") => {
    if (String(value ?? "").toUpperCase() === "NA") {
      return (
        <td className={`text-center ${extraClass}`}>
          <span className="badge-na">NA</span>
        </td>
      );
    }
    const display =
      value !== "" && value !== null && value !== undefined ? value : "-";
    return <td className={`text-center ${extraClass}`}>{display}</td>;
  };

  return (
    <>
      {processedStudents.length === 0 ? (
        <tr>
          <td>1</td>
          <td>KMU-001</td>
          <td>Student Name</td>
          <td>Father Name</td>
          <td>REG-2024</td>
          <td>Discipline Name</td>
          <td>
            <span className="badge-regular">Regular</span>
          </td>
          <td>KMU IHS-Swat</td>

          {columns.map((item, i) => (
            <React.Fragment key={i}>
              <td className="text-center">-</td>
              <td className="text-center">-</td>
              <td className="text-center">-</td>
            </React.Fragment>
          ))}
          <td className="text-center">
            <span className="text-muted fw-bold">-</span>
          </td>
          <td className="text-center">-</td>
        </tr>
      ) : (
        processedStudents.map((student, index) => {
          if (!student || typeof student !== "object") return null;

          let totalApplicableSubjects = 0;
          let failedSubjects = 0;
          let hasAnyMarksEntered = false;

          const subjectCells = columns.map((item, i) => {
            // ── 1. COMBINED MODE COLUMN ──────────────────────────────────
            if (item.isCombined) {
              const theorySubj = findTheorySubject(
                student.subjects || [],
                item.subjectBase
              );
              const ospeSubj = findOspeSubject(
                student.subjects || [],
                item.subjectBase
              );

              const isTheoryNA =
                theorySubj &&
                (String(theorySubj.mid ?? "").toUpperCase() === "NA" ||
                  String(theorySubj.final ?? "").toUpperCase() === "NA");
              const isOspeNA =
                ospeSubj &&
                (String(ospeSubj.mid ?? "").toUpperCase() === "NA" ||
                  String(ospeSubj.final ?? "").toUpperCase() === "NA");

              if (!theorySubj && !ospeSubj) {
                if (!student.isRA) {
                  return (
                    <React.Fragment key={i}>
                      <td className="text-center text-muted">-</td>
                      <td className="text-center text-muted">-</td>
                      <td className="text-center text-muted">-</td>
                    </React.Fragment>
                  );
                }
                return (
                  <React.Fragment key={i}>
                    <td className="text-center">
                      <span className="badge-na">NA</span>
                    </td>
                    <td className="text-center">
                      <span className="badge-na">NA</span>
                    </td>
                    <td className="text-center">
                      <span className="badge-na">NA</span>
                    </td>
                  </React.Fragment>
                );
              }

              if (isTheoryNA || isOspeNA) {
                return (
                  <React.Fragment key={i}>
                    <td className="text-center">
                      <span className="badge-na">NA</span>
                    </td>
                    <td className="text-center">
                      <span className="badge-na">NA</span>
                    </td>
                    <td className="text-center">
                      <span className="badge-na">NA</span>
                    </td>
                  </React.Fragment>
                );
              }

              const tMid = theorySubj ? parseFloat(theorySubj.mid) : NaN;
              const tFinal = theorySubj ? parseFloat(theorySubj.final) : NaN;
              const oMid = ospeSubj ? parseFloat(ospeSubj.mid) : NaN;
              const oFinal = ospeSubj ? parseFloat(ospeSubj.final) : NaN;

              const hasMid = !isNaN(tMid) || !isNaN(oMid);
              const hasFinal = !isNaN(tFinal) || !isNaN(oFinal);

              const combinedMid =
                (!isNaN(tMid) ? tMid : 0) + (!isNaN(oMid) ? oMid : 0);
              const combinedFinal =
                (!isNaN(tFinal) ? tFinal : 0) + (!isNaN(oFinal) ? oFinal : 0);
              const combinedTotal = combinedMid + combinedFinal;

              const maxTotal = item.maxMid + item.maxFinal;
              if (hasMid || hasFinal) {
                hasAnyMarksEntered = true;
                totalApplicableSubjects++;
                if (maxTotal > 0 && combinedTotal < maxTotal * 0.5) {
                  failedSubjects++;
                }
              }

              const midExceeds = item.maxMid > 0 && combinedMid > item.maxMid;
              const finalExceeds =
                item.maxFinal > 0 && combinedFinal > item.maxFinal;

              return (
                <React.Fragment key={i}>
                  {renderCell(
                    hasMid ? combinedMid : "-",
                    midExceeds ? "cell-exceeds" : ""
                  )}
                  {renderCell(
                    hasFinal ? combinedFinal : "-",
                    finalExceeds ? "cell-exceeds" : ""
                  )}
                  {renderCell(hasMid || hasFinal ? combinedTotal : "-")}
                </React.Fragment>
              );
            }

            // ── 2. SEPARATED OR REGULAR COLUMN ───────────────────────────
            const matchedSubject = matchSubjectForColumn(
              student.subjects || [],
              item
            );

            if (!matchedSubject) {
              if (!student.isRA) {
                return (
                  <React.Fragment key={i}>
                    <td className="text-center text-muted">-</td>
                    <td className="text-center text-muted">-</td>
                    <td className="text-center text-muted">-</td>
                  </React.Fragment>
                );
              }
              return (
                <React.Fragment key={i}>
                  <td className="text-center">
                    <span className="badge-na">NA</span>
                  </td>
                  <td className="text-center">
                    <span className="badge-na">NA</span>
                  </td>
                  <td className="text-center">
                    <span className="badge-na">NA</span>
                  </td>
                </React.Fragment>
              );
            }

            const midVal = parseFloat(matchedSubject.mid);
            const finalVal = parseFloat(matchedSubject.final);

            const midExceeds =
              item.maxMid > 0 && !isNaN(midVal) && midVal > item.maxMid;
            const finalExceeds =
              item.maxFinal > 0 && !isNaN(finalVal) && finalVal > item.maxFinal;

            const maxTotal = item.maxMid + item.maxFinal;
            const obtainedTotal = computeTotal(matchedSubject);
            const obtainedMarks =
              typeof obtainedTotal === "number"
                ? obtainedTotal
                : parseFloat(obtainedTotal);

            const isMarksUploaded = !isNaN(obtainedMarks);
            if (isMarksUploaded) {
              hasAnyMarksEntered = true;
              totalApplicableSubjects++;
              if (maxTotal > 0 && obtainedMarks < maxTotal * 0.5) {
                failedSubjects++;
              }
            }

            const totalDisplay = computeTotal(matchedSubject);

            return (
              <React.Fragment key={i}>
                {renderCell(
                  matchedSubject.mid,
                  midExceeds ? "cell-exceeds" : ""
                )}
                {renderCell(
                  matchedSubject.final,
                  finalExceeds ? "cell-exceeds" : ""
                )}
                {renderCell(totalDisplay)}
              </React.Fragment>
            );
          });

          const isFailed =
            hasAnyMarksEntered &&
            totalApplicableSubjects > 0 &&
            failedSubjects >= Math.ceil(totalApplicableSubjects / 2);

          return (
            <tr
              key={String(student.rollNumber ?? index) + "_" + index}
              className={student.isRA ? "ra-row" : ""}
              style={{ textWrap: "nowrap" }}
            >
              <td>{student.serial}</td>
              <td>{String(student.rollNumber ?? "").split("(")[0]}</td>
              <td>{student.name}</td>
              <td>{student.fatherName}</td>
              <td>{student.registration}</td>
              <td>{student.Discipline}</td>
              <td>
                <span
                  className={
                    student.isRA ? "badge-reappear" : "badge-regular"
                  }
                >
                  {student.isRA ? "Re-appear" : "Regular"}
                </span>
              </td>
              <td>{student.institute}</td>

              {subjectCells}

              <td className="text-center">
                {!hasAnyMarksEntered ? (
                  <span className="text-muted fw-semibold">-</span>
                ) : (
                  <span
                    className={`status-pill ${
                      isFailed ? "status-failed" : "status-passed"
                    }`}
                  >
                    {isFailed ? "NP" : "P"}
                  </span>
                )}
              </td>

              <td className="text-center">
                <button
                  onClick={() => setEditingStudent(student)}
                  className="btn p-1 border-0"
                  style={{
                    cursor: "pointer",
                    background: "transparent",
                    transition: "all 0.2s ease-in-out",
                    borderRadius: "6px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#e9ecef";
                    e.currentTarget.style.transform = "scale(1.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  title="Edit Student"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="#6c757d"
                    className="bi bi-pencil-square"
                    viewBox="0 0 16 16"
                  >
                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                    <path
                      fillRule="evenodd"
                      d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"
                    />
                  </svg>
                </button>
              </td>
            </tr>
          );
        })
      )}
    </>
  );
};

export default TableRows;
