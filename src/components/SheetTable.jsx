import React, { useMemo } from "react";
import { useSubject } from "../context/SubjectContext";
import TableRows from "./tableItems/TableRows";
import { LuSearchX, LuFilterX } from "react-icons/lu";

const hasRA = (rollNumber) =>
  String(rollNumber || "")
    .toUpperCase()
    .includes("RA");

const parseRollNumber = (value) => {
  if (!value) return null;
  const numeric = Number(String(value).replace(/[^0-9]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
};

const norm = (v) =>
  String(v ?? "")
    .trim()
    .toLowerCase();

const buildColumns = (subjects) =>
  (subjects || []).flatMap((s) => {
    const baseMid = Number(s.maxMid) || 0;
    const baseFinal = Number(s.maxFinal) || 0;

    const base = [
      {
        label: s.subject,
        key: s.subject,
        maxMid: baseMid,
        maxFinal: baseFinal,
      },
    ];
    if (s.ospe) {
      base.push({
        label: `${s.subject} - OSPE`,
        key: `${s.subject}-ospe`,
        maxMid: s.ospeMaxMid !== undefined && s.ospeMaxMid !== "" ? Number(s.ospeMaxMid) || 0 : baseMid,
        maxFinal: s.ospeMaxFinal !== undefined && s.ospeMaxFinal !== "" ? Number(s.ospeMaxFinal) || 0 : baseFinal,
      });
    }
    return base;
  });

const possibleKeysForColumn = (label) => {
  const l = norm(label);
  if (l.endsWith("- ospe") || l.includes(" - ospe")) {
    const b = l.replace(/\s*-\s*ospe\s*$/, "").trim();
    return [l, `${b} - ospe`, `${b}-ospe`];
  }
  return [l];
};

const checkStudentFailed = (student, columns) => {
  let totalApplicable = 0;
  let failed = 0;
  let hasAnyMarks = false;

  columns.forEach((item) => {
    const keys = possibleKeysForColumn(item.label);
    const matchedSubject = (student.subjects || []).find((s) => {
      if (!s) return false;
      const subjectName = norm(s?.label ?? s?.name ?? s?.subject ?? s?.subjectName ?? s?.title);
      return keys.includes(subjectName);
    });

    if (!matchedSubject) return;

    const maxTotal = item.maxMid + item.maxFinal;
    const mid = parseFloat(matchedSubject.mid);
    const final = parseFloat(matchedSubject.final);
    const obtained = (!isNaN(mid) && !isNaN(final)) ? mid + final : parseFloat(matchedSubject.total);

    if (!isNaN(obtained)) {
      hasAnyMarks = true;
      totalApplicable++;
      if (maxTotal > 0 && obtained < maxTotal * 0.5) {
        failed++;
      }
    }
  });

  return hasAnyMarks && totalApplicable > 0 && failed >= Math.ceil(totalApplicable / 2);
};

const SheetTable = ({
  searchQuery = "",
  statusFilter = "all",
  instituteFilter = "all",
  onResetFilters,
}) => {
  const { subjects, studentsData } = useSubject();

  const columns = useMemo(() => buildColumns(subjects), [subjects]);

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

    // Compute serials by group
    const countsByGroup = new Map();
    const withSerials = sorted.map((student) => {
      const isRA = hasRA(student.rollNumber);
      const institute = String(student?.institute || "")
        .trim()
        .toUpperCase();
      const groupKey = `${institute}__${isRA ? "RA" : "NON_RA"}`;

      const currentSerial = (countsByGroup.get(groupKey) || 0) + 1;
      countsByGroup.set(groupKey, currentSerial);

      const isFailed = checkStudentFailed(student, columns);

      return {
        ...student,
        serial: currentSerial,
        isRA,
        isFailed,
      };
    });

    // Apply Filters
    return withSerials.filter((student) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = norm(searchQuery);
        const name = norm(student.name);
        const roll = norm(student.rollNumber);
        const reg = norm(student.registration);
        const father = norm(student.fatherName);
        const inst = norm(student.institute);
        const disc = norm(student.Discipline);

        const matchesSearch =
          name.includes(q) ||
          roll.includes(q) ||
          reg.includes(q) ||
          father.includes(q) ||
          inst.includes(q) ||
          disc.includes(q);

        if (!matchesSearch) return false;
      }

      // 2. Status filter
      if (statusFilter === "passed" && student.isFailed) return false;
      if (statusFilter === "failed" && !student.isFailed) return false;
      if (statusFilter === "regular" && student.isRA) return false;
      if (statusFilter === "reappear" && !student.isRA) return false;

      // 3. Institute filter
      if (instituteFilter !== "all" && student.institute !== instituteFilter) {
        return false;
      }

      return true;
    });
  }, [studentsData, columns, searchQuery, statusFilter, instituteFilter]);

  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter !== "all" || instituteFilter !== "all";

  return (
    <table className="customTable resultTable" style={{ textWrap: "nowrap" }}>
      <thead>
        <tr>
          <th rowSpan="2" style={{ width: "50px" }}>S#</th>
          <th rowSpan="2">Roll #</th>
          <th rowSpan="2">Student Name</th>
          <th rowSpan="2">Father's Name</th>
          <th rowSpan="2">Registration</th>
          <th rowSpan="2">Discipline</th>
          <th rowSpan="2" style={{ width: "110px" }}>Type</th>
          <th rowSpan="2">Institute</th>

          {columns.map((col) => (
            <th
              key={col.key}
              colSpan="3"
              className="text-center"
              style={{ textTransform: "capitalize" }}
            >
              {col.label}
            </th>
          ))}
          <th rowSpan="2" className="text-center" style={{ width: "80px" }}>Status</th>
          <th rowSpan="2" className="text-center" style={{ width: "70px" }}>Action</th>
        </tr>

        <tr>
          {columns.map((col) => (
            <React.Fragment key={col.key}>
              <th className="text-center">Mid</th>
              <th className="text-center">Final</th>
              <th className="text-center">Total</th>
            </React.Fragment>
          ))}
        </tr>
      </thead>

      <tbody>
        {processedStudents.length === 0 && (studentsData?.length > 0) ? (
          <tr>
            <td colSpan={10 + columns.length * 3} className="text-center py-5">
              <div className="d-flex flex-column align-items-center justify-content-center text-muted">
                <LuSearchX size={36} className="mb-2 text-secondary opacity-50" />
                <h6 className="fw-bold text-dark mb-1">No matching student records found</h6>
                <p className="small mb-3">No students match your active search or filter criteria.</p>
                {hasActiveFilters && onResetFilters && (
                  <button
                    onClick={onResetFilters}
                    className="btn-sc btn-sc-outline btn-sc-sm d-flex align-items-center gap-1"
                  >
                    <LuFilterX size={14} />
                    <span>Clear Search & Filters</span>
                  </button>
                )}
              </div>
            </td>
          </tr>
        ) : (
          <TableRows processedStudents={processedStudents} columns={columns} />
        )}
      </tbody>
    </table>
  );
};

export default SheetTable;
