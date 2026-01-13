import { useNavigate } from "react-router-dom";

export default function Construction() {
  const navigate = useNavigate();

  return (
    <div className="pageCenter">
      <div className="cardLarge">
        <h2>This page is under construction 🚧</h2>
        <button className="primaryButton" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    </div>
  );
}
