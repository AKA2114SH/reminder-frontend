import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useQuery } from "@tanstack/react-query";
import { HealthApi } from "@/lib/api/client";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: HealthApi.check,
    refetchInterval: 30000,
    retry: false,
  });

  return (
    <SidebarProvider open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          {/* Top Bar */}
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="rounded-md p-2 hover:bg-accent text-foreground transition-colors"
                  aria-label="Toggle Sidebar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                  </svg>
                </button>
                <h1 className="text-sm font-semibold tracking-tight">BAAP Notify Service</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border bg-muted/50 px-2.5 py-0.5">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      health?.status === 'ok' ? 'bg-success animate-pulse' : 'bg-destructive'
                    }`}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {health?.status === 'ok' ? 'Healthy' : 'Unhealthy'}
                  </span>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </header>
          {/* Page Content */}
          <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
