import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { FindTenantPage } from './pages/FindTenantPage'
import { HomePage } from './pages/HomePage'
import { SendItemPage } from './pages/SendItemPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="/find-tenant" element={<FindTenantPage />} />
        <Route path="/send-item" element={<SendItemPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
