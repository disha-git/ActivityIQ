import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X } from 'lucide-react'
import Skeleton from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'
import type { TimelineScreenshot } from '../../lib/api'

interface ScreenshotViewerProps {
  loading: boolean
  screenshots: TimelineScreenshot[]
  accentColor?: string
}

export default function ScreenshotViewer({ loading, screenshots, accentColor }: ScreenshotViewerProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[16/10] rounded-xl" />
        ))}
      </div>
    )
  }

  if (screenshots.length === 0) {
    return <EmptyState icon={<Camera size={18} />} title="No screenshots yet" />
  }

  const active = openIndex !== null ? screenshots[openIndex] : null

  return (
    <>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
        {screenshots.map((shot, i) => (
          <motion.button
            key={shot.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
            className="flex flex-col gap-1.5 text-left"
          >
            {shot.imageUrl ? (
              <img
                src={shot.imageUrl}
                alt={`Screenshot at ${new Date(shot.capturedAt).toTimeString().slice(0, 5)}`}
                className="aspect-[16/10] rounded-xl border border-slate-200 object-cover dark:border-slate-800"
              />
            ) : (
              <div
                className="aspect-[16/10] rounded-xl border border-slate-200 dark:border-slate-800"
                style={{ background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}0d)` }}
              />
            )}
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {new Date(shot.capturedAt).toTimeString().slice(0, 5)}
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-6 backdrop-blur-sm"
            onClick={() => setOpenIndex(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[85vh] max-w-3xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(null)}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
                aria-label="Close"
              >
                <X size={18} />
              </button>
              {active.imageUrl ? (
                <img src={active.imageUrl} alt="Screenshot preview" className="max-h-[85vh] w-full object-contain" />
              ) : (
                <div
                  className="flex h-80 w-[32rem] max-w-full items-center justify-center text-sm text-slate-400"
                  style={{ background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}0d)` }}
                >
                  No image available for this demo entry
                </div>
              )}
              <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                Captured at {new Date(active.capturedAt).toLocaleString()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
