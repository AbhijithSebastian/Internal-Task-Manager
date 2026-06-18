import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { DrawerProvider } from "@/hooks/useEntityDrawer";
import { DrawerRouter } from "@/components/ui/DrawerRouter";

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <DrawerProvider>
      <div className="flex h-screen overflow-hidden bg-app">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col min-w-0">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <DrawerRouter />
    </DrawerProvider>
  );
}
