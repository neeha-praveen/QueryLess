import './Header.css'
import React from 'react'

const Header = ({ dbCreated, onWorkWithDb }) => {
  return (
    <div className='header'>
        <h1>QueryLess</h1>
        {dbCreated && (
          <button>Work with the db</button>
        )}
    </div>
  )
}

export default Header