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
import {
  formatMidMarks,
  mergeMidMarksData,
  formatFinalMarks,
  mergeFinalMarksData,
} from "../utils/marksSheetFormater";
import FinalMarksUploader from "../components/upload/FinalMarksUploader";

export default function UploadFiles() {
  const [file1Data, setFile1Data] = useState(null);
  const [file2Data, setFile2Data] = useState(null);
  const [midMarksData, setMidMarksData] = useState(null);

  const [show, setShow] = useState(false);
  const [activeDropzone, setActiveDropzone] = useState("ospelist");
  const [isPending, startTransition] = useTransition();

  const { saveAllStudentData, studentsData, addData, clearAll, subjects } =
    useSubject();
  const navigate = useNavigate();

  // ── Step tracking persisted in localStorage so buttons survive reload ──
  const uploadStep = Number(localStorage.getItem("uploadStep") || "0");
  const setUploadStep = (step) =>
    localStorage.setItem("uploadStep", String(step));

  const hasStudentsData = studentsData?.length > 0 || uploadStep >= 1;
  const hasReAppearData = uploadStep >= 2;

  /* ===============================
     STEP 1 – Upload OSPE / Marks
  =============================== */
  const handleMultipleFilesOspeSheetDataData = (allFilesData) => {
    const merged = allFilesData.flatMap(({ fileName, data }) =>
      transformExcelData(data, fileName),
    );
    setFile1Data(merged);
    saveAllStudentData(merged);
    setUploadStep(1);
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
      const base = file1Data || studentsData;
      if (base?.length) {
        const merged = mergeFileData(base, mapped);
        saveAllStudentData(merged);
      }
      setUploadStep(2);
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
      const base = file1Data || studentsData;
      if (base?.length) {
        const merged = mergeFileData(base, mapped);
        addData(merged);
      }
      setShow(false);
      alert("Add successfully");
    });
  };

  /* ===============================
     STEP 5 – Upload Mid Marks
  =============================== */
  const handleUploadMidMarksData = (allFiles) => {
    const formatted = formatMidMarks(allFiles.map((f) => f.data));
    setMidMarksData(formatted);
    if (studentsData?.length && formatted?.length) {
      const merged = mergeMidMarksData(studentsData, formatted);
      saveAllStudentData(merged);
    }
    setShow(false);
    alert("Mid marks uploaded successfully.");
  };

  /* ===============================
     STEP 6 – Upload Final Marks 
  =============================== */
  const handleUploadFinalMarksData = (selectedSubject, allFiles) => {
    if (!selectedSubject) {
      alert("Please select a subject before uploading final marks.");
      return;
    }

    // allFiles is [{ fileName, data: rawRows[] }]
    const formatted = formatFinalMarks(
      allFiles.map((f) => f.data),
      selectedSubject,
    );

    if (!formatted.length) {
      alert("No valid student data found in the uploaded file.");
      return;
    }

    if (!studentsData?.length) {
      alert("Please upload student data first.");
      return;
    }

    const { merged, noMatchCount, subjectNotFoundCount } = mergeFinalMarksData(
      studentsData,
      formatted,
      selectedSubject,
    );

    // ── Warn the user if the subject didn't match ─────────────────────────
    if (
      subjectNotFoundCount > 0 &&
      subjectNotFoundCount === studentsData.length
    ) {
      alert(
        `Subject mismatch: "${selectedSubject}" was not found in any student's subject list. ` +
          `Please make sure you selected the correct subject. No marks were updated.`,
      );
      return; // abort — don't save bad data
    }

    if (subjectNotFoundCount > 0) {
      alert(
        `Warning: "${selectedSubject}" was not found for ${subjectNotFoundCount} student(s). ` +
          `Their final marks were left unchanged.`,
      );
    }

    if (noMatchCount > 0) {
      console.warn(
        `${noMatchCount} students had no matching row in the uploaded file.`,
      );
    }

    saveAllStudentData(merged);
    setShow(false);
    alert(`Final marks for "${selectedSubject}" uploaded successfully.`);
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

  const handleClear = async () => {
    await clearAll();
    setFile1Data(null);
    setFile2Data(null);
    setMidMarksData(null);
    setUploadStep(0);
    localStorage.removeItem("uploadStep");
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
  };

  const handleUploadFinalMarks = () => {
    setActiveDropzone("finalMarks");
    setShow(true);
  };

  return (
    <>
      <div className="tableHeader">
        <div className="buttonWrapper d-flex align-items-center gap-2">
          {!hasStudentsData && (
            <button
              className="btn btn-primary"
              onClick={handleUploadOspeStudentData}
            >
              Upload Students Data
            </button>
          )}

          {hasStudentsData && !hasReAppearData && (
            <button
              className="btn btn-danger"
              onClick={HandleReAppearStudentData}
            >
              Upload Re Appear Data
            </button>
          )}

          {hasStudentsData && hasReAppearData && (
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

          {hasStudentsData && (
            <button className="btn btn-warning" onClick={handleClear}>
              Clear
            </button>
          )}
        </div>

        <div className="d-flex align-items-center gap-2">
          {hasStudentsData && hasReAppearData && (
            <>
              <button
                className="btn btn-success text-white"
                onClick={handleUploadMidMarks}
              >
                Upload Mid Marks
              </button>
              <button
                className="btn btn-info text-white"
                onClick={handleUploadFinalMarks}
              >
                Upload Final Marks
              </button>
            </>
          )}
        </div>

        <p className="countText">
          Total Students: ({studentsData?.length ?? 0})
        </p>
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

              {activeDropzone === "finalMarks" && (
                <FinalMarksUploader
                  subjects={subjects}
                  studentsData={studentsData}
                  onUpload={handleUploadFinalMarksData}
                />
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
