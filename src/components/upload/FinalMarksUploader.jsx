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

  const finalIsSet = (val) =>
    val !== undefined && val !== null && val !== "" && val !== "-";

  // Track which (subject) and which (subject - OSPE) already have final marks
  const uploadedPlain = new Set();
  const uploadedOspe = new Set();
  (studentsData || []).forEach((student) => {
    (student.subjects || []).forEach((subj) => {
      const name = norm(subj?.subject ?? subj?.label ?? subj?.name ?? "");
      if (!finalIsSet(subj?.final)) return;
      if (name.endsWith("- ospe"))
        uploadedOspe.add(name.replace(/\s*-\s*ospe$/, ""));
      else uploadedPlain.add(name);
    });
  });

  const subjectHasOspe = (name) =>
    subjects.find((s) => norm(s.subject) === norm(name))?.ospe;

  const isDisabled = (name) =>
    uploadOspe ? uploadedOspe.has(norm(name)) : uploadedPlain.has(norm(name));

  const pendingSubjects = baseSubjects.filter(
    (name) => !uploadOspe || subjectHasOspe(name), // hide OSPE option for subjects without OSPE
  );

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
            className={`btn btn-sm ${mode === "online" ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => setMode("online")}
          >
            Online
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mode === "physical" ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => setMode("physical")}
          >
            Physical
          </button>
        </div>
      </div>

      {/* ── OSPE toggle ─────────────────────────────────────────────── */}
      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          id="ospeToggle"
          checked={uploadOspe}
          onChange={(e) => {
            setUploadOspe(e.target.checked);
            setSelectedSubject("");
          }}
        />
        <label className="form-check-label" htmlFor="ospeToggle">
          This is an OSPE marks upload (separate sheet)
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
            className="fmu-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">— Choose a subject —</option>
            {pendingSubjects.map((name) => (
              <option key={name} value={name} disabled={isDisabled(name)}>
                {name} {isDisabled(name) ? "✅ Uploaded" : ""}
              </option>
            ))}
          </select>
          <span className="fmu-chevron">▾</span>
        </div>
      </div>

      {/* ── Dropzone ────────────────────────────────────────────────── */}
      {selectedSubject && !isDisabled(selectedSubject) && (
        <div className="fmu-dropzone-wrap">
          <div className="fmu-selected-badge">
            <span className="fmu-badge-dot" />
            Uploading {mode} {uploadOspe ? "OSPE" : "final"} marks for:{" "}
            <strong>{selectedSubject}</strong>
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
