import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ExcelDropzone from "../components/ExcelDropzone";

export default function UploadFiles() {
  const [file1Data, setFile1Data] = useState(null);
  const [file2Data, setFile2Data] = useState(null);

  const navigate = useNavigate();

  const handleNext = () => {
    if (!file1Data || !file2Data) {
      alert("Please upload both Excel files");
      return;
    }

    navigate("/subjects");
  };

  console.log("File 1:", file1Data);
  console.log("File 2:", file2Data);

  return (
    <div className="pageCenter">
      <div className="cardLarge" style={{ maxWidth: "800px", width: "100%" }}>
        <h2 className="text-center">Upload Excel Files</h2>

        <ExcelDropzone label="Upload Marks Sheet Excel" onData={setFile1Data} />

        <ExcelDropzone
          label="Upload Student List Excel"
          onData={setFile2Data}
        />

        <div className="buttonRow">
          <button className="secondaryButton" onClick={handleNext}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
