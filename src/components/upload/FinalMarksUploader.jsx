import { useState } from "react"; 
import ExcelDropzone from "../ExcelDropzone";

export default function FinalMarksUploader({
  subjects,
  studentsData,
  onUpload,
}) {
  const [selectedSubject, setSelectedSubject] = useState("");

  // Build flat list of all subject + ospe column labels (same shape as SheetTable columns)
  const allColumns = subjects.flatMap((s) => {
    const cols = [s.subject];
    if (s.ospe) cols.push(`${s.subject} - OSPE`);
    return cols;
  });

  // Detect which subjects already have at least one student with a non-empty final mark
  const norm = (v) =>
    String(v ?? "")
      .trim()
      .toLowerCase();

  const uploadedSubjects = new Set();
  (studentsData || []).forEach((student) => {
    (student.subjects || []).forEach((subj) => {
      const name = norm(subj?.subject ?? subj?.label ?? subj?.name ?? "");
      const final = subj?.final;
      if (
        final !== undefined &&
        final !== null &&
        final !== "" &&
        final !== "-"
      ) {
        uploadedSubjects.add(name);
      }
    });
  });

  const pendingColumns = allColumns.filter(
    (col) => !uploadedSubjects.has(norm(col)),
  );

  const handleFileData = (allFiles) => {
    if (!selectedSubject) return;
    onUpload(selectedSubject, allFiles);
    setSelectedSubject("");
  };

  return (
    <div className="final-marks-uploader">
      {/* ── Subject selector ─────────────────────────────────────── */}
      <div className="fmu-select-wrap">
        <label className="fmu-label" htmlFor="subjectSelect">
          Select Subject / Paper
        </label>

        <div className="fmu-select-box">
          <select
            id="subjectSelect"
            className="fmu-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">— Choose a subject —</option>

            {pendingColumns.length === 0 ? (
              <option disabled>✅ All subjects uploaded</option>
            ) : (
              pendingColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))
            )}
          </select>
          <span className="fmu-chevron">▾</span>
        </div>

        {pendingColumns.length > 0 && (
          <p className="fmu-hint">
            {pendingColumns.length} subject
            {pendingColumns.length !== 1 ? "s" : ""} pending final marks
          </p>
        )}
      </div>

      {/* ── Dropzone — only shown after a subject is selected ────── */}
      {selectedSubject && (
        <div className="fmu-dropzone-wrap">
          <div className="fmu-selected-badge">
            <span className="fmu-badge-dot" />
            Uploading final marks for: <strong>{selectedSubject}</strong>
          </div>

          <ExcelDropzone
            label={`Upload Final Marks — ${selectedSubject}`}
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
