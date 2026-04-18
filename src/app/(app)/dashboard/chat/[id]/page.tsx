import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getRoom, listRooms } from "@/lib/services/chat.service";
import { ChatRoomList } from "@/components/comms/chat-room-list";
import { ChatRoomView } from "@/components/comms/chat-room-view";

export const dynamic = "force-dynamic";

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  let room;
  try {
    room = await getRoom(user, id);
  } catch {
    notFound();
  }
  const rooms = await listRooms(user);

  const roomName =
    room.name ??
    (room.members
      .filter((m) => m.userId !== user.id)
      .map((m) => m.user.fullName ?? m.user.email)
      .join(", ") ||
      "Direct message");

  const serializedRooms = rooms.map((r) => ({
    ...r,
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div className="grid grid-cols-[260px_1fr] gap-4 h-[calc(100vh-7rem)]">
      <aside className="border-r border-[#1F1F1F] pr-3 overflow-y-auto">
        <h2 className="text-[11px] uppercase tracking-wider text-[#71717A] px-2 pb-2">
          Chat rooms
        </h2>
        <ChatRoomList
          rooms={serializedRooms}
          activeId={id}
          viewerId={user.id}
        />
      </aside>
      <section className="rounded-xl border border-[#1F1F1F] bg-[#0F0F0F] overflow-hidden">
        <ChatRoomView roomId={id} viewerId={user.id} roomName={roomName} />
      </section>
    </div>
  );
}
