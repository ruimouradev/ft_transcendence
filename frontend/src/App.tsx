import Shell from './layout/MainLayout'
import { Routes, Route } from 'react-router-dom'
import Login from './account/Login'
import SignUp from './account/SignUp'
import ProfilePage from './account/Profile'
import ApiKeyPage from './account/ApiKeyPage'
import ChangePasswordCard from './account/ChangePasswordCard'
import Dashboard from './dashboard/Dashboard'
import FriendsPage from './friends/FriendsPage'
import UnoDashboard from './stats/UnoDashboard'
import Privacy from './legal/Privacy'
import Terms from './legal/Terms'
import Play from './game/Play'
import Lobby from './game/Lobby'
import Error from './layout/Error'
import { ProtectedRoute } from './core/ProtectedRoute'
import Verify2fa from './account/Verify2fa'

// O mapa do site. O Shell é a moldura (navbar, fundo, footer) e as
// páginas desenham-se dentro dele, no Outlet. O que está sob
// ProtectedRoute exige sessão aberta.
function App() {
    return (
        <Routes>
            <Route path="/" element={<Shell />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<SignUp />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="terms" element={<Terms />} />
                <Route path="login/2fa" element={<Verify2fa />} />
				<Route path='*' element={<Error />}/>
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
