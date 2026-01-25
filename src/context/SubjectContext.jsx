import { createContext, useContext, useState } from "react";

export const SubjectContext = createContext();
export const useSubject = () => useContext(SubjectContext);
 
const normalize = (v) => String(v || "").trim().toUpperCase();
const studentKey = (s) => {
  const roll = normalize(s?.rollNumber);
  const inst = normalize(s?.institute); 
  return `${roll}__${inst}`;
};

export const SubjectContextProvider = ({ children }) => {
  const [subjects, setSubjects] = useState([]);
  const [studentsData, setStudentsData] = useState([]);

  const saveSubjects = (data) => setSubjects(data);
  const saveAllStudentData = (data) => setStudentsData(data);

  const addData = (data) => {
    const items = Array.isArray(data) ? data : [data];

    setStudentsData((prev) => {
      const map = new Map();

      // keep existing
      for (const s of prev || []) {
        map.set(studentKey(s), s);
      }

      for (const s of items) {
        const key = studentKey(s);
        const old = map.get(key);
        map.set(key, old ? { ...old, ...s } : s);
      }

      return Array.from(map.values());
    });
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
      }}
    >
      {children}
    </SubjectContext.Provider>
  );
};
