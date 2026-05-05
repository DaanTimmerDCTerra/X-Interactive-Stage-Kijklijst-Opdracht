import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import SignupForm from './components/SignupForm'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import HomePage from './pages/HomePage'
import ListPage from './pages/ListPage'
import AddPage from './pages/AddPage'
import DiscoveryPage from './pages/DiscoveryPage'
import DetailPage from './pages/DetailPage'
import ProfilePage from './pages/ProfilePage'
import SnakePage from './pages/SnakePage'
import {
  clearCurrentSession,
  getProfilePicture,
  loadCurrentEmail,
  loadAccounts,
  setCurrentSession,
} from './lib/accountStorage'
import { API } from './lib/constants'
export const assetBase = '/VectorPack'
export const getImageUrl = (path) => path ? `${API.replace('/api', '')}${path}` : null

function AuthScreen({ mode, onLogin, onGoToLogin, onGoToSignup }) {
  if (mode === 'signup') {
    return <SignupForm apiUrl={API} onSignup={onLogin} onGoToLogin={onGoToLogin} />
  }

  return <LoginForm apiUrl={API} onLogin={onLogin} onGoToSignup={onGoToSignup} />
}

function AppShell({ token, email, onLogout, onSwitchAccount, onProfileChange }) {
  const navigate = useNavigate()
  const location = useLocation()
  const profileImage = getProfilePicture(email)
  const hideTopBar = location.pathname === '/snake'
  const isSnakePage = location.pathname === '/snake'

  const handleSwitchAccount = (newToken) => {
    if (!newToken) return

    onSwitchAccount(newToken)
    navigate('/')
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar onLogout={onLogout} onSwitchAccount={handleSwitchAccount} />
      <div className="flex-1 ml-56 min-h-screen">
        {!hideTopBar && <TopBar email={email} profileImage={profileImage} />}
        <main className={isSnakePage ? 'w-full p-0' : 'w-full p-6 lg:p-10'}>
          <Routes>
            <Route path="/" element={<HomePage token={token} />} />
            <Route path="/mijn-lijst" element={<ListPage token={token} />} />
            <Route path="/toevoegen" element={<AddPage token={token} />} />
            <Route path="/discovery" element={<DiscoveryPage token={token} />} />
            <Route path="/profiel" element={<ProfilePage email={email} onProfileChange={onProfileChange} />} />
            <Route path="/titel/:id" element={<DetailPage token={token} />} />
            <Route path="/snake" element={<SnakePage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [email, setEmail] = useState(() => loadCurrentEmail(localStorage.getItem('token')))
  const [page, setPage] = useState('login')
  const [, bumpProfileVersion] = useState(0)

  const login = (newToken, email) => {
    setCurrentSession(newToken, email)
    setToken(newToken)
    setEmail(email)
  }

  const logout = () => {
    clearCurrentSession()
    setToken(null)
    setEmail('')
  }

  const switchAccount = (newToken) => {
    if (!newToken) return

    const account = loadAccounts().find((entry) => entry.token === newToken)
    setCurrentSession(newToken, account?.email ?? '')
    setToken(newToken)
    setEmail(account?.email ?? '')
  }

  const refreshProfile = () => {
    bumpProfileVersion((value) => value + 1)
  }

  if (!token) {
    return (
      <AuthScreen
        mode={page}
        onLogin={login}
        onGoToLogin={() => setPage('login')}
        onGoToSignup={() => setPage('signup')}
      />
    )
  }

  return (
    <BrowserRouter>
      <AppShell
        token={token}
        email={email}
        onLogout={logout}
        onSwitchAccount={switchAccount}
        onProfileChange={refreshProfile}
      />
    </BrowserRouter>
  )
}