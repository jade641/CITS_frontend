import { Navigate, Route, Routes } from 'react-router-dom'

import CITSLayout from '../layouts/CITSLayout'
import AdminDashboard from '../pages/AdminDashboard'
import AnalystDashboard from '../pages/AnalystDashboard'
import Analytics from '../pages/Analytics'
import AuditLogs from '../pages/AuditLogs'
import CITSLogin from '../pages/CITSLogin'
import Investigation from '../pages/Investigation.tsx'
import MyTickets from '../pages/MyTickets.tsx'
import Notifications from '../pages/Notifications'
import ReportIncident from '../pages/ReportIncident'
import Reports from '../pages/Reports'
import Settings from '../pages/Settings'
import TicketDetails from '../pages/TicketDetails.tsx'
import TicketManagement from '../pages/TicketManagement'
import UserDashboard from '../pages/UserDashboard'
import UserManagement from '../pages/UserManagement'
import { GuestRoute, ProtectedRoute, RoleLandingRedirect, RoleRoute } from './ProtectedRoute'

export function CITSRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<CITSLogin />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<CITSLayout />}>
          <Route index element={<RoleLandingRedirect />} />

          <Route path="/dashboard/user" element={<UserDashboard />} />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/dashboard/analyst" element={<AnalystDashboard />} />

          <Route path="/incidents/report" element={<ReportIncident />} />
          <Route path="/tickets/my" element={<MyTickets />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Settings />} />
          <Route path="/tickets/:incidentId" element={<TicketDetails />} />
          <Route path="/settings" element={<Settings />} />

          <Route element={<RoleRoute allowedRoles={['administrator', 'security-analyst']} />}>
            <Route path="/tickets/manage" element={<TicketManagement />} />
            <Route path="/investigation" element={<Investigation />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['administrator']} />}>
            <Route path="/admin/users" element={<UserManagement />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}