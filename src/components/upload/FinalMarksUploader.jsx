import { useState } from "react";
import ExcelDropzone from "../ExcelDropzone";

export default function FinalMarksUploader({
  subjects,
  studentsData,
  onUpload,
}) {
  const [mode, setMode] = useState("online"); // "online" | "physical"
  const [selectedSubject, setSelectedSubject] = useState("");
  const [uploadOspe, setUploadOspe] = useState(false); // is this an OSPE-only upload?

  const norm = (v) =>
    String(v ?? "")
      .trim()
      .toLowerCase();

  // Plain subject names only (OSPE handled via the toggle, not as a separate dropdown row)
  const baseSubjects = subjects.map((s) => s.subject);

  // Helper to check if a subject mark is uploaded
  const finalIsUploaded = (val) => {
    if (val === undefined || val === null || val === "" || val === "-") return false;
    if (String(val).toUpperCase() === "NA") return false;
    return !isNaN(parseFloat(String(val)));
  };

  // Compute upload statistics per subject (total applicable students vs filled students)
  const getSubjectUploadStats = (subjName) => {
    const targetNorm = norm(subjName);
    let totalApplicable = 0;
    let filledCount = 0;

    (studentsData || []).forEach((student) => {
      (student.subjects || []).forEach((subj) => {
        const sName = norm(subj?.subject ?? subj?.label ?? subj?.name ?? "");
        const isOspeSlot = sName.endsWith("- ospe");
        const cleanName = sName.replace(/\s*-\s*ospe$/, "").trim();

        if (uploadOspe) {
          // OSPE mode: check slots ending with - ospe
          if (isOspeSlot && (cleanName === targetNorm || sName.includes(targetNorm))) {
            totalApplicable++;
            if (finalIsUploaded(subj.final)) filledCount++;
          }
        } else {
          // Theory mode: check non-ospe slots
          if (!isOspeSlot && (cleanName === targetNorm || sName === targetNorm)) {
            totalApplicable++;
            if (finalIsUploaded(subj.final)) filledCount++;
          }
        }
      });
    });

    const isFullyCompleted = totalApplicable > 0 && filledCount >= totalApplicable;
    const isPartial = filledCount > 0 && filledCount < totalApplicable;

    return { totalApplicable, filledCount, isFullyCompleted, isPartial };
  };

  const pendingSubjects = baseSubjects.filter((name) => {
    const sObj = subjects.find((s) => norm(s.subject) === norm(name));
    if (!sObj) return false;

    if (uploadOspe) {
      // In OSPE mode: show subjects that have OSPE
      return Boolean(sObj.ospe);
    } else {
      // In Theory / Main Final mode: show all subjects (for combined, it updates the single combined course)
      return true;
    }
  });

  // Only disable the subject if 100% of applicable students have their marks filled.
  // Otherwise, keep it enabled so the user can upload files for remaining students/institutes!
  const isFullyDisabled = (name) => {
    const stats = getSubjectUploadStats(name);
    return stats.isFullyCompleted;
  };

  const handleFileData = (allFiles) => {
    if (!selectedSubject) return;
    onUpload(selectedSubject, allFiles, { mode, isOspe: uploadOspe });
    setSelectedSubject("");
  };

  return (
    <div className="final-marks-uploader">
      {/* ── Online / Physical toggle ───────────────────────────────── */}
      <div className="fmu-select-wrap">
        <label className="fmu-label">Marks Source</label>
        <div className="d-flex gap-2">
          <button
            type="button"
            className={`btn-sc btn-sc-sm ${mode === "online" ? "btn-sc-primary" : "btn-sc-outline"}`}
            onClick={() => setMode("online")}
          >
            Online Sheet
          </button>
          <button
            type="button"
            className={`btn-sc btn-sc-sm ${mode === "physical" ? "btn-sc-primary" : "btn-sc-outline"}`}
            onClick={() => setMode("physical")}
          >
            Physical Entry
          </button>
        </div>
      </div>

      {/* ── OSPE toggle ─────────────────────────────────────────────── */}
      <div className="form-check p-2 rounded-2 border bg-light">
        <input
          className="form-check-input ms-0 me-2"
          type="checkbox"
          id="ospeToggle"
          checked={uploadOspe}
          onChange={(e) => {
            setUploadOspe(e.target.checked);
            setSelectedSubject("");
          }}
        />
        <label className="form-check-label fw-semibold" htmlFor="ospeToggle" style={{ fontSize: "13px" }}>
          This is an OSPE / Practical evaluation sheet
        </label>
      </div>

      {/* ── Subject selector ───────────────────────────────────────── */}
      <div className="fmu-select-wrap">
        <label className="fmu-label" htmlFor="subjectSelect">
          Select Subject / Paper{uploadOspe ? " (OSPE)" : ""}
        </label>

        <div className="fmu-select-box">
          <select
            id="subjectSelect"
            className="sc-select w-100"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">— Choose a subject —</option>
            {pendingSubjects.map((name) => {
              const stats = getSubjectUploadStats(name);
              const isDone = stats.isFullyCompleted;
              const isPart = stats.isPartial;

              let suffix = "";
              if (isDone) suffix = " ✓ Completed";
              else if (isPart) suffix = ` ✓ (${stats.filledCount}/${stats.totalApplicable} filled)`;

              return (
                <option
                  key={name}
                  value={name}
                  disabled={isDone}
                  style={
                    isDone
                      ? { color: "#9ca3af", background: "#f3f4f6" }
                      : isPart
                      ? { color: "#0d9488", fontWeight: "600", background: "#f0fdfa" }
                      : {}
                  }
                >
                  {name}
                  {suffix}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* ── Dropzone ────────────────────────────────────────────────── */}
      {selectedSubject && !isFullyDisabled(selectedSubject) && (
        <div className="fmu-dropzone-wrap">
          <div className="fmu-selected-badge">
            <span className="fmu-badge-dot" />
            Uploading {mode} {uploadOspe ? "OSPE" : "final"} marks for:{" "}
            <strong>{selectedSubject}</strong>
            {getSubjectUploadStats(selectedSubject).isPartial && (
              <span className="ms-2 badge bg-info text-dark" style={{ fontSize: "11px" }}>
                {getSubjectUploadStats(selectedSubject).filledCount} /{" "}
                {getSubjectUploadStats(selectedSubject).totalApplicable} already filled
              </span>
            )}
          </div>

          <ExcelDropzone
            label={`Upload ${mode === "online" ? "Online" : "Physical"} ${
              uploadOspe ? "OSPE" : "Final"
            } Marks — ${selectedSubject}`}
            onData={handleFileData}
          />
        </div>
      )}

      <style>{`
        .final-marks-uploader {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 4px 0;
        }

        .fmu-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .fmu-select-box {
          position: relative;
        }

        .fmu-select {
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          padding: 11px 40px 11px 14px;
          font-size: 14px;
          color: #111827;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
        }

        .fmu-select:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
          background: #fff;
        }

        .fmu-chevron {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 13px;
          color: #9ca3af;
          pointer-events: none;
        }

        .fmu-hint {
          margin: 8px 0 0;
          font-size: 12px;
          color: #9ca3af;
        }

        .fmu-dropzone-wrap {
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: fmu-slide-in 0.2s ease;
        }

        @keyframes fmu-slide-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .fmu-selected-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 9px 14px;
          font-size: 13px;
          color: #1e40af;
        }

        .fmu-badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #3b82f6;
          flex-shrink: 0;
          animation: fmu-pulse 1.4s ease-in-out infinite;
        }

        @keyframes fmu-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
