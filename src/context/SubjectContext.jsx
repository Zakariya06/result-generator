import { createContext, useContext, useState } from "react";

export const SubjectContext = createContext();

export const useSubject = () => useContext(SubjectContext);

export const SubjectContextProvider = ({ children }) => {
  const [subjects, setSubjects] = useState([]);
  const [studentsData, setStudentsData] = useState([]);

  const saveSubjects = (data) => {
    setSubjects(data);
  };

  const saveAllStudentData = (data) => {
    setStudentsData(data);
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
      }}
    >
      {children}
    </SubjectContext.Provider>
  );
};
