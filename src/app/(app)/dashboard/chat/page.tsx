import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { listRooms } from "@/lib/services/chat.service";

export const dynamic = "force-dynamic";

export default async function ChatIndexPage() {
  const user = await requireUser();
  const rooms = await listRooms(user);
  if (rooms.length > 0) {
    redirect(`/dashboard/chat/${rooms[0].id}`);
  }
  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-xl border border-dashed border-[#1F1F1F] p-12 text-center">
        <p className="text-sm text-[#FAFAFA]">No chat rooms yet.</p>
        <p className="text-xs text-[#71717A] mt-1">
          Run <code className="text-[#F59E0B]">pnpm db:seed:slice5</code> to create demo rooms.
        </p>
      </div>
    </div>
  );
}
