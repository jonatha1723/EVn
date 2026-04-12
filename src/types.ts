import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

export interface UserData {
  uid: string;
  displayName: string;
  email: string;
  uniqueCode: string;
  publicKey: JsonWebKey;
  contacts?: string[];
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  chatId: string;
  encryptedContent: string;
  encryptedKeyForSender: string;
  encryptedKeyForReceiver: string;
  iv: string;
  timestamp?: Timestamp;
  clientTimestamp: number;
  replyToId?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  isViewOnce?: boolean;
  viewedAt?: Timestamp;
  isUploading?: boolean;
  isPending?: boolean;
  localUrl?: string;
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
