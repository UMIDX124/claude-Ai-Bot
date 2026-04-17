import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Briefcase,
  TicketPercent,
  UserCog,
  CalendarClock,
  ReceiptText,
} from "lucide-react";
import { ensureUserRecord } from "@/lib/auth";
import { redirect } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/clients", label: "Clients", icon: Briefcase },
  { href: "/deals", label: "Deals", icon: Users },
  { href: "/tickets", label: "Tickets", icon: TicketPercent },
  { href: "/employees", label: "Employees", icon: UserCog },
  { href: "/leaves", label: "Leaves", icon: CalendarClock },
  { href: "/invoices", label: "Invoices", icon: ReceiptText },
];

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await ensureUserRecord();
  if (!user) redirect("/sign-in");

  return (
    <div className="min-h-screen flex bg-[#0D0D0D] text-[#FAFAFA]">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-[#1F1F1F] bg-[#0D0D0D]">
        <div className="h-14 flex items-center gap-2 px-5 border-b border-[#1F1F1F]">
          <div className="w-7 h-7 rounded-md bg-[#F59E0B] text-[#0D0D0D] grid place-items-center font-bold text-sm">
            A
          </div>
          <span className="font-semibold tracking-tight">Alpha</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1F1F1F] transition-colors"
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-[#1F1F1F] text-xs text-[#71717A]">
          <p className="truncate">{user.fullName ?? user.email}</p>
          <p className="text-[10px] uppercase tracking-wider text-[#F59E0B]">{user.role}</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-[#1F1F1F] flex items-center justify-between px-6">
          <div>
            <h1 className="text-sm font-medium text-[#A1A1AA]">Alpha Command Center</h1>
          </div>
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                variables: { colorPrimary: "#F59E0B" },
                elements: { avatarBox: "w-8 h-8" },
              }}
            />
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
