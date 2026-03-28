import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type LayoutDensity = "comfortable" | "compact";

const STORAGE_KEY = "pd-assess-layout-density";

type LayoutDensityContextValue = {
  density: LayoutDensity;
  setDensity: (d: LayoutDensity) => void;
  toggleDensity: () => void;
};

const LayoutDensityContext = createContext<LayoutDensityContextValue | null>(null);

function readStored(): LayoutDensity {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "compact" || v === "comfortable") return v;
  } catch {
    /* ignore */
  }
  return "comfortable";
}

export function LayoutDensityProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensityState] = useState<LayoutDensity>(() =>
    typeof document !== "undefined" ? readStored() : "comfortable"
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("layout-compact", density === "compact");
    try {
      localStorage.setItem(STORAGE_KEY, density);
    } catch {
      /* ignore */
    }
  }, [density]);

  const setDensity = useCallback((d: LayoutDensity) => {
    setDensityState(d);
  }, []);

  const toggleDensity = useCallback(() => {
    setDensityState((prev) => (prev === "compact" ? "comfortable" : "compact"));
  }, []);

  const value = useMemo(
    () => ({ density, setDensity, toggleDensity }),
    [density, setDensity, toggleDensity]
  );

  return (
    <LayoutDensityContext.Provider value={value}>{children}</LayoutDensityContext.Provider>
  );
}

export function useLayoutDensity() {
  const ctx = useContext(LayoutDensityContext);
  if (!ctx) {
    throw new Error("useLayoutDensity must be used within LayoutDensityProvider");
  }
  return ctx;
}
