import {
  Check,
  Coins,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import { CATALOG } from '../../data/catalog';
import { useWorldStore } from '../../store/useWorldStore';
import { AnimatedNumber } from './AnimatedNumber';
import { ItemIcon } from './ItemIcon';

export function ShopModal() {
  const open = useWorldStore((state) => state.shopOpen);
  const setShopOpen = useWorldStore((state) => state.setShopOpen);
  const coins = useWorldStore((state) => state.coins);
  const inventory = useWorldStore((state) => state.inventory);
  const buyItem = useWorldStore((state) => state.buyItem);
  const selectItem = useWorldStore((state) => state.selectItem);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/35 p-3 backdrop-blur-sm animate-fade-in"
      onClick={() => setShopOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shop-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[88dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-cream/95 shadow-2xl animate-modal-in"
      >
        <div className="flex items-center gap-3 border-b border-white/60 bg-gradient-to-r from-cream via-[#fbf0dd] to-sage-soft/40 px-4 py-3.5 sm:px-5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-forest text-cream shadow-float">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="shop-title"
              className="font-display text-lg font-black tracking-tight text-forest"
            >
              Build Shop
            </h2>
            <p className="text-[11px] font-semibold text-ink-soft/75">
              Every miniature is 1×1 and snaps to the meadow grid.
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-gold/50 bg-gradient-to-b from-[#fff8de] to-[#ffe6a0] py-1 pl-1 pr-3 shadow-coin sm:flex">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-gold text-[#74510d]">
              <Coins className="h-3.5 w-3.5" />
            </span>
            <AnimatedNumber
              value={coins}
              className="text-sm font-black text-[#6f4b0b]"
            />
          </div>
          <button
            type="button"
            onClick={() => setShopOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/70 bg-white/60 text-ink-soft transition hover:bg-white hover:text-forest"
            aria-label="Close shop"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="scrollbar-thin grid gap-3 overflow-y-auto p-3.5 sm:grid-cols-2 sm:p-4 lg:grid-cols-3">
          {CATALOG.map((item) => {
            const owned = inventory[item.id];
            const affordable = coins >= item.price;
            return (
              <article
                key={item.id}
                className="flex flex-col rounded-2xl border border-white/75 bg-white/60 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-float"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                    style={{
                      backgroundColor: `${item.accent}26`,
                      color: item.accent,
                    }}
                  >
                    <ItemIcon icon={item.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-[13px] font-black text-ink">
                        {item.name}
                      </h3>
                      <span className="rounded-full bg-sage-soft/70 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-forest">
                        {item.category}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-ink-soft/80">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-1 text-[11px] font-black text-gold-deep">
                    <Coins className="h-3 w-3" />
                    {item.price}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-ink-soft/60">
                    <Sparkles className="h-3 w-3" />
                    {owned} owned
                  </span>
                  <span className="ml-auto rounded-full border border-sage-deep/20 bg-white/60 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-sage-deep">
                    1×1
                  </span>
                </div>

                <div className="mt-2.5 flex gap-1.5">
                  {owned > 0 && (
                    <button
                      type="button"
                      onClick={() => selectItem(item.id)}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-sage-deep/25 bg-sage-soft/60 px-2 py-1.5 text-[11px] font-black text-forest transition hover:bg-sage-soft"
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                      Place
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!affordable}
                    onClick={() => buyItem(item.id)}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-forest px-2 py-1.5 text-[11px] font-black text-cream shadow-sm transition hover:bg-[#31513c] disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-ink-soft/45"
                  >
                    {affordable ? 'Buy' : 'Need coins'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-white/60 px-4 py-2.5 text-[10px] font-semibold text-ink-soft/65">
          <Coins className="h-3 w-3 text-gold-deep" />
          Complete tasks to earn coins. Every new miniature is added to your tray.
          <span className="ml-auto hidden sm:inline">
            Tip: press 1–9 to quick-select.
          </span>
        </div>
      </div>
    </div>
  );
}
