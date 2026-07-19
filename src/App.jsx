import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AdminMapEditorPage } from './admin/AdminMapEditorPage'
import { LandingPage } from './user/Landing'

function PageSelector() {
  const navigate = useNavigate()

  return (
    <main>
      <h1>페이지 선택</h1>
      <button type="button" onClick={() => navigate('/admin')}>
        관리자 페이지
      </button>
      <button type="button" onClick={() => navigate('/user')}>
        유저 페이지
      </button>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PageSelector />} />
        <Route path="/admin" element={<AdminMapEditorPage />} />
        <Route path="/user" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
