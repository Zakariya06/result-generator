import React, { useMemo } from "react";
import { useSubject } from "../context/SubjectContext";

/*  HELPERS   */

const hasRA = (rollNumber) =>
  String(rollNumber || "")
    .toUpperCase()
    .includes("RA");

const parseRollNumber = (value) => {
  if (!value) return null;
  const numeric = Number(String(value).replace(/[^0-9]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizeText = (v) => String(v || "").trim().toLowerCase();
 
const buildStudentSubjectMap = (student) => {
  const map = new Map();

  (student?.subjects || []).forEach((item) => {
    // case 1: string subject
    if (typeof item === "string") {
      map.set(normalizeText(item), { mid: "", final: "" });
      return;
    }

    // case 2: object subject
    if (item && typeof item === "object") {
      const name = item.subject ?? item.name ?? "";
      if (!name) return;

      map.set(normalizeText(name), {
        mid: item.mid ?? "",
        final: item.final ?? "",
        // if later you add total in data, you can store it too
        total: item.total ?? "",
        // if later you add ospe marks, store here too
        ospeMid: item.ospeMid ?? "",
        ospeFinal: item.ospeFinal ?? "",
        ospeTotal: item.ospeTotal ?? "",
      });
    }
  });

  return map;
};

const toNumberOrNa = (v) => {
  if (v === "NA") return NaN;
  if (v === "" || v == null) return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const SheetTable = () => {
  const { subjects, studentsData } = useSubject();

  /*   BUILD COLUMNS   */
  const columns = (subjects || []).flatMap((s) => {
    const base = [{ label: s.subject, key: s.subject, type: "main" }];

    if (s.ospe) {
      base.push({
        label: `${s.subject} - OSPE`,
        key: `${s.subject}-ospe`,
        type: "ospe",
        baseSubject: s.subject,
      });
    }
    return base;
  });

  /*   SORT + ASSIGN SERIAL NUMBERS   */
  const processedStudents = useMemo(() => {
    const sorted = [...(studentsData || [])].sort((a, b) => {
      const aRoll = parseRollNumber(a?.rollNumber);
      const bRoll = parseRollNumber(b?.rollNumber);

      if (aRoll !== null && bRoll !== null) return aRoll - bRoll;
      if (aRoll !== null) return -1;
      if (bRoll !== null) return 1;

      return String(a?.rollNumber || "").localeCompare(
        String(b?.rollNumber || ""),
      );
    });

    let serial = 0;
    let previousIsRA = null;

    return sorted.map((student) => {
      const isRA = hasRA(student.rollNumber);

      if (previousIsRA === null || isRA !== previousIsRA) {
        serial = 1;
      } else {
        serial += 1;
      }

      previousIsRA = isRA;

      return {
        ...student,
        serial,
        isRA,
      };
    });
  }, [studentsData]);

  /*   RA COUNT */
  const totalRA = processedStudents.filter((s) => s.isRA).length;
  console.log("Total RA students:", totalRA);

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
            <th key={col.key} colSpan="3" className="text-center">
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
        {processedStudents.length === 0 ? (
          <tr>
            <td>1</td>
            <td>KMU-001</td>
            <td>Student Name</td>
            <td>Father Name</td>
            <td>REG-2024</td>
            <td>Discipline Name</td>
            <td>KMU IHS-Swat</td>

            {columns.map((col, i) => (
              <React.Fragment key={col.key + i}>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </React.Fragment>
            ))}
          </tr>
        ) : (
          processedStudents.map((student, index) => {
            // ✅ subject matching map for this student
            const subjectMap = buildStudentSubjectMap(student);

            return (
              <tr
                key={student.rollNumber + index}
                className={student.isRA ? "ra-row" : ""}
              >
                {/* ✅ CUSTOM SERIAL */}
                <td>{student.serial}</td>

                {/* ✅ ROLL NUMBER + RA FLAG */}
                <td style={{ textWrap: "nowrap" }}>{student.rollNumber}</td>

                <td>{student.name}</td>
                <td>{student.fatherName}</td>
                <td>{student.registration}</td>
                <td>{student.Discipline}</td>
                <td>{student.institute}</td>

                {columns.map((col, i) => {
                  // Determine which subject to match
                  const subjectName =
                    col.type === "ospe"
                      ? col.baseSubject // match same base subject for OSPE
                      : col.key;

                  const found = subjectMap.get(normalizeText(subjectName));

                  // If you later add separate OSPE marks, use found.ospeMid/final here.
                  const mid =
                    col.type === "ospe"
                      ? found?.ospeMid ?? ""
                      : found?.mid ?? "";
                  const final =
                    col.type === "ospe"
                      ? found?.ospeFinal ?? ""
                      : found?.final ?? "";

                  const midDisplay = found ? (mid === "" ? "NA" : mid) : "NA";
                  const finalDisplay = found
                    ? final === ""
                      ? "NA"
                      : final
                    : "NA";

                  // total calculation
                  const midNum = toNumberOrNa(midDisplay);
                  const finalNum = toNumberOrNa(finalDisplay);
                  const totalDisplay =
                    Number.isFinite(midNum) && Number.isFinite(finalNum)
                      ? midNum + finalNum
                      : "NA";

                  return (
                    <React.Fragment key={col.key + i}>
                      <td>{midDisplay}</td>
                      <td>{finalDisplay}</td>
                      <td>{totalDisplay}</td>
                    </React.Fragment>
                  );
                })}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
};

export default SheetTable;
