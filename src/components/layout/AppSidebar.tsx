import { Link, useRouter } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Send,
  Upload,
  Clock,
  BarChart3,
  FileText,
  Settings,
  Bell,
} from "lucide-react";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Send Notification", icon: Send, path: "/send" },
  { title: "Bulk Upload", icon: Upload, path: "/bulk" },
  { title: "Scheduler", icon: Clock, path: "/scheduler" },
  { title: "Analytics", icon: BarChart3, path: "/analytics" },
  { title: "Logs", icon: FileText, path: "/logs" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

export function AppSidebar() {
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            BAAP Notify
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={currentPath === item.path}
                    className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground transition-colors"
                  >
                    <Link to={item.path} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-4 py-3 group-data-[collapsible=icon]:hidden">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
          v2.0 • Production
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
