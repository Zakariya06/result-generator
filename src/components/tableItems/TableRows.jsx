import React from "react";

const TableRows = (props) => {
  const { processedStudents, columns } = props;

  const norm = (v) => String(v ?? "").trim().toLowerCase();

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
          // ✅ build subjectSet correctly (supports subjects as strings OR objects)
          const subjectSet = new Set(
            (Array.isArray(student?.subjects) ? student.subjects : [])
              .map((s) => {
                if (typeof s === "string") return norm(s);
                // try common keys if it's an object:
                return norm(s?.label ?? s?.name ?? s?.subject ?? s?.subjectName ?? s?.title);
              })
              .filter(Boolean)
          );

          return (
            <tr
              key={student.rollNumber + index}
              className={student.isRA ? "ra-row" : ""}
              style={{ textWrap: "nowrap" }}
            >
              <td>{student.serial}</td>
              <td>{student.rollNumber}</td>
              <td>{student.name}</td>
              <td>{student.fatherName}</td>
              <td>{student.registration}</td>
              <td>{student.Discipline}</td>
              <td>{student.institute}</td>

              {columns.map((item, i) => {
                const hasSubject = subjectSet.has(norm(item.label));
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
