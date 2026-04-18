import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/lib/services/notification.service";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();
  const { items, unreadCount } = await listNotifications(user, { limit: 100 });

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <header className="border-b border-[#1F1F1F] pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA]">
          Notifications
        </h1>
        <p className="text-sm text-[#A1A1AA] mt-1">
          {unreadCount} unread · last 100
        </p>
      </header>

      <ul className="space-y-2">
        {items.length === 0 && (
          <li className="text-sm text-[#71717A]">Nothing to see here yet.</li>
        )}
        {items.map((n) => {
          const inner = (
            <div
              className={`rounded-lg border px-4 py-3 ${
                n.isRead
                  ? "border-[#1F1F1F] bg-[#0F0F0F]"
                  : "border-[#F59E0B]/30 bg-[#F59E0B]/5"
              }`}
            >
              <header className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#FAFAFA]">{n.title}</p>
                <span className="text-[10px] text-[#71717A]">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </span>
              </header>
              {n.body && <p className="text-xs text-[#A1A1AA] mt-1">{n.body}</p>}
              <p className="text-[10px] text-[#71717A] mt-1 uppercase tracking-wider">
                {n.kind.replace(/_/g, " ").toLowerCase()} · {n.channel.toLowerCase()}
              </p>
            </div>
          );
          return (
            <li key={n.id}>
              {n.link ? <Link href={n.link}>{inner}</Link> : inner}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
