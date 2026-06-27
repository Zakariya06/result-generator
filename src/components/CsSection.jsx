import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubject } from "../context/SubjectContext";

export default function CsSection() {
  const [count, setCount] = useState("");
  const [subjects, setSubjects] = useState([]);

  const { saveSubjects } = useSubject();
  const navigate = useNavigate();

  const handleCountChange = (value) => {
    setCount(value);
    setSubjects(
      Array.from({ length: value }, () => ({
        subject: "",
        ospe: null,
        maxMid: "",
        maxFinal: "",
      })),
    );
  };

  const updateSubject = (index, key, value) => {
    const updated = [...subjects];
    updated[index][key] = value;
    setSubjects(updated);
  };

  const handleGenerate = () => {
    const hasEmptyField = subjects.some(
      (s) =>
        s.subject.trim() === "" ||
        s.ospe === null ||
        s.maxMid === "" ||
        s.maxFinal === "",
    );

    if (hasEmptyField) {
      alert("Please fill all the fields");
      return;
    }

    saveSubjects(subjects);
    navigate("/sheet");
  };

  return (
    <div className="csSection">
      <label className="labelText">How many paper you have</label>

      <select
        className="inputField"
        value={count}
        onChange={(e) => handleCountChange(Number(e.target.value))}
      >
        <option value="">Select</option>
        {[...Array(10)].map((_, i) => (
          <option key={i} value={i + 1}>
            {i + 1}
          </option>
        ))}
      </select>

      {subjects.length > 0 && (
        <>
          <table className="customTable">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>Subject</th>
                <th>OSPE</th>
                <th>Max Mid</th>
                <th>Max Final</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <input
                      className="tableInput"
                      placeholder="Enter subject"
                      value={item.subject}
                      onChange={(e) =>
                        updateSubject(index, "subject", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <div className="radioGroup">
                      <label>
                        <input
                          type="radio"
                          name={`ospe-${index}`}
                          checked={item.ospe === true}
                          onChange={() => updateSubject(index, "ospe", true)}
                          className="me-1"
                        />
                        Yes
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={`ospe-${index}`}
                          checked={item.ospe === false}
                          onChange={() => updateSubject(index, "ospe", false)}
                          className="me-1"
                        />
                        No
                      </label>
                    </div>
                  </td>
                  <td>
                    <input
                      className="tableInput"
                      type="number"
                      placeholder="Max Mid"
                      value={item.maxMid}
                      style={{ maxWidth: "80px", paddingRight: "1px" }}
                      onChange={(e) =>
                        updateSubject(index, "maxMid", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="tableInput"
                      type="number"
                      placeholder="Max Final"
                      style={{ maxWidth: "80px", paddingRight: "1px" }}
                      value={item.maxFinal}
                      onChange={(e) =>
                        updateSubject(index, "maxFinal", e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="buttonRow" style={{ marginTop: "1rem" }}>
            <button className="secondaryButton" onClick={handleGenerate}>
              Generate Subject
            </button>

            <button
              className="secondaryButton"
              onClick={() => {
                setSubjects([]);
                setCount("");
              }}
            >
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  );
}
