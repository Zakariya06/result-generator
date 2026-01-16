import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ExcelDropzone from "../components/ExcelDropzone";
import {
  transformExcelData,
  transformStudentListFiles,
  mergeFileData,
} from "../utils/excelTransform";
import { useSubject } from "../context/SubjectContext";

export default function UploadFiles() {
  const [file1Data, setFile1Data] = useState(null);
  const [file2Data, setFile2Data] = useState(null);
  const { saveAllStudentData, studentsData } = useSubject();

  const navigate = useNavigate();

  // STEP 1 – Upload OSPE / Marks sheets (MULTIPLE)
  const handleMultipleFilesOspeSheetDataData = (allFilesData) => {
    const merged = allFilesData.flatMap(({ fileName, data }) =>
      transformExcelData(data, fileName)
    );

    setFile1Data(merged);
    alert("Upload successful. Now upload Re-Appear / Subject files");
  };

  // STEP 2 – Upload Re-Appear / Subject lists (MULTIPLE)
  const handleReaAppearStudentData = (allFiles) => {
    const mapped = transformStudentListFiles(allFiles);
    setFile2Data(mapped);

    if (file1Data) {
      const merged = mergeFileData(file1Data, mapped);
      saveAllStudentData(merged);
      console.log("Merged student data saved in context:", merged);
    }
  };

  const handleNext = () => {
    if (!studentsData?.length) {
      alert("Please upload both Excel files");
      return;
    }
    navigate("/subjects");
  };

  return (
    <div className="pageCenter">
      <div className="cardLarge" style={{ maxWidth: "800px", width: "100%" }}>
        <h2 className="text-center">Upload Excel Files</h2>

        {!file1Data ? (
          <ExcelDropzone
            label="Upload Student Details OSPE"
            onData={handleMultipleFilesOspeSheetDataData}
          />
        ) : (
          <ExcelDropzone
            label="Upload Re-Appear / Subject Details"
            onData={handleReaAppearStudentData}
          />
        )}

        {file1Data && file2Data && (
          <div className="buttonRow">
            <button className="secondaryButton" onClick={handleNext}>
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
