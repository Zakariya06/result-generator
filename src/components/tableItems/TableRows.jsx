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
      // ✅ Only OSPE-variant keys — no fallback to the base subject name
      return [l, `${base} - ospe`, `${base}-ospe`];
    }

    return [l];
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
          <td>Regular / Re-appear</td>
          <td>KMU IHS-Swat</td>

          {columns.map((item, i) => (
            <React.Fragment key={i}>
              <td>-</td>
              <td>-</td>
              <td>-</td>
            </React.Fragment>
          ))}
        </tr>
      ) : (
        processedStudents.map((student, index) => {
          if (!student || typeof student !== "object") return null;

          return (
            <tr
              key={String(student.rollNumber ?? index) + "_" + index}
              className={student.isRA ? "ra-row" : ""}
              style={{ textWrap: "nowrap" }}
            >
              <td>{student.serial}</td>

              {/* Safe split — won't crash if rollNumber is undefined */}
              <td>{String(student.rollNumber ?? "").split("(")[0]}</td>

              <td>{student.name}</td>
              <td>{student.fatherName}</td>
              <td>{student.registration}</td>
              <td>{student.Discipline}</td>
              <td>{student.isRA ? "Re-appear" : "Regular"}</td>
              <td>{student.institute}</td>

              {columns.map((item, i) => {
                const keys = possibleKeysForColumn(item.label);

                const matchedSubject = (student.subjects || []).find((s) => {
                  if (!s) return false;
                  const subjectName = norm(
                    s?.label ??
                      s?.name ??
                      s?.subject ??
                      s?.subjectName ??
                      s?.title,
                  );
                  return keys.includes(subjectName);
                });

                // ── Compute total = mid + final if both are numeric ──────────────
                const computeTotal = (subj) => {
                  if (!subj) return "-";
                  const mid = parseFloat(subj.mid);
                  const final = parseFloat(subj.final);
                  if (!isNaN(mid) && !isNaN(final)) return mid + final;
                  return subj.total ?? "-";
                };

                return (
                  <React.Fragment key={i}>
                    <td className="text-center">
                      {matchedSubject ? (
                        (matchedSubject.mid ?? "-")
                      ) : (
                        <span style={{ color: "red" }}>NA</span>
                      )}
                    </td>

                    <td className="text-center">
                      {matchedSubject ? (
                        (matchedSubject.final ?? "-")
                      ) : (
                        <span style={{ color: "red" }}>NA</span>
                      )}
                    </td>

                    <td className="text-center">
                      {matchedSubject ? (
                        computeTotal(matchedSubject)
                      ) : (
                        <span style={{ color: "red" }}>NA</span>
                      )}
                    </td>
                  </React.Fragment>
                );
              })}
            </tr>
          );
        })
      )}
    </>
  );
};

export default TableRows;
