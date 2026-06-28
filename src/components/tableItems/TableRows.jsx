import React from "react"; 
import { useSubject } from "../../context/SubjectContext";

const TableRows = (props) => {
  const { processedStudents, columns } = props;
  const { setEditingStudent } = useSubject();  

  const norm = (v) =>
    String(v ?? "")
      .trim()
      .toLowerCase();

  const possibleKeysForColumn = (label) => {
    const l = norm(label);

    if (l.endsWith("- ospe") || l.includes(" - ospe")) {
      const base = l.replace(/\s*-\s*ospe\s*$/, "").trim();
      return [l, `${base} - ospe`, `${base}-ospe`];
    }

    return [l];
  };

  console.log("All Students Data :::", processedStudents);
  console.log("All Columns Data :::", columns);

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
          <td>Regular / Re-appear</td>
          <td>KMU IHS-Swat</td>

          {columns.map((item, i) => (
            <React.Fragment key={i}>
              <td>-</td>
              <td>-</td>
              <td>-</td>
            </React.Fragment>
          ))}
          <td style={{ textAlign: "center" }}>P</td>
          <td style={{ textAlign: "center" }}>-</td>
        </tr>
      ) : (
        processedStudents.map((student, index) => {
          if (!student || typeof student !== "object") return null;

          // ── Status Calculation Variables ──────────────────────────────
          let totalApplicableSubjects = 0;
          let failedSubjects = 0;

          const subjectCells = columns.map((item, i) => {
            const keys = possibleKeysForColumn(item.label);

            const matchedSubject = (student.subjects || []).find((s) => {
              if (!s) return false;
              const subjectName = norm(
                s?.label ?? s?.name ?? s?.subject ?? s?.subjectName ?? s?.title,
              );
              return keys.includes(subjectName);
            });

            const computeTotal = (subj) => {
              if (!subj) return "-";
              const mid = parseFloat(subj.mid);
              const final = parseFloat(subj.final);
              if (!isNaN(mid) && !isNaN(final)) return mid + final;
              return subj.total ?? "-";
            };

            if (!matchedSubject) {
              return (
                <React.Fragment key={i}>
                  <td className="text-center">
                    <span style={{ color: "red" }}>NA</span>
                  </td>
                  <td className="text-center">
                    <span style={{ color: "red" }}>NA</span>
                  </td>
                  <td className="text-center">
                    <span style={{ color: "red" }}>NA</span>
                  </td>
                </React.Fragment>
              );
            }

            // ── Check if marks exceed max ──────────────────────────────
            const midVal = parseFloat(matchedSubject.mid);
            const finalVal = parseFloat(matchedSubject.final);

            const midExceeds =
              item.maxMid > 0 && !isNaN(midVal) && midVal > item.maxMid;

            const finalExceeds =
              item.maxFinal > 0 && !isNaN(finalVal) && finalVal > item.maxFinal;

            // ── Check if subject is passed (>= 50% of max marks) ───────
            const maxTotal = item.maxMid + item.maxFinal;
            const obtainedTotal = computeTotal(matchedSubject);
            const obtainedMarks =
              typeof obtainedTotal === "number"
                ? obtainedTotal
                : parseFloat(obtainedTotal);

            totalApplicableSubjects++;

            // If marks are missing (NaN) or less than 50%, it's a fail
            if (
              maxTotal > 0 &&
              (isNaN(obtainedMarks) || obtainedMarks < maxTotal * 0.5)
            ) {
              failedSubjects++;
            }

            return (
              <React.Fragment key={i}>
                <td
                  className="text-center"
                  style={
                    midExceeds ? { backgroundColor: "red", color: "white" } : {}
                  }
                >
                  {matchedSubject.mid !== "" &&
                  matchedSubject.mid !== null &&
                  matchedSubject.mid !== undefined
                    ? matchedSubject.mid
                    : "-"}
                </td>

                <td
                  className="text-center"
                  style={
                    finalExceeds
                      ? { backgroundColor: "red", color: "white" }
                      : {}
                  }
                >
                  {matchedSubject.final !== "" &&
                  matchedSubject.final !== null &&
                  matchedSubject.final !== undefined
                    ? matchedSubject.final
                    : "-"}
                </td>

                <td className="text-center">{computeTotal(matchedSubject)}</td>
              </React.Fragment>
            );
          });

          // ── Determine Final Status ────────────────────────────────────
          const isFailed =
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
              <td>{student.isRA ? "Re-appear" : "Regular"}</td>
              <td>{student.institute}</td>

              {subjectCells}

              <td
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  backgroundColor: isFailed ? "red" : "green",
                  color: "white",
                }}
              >
                {isFailed ? "NP" : "P"}
              </td>

              {/* ── ACTION COLUMN ──────────────────────────────────────── */}
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
