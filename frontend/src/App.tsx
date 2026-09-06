import MainLayout from './layout/MainLayout'
import { Routes, Route } from 'react-router-dom'
import Login from './account/Login'
import SignUp from './account/SignUp'
import ProfilePage from './account/Profile'
import ApiKeyPage from './account/ApiKeyPage'
import ChangePasswordCard from './account/ChangePasswordCard'
import HomePage from './pages/HomePage'
import FriendsPage from './pages/FriendsPage'
import UnoDashboard from './pages/UnoDashboard'
import Privacy from './legal/Privacy'
import Terms from './legal/Terms'
import Rules from './legal/Rules'
import Play from './game/Play'
import Lobby from './game/Lobby'
import ErrorPage from './pages/ErrorPage'
import ProtectedRoute from './core/ProtectedRoute'
import Verify2fa from './account/Verify2fa'
import ResetPassword from './account/ResetPassword'

function App()
{
    return (
        <Routes>
            <Route path="/" element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<SignUp />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="terms" element={<Terms />} />
				<Route path="rules" element={<Rules />} />
                <Route path="login/2fa" element={<Verify2fa />} />
                <Route path="reset-password" element={<ResetPassword />} />

				<Route path='*' element={<ErrorPage />}/>
                <Route element={<ProtectedRoute />}>
					<Route path='/lobby' element={<Lobby />}/>
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="play" element={<Play />} />
                    <Route path="friends" element={<FriendsPage />} />
                    <Route path="password" element={<ChangePasswordCard />} />
                    <Route path="apikey" element={<ApiKeyPage />} />
                    <Route path="statistics" element={<UnoDashboard />} />
                </Route>
            </Route>
        </Routes>
    )
}

export default App
