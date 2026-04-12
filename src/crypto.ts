export const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

  return { publicKeyJwk, privateKeyJwk };
};

export const importPublicKey = async (jwk: JsonWebKey) => {
  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );
};

export const importPrivateKey = async (jwk: JsonWebKey) => {
  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt']
  );
};

export const encryptData = async (
  data: Uint8Array,
  senderPubKeyJwk: JsonWebKey,
  receiverPubKeyJwk: JsonWebKey
) => {
  // Generate a symmetric AES-GCM key for the data
  const aesKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Encrypt the data content with the AES key
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    data
  );

  // Export the AES key so we can encrypt it with RSA
  const rawAesKey = await window.crypto.subtle.exportKey('raw', aesKey);

  // Import the RSA public keys
  const senderPubKey = await importPublicKey(senderPubKeyJwk);
  const receiverPubKey = await importPublicKey(receiverPubKeyJwk);

  // Encrypt the AES key for both the sender and the receiver
  const encryptedKeyForSender = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    senderPubKey,
    rawAesKey
  );
  const encryptedKeyForReceiver = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    receiverPubKey,
    rawAesKey
  );

  return {
    encryptedContent, // ArrayBuffer
    encryptedKeyForSender: arrayBufferToBase64(encryptedKeyForSender),
    encryptedKeyForReceiver: arrayBufferToBase64(encryptedKeyForReceiver),
    iv: arrayBufferToBase64(iv.buffer),
  };
};

export const decryptData = async (
  encryptedContent: ArrayBuffer,
  encryptedKeyB64: string,
  ivB64: string,
  privateKeyJwk: JsonWebKey
) => {
  const privateKey = await importPrivateKey(privateKeyJwk);
  const encryptedKey = base64ToArrayBuffer(encryptedKeyB64);
  
  // Decrypt the AES key using our RSA private key
  const rawAesKey = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    encryptedKey
  );

  // Import the decrypted AES key
  const aesKey = await window.crypto.subtle.importKey(
    'raw',
    rawAesKey,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = base64ToArrayBuffer(ivB64);

  // Decrypt the actual data content
  return await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encryptedContent
  );
};

export const encryptMessage = async (
  text: string,
  senderPubKeyJwk: JsonWebKey,
  receiverPubKeyJwk: JsonWebKey
) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const result = await encryptData(data, senderPubKeyJwk, receiverPubKeyJwk);
  
  return {
    ...result,
    encryptedContent: arrayBufferToBase64(result.encryptedContent),
  };
};

export const decryptMessage = async (
  encryptedContentB64: string,
  encryptedKeyB64: string,
  ivB64: string,
  privateKeyJwk: JsonWebKey
) => {
  if (!encryptedContentB64 || !encryptedKeyB64 || !ivB64 || !privateKeyJwk) {
    return '🔒 [Mensagem Indisponível - Chave Ausente]';
  }

  try {
    const encryptedContent = base64ToArrayBuffer(encryptedContentB64);
    const decryptedContent = await decryptData(
      encryptedContent,
      encryptedKeyB64,
      ivB64,
      privateKeyJwk
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedContent);
  } catch (e) {
    return '🔒 [Mensagem Indisponível - Chave Incorreta]';
  }
};

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}
