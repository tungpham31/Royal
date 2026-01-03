"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  TrendingUp,
  PieChart,
  BarChart3,
  Settings,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePrivacyStore } from "@/lib/stores/privacy-store";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Transactions", href: "/transactions", icon: ArrowRightLeft },
  { name: "Net Worth", href: "/net-worth", icon: TrendingUp },
  { name: "Investments", href: "/investments", icon: PieChart },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isPrivate, togglePrivacy } = usePrivacyStore();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">Royal</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t p-4 space-y-2">
          {/* Privacy Mode Toggle */}
          <div className="flex items-center justify-between rounded-md px-3 py-2">
            <div className="flex items-center gap-3 text-sm font-medium text-sidebar-foreground">
              {isPrivate ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
              <span>Privacy</span>
            </div>
            <Switch
              checked={isPrivate}
              onCheckedChange={togglePrivacy}
              aria-label="Toggle privacy mode"
            />
          </div>

          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/settings"
                ? "bg-sidebar-accent text-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>

          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              className="mt-1 w-full justify-start gap-3 px-3 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}
