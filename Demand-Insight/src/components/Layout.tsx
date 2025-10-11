import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BarChart3, Package, TrendingUp, Settings, Upload, Bell } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "SKU Explorer", href: "/sku-explorer", icon: Package },
  { name: "Reorder Recommendations", href: "/reorder", icon: TrendingUp },
  { name: "Data Management", href: "/data", icon: Upload },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <nav className="border-b bg-card">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">DemandIQ</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r bg-card min-h-[calc(100vh-4rem)]">
          <nav className="flex flex-col gap-1 p-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
