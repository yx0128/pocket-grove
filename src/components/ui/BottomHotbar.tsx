import { RotateCw, ShoppingBag } from 'lucide-react';
import { CATALOG } from '../../data/catalog';
import { useWorldStore } from '../../store/useWorldStore';
import { ItemIcon } from './ItemIcon';

export function BottomHotbar() {
  const inventory = useWorldStore((state) => state.inventory);
  const selectedItemId = useWorldStore((state) => state.selectedItemId);
  const mode = useWorldStore((state) => state.mode);
  const selectItem = useWorldStore((state) => state.selectItem);
  const rotate = useWorldStore((state) => state.rotate);
  const setShopOpen = useWorldStore((state) => state.setShopOpen);

  return (
    <div className="absolute bottom-3 left-1/2 z-40 flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-1.5 overflow-x-auto rounded-[1.6rem] border border-white/60 bg-cream/75 p-1.5 shadow-glass backdrop-blur-xl scrollbar-none sm:bottom-4">
      <div className="flex items-center gap-1.5">
        {CATALOG.map((item, index) => {
          const count = inventory[item.id];
          const selected = mode === 'build' && selectedItemId === item.id;
          const keyLabel = index < 9 ? String(index + 1) : null;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectItem(item.id)}
              title={`${item.name} · ${count} in tray · ${item.price} coins in shop`}
              aria-label={`Select ${item.name}, ${count} in tray`}
              aria-pressed={selected}
              className={`group relative grid h-[52px] w-[50px] place-items-center rounded-2xl border transition active:scale-95 ${
                selected
                  ? 'border-forest bg-forest text-cream shadow-float'
                  : count > 0
                    ? 'border-white/70 bg-white/55 text-forest hover:border-sage-deep/40 hover:bg-white/85'
                    : 'border-white/40 bg-white/25 text-ink-soft/35 hover:bg-white/45'
              }`}
            >
              {keyLabel && (
                <span
                  className={`absolute left-1 top-0.5 text-[8px] font-black ${
                    selected ? 'text-cream/60' : 'text-ink-soft/40'
                  }`}
                >
                  {keyLabel}
                </span>
              )}
              <span
                className="grid h-8 w-8 place-items-center rounded-xl"
                style={
                  selected
                    ? { backgroundColor: 'rgba(253,247,234,0.16)' }
                    : { backgroundColor: `${item.accent}24` }
                }
              >
                <ItemIcon icon={item.icon} className="h-[18px] w-[18px]" />
              </span>
              <span
                className={`absolute -bottom-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[8px] font-black shadow-sm ${
                  count > 0
                    ? selected
                      ? 'bg-gold text-[#5e4008]'
                      : 'bg-forest text-cream'
                    : 'bg-ink/15 text-ink-soft/60'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mx-0.5 h-8 w-px shrink-0 bg-ink/10" />

      <button
        type="button"
        onClick={rotate}
        disabled={!selectedItemId}
        title="Rotate preview (R)"
        aria-label="Rotate preview"
        className="relative grid h-[52px] w-[50px] shrink-0 place-items-center rounded-2xl border border-white/70 bg-white/55 text-forest transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-35"
      >
        <RotateCw className="h-5 w-5" />
        <span className="absolute bottom-0.5 text-[8px] font-black text-ink-soft/45">
          R
        </span>
      </button>

      <button
        type="button"
        onClick={() => setShopOpen(true)}
        className="inline-flex h-[52px] shrink-0 items-center gap-1.5 rounded-2xl bg-forest px-3 text-cream shadow-float transition hover:bg-[#31513c] active:scale-[0.98]"
      >
        <ShoppingBag className="h-4 w-4" />
        <span className="text-[11px] font-black tracking-wide">Shop</span>
      </button>
    </div>
  );
}
