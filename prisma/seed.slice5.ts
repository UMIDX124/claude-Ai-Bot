/**
 * Slice 5 — notifications, chat rooms, AI conversations (faker, deterministic).
 * Run: pnpm dotenv -e .env.local -- tsx prisma/seed.slice5.ts
 */
import {
  PrismaClient,
  NotificationKind,
  NotificationChannel,
  ChatRoomKind,
  MessageKind,
  AIRole,
} from "@prisma/client";
import { faker } from "@faker-js/faker";

faker.seed(55);
const db = new PrismaClient();

const NOTIFICATION_KINDS: NotificationKind[] = [
  "TASK_ASSIGNED",
  "TASK_DUE",
  "TASK_COMPLETED",
  "TASK_COMMENT",
  "TICKET_NEW",
  "TICKET_REPLY",
  "TICKET_SLA_RISK",
  "TICKET_RESOLVED",
  "DEAL_STAGE_CHANGED",
  "DEAL_WON",
  "INVOICE_SENT",
  "LEAVE_REQUEST",
  "MENTION",
  "SYSTEM",
];

async function seedNotifications(userIds: string[]) {
  let n = 0;
  for (const userId of userIds) {
    const count = faker.number.int({ min: 3, max: 12 });
    for (let i = 0; i < count; i += 1) {
      const kind = faker.helpers.arrayElement(NOTIFICATION_KINDS);
      const createdAt = faker.date.between({
        from: new Date(Date.now() - 14 * 24 * 3600_000),
        to: new Date(),
      });
      const isRead = i > 2 || faker.datatype.boolean({ probability: 0.4 });
      const existing = await db.notification.findFirst({
        where: { userId, kind, createdAt },
      });
      if (existing) continue;
      await db.notification.create({
        data: {
          userId,
          kind,
          channel: faker.helpers.arrayElement<NotificationChannel>([
            "IN_APP",
            "EMAIL",
            "PUSH",
          ]),
          title: titleFor(kind),
          body: faker.lorem.sentence({ min: 4, max: 10 }),
          link: linkFor(kind),
          isRead,
          readAt: isRead ? faker.date.between({ from: createdAt, to: new Date() }) : null,
          createdAt,
        },
      });
      n += 1;
    }
    await db.notificationPreference.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
      },
    });
  }
  console.log(`  seeded ${n} notifications for ${userIds.length} users`);
}

function titleFor(kind: NotificationKind): string {
  switch (kind) {
    case "TASK_ASSIGNED": return "New task assigned";
    case "TASK_DUE": return "Task due soon";
    case "TASK_COMPLETED": return "Task marked done";
    case "TASK_COMMENT": return "New comment on a task";
    case "TICKET_NEW": return "New support ticket";
    case "TICKET_REPLY": return "Customer replied";
    case "TICKET_SLA_RISK": return "SLA at risk";
    case "TICKET_RESOLVED": return "Ticket resolved";
    case "DEAL_STAGE_CHANGED": return "Deal moved stage";
    case "DEAL_WON": return "Deal won";
    case "INVOICE_SENT": return "Invoice sent";
    case "LEAVE_REQUEST": return "New leave request";
    case "MENTION": return "You were mentioned";
    default: return "System notification";
  }
}

function linkFor(kind: NotificationKind): string {
  if (kind.startsWith("TASK")) return "/dashboard/tasks";
  if (kind.startsWith("TICKET")) return "/dashboard/tickets";
  if (kind.startsWith("DEAL")) return "/dashboard/deals";
  if (kind.startsWith("INVOICE")) return "/dashboard/invoices";
  if (kind === "LEAVE_REQUEST") return "/dashboard/leaves";
  return "/dashboard";
}

