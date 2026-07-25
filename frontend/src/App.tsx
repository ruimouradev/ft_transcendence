import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { HelloWorld } from './components'
import Home from './pages/Home'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import { AuthProvider } from './components/AuthContext'
// import SettingsPage from './pages/SettingsPage'
// import NotFoundPage from './pages/NotFoundPage'

function App() {
  const [count, setCount] = useState(0)

  return (
    // <Home></Home>
    <AuthProvider>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        
        </Routes>
    </AuthProvider>
  )
}

export default App
