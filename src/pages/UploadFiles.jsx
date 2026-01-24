import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ExcelDropzone from "../components/ExcelDropzone";
import {
  transformExcelData,
  transformStudentListFiles,
  mergeFileData,
} from "../utils/excelTransform";
import { useSubject } from "../context/SubjectContext";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

export default function UploadFiles() {
  const [file1Data, setFile1Data] = useState(null);
  const [file2Data, setFile2Data] = useState(null);
  const [show, setShow] = useState(false);
  const { saveAllStudentData, studentsData } = useSubject();

  const navigate = useNavigate();

  // STEP 1 – Upload OSPE / Marks sheets (MULTIPLE)
  const handleMultipleFilesOspeSheetDataData = (allFilesData) => {
    const merged = allFilesData.flatMap(({ fileName, data }) =>
      transformExcelData(data, fileName),
    );

    setFile1Data(merged);
    setShow(false);
    alert("Upload successful. Now upload Re-Appear / Subject files");
  };

  // STEP 2 – Upload Re-Appear / Subject lists (MULTIPLE)
  const handleReaAppearStudentData = (allFiles) => {
    const mapped = transformStudentListFiles(allFiles);
    setFile2Data(mapped);

    if (file1Data) {
      setShow(false);
      const merged = mergeFileData(file1Data, mapped);
      console.log("This merged data", merged);
      saveAllStudentData(merged); 
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
  };

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <div className="buttonWrapper d-flex align-items-center gap-2">
        {!file1Data ? (
          <button className="btn btn-primary" onClick={handleShow}>
            Upload Students Data
          </button>
        ) : (
          !file2Data && (
            <button className="btn btn-danger" onClick={handleShow}>
              Upload Re Appear Data
            </button>
          )
        )}

        {file1Data && file2Data && (
          <button className="btn btn-danger" onClick={handleClear}>
            Clear
          </button>
        )}
      </div>

      <Modal centered size="lg" show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Your Excel Files Here</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
        </Modal.Body>
      </Modal>

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
