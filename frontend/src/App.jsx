import { useState } from 'react'
import './App.css'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import Header from './components/Header/Header'

function App() {
  return (
    <div className='app'>
      <Sidebar/>
      <div className="main-body">
        <Header/>
      </div>
    </div>
  )
}

export default App
