import { createContext, useContext, useState } from "react";

export const SubjectContext = createContext();

export const useSubject = () => useContext(SubjectContext);

export const SubjectContextProvider = ({ children }) => {
  const [subjects, setSubjects] = useState([]);

  const saveSubjects = (data) => {
    setSubjects(data);
  };
  return (
    <SubjectContext.Provider value={{ subjects, setSubjects, saveSubjects }}>
      {children}
    </SubjectContext.Provider>
  );
};
