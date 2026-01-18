import SheetTable from "../components/SheetTable";
import { useSubject } from "../context/SubjectContext";
import UploadFiles from "./UploadFiles";

export default function MarksSheet() {
  const { subjects, studentsData } = useSubject();

  return (
    <div style={{ padding: "2.5rem 1.5rem" }}>
      <div
        className="cardLarge"
        style={{ overflowX: "auto", width: "100%", maxWidth: "100%" }}
      >
        <div className="tableHeader">
          <UploadFiles />

          <h2 style={{ textAlign: "center" }}>
            <span style={{ color: "a22840", display: "inline-block" }}>
              Khyber Medical University
            </span>{" "}
            - Peshawar
          </h2>

          <p className="countText">{studentsData.length}</p>
        </div>

        <SheetTable />
      </div>
    </div>
  );
}
