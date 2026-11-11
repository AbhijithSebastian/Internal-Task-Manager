import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface EntityDrawerState {
  isOpen: boolean;
  entityId: number | null;
  entityType: string;
}

interface DrawerContextType {
  state: EntityDrawerState;
  openDrawer: (entityType: string, entityId: number) => void;
  closeDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | null>(null);

let externalOpen: ((entityType: string, entityId: number) => void) | null = null;
let externalClose: (() => void) | null = null;

export function openDrawer(entityType: string, entityId: number) {
  if (externalOpen) externalOpen(entityType, entityId);
}

export function closeDrawer() {
  if (externalClose) externalClose();
}

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EntityDrawerState>({
    isOpen: false,
    entityId: null,
    entityType: "",
  });

  const openHandler = useCallback((entityType: string, entityId: number) => {
    setState({ isOpen: true, entityType, entityId });
  }, []);

  const closeHandler = useCallback(() => {
    setState({ isOpen: false, entityId: null, entityType: "" });
  }, []);

  externalOpen = openHandler;
  externalClose = closeHandler;

  return (
    <DrawerContext.Provider value={{ state, openDrawer: openHandler, closeDrawer: closeHandler }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useEntityDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error("useEntityDrawer must be used within DrawerProvider");
  return ctx;
}

export function useDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) return { open: openDrawer, close: closeDrawer, subscribe: () => () => {} };
  return { open: ctx.openDrawer, close: ctx.closeDrawer, subscribe: () => () => {} };
}
