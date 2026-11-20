import { ITEM_BY_ID } from '../../data/catalog';
import { useWorldStore } from '../../store/useWorldStore';

export function ModeHint() {
  const mode = useWorldStore((state) => state.mode);
  const selectedItemId = useWorldStore((state) => state.selectedItemId);

  let message = '';
  if (mode === 'view') {
    message = 'Left-drag to orbit · right-drag to pan · scroll to zoom';
  } else if (mode === 'remove') {
    message = 'Click any placed miniature to return it to your tray';
  } else if (selectedItemId) {
    message = `Placing ${ITEM_BY_ID[selectedItemId].name} · click a tile · R rotates · right-click stores`;
  } else {
    message = 'Pick a miniature from the tray or open the shop';
  }

  return (
    <div className="pointer-events-none absolute bottom-[6.1rem] left-1/2 z-30 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/55 bg-cream/70 px-3.5 py-1.5 text-[10px] font-semibold text-ink-soft/85 shadow-float backdrop-blur-lg sm:flex">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          mode === 'remove'
            ? 'bg-rose-400'
            : mode === 'build'
              ? 'bg-sage-deep'
              : 'bg-sky-deep'
        }`}
      />
      {message}
    </div>
  );
}
