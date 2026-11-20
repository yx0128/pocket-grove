import { beforeEach, describe, expect, it } from 'vitest';
import { REWARD_TIERS, STARTING_COINS } from '../data/catalog';
import { useWorldStore } from './useWorldStore';

function reset() {
  useWorldStore.getState().resetWorld();
}

describe('Pocket Grove world store', () => {
  beforeEach(() => {
    reset();
  });

  it('starts with the documented starter experience', () => {
    const state = useWorldStore.getState();
    expect(state.coins).toBe(STARTING_COINS);
    expect(state.tasks).toHaveLength(3);
    expect(state.inventory.grass).toBe(1);
    expect(state.inventory.pine).toBe(1);
    expect(state.placed).toHaveLength(0);
    expect(state.mode).toBe('build');
    expect(state.selectedItemId).toBe('grass');
  });

  it('awards the correct reward when a task is completed', () => {
    const store = useWorldStore.getState();
    const task = store.tasks.find((entry) => entry.tier === 'deep');
    expect(task).toBeDefined();
    store.completeTask(task!.id);
    const next = useWorldStore.getState();
    expect(next.coins).toBe(STARTING_COINS + REWARD_TIERS.deep.coins);
    expect(next.tasks.find((entry) => entry.id === task!.id)?.completed).toBe(
      true,
    );
  });

  it('does not pay out twice for the same task', () => {
    const store = useWorldStore.getState();
    const task = store.tasks[0];
    store.completeTask(task.id);
    useWorldStore.getState().completeTask(task.id);
    expect(useWorldStore.getState().coins).toBe(
      STARTING_COINS + REWARD_TIERS[task.tier].coins,
    );
  });

  it('adds a trimmed task at the top of the list', () => {
    useWorldStore.getState().addTask('   Write   release notes   ', 'standard');
    const task = useWorldStore.getState().tasks[0];
    expect(task.title).toBe('Write release notes');
    expect(task.tier).toBe('standard');
    expect(task.completed).toBe(false);
  });

  it('buys an item and deducts its price', () => {
    useWorldStore.getState().buyItem('pond');
    const state = useWorldStore.getState();
    expect(state.coins).toBe(STARTING_COINS - 20);
    expect(state.inventory.pond).toBe(1);
  });

  it('refuses a purchase that costs more than the balance', () => {
    useWorldStore.setState({ coins: 5 });
    const ok = useWorldStore.getState().buyItem('cottage');
    const state = useWorldStore.getState();
    expect(ok).toBe(false);
    expect(state.coins).toBe(5);
    expect(state.inventory.cottage).toBe(0);
  });

  it('selects an owned item for building', () => {
    useWorldStore.getState().selectItem('pine');
    const state = useWorldStore.getState();
    expect(state.mode).toBe('build');
    expect(state.selectedItemId).toBe('pine');
    expect(state.rotation).toBe(0);
  });

  it('places a miniature, consumes stock, and advances the selection', () => {
    const ok = useWorldStore.getState().placeItem(2, 3);
    const state = useWorldStore.getState();
    expect(ok).toBe(true);
    expect(state.inventory.grass).toBe(0);
    expect(state.placed).toHaveLength(1);
    expect(state.placed[0]).toMatchObject({
      itemId: 'grass',
      col: 2,
      row: 3,
      rotation: 0,
    });
    expect(state.selectedItemId).toBe('pine');
  });

  it('rejects occupied cells and out-of-bounds placements', () => {
    const store = useWorldStore.getState();
    store.placeItem(0, 0);
    const before = useWorldStore.getState();
    const occupied = useWorldStore.getState().placeItem(0, 0);
    const outside = useWorldStore.getState().placeItem(9, 9);
    const after = useWorldStore.getState();
    expect(occupied).toBe(false);
    expect(outside).toBe(false);
    expect(after.placed).toHaveLength(1);
    expect(after.inventory.pine).toBe(before.inventory.pine);
  });

  it('returns a placed miniature to the tray when removed', () => {
    const store = useWorldStore.getState();
    store.placeItem(4, 4);
    const removed = useWorldStore.getState().removeAt(4, 4);
    const state = useWorldStore.getState();
    expect(removed).toBe(true);
    expect(state.placed).toHaveLength(0);
    expect(state.inventory.grass).toBe(1);
  });

  it('restores the starter state on reset', () => {
    const store = useWorldStore.getState();
    store.buyItem('pond');
    store.placeItem(1, 1);
    useWorldStore.getState().resetWorld();
    const state = useWorldStore.getState();
    expect(state.coins).toBe(STARTING_COINS);
    expect(state.tasks).toHaveLength(3);
    expect(state.placed).toHaveLength(0);
    expect(state.inventory.grass).toBe(1);
    expect(state.inventory.pond).toBe(0);
  });
});
