import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'

// Lazy load pages
const Login                  = lazy(() => import('./pages/Login'))
const Dashboard              = lazy(() => import('./pages/Dashboard'))
const Borrowers              = lazy(() => import('./pages/Borrowers'))
const Staff                  = lazy(() => import('./pages/Staff'))
const VerifyRecoveries       = lazy(() => import('./pages/VerifyRecoveries'))
const Loans                  = lazy(() => import('./pages/Loans'))
const CombinedEntry          = lazy(() => import('./pages/CombinedEntry'))
const LoanDetail             = lazy(() => import('./pages/LoanDetail'))
const BorrowerEntry          = lazy(() => import('./pages/BorrowerEntry'))
const VehicleEntry           = lazy(() => import('./pages/VehicleEntry'))
const Reports                = lazy(() => import('./pages/Reports'))
const SeizedVehicles         = lazy(() => import('./pages/SeizedVehicles'))
const Financers              = lazy(() => import('./pages/admin/Financers'))
const WhatsAppSettings       = lazy(() => import('./pages/WhatsAppSettings'))
const Trash                  = lazy(() => import('./pages/Trash'))
const Verifications          = lazy(() => import('./pages/Verifications'))
const BorrowerLogin          = lazy(() => import('./pages/BorrowerLogin'))
const BorrowerDashboard      = lazy(() => import('./pages/BorrowerDashboard'))
const Customers              = lazy(() => import('./pages/Customers'))
const IndividualBalanceSheet = lazy(() => import('./pages/IndividualBalanceSheet'))
const InteractiveLedger      = lazy(() => import('./pages/InteractiveLedger'))
const BorrowerProfile       = lazy(() => import('./pages/BorrowerProfile'))
const Backlog               = lazy(() => import('./pages/Backlog'))
const BacklogProfile        = lazy(() => import('./pages/BacklogProfile'))

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
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
            <Route path="/backlog"      element={<Backlog />} />
            <Route path="/backlog/:id"  element={<BacklogProfile />} />
            <Route path="/borrowers/:id" element={<BorrowerProfile />} />
            <Route path="/borrowers/:id/balance-sheet" element={<IndividualBalanceSheet />} />
            <Route path="/borrowers/:id/ledger" element={<InteractiveLedger />} />
            <Route path="/admin/financers" element={<Financers />} />
          </Route>
        </Route>
        
        {/* Borrower Portal */}
        <Route path="/borrower/login" element={<BorrowerLogin />} />
        <Route path="/borrower/dashboard" element={<BorrowerDashboard />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
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
