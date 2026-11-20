import { useRef, useState, type FormEvent } from 'react';
import {
  Brain,
  Check,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  Clock,
  Coins,
  HardDrive,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import {
  REWARD_TIERS,
  REWARD_TIER_IDS,
} from '../../data/catalog';
import { useWorldStore } from '../../store/useWorldStore';
import type { RewardTier, Task } from '../../types';

const TIER_ICONS: Record<RewardTier, LucideIcon> = {
  quick: Zap,
  standard: Clock,
  deep: Brain,
};

function TierBadge({ tier }: { tier: RewardTier }) {
  const meta = REWARD_TIERS[tier];
  return (
    <span
      className="rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide"
      style={{ backgroundColor: `${meta.accent}33`, color: '#3d4a40' }}
    >
      {meta.label}
    </span>
  );
}

function ActiveTask({ task }: { task: Task }) {
  const completeTask = useWorldStore((state) => state.completeTask);
  const deleteTask = useWorldStore((state) => state.deleteTask);
  const reward = REWARD_TIERS[task.tier].coins;

  return (
    <li className="group flex items-start gap-2 rounded-2xl border border-white/60 bg-white/45 p-2.5 transition hover:border-sage-deep/30 hover:bg-white/70">
      <button
        type="button"
        onClick={() => completeTask(task.id)}
        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-sage-deep/35 bg-white/70 text-transparent transition hover:scale-110 hover:border-forest hover:bg-sage-soft hover:text-forest"
        aria-label={`Complete ${task.title}`}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold leading-snug text-ink">
          {task.title}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <TierBadge tier={task.tier} />
          <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-gold-deep">
            <Coins className="h-2.5 w-2.5" />+{reward}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => deleteTask(task.id)}
        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-soft/40 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 focus:opacity-100"
        aria-label={`Delete ${task.title}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

function CompletedTask({ task }: { task: Task }) {
  const deleteTask = useWorldStore((state) => state.deleteTask);

  return (
    <li className="group flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-white/45">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest/10 text-forest">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink-soft line-through decoration-ink-soft/35">
        {task.title}
      </span>
      <span className="text-[10px] font-bold text-gold-deep">
        +{REWARD_TIERS[task.tier].coins}
      </span>
      <button
        type="button"
        onClick={() => deleteTask(task.id)}
        className="grid h-5 w-5 place-items-center rounded-full text-ink-soft/40 opacity-0 transition hover:text-rose-500 group-hover:opacity-100 focus:opacity-100"
        aria-label={`Delete ${task.title}`}
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </li>
  );
}

export function TaskSidebar() {
  const tasks = useWorldStore((state) => state.tasks);
  const addTask = useWorldStore((state) => state.addTask);
  const clearCompleted = useWorldStore((state) => state.clearCompleted);
  const resetWorld = useWorldStore((state) => state.resetWorld);
  const sidebarOpen = useWorldStore((state) => state.sidebarOpen);
  const setSidebarOpen = useWorldStore((state) => state.setSidebarOpen);
  const completedOpen = useWorldStore((state) => state.completedOpen);
  const setCompletedOpen = useWorldStore((state) => state.setCompletedOpen);

  const [title, setTitle] = useState('');
  const [tier, setTier] = useState<RewardTier>('standard');
  const inputRef = useRef<HTMLInputElement>(null);

  const active = tasks.filter((task) => !task.completed);
  const completed = tasks.filter((task) => task.completed);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    addTask(title, tier);
    setTitle('');
    inputRef.current?.focus();
  };

  const confirmReset = () => {
    if (
      window.confirm(
        'Reset your grove? Tasks, coins, inventory, and placed miniatures will return to the starter state.',
      )
    ) {
      resetWorld();
    }
  };

  if (!sidebarOpen) {
    return (
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="absolute left-3 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-2 rounded-2xl border border-white/60 bg-cream/75 px-2.5 py-3 text-forest shadow-glass backdrop-blur-xl transition hover:bg-cream active:scale-95"
        aria-label="Open task panel"
      >
        <ClipboardList className="h-5 w-5" />
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-forest px-1 text-[10px] font-black text-cream">
          {active.length}
        </span>
      </button>
    );
  }

  return (
    <aside className="absolute bottom-28 left-3 top-24 z-30 flex w-[calc(100%-1.5rem)] max-w-[342px] flex-col overflow-hidden rounded-[1.7rem] border border-white/60 bg-cream/75 shadow-glass backdrop-blur-xl animate-slide-in sm:left-4 sm:top-24">
      <div className="flex items-center gap-2 border-b border-white/50 px-3.5 pb-2.5 pt-3">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-forest text-cream">
          <ClipboardList className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-sm font-black tracking-tight text-forest">
            Today&apos;s tasks
          </h2>
          <p className="text-[10px] font-semibold text-ink-soft/75">
            {completed.length} done · {active.length} to go
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="grid h-7 w-7 place-items-center rounded-full text-ink-soft/60 transition hover:bg-white/70 hover:text-forest"
          aria-label="Collapse task panel"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={submit} className="border-b border-white/50 px-3.5 py-3">
        <div className="flex gap-1.5">
          <input
            ref={inputRef}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={90}
            placeholder="Add a real-world task…"
            className="min-w-0 flex-1 rounded-xl border border-white/80 bg-white/65 px-3 py-2 text-[13px] font-medium text-ink placeholder:text-ink-soft/45 shadow-sm outline-none transition focus:border-sage-deep/50 focus:bg-white focus:ring-2 focus:ring-sage/30"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest text-cream shadow-float transition hover:bg-[#31513c] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Add task"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {REWARD_TIER_IDS.map((id) => {
            const meta = REWARD_TIERS[id];
            const Icon = TIER_ICONS[id];
            const selected = tier === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTier(id)}
                title={meta.description}
                aria-pressed={selected}
                className={`flex flex-col items-start rounded-xl border px-2 py-1.5 text-left transition ${
                  selected
                    ? 'border-forest/30 bg-forest text-cream shadow-sm'
                    : 'border-white/70 bg-white/45 text-ink-soft hover:bg-white/75'
                }`}
              >
                <span className="flex items-center gap-1 text-[10px] font-black">
                  <Icon className="h-3 w-3" />
                  {meta.label}
                </span>
                <span
                  className={`text-[9px] font-bold ${
                    selected ? 'text-cream/75' : 'text-gold-deep'
                  }`}
                >
                  +{meta.coins} coins
                </span>
              </button>
            );
          })}
        </div>
      </form>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-3.5 py-3">
        {active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sage-deep/30 bg-white/30 px-3 py-6 text-center">
            <p className="text-[12px] font-bold text-forest">Inbox zero.</p>
            <p className="mt-0.5 text-[11px] text-ink-soft/75">
              Add a small task above to earn your next miniature.
            </p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {active.map((task) => (
              <ActiveTask key={task.id} task={task} />
            ))}
          </ul>
        )}

        <div className="mt-3 rounded-2xl border border-dashed border-sage-deep/25 bg-white/25 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-sage-deep">
            <Sparkles className="h-3 w-3" />
            Tiny ritual
          </div>
          <p className="mt-0.5 text-[11px] leading-snug text-ink-soft/75">
            Finish one small task, then place one miniature. A grove grows one
            tile at a time.
          </p>
        </div>

        {completed.length > 0 && (
          <div className="mt-3 rounded-2xl border border-white/55 bg-white/30 p-1.5">
            <button
              type="button"
              onClick={() => setCompletedOpen(!completedOpen)}
              className="flex w-full items-center gap-1.5 rounded-xl px-2 py-1.5 text-left transition hover:bg-white/55"
            >
              <Check className="h-3.5 w-3.5 text-forest" strokeWidth={3} />
              <span className="flex-1 text-[11px] font-black uppercase tracking-wide text-ink-soft">
                Completed · {completed.length}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-ink-soft/60 transition ${
                  completedOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {completedOpen && (
              <div className="mt-0.5">
                <ul>
                  {completed.map((task) => (
                    <CompletedTask key={task.id} task={task} />
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={clearCompleted}
                  className="mt-1 w-full rounded-lg px-2 py-1 text-[10px] font-bold text-ink-soft/60 transition hover:bg-white/60 hover:text-rose-500"
                >
                  Clear completed
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 border-t border-white/50 px-3.5 py-2">
        <HardDrive className="h-3 w-3 text-ink-soft/45" />
        <span className="text-[9px] font-semibold text-ink-soft/50">
          Saved locally
        </span>
        <button
          type="button"
          onClick={confirmReset}
          className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold text-ink-soft/55 transition hover:bg-white/60 hover:text-rose-500"
        >
          <RotateCcw className="h-3 w-3" />
          Reset world
        </button>
      </div>
    </aside>
  );
}
