import { createContext, useContext, useEffect, useState } from "react";
import {
  saveStudentsToDB,
  getStudentsFromDB,
  clearStudentsDB,
  saveSubjectsToDB,
  getSubjectsFromDB,
  clearSubjectsDB,
} from "../db/studentDB";
import { ensureSubjectEntries } from "../utils/excelTransform";

export const SubjectContext = createContext();
export const useSubject = () => useContext(SubjectContext);

const normalize = (v) =>
  String(v || "")
    .trim()
    .toUpperCase();

const studentKey = (s) => {
  const roll = normalize(s?.rollNumber);
  const inst = normalize(s?.institute);
  return `${roll}__${inst}`;
};

export const SubjectContextProvider = ({ children }) => {
  const [subjects, setSubjects] = useState([]);
  const [studentsData, setStudentsData] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);

  // ── Load from IndexedDB on mount ────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        const [students, savedSubjects] = await Promise.all([
          getStudentsFromDB(),
          getSubjectsFromDB(),
        ]);

        if (savedSubjects?.length) setSubjects(savedSubjects);
        if (students?.length) {
          const withSubjects = savedSubjects?.length
            ? ensureSubjectEntries(students, savedSubjects)
            : students;
          setStudentsData(withSubjects);
        }
      } catch (err) {
        console.error("Failed to load data from IndexedDB:", err);
      }
    };

    loadData();
  }, []);

  // ── Persist students whenever they change ───────────────────────────────
  useEffect(() => {
    if (studentsData?.length) {
      saveStudentsToDB(studentsData).catch((err) =>
        console.error("Failed to save students:", err),
      );
    }
  }, [studentsData]);

  // ── Persist subjects whenever they change ───────────────────────────────
  useEffect(() => {
    if (subjects?.length) {
      saveSubjectsToDB(subjects).catch((err) =>
        console.error("Failed to save subjects:", err),
      );
    }
  }, [subjects]);

  // ── Helpers ─────────────────────────────────────────────────────────────

  const saveSubjects = (data) => {
    setSubjects(data);
    setStudentsData((prev) => (prev?.length ? ensureSubjectEntries(prev, data) : prev));
  };

  const saveAllStudentData = (data) => {
    const withSubjects = subjects?.length ? ensureSubjectEntries(data, subjects) : data;
    setStudentsData(withSubjects);
  };

  const addData = (data) => {
    const items = Array.isArray(data) ? data : [data];

    setStudentsData((prev) => {
      const map = new Map();

      for (const s of prev || []) {
        map.set(studentKey(s), s);
      }

      for (const s of items) {
        const key = studentKey(s);
        const old = map.get(key);
        map.set(key, old ? { ...old, ...s } : s);
      }

      const merged = Array.from(map.values());
      return subjects?.length ? ensureSubjectEntries(merged, subjects) : merged;
    });
  };

  const clearAllStudents = async () => {
    setStudentsData([]);
    localStorage.removeItem("uploadStep");
    await clearStudentsDB();
  };

  const clearAll = async () => {
    setStudentsData([]);
    setSubjects([]);
    localStorage.removeItem("uploadStep");
    await Promise.all([clearStudentsDB(), clearSubjectsDB()]);
  };

  return (
    <SubjectContext.Provider
      value={{
        subjects,
        setSubjects,
        saveSubjects,
        studentsData,
        setStudentsData,
        saveAllStudentData,
        addData,
        clearAllStudents,
        clearAll,
        editingStudent,
        setEditingStudent,
      }}
    >
      {children}
    </SubjectContext.Provider>
  );
};
