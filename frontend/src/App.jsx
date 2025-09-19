import './App.css'
import Sidebar from './components/Sidebar/Sidebar'
import Chat from './components/Chat/Chat'

function App() {
  return (
    <div className='app'>
      <Sidebar/>
      <div className="main-body">
        <Chat/>
      </div>
    </div>
  )
}

export default App
