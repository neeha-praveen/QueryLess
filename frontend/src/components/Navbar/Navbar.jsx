import { assets } from '../../assets/assets'
import './Navbar.css'
import React from 'react'

const Navbar = () => {
  return (
    <div className='navbar'>
        <div className="navbar-left">
            <div className="heading">
                <div className="logo">
                    <img src={assets.logo} alt="logo" />
                </div>
            </div>
        </div>
    </div>
  )
}

export default Navbar