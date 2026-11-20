import {
  Coins,
  Eye,
  EyeOff,
  Hammer,
  RotateCcw,
  Trash2,
  Trees,
  Volume2,
  VolumeX,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useWorldStore } from '../../store/useWorldStore';
import type { WorldMode } from '../../types';
import { AnimatedNumber } from './AnimatedNumber';

const MODES: {
  id: WorldMode;
  label: string;
  icon: LucideIcon;
  hint: string;
}[] = [
  { id: 'view', label: 'View', icon: Eye, hint: 'Look around your grove' },
  { id: 'build', label: 'Build', icon: Hammer, hint: 'Place miniatures on the grid' },
  { id: 'remove', label: 'Remove', icon: Trash2, hint: 'Store miniatures back in your tray' },
];

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-white/60 bg-white/45 text-ink-soft shadow-sm transition hover:-translate-y-0.5 hover:bg-white/75 hover:text-forest active:translate-y-0"
    >
      {children}
    </button>
  );
}

export function TopBar() {
  const coins = useWorldStore((state) => state.coins);
  const mode = useWorldStore((state) => state.mode);
  const setMode = useWorldStore((state) => state.setMode);
  const muted = useWorldStore((state) => state.muted);
  const toggleMuted = useWorldStore((state) => state.toggleMuted);
  const toggleHideUI = useWorldStore((state) => state.toggleHideUI);
  const requestCameraReset = useWorldStore((state) => state.requestCameraReset);

  return (
    <header className="absolute left-3 right-3 top-3 z-40 sm:left-4 sm:right-4 sm:top-4">
      <div className="flex items-center gap-2 rounded-[1.6rem] border border-white/60 bg-cream/70 px-2.5 py-2 shadow-glass backdrop-blur-xl sm:gap-3 sm:px-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-forest text-cream shadow-float">
            <Trees className="h-5 w-5" />
          </span>
          <div className="min-w-0 leading-tight">
            <h1 className="truncate font-display text-[17px] font-black tracking-tight text-forest">
              Pocket Grove
            </h1>
            <p className="hidden truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-soft/70 lg:block">
              task-powered diorama
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-2 rounded-full border border-gold/50 bg-gradient-to-b from-[#fff8de] to-[#ffe6a0] py-1 pl-1 pr-3 shadow-coin">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-gold text-[#74510d]">
              <Coins className="h-3.5 w-3.5" />
            </span>
            <AnimatedNumber
              value={coins}
              className="min-w-[2ch] text-sm font-black text-[#6f4b0b]"
            />
            <span className="hidden text-[10px] font-bold uppercase tracking-wider text-[#8c691f] sm:inline">
              coins
            </span>
          </div>

          <div className="hidden items-center gap-0.5 rounded-full border border-white/60 bg-white/40 p-1 md:flex">
            {MODES.map((entry) => {
              const Icon = entry.icon;
              const active = mode === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setMode(entry.id)}
                  title={entry.hint}
                  aria-pressed={active}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold transition ${
                    active
                      ? 'bg-forest text-cream shadow-float'
                      : 'text-ink-soft hover:bg-white/70 hover:text-forest'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{entry.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden h-7 w-px bg-ink/10 sm:block" />

          <IconButton label="Reset camera" onClick={requestCameraReset}>
            <RotateCcw className="h-4 w-4" />
          </IconButton>
          <IconButton
            label={muted ? 'Unmute sounds' : 'Mute sounds'}
            onClick={toggleMuted}
          >
            {muted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </IconButton>
          <IconButton label="Hide interface" onClick={toggleHideUI}>
            <EyeOff className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div className="mt-2 flex justify-end md:hidden">
        <div className="flex items-center gap-0.5 rounded-full border border-white/60 bg-cream/75 p-1 shadow-glass backdrop-blur-xl">
          {MODES.map((entry) => {
            const Icon = entry.icon;
            const active = mode === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setMode(entry.id)}
                aria-pressed={active}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold ${
                  active
                    ? 'bg-forest text-cream'
                    : 'text-ink-soft hover:bg-white/70'
                }`}
              >
                <Icon className="h-3 w-3" />
                {entry.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
