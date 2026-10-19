import { useNavigate } from "react-router-dom";
import { LuConstruction, LuArrowLeft } from "react-icons/lu";

export default function Construction() {
  const navigate = useNavigate();

  return (
    <div className="pageCenter">
      <div className="sc-card p-5 text-center animate-fade-in" style={{ maxWidth: "480px" }}>
        <div
          className="sc-stat-icon-wrap sc-stat-icon-amber mx-auto mb-3"
          style={{ width: "56px", height: "56px", borderRadius: "14px" }}
        >
          <LuConstruction size={28} />
        </div>
        <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 px-2 py-1 mb-2">
          Under Active Development
        </span>
        <h3 className="fw-bold mb-2 text-dark" style={{ fontSize: "20px" }}>
          Final Gazette Sheet Generator
        </h3>
        <p className="text-muted mb-4" style={{ fontSize: "13.5px" }}>
          The university final sheet generator with cumulative GPA computations and
          registrar formatting is currently being finalized.
        </p>
        <button
          className="btn-sc btn-sc-primary w-100"
          onClick={() => navigate(-1)}
        >
          <LuArrowLeft size={16} />
          <span>Return to Previous Screen</span>
        </button>
      </div>
    </div>
  );
}
