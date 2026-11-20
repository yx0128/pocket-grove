import { useEffect } from 'react';
import { Eye } from 'lucide-react';
import { CATALOG } from './data/catalog';
import { audio } from './lib/sound';
import { useWorldStore } from './store/useWorldStore';
import { Scene } from './components/canvas/Scene';
import { BottomHotbar } from './components/ui/BottomHotbar';
import { ModeHint } from './components/ui/ModeHint';
import { ShopModal } from './components/ui/ShopModal';
import { TaskSidebar } from './components/ui/TaskSidebar';
import { Toasts } from './components/ui/Toasts';
import { TopBar } from './components/ui/TopBar';

export default function App() {
  const mode = useWorldStore((state) => state.mode);
  const selectedItemId = useWorldStore((state) => state.selectedItemId);
  const muted = useWorldStore((state) => state.muted);
  const hideUI = useWorldStore((state) => state.hideUI);
  const toggleHideUI = useWorldStore((state) => state.toggleHideUI);

  useEffect(() => {
    audio.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const cursor =
      hideUI || mode === 'view' || (mode === 'build' && !selectedItemId)
        ? 'grab'
        : 'crosshair';
    document.body.style.cursor = cursor;
    return () => {
      document.body.style.cursor = '';
    };
  }, [hideUI, mode, selectedItemId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        if (event.key === 'Escape') target.blur();
        return;
      }

      const state = useWorldStore.getState();

      if (event.key === 'Escape') {
        if (state.hideUI) {
          state.toggleHideUI();
          return;
        }
        if (state.shopOpen) {
          state.setShopOpen(false);
          return;
        }
        if (state.mode !== 'view') state.setMode('view');
        return;
      }

      if (state.hideUI) return;
      if (state.shopOpen) return;
      if (event.repeat) return;

      const key = event.key.toLowerCase();
      if (key === 'r') {
        event.preventDefault();
        state.rotate();
        return;
      }
      if (key === 'b') {
        state.setMode('build');
        return;
      }
      if (key === 'v') {
        state.setMode('view');
        return;
      }
      if (key === 'x') {
        state.setMode('remove');
        return;
      }
      if (/^[1-9]$/.test(event.key)) {
        const item = CATALOG[Number(event.key) - 1];
        if (item) state.selectItem(item.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main
      className="relative h-[100dvh] w-screen overflow-hidden bg-[#f9dfba] font-sans text-ink"
      style={{
        background:
          'radial-gradient(circle at 80% 8%, rgba(255, 244, 204, 0.88), transparent 32%), linear-gradient(180deg, #9bd6ea 0%, #c7e7ee 45%, #f9dfba 100%)',
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="absolute inset-0">
        <Scene />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(circle_at_50%_42%,transparent_52%,rgba(47,58,52,0.13)_100%)]" />

      {!hideUI && (
        <>
          <TopBar />
          <TaskSidebar />
          <ModeHint />
          <BottomHotbar />
          <Toasts />
          <ShopModal />
        </>
      )}

      {hideUI && (
        <button
          type="button"
          onClick={toggleHideUI}
          className="absolute bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-white/60 bg-cream/75 px-3.5 py-2 text-[11px] font-black text-forest shadow-glass backdrop-blur-xl transition hover:bg-cream active:scale-95"
        >
          <Eye className="h-4 w-4" />
          Show interface
        </button>
      )}
    </main>
  );
}
