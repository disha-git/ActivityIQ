import { useState } from 'react'
import type { ApiEmployee, ApiUser } from '../lib/api'
import AdminSidebar, { type AdminTab } from '../components/admin/AdminSidebar'
import AdminTopbar from '../components/admin/AdminTopbar'
import AdminOverviewView from '../components/admin/AdminOverviewView'
import AdminRealtimeView from '../components/admin/AdminRealtimeView'
import AdminEmployeesView from '../components/admin/AdminEmployeesView'
import AdminEmployeeDetailView from '../components/admin/AdminEmployeeDetailView'
import AdminProjectsView from '../components/admin/AdminProjectsView'
import AdminScreenshotsView from '../components/admin/AdminScreenshotsView'
import AdminAnalyticsView from '../components/admin/AdminAnalyticsView'
import AdminAiInsightsView from '../components/admin/AdminAiInsightsView'
import AdminReportsView from '../components/admin/AdminReportsView'
import AdminSettingsView from '../components/admin/AdminSettingsView'

interface AdminPageProps {
  user: ApiUser
  employee: ApiEmployee
  onReturnToUserDashboard: () => void
  onLogout: () => void
}

export default function AdminPage({
  user,
  employee,
  onReturnToUserDashboard,
  onLogout,
}: AdminPageProps) {
  const [currentTab, setCurrentTab] = useState<AdminTab | 'employee-detail'>('overview')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [openEmployeeModal, setOpenEmployeeModal] = useState(false)
  const [openProjectModal, setOpenProjectModal] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  function handleSelectEmployeeDetail(employeeId: string) {
    setSelectedEmployeeId(employeeId)
    setCurrentTab('employee-detail')
  }

  return (
    <div className="flex min-h-svh bg-slate-50 font-sans text-ink antialiased dark:bg-slate-950 dark:text-slate-100">
      <AdminSidebar
        currentTab={currentTab === 'employee-detail' ? 'employees' : currentTab}
        onSelectTab={(tab) => {
          setSelectedEmployeeId(null)
          setCurrentTab(tab)
        }}
        user={user}
        employee={employee}
        onReturnToUserDashboard={onReturnToUserDashboard}
        onLogout={onLogout}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          currentTab={currentTab === 'employee-detail' ? 'employees' : currentTab}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'overview' && (
            <AdminOverviewView
              onNavigateTab={setCurrentTab}
              onOpenEmployeeModal={() => {
                setCurrentTab('employees')
                setOpenEmployeeModal(true)
              }}
              onOpenProjectModal={() => {
                setCurrentTab('projects')
                setOpenProjectModal(true)
              }}
            />
          )}

          {currentTab === 'monitoring' && <AdminRealtimeView />}

          {currentTab === 'employees' && (
            <AdminEmployeesView
              onSelectEmployeeDetail={handleSelectEmployeeDetail}
              openCreateModal={openEmployeeModal}
              onCloseCreateModal={() => setOpenEmployeeModal(false)}
            />
          )}

          {currentTab === 'employee-detail' && selectedEmployeeId && (
            <AdminEmployeeDetailView
              employeeId={selectedEmployeeId}
              onBack={() => setCurrentTab('employees')}
            />
          )}

          {currentTab === 'projects' && (
            <AdminProjectsView
              openCreateModal={openProjectModal}
              onCloseCreateModal={() => setOpenProjectModal(false)}
            />
          )}

          {currentTab === 'screenshots' && <AdminScreenshotsView />}

          {currentTab === 'analytics' && <AdminAnalyticsView />}

          {currentTab === 'insights' && <AdminAiInsightsView />}

          {currentTab === 'reports' && <AdminReportsView />}

          {currentTab === 'settings' && <AdminSettingsView />}
        </main>
      </div>
    </div>
  )
}
