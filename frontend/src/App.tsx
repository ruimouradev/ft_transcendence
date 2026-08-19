import { useState } from 'react'
import './App.css'
import Home from './pages/Home'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ProfilePage from './pages/Profile'
import Dashboard from './pages/Dashboard'
import UnoGamePage from './pages/UnoGamePage'
import FriendsPage from './pages/FriendsPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import ChangePasswordCard from './components/ChangePasswordCard'
import UnoDashboard from './pages/UnoDashboard'
import APIKeyPage from './pages/ApiKeyPage'

function App() {
    const [count, setCount] = useState(0)

    return (
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
                    <Route path="apikey" element={<APIKeyPage />} />
                    <Route path="statistics" element={<UnoDashboard />} />
                </Route>

            </Route>
        </Routes>
    )
}

export default App
