import DownloadExcelBar from "../components/DownloadExcelButton";
import SheetTable from "../components/SheetTable";
import { useSubject } from "../context/SubjectContext";
import TableHeader from "../components/TableHeader";

export default function MarksSheet() {
  const { studentsData } = useSubject();

  return (
    <div style={{ padding: "2.5rem 1.5rem" }}>
      <div className="cardLarge" style={{ width: "100%", maxWidth: "100%" }}>
        <TableHeader />
        <div style={{ width: "100%", maxWidth: "100%", overflowX: "auto" }}>
          <SheetTable />
        </div>
      </div>

      <DownloadExcelBar />
    </div>
  );
}
