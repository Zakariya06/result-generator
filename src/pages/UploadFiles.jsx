import { useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import ExcelDropzone from "../components/ExcelDropzone";
import {
  transformExcelData,
  transformStudentListFiles,
  mergeFileData,
} from "../utils/excelTransform";
import { useSubject } from "../context/SubjectContext";
import Modal from "react-bootstrap/Modal";
import { Spinner } from "react-bootstrap";
import { formatMidMarks, mergeMidMarksData } from "../utils/marksSheetFormater";

export default function UploadFiles() {
  const [file1Data, setFile1Data] = useState(null);
  const [file2Data, setFile2Data] = useState(null);
  const [midMarksData, setMidMarksData] = useState(null);


  const [show, setShow] = useState(false);
  const [activeDropzone, setActiveDropzone] = useState("ospelist");

  const [isPending, startTransition] = useTransition();

  const { saveAllStudentData, studentsData, addData } = useSubject();
  const navigate = useNavigate();

  /* ===============================
     STEP 1 – Upload OSPE / Marks
  =============================== */
  const handleMultipleFilesOspeSheetDataData = (allFilesData) => {
    const merged = allFilesData.flatMap(({ fileName, data }) =>
      transformExcelData(data, fileName),
    );


    setFile1Data(merged);
    saveAllStudentData(merged);

    setShow(false);
    alert("Upload successful. Now upload Re-Appear / Subject files");
  };

  /* ===============================
     STEP 2 – Upload Re-Appear
  =============================== */
  const handleReaAppearStudentData = (allFiles) => {
    startTransition(() => {
      const mapped = transformStudentListFiles(allFiles);
      setFile2Data(mapped);


      console.log("this is institiue data", mapped);

      if (file1Data) {
        const merged = mergeFileData(file1Data, mapped);
        saveAllStudentData(merged);
      }

      setShow(false);
    });
  };

  /* ===============================
     STEP 3 – ADD OSPE / Marks
  =============================== */
  const handleAddMultipleFilesOspeSheetDataData = (addFiles) => {
    const merged = addFiles.flatMap(({ fileName, data }) =>
      transformExcelData(data, fileName),
    );

    setFile1Data((prev) => [...(prev || []), ...merged]);
    addData(merged);

    setShow(false);
    alert("Add successfully");
  };

  /* ===============================
     STEP 4 – ADD Re-Appear
  =============================== */
  const handleAddReaAppearStudentData = (addFiles) => {
    startTransition(() => {
      const mapped = transformStudentListFiles(addFiles);
      const mappedItems = Array.isArray(mapped) ? mapped : [mapped];

      setFile2Data((prev) => [...(prev || []), ...mappedItems]);

      if (file1Data) {
        const merged = mergeFileData(file1Data, mapped);
        addData(merged);
      }

      setShow(false);
      alert("Add successfully");
    });
  };

  /* ===============================
     Navigation / Clear
  =============================== */
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

  /* ===============================
     Modal Controls
  =============================== */
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

  const handleUploadMidMarks = () => {
    setActiveDropzone("midMarks");
    setShow(true);
  }




  // STEP 5 – Upload Mid Marks
  const handleUploadMidMarksData = (allFiles) => {
    const formatted = formatMidMarks(allFiles.map(f => f.data));
    setMidMarksData(formatted);
    if (studentsData && formatted) {
      const merged = mergeMidMarksData(studentsData, formatted);
      saveAllStudentData(merged);
    }
    setShow(false);
    alert("Upload successful. Now upload Final Marks. This will also update the students data");
  }

  return (
    <>
      <div className="tableHeader">
        <div className="buttonWrapper d-flex align-items-center gap-2">
          {!file1Data ? (
            <button
              className="btn btn-primary"
              onClick={handleUploadOspeStudentData}
            >
              Upload Students Data
            </button>
          ) : (
            !file2Data && (
              <button
                className="btn btn-danger"
                onClick={HandleReAppearStudentData}
              >
                Upload Re Appear Data
              </button>
            )
          )}

          {file1Data && file2Data && (
            <>
              <button
                className="btn btn-primary"
                onClick={handleAddUploadOspeStudentData}
              >
                Add More Students Data
              </button>
              <button
                className="btn btn-danger"
                onClick={HandleAddReAppearStudentData}
              >
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

        <div>
          {file1Data && file2Data && (
            <button className="btn btn-success text-white" onClick={handleUploadMidMarks}>
              Upload Mid Marks
            </button>
          )}
        </div>




        <p className="countText">Total Students{studentsData?.length}</p>


      </div>

      <Modal centered size="md" show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Your Excel Files Here</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {isPending ? (
            <div className="d-flex align-items-center justify-content-center py-5 px-3">
              <Spinner variant="primary" animation="border" />
              <span className="ms-2">Files Comparing...</span>
            </div>
          ) : (
            <>
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
              {activeDropzone === "midMarks" && (
                <ExcelDropzone
                  label="Upload Mid Marks"
                  onData={handleUploadMidMarksData}
                />
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
