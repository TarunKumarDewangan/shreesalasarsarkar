import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Borrowers from './pages/Borrowers'
import Staff from './pages/Staff'
import VerifyRecoveries from './pages/VerifyRecoveries'
import Loans from './pages/Loans'
import CombinedEntry from './pages/CombinedEntry'
import LoanDetail from './pages/LoanDetail'
import BorrowerEntry from './pages/BorrowerEntry'
import VehicleEntry from './pages/VehicleEntry'
import Reports from './pages/Reports'
import SeizedVehicles from './pages/SeizedVehicles'
import Financers from './pages/admin/Financers'
import WhatsAppSettings from './pages/WhatsAppSettings'
import Trash from './pages/Trash'
import Verifications from './pages/Verifications'
import BorrowerLogin from './pages/BorrowerLogin'
import BorrowerDashboard from './pages/BorrowerDashboard'
import Customers from './pages/Customers'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard"   element={<Dashboard />} />
          <Route path="/entry"       element={<CombinedEntry />} />
          <Route path="/borrowers"   element={<Borrowers />} />
          <Route path="/staff"       element={<Staff />} />
          <Route path="/verify-recoveries" element={<VerifyRecoveries />} />
          <Route path="/borrowers/new" element={<BorrowerEntry />} />
          <Route path="/vehicles/new" element={<VehicleEntry />} />
          <Route path="/borrowers/:borrowerId/vehicle/new" element={<VehicleEntry />} />
          <Route path="/loans"       element={<Loans />} />
          <Route path="/loans/:id"   element={<LoanDetail />} />
          <Route path="/seized-vehicles" element={<SeizedVehicles />} />
          <Route path="/reports"     element={<Reports />} />
          <Route path="/whatsapp"    element={<WhatsAppSettings />} />
          <Route path="/customers"   element={<Customers />} />
          <Route path="/trash"       element={<Trash />} />
          <Route path="/verifications" element={<Verifications />} />
          <Route path="/admin/financers" element={<Financers />} />
        </Route>
      </Route>
      
      {/* Borrower Portal */}
      <Route path="/borrower/login" element={<BorrowerLogin />} />
      <Route path="/borrower/dashboard" element={<BorrowerDashboard />} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
