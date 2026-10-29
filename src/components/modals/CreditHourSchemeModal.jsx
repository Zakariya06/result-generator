import { useState } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import {
  LuBookOpen,
  LuCalculator,
  LuInfo,
  LuCircleCheck,
  LuFileSpreadsheet,
  LuSparkles,
} from "react-icons/lu";
import {
  KMU_CREDIT_HOUR_SCHEME,
  evaluateSubjectMarks,
} from "../../utils/kmuCreditScheme";

export default function CreditHourSchemeModal({ show, onHide }) {
  const [calcTheory, setCalcTheory] = useState("3");
  const [calcPrac, setCalcPrac] = useState("1");
  const [calcObtained, setCalcObtained] = useState("68");

  // Interactive Calculator
  const tNum = parseFloat(calcTheory) || 0;
  const pNum = parseFloat(calcPrac) || 0;
  const totalCr = tNum + pNum;
  const totalMarks = totalCr * 25;
  const midTheory = tNum * 5;
  const midPrac = pNum * 5;
  const totalMid = midTheory + midPrac;
  const finalTheory = tNum * 20;
  const finalPrac = pNum * 20;
  const totalFinal = finalTheory + finalPrac;

  const obtNum = parseFloat(calcObtained);
  const evalResult = !isNaN(obtNum)
    ? evaluateSubjectMarks(obtNum, totalMarks)
    : null;

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton className="border-bottom pb-3">
        <div className="d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle"
            style={{ width: "36px", height: "36px" }}
          >
            <LuBookOpen size={20} />
          </div>
          <div>
            <Modal.Title className="fw-bold mb-0" style={{ fontSize: "17px" }}>
              KMU Credit Hours Weightage & Grading Scheme
            </Modal.Title>
            <div className="text-muted" style={{ fontSize: "12px" }}>
              Official Marks Distribution Table for Nursing & Allied Health Sciences
            </div>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className="p-4" style={{ maxHeight: "75vh", overflowY: "auto" }}>
        {/* Core Principles Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="p-3 border rounded-3 bg-light h-100">
              <div className="d-flex align-items-center gap-2 text-primary fw-bold mb-1">
                <LuSparkles size={16} />
                <span>1 Credit Hour = 25 Marks</span>
              </div>
              <p className="text-muted small mb-0">
                Every credit hour carries 25 total marks. Theory hours contribute 5 marks to Midterm and 20 marks to Final. Practical hours similarly contribute 5 to Midterm and 20 to Final.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="p-3 border rounded-3 bg-light h-100">
              <div className="d-flex align-items-center gap-2 text-primary fw-bold mb-1">
                <LuInfo size={16} />
                <span>20% Midterm / 80% Final</span>
              </div>
              <p className="text-muted small mb-0">
                Total course marks are partitioned into 20% continuous/midterm assessment and 80% final examination (comprising final theory and final practical/clinical OSPE).
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="p-3 border rounded-3 bg-light h-100">
              <div className="d-flex align-items-center gap-2 text-danger fw-bold mb-1">
                <LuCircleCheck size={16} />
                <span>Passing Threshold Rules</span>
              </div>
              <p className="text-muted small mb-0">
                <strong>100 Marks Courses:</strong> Passing requires at least <strong>60 marks (60%)</strong>. Scores under 60 result in failure.<br />
                <strong>&lt; 100 Marks Courses (e.g. 75, 50, 25):</strong> Passing threshold is <strong>50%</strong> of maximum marks.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Credit Hour Calculator */}
        <div className="p-3 border rounded-3 bg-white shadow-sm mb-4">
          <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
            <LuCalculator size={16} className="text-primary" />
            <span>Interactive Credit Hour & Marks Calculator</span>
          </h6>
          <div className="row g-3 align-items-center">
            <div className="col-md-2">
              <Form.Label className="small fw-semibold mb-1">Theory Credits (T):</Form.Label>
              <Form.Control
                type="number"
                size="sm"
                value={calcTheory}
                onChange={(e) => setCalcTheory(e.target.value)}
                min="0"
                step="0.5"
                className="sc-input"
              />
            </div>
            <div className="col-md-2">
              <Form.Label className="small fw-semibold mb-1">Practical Credits (P):</Form.Label>
              <Form.Control
                type="number"
                size="sm"
                value={calcPrac}
                onChange={(e) => setCalcPrac(e.target.value)}
                min="0"
                step="0.5"
                className="sc-input"
              />
            </div>
            <div className="col-md-2">
              <Form.Label className="small fw-semibold mb-1">Marks Obtained:</Form.Label>
              <Form.Control
                type="number"
                size="sm"
                value={calcObtained}
                onChange={(e) => setCalcObtained(e.target.value)}
                min="0"
                className="sc-input"
              />
            </div>
            <div className="col-md-6">
              <div className="p-2 border rounded bg-light text-center">
                <div className="d-flex justify-content-around">
                  <div>
                    <span className="text-muted small d-block">Total Cr. Hr:</span>
                    <strong>{totalCr} ({calcTheory}+{calcPrac})</strong>
                  </div>
                  <div>
                    <span className="text-muted small d-block">Max Marks:</span>
                    <strong className="text-primary">{totalMarks} (Mid: {totalMid}, Final: {totalFinal})</strong>
                  </div>
                  <div>
                    <span className="text-muted small d-block">Pass Threshold:</span>
                    <strong>{totalMarks === 100 ? "60 Marks" : `${Math.ceil(totalMarks * 0.5)} Marks (50%)`}</strong>
                  </div>
                  {evalResult && (
                    <div>
                      <span className="text-muted small d-block">Evaluation:</span>
                      <strong className={evalResult.isPassed ? "text-success" : "text-danger"}>
                        {evalResult.grade} (GPA {evalResult.gpa.toFixed(2)}) - {evalResult.isPassed ? "PASS" : "FAIL"}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Official Weightage Table */}
        <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
          <LuFileSpreadsheet size={16} className="text-primary" />
          <span>Official KMU Marks Distribution Table</span>
        </h6>
        <div className="table-responsive border rounded-3 mb-4">
          <table className="table table-sm table-striped table-bordered mb-0 align-middle text-center">
            <thead className="table-light">
              <tr>
                <th rowSpan="2" style={{ width: "12%" }}>Course Credit Hours</th>
                <th rowSpan="2" style={{ width: "10%" }}>Total Marks</th>
                <th colSpan="2">Midterm (20%)</th>
                <th colSpan="2">Final (80%)</th>
                <th rowSpan="2" style={{ width: "12%" }}>Passing Marks</th>
                <th rowSpan="2" style={{ width: "24%" }} className="text-start">Description</th>
              </tr>
              <tr>
                <th style={{ width: "11%" }}>Theory</th>
                <th style={{ width: "11%" }}>Prac/Clinical</th>
                <th style={{ width: "10%" }}>Practical</th>
                <th style={{ width: "10%" }}>Theory</th>
              </tr>
            </thead>
            <tbody>
              {KMU_CREDIT_HOUR_SCHEME.map((row, idx) => (
                <tr key={idx}>
                  <td className="fw-bold text-dark">{row.cr}</td>
                  <td className="fw-bold text-primary">{row.total}</td>
                  <td>{row.midTheory > 0 ? row.midTheory : "-"}</td>
                  <td>{row.midPrac > 0 ? row.midPrac : "-"}</td>
                  <td>{row.finalPrac > 0 ? row.finalPrac : "-"}</td>
                  <td>{row.finalTheory > 0 ? row.finalTheory : "-"}</td>
                  <td className="fw-semibold text-danger">
                    {row.total === 100 ? "60 (60%)" : `${row.passing} (50%)`}
                  </td>
                  <td className="text-start text-muted small">{row.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* KMU Grading Scale */}
        <h6 className="fw-bold text-dark mb-2">KMU Fractionalized Grading Scale</h6>
        <div className="table-responsive border rounded-3">
          <table className="table table-sm table-bordered mb-0 align-middle text-center">
            <thead className="table-light">
              <tr>
                <th>Percentage</th>
                <th>Letter Grade</th>
                <th>Grade Point (GP)</th>
                <th>Status (Max 100)</th>
                <th>Status (Max &lt; 100)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>85% and above</td>
                <td className="fw-bold text-success">A / A+</td>
                <td className="fw-bold">4.00</td>
                <td>Pass</td>
                <td>Pass</td>
              </tr>
              <tr>
                <td>80% - 84%</td>
                <td className="fw-bold text-success">A-</td>
                <td className="fw-bold">3.70</td>
                <td>Pass</td>
                <td>Pass</td>
              </tr>
              <tr>
                <td>75% - 79%</td>
                <td className="fw-bold text-success">B+</td>
                <td className="fw-bold">3.50</td>
                <td>Pass</td>
                <td>Pass</td>
              </tr>
              <tr>
                <td>70% - 74%</td>
                <td className="fw-bold text-primary">B</td>
                <td className="fw-bold">3.00</td>
                <td>Pass</td>
                <td>Pass</td>
              </tr>
              <tr>
                <td>64% - 69%</td>
                <td className="fw-bold text-primary">C+</td>
                <td className="fw-bold">2.50</td>
                <td>Pass</td>
                <td>Pass</td>
              </tr>
              <tr>
                <td>60% - 63%</td>
                <td className="fw-bold text-secondary">C</td>
                <td className="fw-bold">2.00</td>
                <td>Pass</td>
                <td>Pass</td>
              </tr>
              <tr>
                <td>54% - 59%</td>
                <td className="fw-bold text-warning">D+</td>
                <td className="fw-bold">1.30</td>
                <td className="text-danger fw-bold">FAIL (&lt; 60)</td>
                <td className="text-success fw-bold">Pass (&gt;= 50%)</td>
              </tr>
              <tr>
                <td>50% - 53%</td>
                <td className="fw-bold text-warning">D</td>
                <td className="fw-bold">1.00</td>
                <td className="text-danger fw-bold">FAIL (&lt; 60)</td>
                <td className="text-success fw-bold">Pass (&gt;= 50%)</td>
              </tr>
              <tr className="table-danger">
                <td>Below 50%</td>
                <td className="fw-bold text-danger">F</td>
                <td className="fw-bold">0.00</td>
                <td className="text-danger fw-bold">FAIL</td>
                <td className="text-danger fw-bold">FAIL</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Modal.Body>

      <Modal.Footer className="border-top px-4 py-2 bg-light">
        <button
          type="button"
          onClick={onHide}
          className="btn-sc btn-sc-primary btn-sc-sm"
        >
          Close Guide
        </button>
      </Modal.Footer>
    </Modal>
  );
}
