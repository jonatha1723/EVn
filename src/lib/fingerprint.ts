export const getDeviceFingerprint = async () => {
  const data = [
    navigator.hardwareConcurrency || 0,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    !!window.indexedDB,
    !!window.sessionStorage,
    !!window.localStorage,
    navigator.platform
  ].join('|');
  
  // Hash simples usando Web Crypto API
  const msgBuffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};
