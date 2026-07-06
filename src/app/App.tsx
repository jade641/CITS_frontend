import { CITSProvider, useCITS } from "../contexts/CITSContext";
import CITSLogin from "../pages/CITSLogin";
import CITSLayout from "../layouts/CITSLayout";
import UserDashboard from "../pages/UserDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import AnalystDashboard from "../pages/AnalystDashboard";
import ReportIncident from "../pages/ReportIncident";
import MyTickets from "../pages/MyTickets.tsx";
import Notifications from "../pages/Notifications";
import TicketDetails from "../pages/TicketDetails.tsx";
import UserManagement from "../pages/UserManagement";
import TicketManagement from "../pages/TicketManagement";
import Investigation from "../pages/Investigation.tsx";
import AssignedTickets from "../pages/AssignedTickets.tsx";
import IncidentHistory from "../pages/IncidentHistory";
import AuditLogs from "../pages/AuditLogs";
import Reports from "../pages/Reports";
import Analytics from "../pages/Analytics";
import Settings from "../pages/Settings";

function PageRenderer() {
  const { currentPage, currentUser } = useCITS();

  if (!currentUser || currentPage === "login") return <CITSLogin />;

  const pages: Record<string, React.ReactNode> = {
    "user-dashboard":    <UserDashboard />,
    "admin-dashboard":   <AdminDashboard />,
    "analyst-dashboard": <AnalystDashboard />,
    "report-incident":   <ReportIncident />,
    "my-tickets":        <MyTickets />,
    "notifications":     <Notifications />,
    "ticket-details":    <TicketDetails />,
    "user-management":   <UserManagement />,
    "ticket-management": <TicketManagement />,
    "investigation":     <Investigation />,
    "assigned-tickets":  <AssignedTickets />,
    "incident-history":  <IncidentHistory />,
    "audit-logs":        <AuditLogs />,
    "reports":           <Reports />,
    "admin-reports":     <Reports />,
    "analytics":         <Analytics />,
    "profile":           <Settings />,
    "settings":          <Settings />,
    "admin-settings":    <Settings />,
  };

  const page = pages[currentPage] ?? (
    currentUser.role === "admin"   ? <AdminDashboard />   :
    currentUser.role === "analyst" ? <AnalystDashboard /> :
                                     <UserDashboard />
  );

  return <CITSLayout>{page}</CITSLayout>;
}

export default function App() {
  return (
    <CITSProvider>
      <PageRenderer />
    </CITSProvider>
  );
}
