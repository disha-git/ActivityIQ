import { useEffect, useState } from 'react'
import { Plus, Briefcase, Users, Clock, Edit2, Trash2, X, AlertCircle } from 'lucide-react'
import { api, type AdminProjectItem } from '../../lib/api'

interface ProjectsViewProps {
  openCreateModal: boolean
  onCloseCreateModal: () => void
}

export default function AdminProjectsView({ openCreateModal, onCloseCreateModal }: ProjectsViewProps) {
  const [projects, setProjects] = useState<AdminProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingProject, setEditingProject] = useState<AdminProjectItem | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#4b6fed')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  function loadProjects() {
    setLoading(true)
    setError(null)
    api
      .adminGetProjects()
      .then((res) => setProjects(res.projects))
      .catch((err) => setError(err.message || 'Failed to fetch projects.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProjects()
  }, [])

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    setModalLoading(true)
    setModalError(null)

    api
      .adminCreateProject(name, color)
      .then(() => {
        onCloseCreateModal()
        resetForm()
        loadProjects()
      })
      .catch((err) => setModalError(err.message || 'Failed to create project.'))
      .finally(() => setModalLoading(false))
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingProject) return
    setModalLoading(true)
    setModalError(null)

    api
      .adminUpdateProject(editingProject.id, name, color)
      .then(() => {
        setEditingProject(null)
        resetForm()
        loadProjects()
      })
      .catch((err) => setModalError(err.message || 'Failed to update project.'))
      .finally(() => setModalLoading(false))
  }

  function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this project?')) return
    api
      .adminDeleteProject(id)
      .then(() => loadProjects())
      .catch((err) => alert(err.message || 'Failed to delete project.'))
  }

  function resetForm() {
    setName('')
    setColor('#4b6fed')
    setModalError(null)
  }

  function openEdit(p: AdminProjectItem) {
    setEditingProject(p)
    setName(p.name)
    setColor(p.color)
  }

  const COLOR_OPTIONS = ['#21c17c', '#4b6fed', '#f5a623', '#e0578c', '#8b6cf5', '#3b82f6', '#10b981', '#f43f5e']

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <Briefcase size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink dark:text-white">Project Portfolio Management</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Manage client projects, department initiatives, and time budgets
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm()
            // Toggle create via parent or trigger modal
          }}
          className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-brand-700"
        >
          <Plus size={15} /> Create New Project
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/30 dark:bg-rose-950/20">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-all hover:shadow-soft-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-4 w-4 rounded-full" style={{ backgroundColor: proj.color }} />
                  <h3 className="text-base font-bold text-ink dark:text-white">{proj.name}</h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(proj)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(proj.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-slate-400" />
                  <div>
                    <div className="text-sm font-extrabold text-ink dark:text-white">{proj.employeeCount}</div>
                    <div className="text-[11px] text-slate-400">Team Members</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-brand-500" />
                  <div>
                    <div className="text-sm font-extrabold text-brand-600 dark:text-brand-400">{proj.totalHours} hrs</div>
                    <div className="text-[11px] text-slate-400">Total Tracked</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {(openCreateModal || editingProject) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-soft-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-base font-bold text-ink dark:text-white">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  onCloseCreateModal()
                  setEditingProject(null)
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

            <form onSubmit={editingProject ? handleEditSubmit : handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Website Redesign v2"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-ink focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Theme Badge Color
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    onCloseCreateModal()
                    setEditingProject(null)
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
                  {modalLoading ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
