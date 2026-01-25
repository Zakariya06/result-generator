import DownloadExcelBar from "../components/DownloadExcelButton";
import SheetTable from "../components/SheetTable";
import { useSubject } from "../context/SubjectContext";
import UploadFiles from "./UploadFiles";

export default function MarksSheet() {
  const { studentsData } = useSubject();

  return (
    <div style={{ padding: "2.5rem 1.5rem" }}>
      <div className="cardLarge" style={{ width: "100%", maxWidth: "100%" }}>
        <div className="tableHeader">
          <UploadFiles />

          <h2 style={{ textAlign: "center" }}>
            <span style={{ color: "a22840", display: "inline-block" }}>
              Khyber Medical University
            </span>{" "}
            - Peshawar
          </h2>

          <p className="countText">Total Students {studentsData?.length}</p>
        </div>
<<<<<<< HEAD:src/pages/SheetPage.jsx
        <SheetTable />
=======

        <div style={{ width: "100%", maxWidth: "100%", overflowX: "auto" }}>
          <SheetTable />
        </div>
>>>>>>> e031d34e8ddff1bb21355db1d95e02d04d692dbf:src/pages/AddedSubjects.jsx
      </div>

      <DownloadExcelBar />
    </div>
  );
}
