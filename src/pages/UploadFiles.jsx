import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ExcelDropzone from "../components/ExcelDropzone";
import {
  transformExcelData,
  transformStudentListFiles,
  mergeFileData,
} from "../utils/excelTransform";
import { useSubject } from "../context/SubjectContext";
import Modal from "react-bootstrap/Modal";

export default function UploadFiles() {
  const [file1Data, setFile1Data] = useState(null);
  const [file2Data, setFile2Data] = useState(null);
  const [show, setShow] = useState(false);
  const [activeDropzone, setActiveDropzone] = useState("ospelist");

  const { saveAllStudentData, studentsData, addData } = useSubject();
  const navigate = useNavigate();

  // STEP 1 – Upload OSPE / Marks sheets (MULTIPLE)
  const handleMultipleFilesOspeSheetDataData = (allFilesData) => {
    const merged = allFilesData.flatMap(({ fileName, data }) =>
      transformExcelData(data, fileName),
    );

    setFile1Data(merged);
    saveAllStudentData(merged);

    setShow(false);
    alert("Upload successful. Now upload Re-Appear / Subject files");
  };

  // STEP 2 – Upload Re-Appear / Subject lists (MULTIPLE)
  const handleReaAppearStudentData = (allFiles) => {
    const mapped = transformStudentListFiles(allFiles);
    setFile2Data(mapped);

    if (file1Data) {
      const merged = mergeFileData(file1Data, mapped);
      setShow(false);
      saveAllStudentData(merged);
    }
  };

  // STEP 3 - ADD OSPE / MARK SHEETS (MULTIPLE)
  const handleAddMultipleFilesOspeSheetDataData = (addFiles) => {
    const merged = addFiles.flatMap(({ fileName, data }) =>
      transformExcelData(data, fileName),
    );

    // ✅ spread arrays (no nested arrays)
    setFile1Data((prev) => [...(prev || []), ...merged]);

    // ✅ dedupe + merge in context
    addData(merged);

    setShow(false);
    alert("Add successfully");
  };

  // STEP 4 – ADD Re-Appear / Subject lists (MULTIPLE)
  const handleAddReaAppearStudentData = (addFiles) => {
    const mapped = transformStudentListFiles(addFiles);

    const mappedItems = Array.isArray(mapped) ? mapped : [mapped];
    setFile2Data((prev) => [...(prev || []), ...mappedItems]);

    if (file1Data) {
      const merged = mergeFileData(file1Data, mapped); 
      addData(merged);

      setShow(false);
      alert("Add successfully");
    }
  };

  const handleNext = () => {
    if (!studentsData?.length) {
      alert("Please upload both Excel files");
      return;
    }
    navigate("/subjects");
  };

  const handleClear = () => {
    saveAllStudentData([]);
    setFile1Data(null);
    setFile2Data(null);
    setActiveDropzone("ospelist");
  };

  // Upload modal openers
  const handleUploadOspeStudentData = () => {
    setActiveDropzone("ospelist");
    setShow(true);
  };

  const HandleReAppearStudentData = () => {
    setActiveDropzone("studentlist");
    setShow(true);
  };

  const handleAddUploadOspeStudentData = () => {
    setActiveDropzone("addMoreOspelist");
    setShow(true);
  };

  const HandleAddReAppearStudentData = () => {
    setActiveDropzone("addMoreStudenlist");
    setShow(true);
  };

  return (
    <>
      <div className="buttonWrapper d-flex align-items-center gap-2">
        {!file1Data ? (
          <button className="btn btn-primary" onClick={handleUploadOspeStudentData}>
            Upload Students Data
          </button>
        ) : (
          !file2Data && (
            <button className="btn btn-danger" onClick={HandleReAppearStudentData}>
              Upload Re Appear Data
            </button>
          )
        )}

        {file1Data && file2Data && (
          <>
            <button className="btn btn-primary" onClick={handleAddUploadOspeStudentData}>
              Add More Students Data
            </button>
            <button className="btn btn-danger" onClick={HandleAddReAppearStudentData}>
              Add More Re Appear Data
            </button>
          </>
        )}

        {file1Data && (
          <button className="btn btn-warning" onClick={handleClear}>
            Clear
          </button>
        )}
      </div>

      <Modal centered size="md" show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Your Excel Files Here</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {activeDropzone === "ospelist" && (
            <ExcelDropzone
              label="Upload Student Details OSPE"
              onData={handleMultipleFilesOspeSheetDataData}
            />
          )}

          {activeDropzone === "studentlist" && (
            <ExcelDropzone
              label="Upload Re-Appear / Subject Details"
              onData={handleReaAppearStudentData}
            />
          )}

          {activeDropzone === "addMoreOspelist" && (
            <ExcelDropzone
              label="Upload Student Details OSPE"
              onData={handleAddMultipleFilesOspeSheetDataData}
            />
          )}

          {activeDropzone === "addMoreStudenlist" && (
            <ExcelDropzone
              label="Upload Re-Appear / Subject Details"
              onData={handleAddReaAppearStudentData}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Optional Continue Button */}
      {/* {file1Data && file2Data && (
        <div className="buttonRow">
          <button className="secondaryButton" onClick={handleNext}>
            Continue
          </button>
        </div>
      )} */}
    </>
  );
}
