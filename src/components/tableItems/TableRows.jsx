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
      const base = l.replace(/\s*-\s*ospe\s*$/, "");
      return [l, `${base} - ospe`, `${base}-ospe`, base];
    }

    return [l];
  };

  console.log("This is Final Students Data ====== \n", processedStudents);

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
          // ✅ build subjectSet correctly (strings OR objects)
          const subjectSet = new Set(
            (Array.isArray(student?.subjects) ? student.subjects : [])
              .map((s) => {
                if (typeof s === "string") return norm(s);
                return norm(
                  s?.label ??
                    s?.name ??
                    s?.subject ??
                    s?.subjectName ??
                    s?.title,
                );
              })
              .filter(Boolean),
          );

          return (
            <tr
              key={student.rollNumber + index}
              className={student.isRA ? "ra-row" : ""}
              style={{ textWrap: "nowrap" }}
            >
              <td>{student.serial}</td>
              <td>{student.rollNumber.split("(")[0]}</td>
              <td>{student.name}</td>
              <td>{student.fatherName}</td>
              <td>{student.registration}</td>
              <td>{student.Discipline}</td>
              <td>{student.isRA ? "Re-appear" : "Regular"}</td>
              <td>{student.institute}</td>

              {columns.map((item, i) => {
                const keys = possibleKeysForColumn(item.label);
                const hasSubject = keys.some((k) => subjectSet.has(k));

                return (
                  <React.Fragment key={i}>
                    <td>{hasSubject ? "-" : "NA"}</td>
                    <td>{hasSubject ? "-" : "NA"}</td>
                    <td>{hasSubject ? "-" : "NA"}</td>
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
