import { useEffect, useState } from 'react'
import { Settings, Save, CheckCircle2, ShieldCheck, Sliders } from 'lucide-react'
import { api, type AdminSettings } from '../../lib/api'

export default function AdminSettingsView() {
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState(false)

  useEffect(() => {
    api
      .adminGetSettings()
      .then((res) => setSettings(res.settings))
      .finally(() => setLoading(false))
  }, [])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    setSuccessMsg(false)

    api
      .adminUpdateSettings(settings)
      .then((res) => {
        setSettings(res.settings)
        setSuccessMsg(true)
        setTimeout(() => setSuccessMsg(false), 4000)
      })
      .finally(() => setSaving(false))
  }

  if (loading || !settings) {
    return (
      <div className="p-6">
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <Settings size={20} />
        </div>
        <div>
          <h2 className="text-base font-bold text-ink dark:text-white">Admin & Platform Settings</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Configure system-wide screenshot frequency, OCR policies, and admin contacts
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400">
          <CheckCircle2 size={16} /> Admin settings updated successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tracking Policies */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-4">
            <Sliders size={18} className="text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-ink dark:text-white">Desktop Agent Tracking Parameters</h3>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Screenshot Frequency (Minutes)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={settings.screenshotFrequencyMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, screenshotFrequencyMinutes: Number(e.target.value) || 10 })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-ink focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Idle Inactivity Threshold (Minutes)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={settings.idleThresholdMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, idleThresholdMinutes: Number(e.target.value) || 5 })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-ink focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <input
              type="checkbox"
              id="ocr"
              checked={settings.ocrEnabled}
              onChange={(e) => setSettings({ ...settings, ocrEnabled: e.target.checked })}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="ocr" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Enable Automatic OCR Text Extraction on Screenshots (Tesseract.js)
            </label>
          </div>
        </div>

        {/* Contact & Admin Profile */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-ink dark:text-white">Admin Profile & Contact</h3>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Platform Admin Contact Email
              </label>
              <input
                type="email"
                value={settings.adminEmailContact}
                onChange={(e) => setSettings({ ...settings, adminEmailContact: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-ink focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Default Employee Role
              </label>
              <input
                type="text"
                value={settings.defaultRole}
                onChange={(e) => setSettings({ ...settings, defaultRole: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-ink focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-6 py-2.5 text-xs font-bold text-white shadow-soft hover:bg-brand-700 disabled:opacity-50"
          >
            <Save size={15} /> {saving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
