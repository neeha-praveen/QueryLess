import { useNavigate, useLocation } from "react-router-dom";
import './Header.css';

const Header = ({ dbCreated, onWorkWithDb }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDbPage = location.pathname === "/db";
  
  return (
    <div className="header">
      <h1>QueryLess</h1>
      {isDbPage ? (
        <button
          onClick={() => navigate("/")}
          className="work-db-btn"
        >
          Go Back to Chat
        </button>
      ) : (
        dbCreated && (
          <button
            onClick={() => navigate("/db")}
            className="work-db-btn"
          >
            Work with DB
          </button>
        )
      )}
    </div>
  );
};

export default Header;