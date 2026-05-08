import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import SignupForm from './components/SignupForm'
import Sidebar from './components/Sidebar'
import HomePage from './pages/HomePage'
import ListPage from './pages/ListPage'
import AddPage from './pages/AddPage'
import DetailPage from './pages/DetailPage'
import EditPage from './pages/EditPage'
import ProfilePage from './pages/ProfilePage'
import SnakePage from './pages/SnakePage'
import {
  clearCurrentSession,
  loadCurrentToken,
  setCurrentSession,
} from './lib/accountStorage'
import { requestAuthApi } from './lib/api'

const authPage = {
  login: 'login',
  signup: 'signup',
}

function AuthScreen({ mode, onLogin, onGoToLogin, onGoToSignup }) {
  if (mode === authPage.signup) {
    return <SignupForm onSignup={onLogin} onGoToLogin={onGoToLogin} />
  }

  return <LoginForm onLogin={onLogin} onGoToSignup={onGoToSignup} />
}

function AppShell({ token, email, profileImage, onLogout, onProfileChange }) {
  const location = useLocation()
  const isSnakePage = location.pathname === '/snake'

  return (
    <div className="app-root">
      <Sidebar email={email} profileImage={profileImage} onLogout={onLogout} />
      <div className="app-main">
        <main className={isSnakePage ? 'main-content-full' : 'main-content'}>
          <Routes>
            <Route path="/" element={<HomePage token={token} />} />
            <Route path="/mijn-lijst" element={<ListPage token={token} />} />
            <Route path="/toevoegen" element={<AddPage token={token} />} />
            <Route
              path="/profiel"
              element={(
                <ProfilePage
                  email={email}
                  token={token}
                  profileImage={profileImage}
                  onProfileChange={onProfileChange}
                />
              )}
            />
            <Route path="/titel/:id" element={<DetailPage token={token} />} />
            <Route path="/titel/:id/bewerk" element={<EditPage token={token} />} />
            <Route path="/snake" element={<SnakePage token={token} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState(() => loadCurrentToken())
  const [checkingSession, setCheckingSession] = useState(() => Boolean(loadCurrentToken()))
  const [email, setEmail] = useState('')
  const [profileImage, setProfileImage] = useState(null)
  const [page, setPage] = useState(authPage.login)

  useEffect(() => {
    let active = true

    const loadEmailFromToken = async () => {
      if (!token) {
        if (active) {
          setEmail('')
          setProfileImage(null)
          setCheckingSession(false)
        }
        return
      }

      setCheckingSession(true)

      try {
        const data = await requestAuthApi(token, '/profile')

        if (!active) return

        if (data?.email) {
          setEmail(data.email)
          setProfileImage(data.profilePicture ?? null)
          setCurrentSession(token)
        } else {
          throw new Error('Invalid session')
        }
      } catch (err) {
        if (!active) return

        console.error('Failed to load email:', err)
        clearCurrentSession()
        setToken(null)
        setEmail('')
        setProfileImage(null)
      } finally {
        if (active) setCheckingSession(false)
      }
    }

    loadEmailFromToken()

    return () => {
      active = false
    }
  }, [token])

  const login = (newToken, email, profilePicture = null) => {
    setCurrentSession(newToken)
    setToken(newToken)
    setEmail(email)
    setProfileImage(profilePicture)
    setCheckingSession(false)
  }

  const logout = () => {
    clearCurrentSession()
    setToken(null)
    setEmail('')
    setProfileImage(null)
    setCheckingSession(false)
  }

  if (checkingSession) {
    return null
  }

  if (!token) {
    return (
      <AuthScreen
        mode={page}
        onLogin={login}
        onGoToLogin={() => setPage(authPage.login)}
        onGoToSignup={() => setPage(authPage.signup)}
      />
    )
  }

  return (
    <BrowserRouter>
      <AppShell 
        token={token} 
        email={email} 
        profileImage={profileImage}
        onLogout={logout} 
        onProfileChange={setProfileImage}
      />
    </BrowserRouter>
  )
}
