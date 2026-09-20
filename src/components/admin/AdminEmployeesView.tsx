import { useEffect, useState } from 'react'
import { Search, Filter, Eye, Edit2, Trash2, ShieldCheck, X } from 'lucide-react'
import { api, type AdminEmployeeItem, type ApiProject } from '../../lib/api'
import DataTable, { type Column } from './common/DataTable'
import Avatar from '../ui/Avatar'

interface EmployeesViewProps {
  onSelectEmployeeDetail: (employeeId: string) => void
  openCreateModal: boolean
  onCloseCreateModal: () => void
}

export default function AdminEmployeesView({
  onSelectEmployeeDetail,
  openCreateModal,
  onCloseCreateModal,
}: EmployeesViewProps) {
  const [employees, setEmployees] = useState<AdminEmployeeItem[]>([])
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Edit Modal state
  const [editingEmp, setEditingEmp] = useState<AdminEmployeeItem | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Form fields for Create / Edit
  const [formData, setFormData] = useState({
    name: '',
    role: 'Team Member',
    projectId: '',
    email: '',
    password: '',
    isAdmin: false,
    status: 'offline',
  })

  function loadData() {
    setLoading(true)
    setError(null)
    api
      .adminGetEmployees({
        page,
        limit: 10,
        search,
        status: statusFilter,
        projectId: projectFilter,
        sortBy,
        sortOrder,
      })
      .then((res) => {
        setEmployees(res.employees)
        setTotalPages(res.pagination.totalPages)
        setTotalItems(res.pagination.total)
      })
      .catch((err) => setError(err.message || 'Failed to fetch employees list.'))
      .finally(() => setLoading(false))
  }

  function loadProjectsList() {
    api.getProjects().then((res) => {
      setProjects(res.projects)
      if (res.projects.length > 0 && !formData.projectId) {
        setFormData((prev) => ({ ...prev, projectId: res.projects[0].id }))
      }
    })
  }

  useEffect(() => {
    loadProjectsList()
  }, [])

  useEffect(() => {
    loadData()
  }, [page, search, statusFilter, projectFilter, sortBy, sortOrder])

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    setModalLoading(true)
    setModalError(null)

    api
      .adminCreateEmployee({
        name: formData.name,
        role: formData.role,
        projectId: formData.projectId || projects[0]?.id || '',
        email: formData.email || undefined,
        password: formData.password || undefined,
        isAdmin: formData.isAdmin,
      })
      .then(() => {
        onCloseCreateModal()
        resetForm()
        loadData()
      })
      .catch((err) => setModalError(err.message || 'Failed to create employee.'))
      .finally(() => setModalLoading(false))
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingEmp) return
    setModalLoading(true)
    setModalError(null)

    api
      .adminUpdateEmployee(editingEmp.id, {
        name: formData.name,
        role: formData.role,
        projectId: formData.projectId,
        status: formData.status,
        isAdmin: formData.isAdmin,
      })
      .then(() => {
        setEditingEmp(null)
        resetForm()
        loadData()
      })
      .catch((err) => setModalError(err.message || 'Failed to update employee.'))
      .finally(() => setModalLoading(false))
  }

  function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this employee and all associated time logs?')) return
    api
      .adminDeleteEmployee(id)
      .then(() => loadData())
      .catch((err) => alert(err.message || 'Failed to delete employee.'))
  }

  function resetForm() {
    setFormData({
      name: '',
      role: 'Team Member',
      projectId: projects[0]?.id || '',
      email: '',
      password: '',
      isAdmin: false,
      status: 'offline',
    })
    setModalError(null)
  }

  function openEdit(emp: AdminEmployeeItem) {
    setEditingEmp(emp)
    setFormData({
      name: emp.name,
      role: emp.role,
      projectId: emp.project_id,
      email: emp.userEmail !== 'No User Account' ? emp.userEmail : '',
      password: '',
      isAdmin: emp.isAdmin,
      status: emp.status,
    })
  }

  const columns: Column<AdminEmployeeItem>[] = [
    {
      key: 'name',
      label: 'Employee',
      sortable: true,
      render: (emp) => (
        <div className="flex items-center gap-3">
          <Avatar initials={emp.initials} color={emp.color} size={36} />
          <div>
            <div className="flex items-center gap-1.5 font-bold text-ink dark:text-white">
              <span>{emp.name}</span>
              {emp.isAdmin && (
                <span className="flex items-center gap-0.5 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-extrabold text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
                  <ShieldCheck size={11} /> Admin
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500">{emp.userEmail}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role & Department',
      sortable: true,
      render: (emp) => <span className="font-medium">{emp.role}</span>,
    },
    {
      key: 'projectName',
      label: 'Assigned Project',
      render: (emp) => (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {emp.projectName}
        </span>
      ),
    },
    {
      key: 'todayHours',
      label: 'Today Hours',
      sortable: true,
      render: (emp) => (
        <span className="font-semibold text-ink dark:text-slate-200">{emp.todayHours} hrs</span>
      ),
    },
    {
      key: 'focusScore',
      label: 'Focus Score',
      sortable: true,
      render: (emp) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
            emp.focusScore >= 80
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : emp.focusScore >= 50
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
          }`}
        >
          {emp.focusScore}%
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (emp) => (
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              emp.isTrackingNow
                ? 'bg-emerald-500 animate-ping'
                : emp.status === 'online'
                  ? 'bg-emerald-500'
                  : 'bg-slate-400'
            }`}
          />
          <span className="text-xs font-semibold capitalize text-slate-700 dark:text-slate-300">
            {emp.isTrackingNow ? 'Tracking' : emp.status}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (emp) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onSelectEmployeeDetail(emp.id)}
            title="View Details"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-brand-600 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            onClick={() => openEdit(emp)}
            title="Edit Employee"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-amber-600 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <Edit2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(emp.id)}
            title="Delete Employee"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search employee name or role..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2 text-xs font-medium text-ink placeholder-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-850 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter size={15} /> Filter:
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>

          <select
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value)
              setPage(1)
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employee Data Table */}
      <DataTable
        columns={columns}
        data={employees}
        loading={loading}
        error={error}
        emptyMessage="No employees matched your criteria."
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        onSort={(key, order) => {
          setSortBy(key)
          setSortOrder(order)
        }}
        onRowClick={(emp) => onSelectEmployeeDetail(emp.id)}
      />

      {/* Create / Edit Employee Modal */}
      {(openCreateModal || editingEmp) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-soft-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-base font-bold text-ink dark:text-white">
                {editingEmp ? 'Edit Employee Profile' : 'Add New Employee'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  onCloseCreateModal()
                  setEditingEmp(null)
                  resetForm()
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600 dark:border-rose-900/30 dark:bg-rose-950/20">
                {modalError}
              </div>
            )}

            <form onSubmit={editingEmp ? handleEditSubmit : handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sarah Connor"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-ink focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Job Role / Title</label>
                <input
                  type="text"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-ink focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Project</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-ink focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {!editingEmp && (
                <>
                  <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">User Account Credentials (Optional)</h4>
                    <p className="text-[11px] text-slate-400">Allows employee to log into the web app & desktop agent.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">User Account Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. sarah@company.com"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-ink focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-ink focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={formData.isAdmin}
                  onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="isAdmin" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Grant Admin Access Privileges
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    onCloseCreateModal()
                    setEditingEmp(null)
                    resetForm()
                  }}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-50"
                >
                  {modalLoading ? 'Saving...' : editingEmp ? 'Update Employee' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
