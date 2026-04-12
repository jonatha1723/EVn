import React, { useState, useEffect } from 'react';
import { File as FileIcon, Download, Loader2 } from 'lucide-react';
import { DecryptedMessage } from '../../types';
import { decryptData } from '../../crypto';

interface MessageFileProps {
  msg: DecryptedMessage;
  privateKey: JsonWebKey | null;
  currentUserId: string;
}

export const MessageFile: React.FC<MessageFileProps> = ({ msg, privateKey, currentUserId }) => {
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!msg.fileUrl || !privateKey || msg.isUploading) return;

    const decryptFile = async () => {
      setIsDecrypting(true);
      setError(null);
      try {
        const response = await fetch(msg.fileUrl!);
        const encryptedBuffer = await response.arrayBuffer();
        
        const isMe = msg.senderId === currentUserId;
        const encryptedKey = isMe ? msg.encryptedKeyForSender : msg.encryptedKeyForReceiver;
        
        if (!encryptedKey || !msg.iv) {
          throw new Error("Chave ou IV ausente");
        }

        const decryptedBuffer = await decryptData(
          encryptedBuffer,
          encryptedKey,
          msg.iv,
          privateKey
        );

        const blob = new Blob([decryptedBuffer], { type: msg.fileType });
        const url = URL.createObjectURL(blob);
        setDecryptedUrl(url);
      } catch (err) {
        console.error("Decryption error:", err);
        setError("Erro ao carregar arquivo");
      } finally {
        setIsDecrypting(false);
      }
    };

    decryptFile();

    return () => {
      if (decryptedUrl) {
        URL.revokeObjectURL(decryptedUrl);
      }
    };
  }, [msg.fileUrl, privateKey, currentUserId]);

  if (!msg.fileUrl) return null;

  if (isDecrypting) {
    return (
      <div className="bg-black/20 rounded-2xl p-4 flex items-center gap-4 mb-2 border border-white/5">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
        <p className="text-xs text-zinc-500 font-medium">Descriptografando arquivo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black/20 rounded-2xl p-4 flex items-center gap-4 mb-2 border border-red-500/20">
        <FileIcon className="w-5 h-5 text-red-500" />
        <p className="text-xs text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  const displayUrl = msg.isUploading ? msg.localUrl : (decryptedUrl || msg.fileUrl);

  if (msg.fileType?.startsWith('image/')) {
    return (
      <div className="relative rounded-2xl overflow-hidden mb-2 group/img">
        <img 
          src={displayUrl} 
          alt={msg.fileName} 
          className={`max-w-full h-auto object-cover max-h-[300px] rounded-2xl transition-opacity ${msg.isUploading ? 'opacity-50 grayscale' : 'opacity-100'}`}
          referrerPolicy="no-referrer"
          onContextMenu={(e) => e.preventDefault()}
        />
        {msg.isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        )}
        {!msg.isUploading && (
          <a 
            href={displayUrl} 
            download={msg.fileName}
            className="absolute top-2 right-2 p-2 bg-black/50 rounded-xl opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-emerald-500"
          >
            <Download className="w-4 h-4 text-white" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-black/20 rounded-2xl p-4 flex items-center gap-4 mb-2 border border-white/5 transition-opacity ${msg.isUploading ? 'opacity-50' : 'opacity-100'}`}>
      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
        {msg.isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileIcon className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{msg.fileName}</p>
        <p className="text-[10px] opacity-50 uppercase tracking-wider">
          {msg.isUploading ? 'Enviando...' : (msg.fileType?.split('/')[1] || 'Arquivo')}
        </p>
      </div>
      {!msg.isUploading && (
        <a 
          href={displayUrl} 
          download={msg.fileName}
          className="p-2 hover:bg-white/10 rounded-xl transition-all"
        >
          <Download className="w-4 h-4" />
        </a>
      )}
    </div>
  );
};
