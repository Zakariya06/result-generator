import React from "react";

const TableRows = (props) => {
  const { processedStudents, columns } = props;

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
          // If failed subjects are >= half of the total subjects, status is NP
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
            </tr>
          );
        })
      )}
    </>
  );
};

export default TableRows;
