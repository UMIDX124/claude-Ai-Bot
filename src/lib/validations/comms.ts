import { z } from "zod";
import {
  AIRole,
  ChatRoomKind,
  MessageKind,
  NotificationChannel,
  NotificationKind,
} from "@prisma/client";

export const NotificationKindEnum = z.nativeEnum(NotificationKind);
export const NotificationChannelEnum = z.nativeEnum(NotificationChannel);
export const ChatRoomKindEnum = z.nativeEnum(ChatRoomKind);
export const MessageKindEnum = z.nativeEnum(MessageKind);
export const AIRoleEnum = z.nativeEnum(AIRole);

// Notifications
export const NotificationListQuerySchema = z.object({
  isRead: z.coerce.boolean().optional(),
  kind: z
    .union([NotificationKindEnum, z.array(NotificationKindEnum)])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  before: z.coerce.date().optional(),
});
export type NotificationListQuery = z.infer<typeof NotificationListQuerySchema>;

export const NotificationCreateSchema = z.object({
  userId: z.string().cuid(),
  kind: NotificationKindEnum,
  channel: NotificationChannelEnum.default("IN_APP"),
  title: z.string().min(1).max(200),
  body: z.string().max(2000).optional().nullable(),
  link: z.string().max(400).optional().nullable(),
});
export type NotificationCreateInput = z.infer<typeof NotificationCreateSchema>;

export const NotificationMarkReadSchema = z.object({
  ids: z.array(z.string().cuid()).optional(),
  all: z.boolean().default(false),
});
export type NotificationMarkReadInput = z.infer<typeof NotificationMarkReadSchema>;

export const NotificationPreferenceSchema = z.object({
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
});
export type NotificationPreferenceInput = z.infer<typeof NotificationPreferenceSchema>;

// Chat rooms
export const ChatRoomCreateSchema = z.object({
  kind: ChatRoomKindEnum.default("GROUP"),
  name: z.string().max(120).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  memberIds: z.array(z.string().cuid()).min(1).max(100),
  clientId: z.string().cuid().optional().nullable(),
  ticketId: z.string().cuid().optional().nullable(),
});
export type ChatRoomCreateInput = z.infer<typeof ChatRoomCreateSchema>;

export const ChatMessageCreateSchema = z.object({
  content: z.string().min(1).max(20_000),
  kind: MessageKindEnum.default("TEXT"),
  replyToId: z.string().cuid().optional().nullable(),
});
export type ChatMessageCreateInput = z.infer<typeof ChatMessageCreateSchema>;

// AI
export const AIConversationCreateSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  model: z.string().max(120).optional().nullable(),
});
export type AIConversationCreateInput = z.infer<typeof AIConversationCreateSchema>;

export const AIMessageCreateSchema = z.object({
  role: AIRoleEnum.default("USER"),
  content: z.string().min(1).max(20_000),
});
export type AIMessageCreateInput = z.infer<typeof AIMessageCreateSchema>;
