import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import Analysis from './pages/Analysis'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'
import Exercise from './pages/Exercise'
import History from './pages/History'
import Login from './pages/Login'
import Medication from './pages/Medication'
import PrivateRoute from './components/PrivateRoute'
import Questionnaire from './pages/Questionnaire'
import Register from './pages/Register'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/questionnaire" element={<Questionnaire />} />
          <Route path="/history" element={<History />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/medication" element={<Medication />} />
          <Route path="/exercise" element={<Exercise />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
