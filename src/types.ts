import { Timestamp } from 'firebase/firestore';

export interface UserData {
  uid: string;
  displayName: string;
  email: string;
  uniqueCode: string;
  publicKey: JsonWebKey;
  contacts: string[];
  role?: 'admin' | 'user';
  lastActive?: any;
  settings?: {
    autoAcceptFriends?: boolean;
    autoAcceptGroups?: boolean;
  };
}

export interface Group {
  id: string;
  name: string;
  adminUid: string;
  members: string[];
  banned?: string[];
  imageIndex: number;
  createdAt: any;
  lastMessage?: string;
  lastMessageTime?: any;
}

export interface GroupRequest {
  id: string;
  type: 'friend' | 'group';
  fromUid: string;
  fromName: string;
  toUid: string;
  groupId?: string;
  groupName?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: any;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string; // Para mensagens privadas
  groupId?: string; // Para mensagens de grupo
  chatId: string;
  encryptedContent: string;
  encryptedKeyForSender?: string;
  encryptedKeyForReceiver?: string;
  iv: string;
  timestamp?: any;
  clientTimestamp: number;
  replyToId?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  mimeType?: string;
  isViewOnce?: boolean;
  viewedAt?: Timestamp;
  isUploading?: boolean;
  isPending?: boolean;
  localUrl?: string;
  senderName?: string; // Para exibição em grupos
}

export interface DecryptedMessage extends Message {
  text: string;
}

export interface MessagePosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface InviteToken {
  id?: string;
  creatorUid: string;
  creatorName: string;
  creatorCode: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
  usedBy?: string;
}
