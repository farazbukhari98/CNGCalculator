const STORAGE_KEY = "cng-saved-strategies";

export interface SavedStrategy {
  id: string;
  name: string;
  createdAt: string;
  deploymentStrategy: string;
  vehicleParameters: any;
  stationConfig: any;
  fuelPrices: any;
  timeHorizon: number;
  vehicleDistribution: any[];
  calculatedResults?: any;
}

function getAll(): SavedStrategy[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setAll(strategies: SavedStrategy[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies));
}

export function getAllStrategies(): SavedStrategy[] {
  return getAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getStrategy(id: string): SavedStrategy | undefined {
  return getAll().find((s) => s.id === id);
}

export function saveStrategy(
  data: Omit<SavedStrategy, "id" | "createdAt">
): SavedStrategy {
  const strategy: SavedStrategy = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const all = getAll();
  all.push(strategy);
  setAll(all);
  return strategy;
}

export function updateStrategyName(
  id: string,
  name: string
): SavedStrategy | undefined {
  const all = getAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  all[idx].name = name;
  setAll(all);
  return all[idx];
}

export function deleteStrategy(id: string): boolean {
  const all = getAll();
  const filtered = all.filter((s) => s.id !== id);
  if (filtered.length === all.length) return false;
  setAll(filtered);
  return true;
}
