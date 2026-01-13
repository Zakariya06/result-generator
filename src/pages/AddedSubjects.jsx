import { useNavigate } from "react-router-dom";
import { useSubject } from "../context/SubjectContext";

export default function AddedSubjects() {
  const { subjects } = useSubject();
  const navigate = useNavigate();

  return (
    <div className="pageCenter">
      <div className="cardLarge">
        <h2>Generated Subjects</h2>

        {subjects.length === 0 ? (
          <p>No subjects found</p>
        ) : (
          <table className="customTable">
            <thead>
              <tr>
                <th>#</th>
                <th>Subject</th>
                <th>OSPE</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.subject}</td>
                  <td>
                    <span
                      className={item.ospe ? "ospeBadgeYes" : "ospeBadgeNo"}
                    >
                      {item.ospe ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button
          className="primaryButton"
          style={{ marginTop: "1.5rem" }}
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>
    </div>
  );
}
