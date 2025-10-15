import './Header.css'
import React from 'react'

const Header = ({ dbCreated, onWorkWithDb }) => {
  return (
    <div className='header'>
      <h1>QueryLess</h1>
      {dbCreated && (
        <button className="work-db-btn" onClick={onWorkWithDb}>
          Work with the DB
        </button>
      )}
    </div>
  );
};

export default Header;
