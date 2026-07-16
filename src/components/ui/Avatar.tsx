interface AvatarProps {
  initials: string
  color: string
  size?: number
  status?: 'online' | 'offline'
}

export default function Avatar({ initials, color, size = 36, status }: AvatarProps) {
  return (
    <span className="relative inline-flex flex-shrink-0" style={{ width: size, height: size }}>
      <span
        className="flex h-full w-full items-center justify-center rounded-full text-xs font-semibold text-white"
        style={{ background: color }}
      >
        {initials}
      </span>
      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
            status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
        />
      )}
    </span>
  )
}
