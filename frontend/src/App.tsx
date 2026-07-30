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
import ProfilePage from './pages/Profile'
import Dashboard from './pages/Dashboard'
import UnoGamePage from './pages/UnoGamePage'
import FriendsPage from './pages/FriendsPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import ChangePasswordCard from './components/ChangePasswordCard'
// import SettingsPage from './pages/SettingsPage'
// import NotFoundPage from './pages/NotFoundPage'

function App() {
  const [count, setCount] = useState(0)

  return (
    // <Home></Home>
    // <AuthProvider>
    //     <Routes>
    //       <Route path="/" element={<Home />}>
    //         <Route index element={<Dashboard />} />
    //         <Route path="/dashboard" element={<Dashboard />} />
    //         <Route path="/login" element={<Login />} />
    //         <Route path="/signup" element={<SignUp />} />
    //         <Route path="profile" element={<ProfilePage />} />
    //       </Route>
    //     </Routes>
    // </AuthProvider>
<AuthProvider>
  <Routes>
    <Route path="/" element={<Home />}>
      <Route index element={<Dashboard />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="login" element={<Login />} />
      <Route path="signup" element={<SignUp />} />

      <Route element={<ProtectedRoute />}>
        <Route path="profile" element={<ProfilePage />} />
        <Route path="play" element={<UnoGamePage />} />
        <Route path="friends" element={<FriendsPage />} />
        <Route path="password" element={<ChangePasswordCard />} />
      </Route>

    </Route>
  </Routes>
</AuthProvider>
  )
}

export default App
