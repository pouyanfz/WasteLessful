import type { Timestamp } from "firebase/firestore";

export interface Group {
  id: string;
  name: string;
  color: string;
  ownerId: string;
  memberIds: string[];
  inviteCode: string;
  inviteCodeExpiresAt: Timestamp | null;
  updatedAt: Timestamp;
}
