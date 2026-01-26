import React, { useMemo } from "react";
import { useSubject } from "../context/SubjectContext";
import TableRows from "./tableItems/TableRows";


const hasRA = (rollNumber) =>
  String(rollNumber || "").toUpperCase().includes("RA");

const parseRollNumber = (value) => {
  if (!value) return null;
  const numeric = Number(String(value).replace(/[^0-9]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
};


// sheet Table
const SheetTable = () => {
  const { subjects, studentsData } = useSubject();

  const columns = subjects.flatMap((s) => {
    const base = [{ label: s.subject, key: s.subject }];
    if (s.ospe) base.push({ label: `${s.subject} - OSPE`, key: `${s.subject}-ospe` });
    return base;
  });

  const processedStudents = useMemo(() => {
    const sorted = [...(studentsData || [])].sort((a, b) => {
      const aRoll = parseRollNumber(a?.rollNumber);
      const bRoll = parseRollNumber(b?.rollNumber);

      if (aRoll !== null && bRoll !== null) return aRoll - bRoll;
      if (aRoll !== null) return -1;
      if (bRoll !== null) return 1;

      return String(a?.rollNumber || "").localeCompare(String(b?.rollNumber || ""));
    });

    let serial = 0;
    let previousGroupKey = null;

    return sorted.map((student) => {
      const isRA = hasRA(student.rollNumber);
      const institute = String(student?.institute || "").trim().toUpperCase();  
      const groupKey = `${institute}__${isRA ? "RA" : "NON_RA"}`;

      serial = previousGroupKey === groupKey ? serial + 1 : 1;
      previousGroupKey = groupKey;

      return { ...student, serial, isRA };
    });
  }, [studentsData]);


  return (
    <table className="customTable resultTable" style={{textWrap: 'nowrap'}}>
      <thead>
        <tr>
          <th rowSpan="2">S#</th>
          <th rowSpan="2">Roll #</th>
          <th rowSpan="2">Name</th>
          <th rowSpan="2">Father’s Name</th>
          <th rowSpan="2">Registration</th>
          <th rowSpan="2">Discipline</th>
          <th rowSpan="2">Institute</th>

          {columns.map((col) => (
            <th key={col.key} colSpan="3" className="text-center" style={{ textTransform: 'capitalize' }}>
              {col.label}
            </th>
          ))}
        </tr>

        <tr>
          {columns.map((col) => (
            <React.Fragment key={col.key}>
              <th>Mid</th>
              <th>Final</th>
              <th>Total</th>
            </React.Fragment>
          ))}
        </tr>
      </thead>

      <tbody>

        <TableRows
          processedStudents={processedStudents}
          columns={columns} />

      </tbody>
    </table>
  );
};

export default SheetTable;
