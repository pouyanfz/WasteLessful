import type { Group } from "../types";
import { daysAgo, daysFromNow } from "./mockTimestamp";

export const mockGroups: Group[] = [
  {
    id: "group-1",
    name: "Home",
    ownerId: "user-1",
    memberIds: ["user-1", "user-2"],
    inviteCode: "HOME-1234",
    inviteCodeExpiresAt: daysFromNow(7) as never,
    updatedAt: daysAgo(1) as never,
  },
  {
    id: "group-2",
    name: "Office",
    ownerId: "user-1",
    memberIds: ["user-1"],
    inviteCode: "OFFI-5678",
    inviteCodeExpiresAt: null,
    updatedAt: daysAgo(3) as never,
  },
];