async function seedChatRooms(userIds: string[]) {
  let rooms = 0;
  let messages = 0;

  const groupNames = ["#general", "#engineering", "#support"];
  for (const name of groupNames) {
    const existing = await db.chatRoom.findFirst({
      where: { kind: "CHANNEL", name },
    });
    const room = existing
      ? existing
      : await db.chatRoom.create({
          data: {
            kind: "CHANNEL" as ChatRoomKind,
            name,
            description: `Shared channel: ${name}`,
          },
        });
    if (!existing) rooms += 1;
    for (const userId of userIds.slice(0, 10)) {
      await db.chatMember.upsert({
        where: { roomId_userId: { roomId: room.id, userId } },
        update: {},
        create: { roomId: room.id, userId },
      });
    }
    const msgCount = faker.number.int({ min: 8, max: 20 });
    for (let i = 0; i < msgCount; i += 1) {
      const authorId = userIds[faker.number.int({ min: 0, max: Math.min(9, userIds.length - 1) })];
      const createdAt = faker.date.between({
        from: new Date(Date.now() - 10 * 24 * 3600_000),
        to: new Date(),
      });
      const existing = await db.message.findFirst({
        where: { roomId: room.id, authorId, createdAt },
      });
      if (existing) continue;
      await db.message.create({
        data: {
          room: { connect: { id: room.id } },
          author: { connect: { id: authorId } },
          kind: "TEXT" as MessageKind,
          content: faker.lorem.sentence({ min: 4, max: 18 }),
          createdAt,
          updatedAt: createdAt,
        },
      });
      messages += 1;
    }
  }

  for (let i = 0; i < 5 && userIds.length >= 2; i += 1) {
    const [a, b] = faker.helpers.arrayElements(userIds, 2);
    const room = await db.chatRoom.create({
      data: {
        kind: "DIRECT" as ChatRoomKind,
        members: { create: [{ userId: a }, { userId: b }] },
      },
    });
    rooms += 1;
    const msgCount = faker.number.int({ min: 4, max: 12 });
    for (let j = 0; j < msgCount; j += 1) {
      const authorId = j % 2 === 0 ? a : b;
      const createdAt = faker.date.recent({ days: 7 });
      await db.message.create({
        data: {
          room: { connect: { id: room.id } },
          author: { connect: { id: authorId } },
          kind: "TEXT",
          content: faker.lorem.sentence(),
          createdAt,
          updatedAt: createdAt,
        },
      });
      messages += 1;
    }
  }

  console.log(`  seeded ${rooms} chat rooms · ${messages} chat messages`);
}

async function seedAiConversations(userIds: string[]) {
  let convos = 0;
  let messages = 0;
  for (const userId of userIds.slice(0, 5)) {
    const title = faker.helpers.arrayElement([
      "Weekly status summary",
      "Draft Q2 outreach email",
      "Explain SLA breach reasons",
      "Prepare standup agenda",
    ]);
    const existing = await db.aIConversation.findFirst({
      where: { userId, title },
    });
    if (existing) continue;
    const c = await db.aIConversation.create({
      data: {
        userId,
        title,
        model: "llama-3.3-70b-versatile",
      },
    });
    convos += 1;
    const turns = faker.number.int({ min: 2, max: 5 });
    for (let i = 0; i < turns; i += 1) {
      const role: AIRole = i % 2 === 0 ? "USER" : "ASSISTANT";
      await db.aIMessage.create({
        data: {
          conversationId: c.id,
          role,
          content:
            role === "USER"
              ? faker.lorem.sentence({ min: 5, max: 14 })
              : faker.lorem.paragraph({ min: 1, max: 2 }),
        },
      });
      messages += 1;
    }
  }
  console.log(`  seeded ${convos} AI conversations · ${messages} AI messages`);
}

async function main() {
  console.log("→ seeding Slice 5 (notifications, chat, AI conversations)");
  const users = await db.user.findMany({
    where: { deletedAt: null, isActive: true },
    select: { id: true },
    take: 30,
  });
  if (users.length === 0) {
    throw new Error("No users — run main seed first.");
  }
  const userIds = users.map((u) => u.id);
  await seedNotifications(userIds);
  await seedChatRooms(userIds);
  await seedAiConversations(userIds);
  console.log("✔ Slice 5 seed complete");
}

main()
  .catch((err) => {
    console.error("seed.slice5 failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
