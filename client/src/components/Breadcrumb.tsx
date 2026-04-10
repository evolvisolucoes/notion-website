import { ChevronRight, Home } from "lucide-react";
import { useLocation } from "wouter";
import { createContext, useContext, useCallback, useState, useEffect, ReactNode } from "react";

type BreadcrumbEntry = {
  label: string;
  path: string;
};

type BreadcrumbContextType = {
  trail: BreadcrumbEntry[];
  push: (entry: BreadcrumbEntry) => void;
  reset: () => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextType>({
  trail: [],
  push: () => {},
  reset: () => {},
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [trail, setTrail] = useState<BreadcrumbEntry[]>([]);
  const [location] = useLocation();

  // Reset trail when going to dashboard
  useEffect(() => {
    if (location === "/dashboard") {
      setTrail([]);
    }
  }, [location]);

  const push = useCallback((entry: BreadcrumbEntry) => {
    setTrail((prev) => {
      // If already in trail, truncate to that point
      const existingIndex = prev.findIndex((e) => e.path === entry.path);
      if (existingIndex >= 0) {
        return prev.slice(0, existingIndex + 1);
      }
      return [...prev, entry];
    });
  }, []);

  const reset = useCallback(() => setTrail([]), []);

  return (
    <BreadcrumbContext.Provider value={{ trail, push, reset }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  return useContext(BreadcrumbContext);
}

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const [, setLocation] = useLocation();
  const { trail } = useBreadcrumb();

  // Merge trail with current items
  const allItems: BreadcrumbItem[] = [
    ...trail.slice(0, -1).map((e) => ({ label: e.label, href: e.path })),
    ...items,
  ];

  // Deduplicate by label
  const seen = new Set<string>();
  const deduped = allItems.filter((item) => {
    const key = item.label;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
      <button
        onClick={() => setLocation("/dashboard")}
        className="hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
      >
        <Home className="h-3.5 w-3.5" />
      </button>
      {deduped.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
          {item.href ? (
            <button
              onClick={() => setLocation(item.href!)}
              className="hover:text-blue-600 transition-colors hover:underline underline-offset-4"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-gray-800 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
