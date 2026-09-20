import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Monitor, Sparkles, FileText, Activity } from 'lucide-react'
import Avatar from '../../ui/Avatar'

interface LightboxProps {
  screenshot: {
    id: string
    employeeName: string
    employeeInitials: string
    employeeColor: string
    projectName?: string
    capturedAt: string
    activeWindow?: string | null
    productivityScore?: number | null
    aiSummary?: string | null
    ocrText?: string | null
    imageUrl: string
  } | null
  onClose: () => void
}

export default function ScreenshotLightbox({ screenshot, onClose }: LightboxProps) {
  if (!screenshot) return null

  const score = screenshot.productivityScore ?? 75
  const scoreBadgeColor =
    score >= 80
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      : score >= 50
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-ink/70 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-soft-lg dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Avatar initials={screenshot.employeeInitials} color={screenshot.employeeColor} size={36} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-ink dark:text-white">{screenshot.employeeName}</h3>
                  {screenshot.projectName && (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                      {screenshot.projectName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Clock size={13} />
                  <span>{new Date(screenshot.capturedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${scoreBadgeColor}`}
              >
                <Activity size={14} />
                <span>Score: {score}%</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-3">
            {/* Image Preview */}
            <div className="flex items-center justify-center bg-slate-950 p-4 lg:col-span-2">
              <img
                src={screenshot.imageUrl}
                alt={screenshot.activeWindow || 'Captured screenshot'}
                className="max-h-[60vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
              />
            </div>

            {/* Sidebar Details */}
            <div className="flex flex-col space-y-6 border-t border-slate-200/80 p-6 lg:border-t-0 lg:border-l dark:border-slate-800">
              {screenshot.activeWindow && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <Monitor size={14} /> Active Window
                  </div>
                  <p className="mt-1 text-sm font-medium text-ink dark:text-slate-200 break-words">
                    {screenshot.activeWindow}
                  </p>
                </div>
              )}

              {screenshot.aiSummary && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                    <Sparkles size={14} /> AI Activity Summary
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {screenshot.aiSummary}
                  </p>
                </div>
              )}

              {screenshot.ocrText && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <FileText size={14} /> Detected Screen Text (OCR)
                  </div>
                  <div className="mt-1.5 max-h-40 overflow-y-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-850 dark:text-slate-400 font-mono">
                    {screenshot.ocrText}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
