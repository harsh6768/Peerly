import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { TrustCenterPage } from './pages/TrustCenterPage'
import {
  FindTenantHostComposePage,
  FindTenantHostDashboardPage,
  FindTenantHostInquiriesPage,
  FindTenantListingDetailsPage,
  FindTenantPage,
} from './pages/FindTenantPage'
import { HomePage } from './pages/HomePage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="/auth" element={<TrustCenterPage />} />
        <Route path="/profile" element={<TrustCenterPage />} />
        <Route path="/find-tenant" element={<FindTenantPage />} />
        <Route path="/find-tenant/host" element={<FindTenantHostDashboardPage />} />
        <Route path="/find-tenant/host/listings/new" element={<FindTenantHostComposePage />} />
        <Route path="/find-tenant/host/listings/:editListingId/edit" element={<FindTenantHostComposePage />} />
        <Route path="/find-tenant/host/inquiries" element={<FindTenantHostInquiriesPage />} />
        <Route path="/find-tenant/listings/:listingId" element={<FindTenantListingDetailsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
