import { useState, useTransition, useEffect } from "react"; // <-- Added useEffect here
import { useNavigate } from "react-router-dom";
import ExcelDropzone from "../components/ExcelDropzone";
import {
  transformExcelData,
  transformStudentListFiles,
  mergeFileData,
  ensureSubjectEntries,
} from "../utils/excelTransform";
import { useSubject } from "../context/SubjectContext";
import Modal from "react-bootstrap/Modal";
import { Spinner } from "react-bootstrap";
import {
  formatMidMarks,
  mergeMidMarksData,
  formatFinalMarks,
  mergeFinalMarksData,
  formatFinalMarksOnlineOspe,
  formatFinalMarksPhysical,
} from "../utils/marksSheetFormater";
import FinalMarksUploader from "../components/upload/FinalMarksUploader";
import StudentFormModal from "../components/modals/StudentFormModal";
import {
  LuUpload,
  LuFilePlus,
  LuPlus,
  LuRotateCcw,
  LuFileSpreadsheet,
  LuSparkles,
} from "react-icons/lu";

export default function UploadFiles() {
  const [file1Data, setFile1Data] = useState(null);
  const [file2Data, setFile2Data] = useState(null);
  const [midMarksData, setMidMarksData] = useState(null);

  const [show, setShow] = useState(false);
  const [activeDropzone, setActiveDropzone] = useState("ospelist");
  const [isPending, startTransition] = useTransition();

  // Modal State for Add/Edit
  const [showStudentModal, setShowStudentModal] = useState(false);

  const {
    saveAllStudentData,
    studentsData,
    addData,
    clearAllStudents,
    subjects,
    editingStudent,
    setEditingStudent,
  } = useSubject();

  const navigate = useNavigate();

  const uploadStep = Number(localStorage.getItem("uploadStep") || "0");
  const setUploadStep = (step) =>
    localStorage.setItem("uploadStep", String(step));

  const hasStudentsData = studentsData?.length > 0 || uploadStep >= 1;
  const hasReAppearData = uploadStep >= 2;

  // ── FIX: Listen for editingStudent changes and open modal ────────────
  useEffect(() => {
    if (editingStudent) {
      setShowStudentModal(true);
    }
  }, [editingStudent]);
  // ────────────────────────────────────────────────────────────────────────

  // ── Add / Edit Modal Handlers ──────────────────────────────────────────
  const handleAddNewRecord = () => {
    setEditingStudent(null);
    setShowStudentModal(true);
  };

  // Close edit/add modal
  const handleCloseStudentModal = () => {
    setShowStudentModal(false);
    setEditingStudent(null); // Clear editing state on close
  };

  // Save logic for Add/Edit
  const handleSaveStudent = async (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (editingStudent) {
          // Update existing
          const updated = studentsData.map((s) =>
            s.rollNumber === data.rollNumber ? data : s,
          );
          saveAllStudentData(updated);
        } else {
          // Add new
          addData(data);
        }
        resolve();
      }, 600); // Artificial delay for cool loader effect
    });
  };
  // ────────────────────────────────────────────────────────────────────────

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

  const handleReaAppearStudentData = (allFiles) => {
    startTransition(() => {
      const mapped = transformStudentListFiles(allFiles);
      setFile2Data(mapped);
      const base = file1Data || studentsData;
      if (base?.length) {
        let merged = mergeFileData(base, mapped);
        merged = ensureSubjectEntries(merged, subjects);
        saveAllStudentData(merged);
      }
      setUploadStep(2);
      setShow(false);
    });
  };

  const handleAddMultipleFilesOspeSheetDataData = (addFiles) => {
    const merged = addFiles.flatMap(({ fileName, data }) =>
      transformExcelData(data, fileName),
    );
    setFile1Data((prev) => [...(prev || []), ...merged]);
    addData(merged);
    setShow(false);
    alert("Add successfully");
  };

  const handleAddReAppearStudentData = (addFiles) => {
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

  const handleUploadMidMarksData = (allFiles) => {
    console.group("🚀 handleUploadMidMarksData triggered");
    console.log("Raw files uploaded:", allFiles);
    console.log("Current subjects in context:", subjects);
    console.log("Current students in context:", studentsData);

    const base = ensureSubjectEntries(studentsData, subjects);
    const formatted = formatMidMarks(allFiles.map((f) => f.data));
    setMidMarksData(formatted);

    console.log("Parsed mid marks count:", formatted?.length);
    console.log("Base students to merge into:", base?.length);

    if (base?.length && formatted?.length) {
      const merged = mergeMidMarksData(base, formatted);
      console.log("Merged students result:", merged);
      saveAllStudentData(merged);
      alert(`Mid marks uploaded successfully! Processed ${formatted.length} students.`);
    } else {
      console.warn("Could not merge mid marks: base or formatted data is empty.", {
        baseCount: base?.length,
        formattedCount: formatted?.length,
      });
      alert(
        `Uploaded mid marks file had ${formatted?.length || 0} student rows and found ${base?.length || 0} existing students in the system. Check console for details.`
      );
    }
    console.groupEnd();
    setShow(false);
  };

  const handleUploadFinalMarksData = (
    selectedSubject,
    allFiles,
    { mode, isOspe } = {},
  ) => {
    if (!selectedSubject) {
      alert("Please select a subject before uploading final marks.");
      return;
    }
    if (!studentsData?.length) {
      alert("Please upload student data first.");
      return;
    }

    let formatted;
    let targetSubjectLabel = selectedSubject;

    if (mode === "physical") {
      formatted = formatFinalMarksPhysical(
        allFiles.map((f) => f.data),
        selectedSubject,
        { isOspe },
      );
      if (isOspe) targetSubjectLabel = `${selectedSubject} - OSPE`;
    } else {
      formatted = isOspe
        ? formatFinalMarksOnlineOspe(
            allFiles.map((f) => f.data),
            selectedSubject,
            allFiles.map((f) => f.rawData),   // pass raw array data for OSPE
          )
        : formatFinalMarks(
            allFiles.map((f) => f.data),
            selectedSubject,
          );
      if (isOspe) targetSubjectLabel = `${selectedSubject} - OSPE`;
    }

    if (!formatted.length) {
      alert("No valid student data found in the uploaded file.");
      return;
    }

    const { merged, noMatchCount, subjectNotFoundCount } = mergeFinalMarksData(
      studentsData,
      formatted,
      targetSubjectLabel,
    );

    if (
      subjectNotFoundCount > 0 &&
      subjectNotFoundCount === studentsData.length
    ) {
      alert(
        `Subject mismatch: "${targetSubjectLabel}" was not found in any student's subject list. ` +
          `No marks were updated.`,
      );
      return;
    }
    if (subjectNotFoundCount > 0) {
      alert(
        `Warning: "${targetSubjectLabel}" not found for ${subjectNotFoundCount} student(s).`,
      );
    }
    if (noMatchCount > 0) {
      alert(
        `Warning: ${noMatchCount} student(s) in the uploaded file did not match any existing student records.`,
      );
      console.warn(
        `${noMatchCount} students had no matching row in the uploaded file.`,
      );
    }

    saveAllStudentData(merged);
    setShow(false);
    alert(
      `${isOspe ? "OSPE" : "Final"} marks (${mode}) for "${selectedSubject}" uploaded successfully.`,
    );
  };

  const handleNext = () => {
    if (!studentsData?.length) {
      alert("Please upload both Excel files");
      return;
    }
    navigate("/subjects");
  };

  const handleClear = async () => {
    await clearAllStudents();
    setFile1Data(null);
    setFile2Data(null);
    setMidMarksData(null);
    setUploadStep(0);
    localStorage.removeItem("uploadStep");
    setActiveDropzone("ospelist");
  };

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
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-3 border-bottom">
        <div className="d-flex flex-wrap align-items-center gap-2">
          {!hasStudentsData && (
            <button
              className="btn-sc btn-sc-primary"
              onClick={handleUploadOspeStudentData}
            >
              <LuUpload size={16} />
              <span>Upload Students Data</span>
            </button>
          )}

          {hasStudentsData && !hasReAppearData && (
            <button
              className="btn-sc btn-sc-dark"
              onClick={HandleReAppearStudentData}
            >
              <LuFileSpreadsheet size={16} />
              <span>Upload Re-Appear Data</span>
            </button>
          )}

          {hasStudentsData && hasReAppearData && (
            <>
              <button
                className="btn-sc btn-sc-outline btn-sc-sm"
                onClick={handleAddUploadOspeStudentData}
                title="Append more regular students"
              >
                <LuPlus size={14} />
                <span>Add More Students</span>
              </button>
              <button
                className="btn-sc btn-sc-outline btn-sc-sm"
                onClick={HandleAddReAppearStudentData}
                title="Append more re-appear students"
              >
                <LuPlus size={14} />
                <span>Add More Re-Appear</span>
              </button>
            </>
          )}

          {hasStudentsData && hasReAppearData && (
            <div className="d-flex align-items-center gap-2 ms-sm-2">
              <button
                className="btn-sc btn-sc-secondary btn-sc-sm"
                onClick={handleUploadMidMarks}
              >
                <LuFilePlus size={14} className="text-primary" />
                <span>Upload Mid Marks</span>
              </button>
              <button
                className="btn-sc btn-sc-secondary btn-sc-sm"
                onClick={handleUploadFinalMarks}
              >
                <LuSparkles size={14} className="text-primary" />
                <span>Upload Final Marks</span>
              </button>
            </div>
          )}

          {hasStudentsData && (
            <button
              className="btn-sc btn-sc-ghost btn-sc-sm text-muted ms-auto"
              onClick={handleClear}
              title="Reset current session uploads"
            >
              <LuRotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="d-flex align-items-center gap-2 ms-auto">
          {hasStudentsData && (
            <button
              className="btn-sc btn-sc-primary btn-sc-sm"
              onClick={handleAddNewRecord}
            >
              <LuPlus size={15} />
              <span>Add Record</span>
            </button>
          )}
        </div>
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
                  onData={handleAddReAppearStudentData}
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

      {/* Add/Edit Student Modal */}
      <StudentFormModal
        show={showStudentModal}
        onHide={handleCloseStudentModal}
        studentData={editingStudent}
        subjects={subjects}
        onSave={handleSaveStudent}
      />
    </>
  );
}
