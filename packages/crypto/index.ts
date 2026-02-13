/**
 * 🛡️ CRYPTO ERROR CODE STANDARD
 * ---------------------------------------------------------
 * ER-4001 : Integrity Check Failed (Auth Tag Mismatch)
 * ER-4002 : Invalid Nonce Length (Must be 12 bytes)
 * ER-4003 : Invalid Key Length (Must be 32 bytes)
 * ER-4004 : Ciphertext Corrupted (Invalid Hex/Format)
 * ER-5000 : Unknown Decryption Failure
 * ---------------------------------------------------------
 */

import crypto from 'crypto';

export const CryptoErrors = {
  INTEGRITY_FAIL: "ER-4001",
  INVALID_NONCE: "ER-4002",
  INVALID_KEY: "ER-4003",
  CIPHERTEXT_CORRUPT: "ER-4004", // New specific code
  UNKNOWN: "ER-5000"
};

// Types for your secure record
export interface SecureTransaction {
  partyId: string;
  payload_nonce: string;
  payload_ct: string;
  payload_tag: string;
  dek_wrap_nonce: string;
  dek_wrapped: string;
  dek_wrap_tag: string;
}

// Visual helpers
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
  white: "\x1b[37m",
  blue: "\x1b[34m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m"
};

const getTimestamp = () => {
  const now = new Date();
  return `${colors.dim}${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}${colors.reset}`;
};

const logBoxHeader = (title: string, sessionId: string, color: string) => {
  console.log(`\n${color}╔════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${color}║ ${colors.bright}${colors.white}${title.padEnd(50)} ${colors.dim}ID: ${sessionId}${colors.reset} ${color}║${colors.reset}`);
  console.log(`${color}╠════════════════════════════════════════════════════════════════╣${colors.reset}`);
};

const logBoxFooter = (color: string) => {
  console.log(`${color}╚════════════════════════════════════════════════════════════════╝${colors.reset}\n`);
};

const logEntry = (label: string, value: string, icon: string = "◈") => {
  const cleanLabel = label.padEnd(18);
  console.log(`  ${colors.cyan}${icon} ${colors.white}${cleanLabel}${colors.reset} ${colors.dim}→${colors.reset} ${value}`);
};

// Low-level GCM Encrypt Helper
const encryptGCM = (data: Buffer, key: Buffer) => {
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
  return {
    ciphertext: ciphertext.toString('hex'),
    nonce: nonce.toString('hex'),
    tag: cipher.getAuthTag().toString('hex'),
  };
};

// Low-level GCM Decrypt Helper
const decryptGCM = (dataHex: string, nonceHex: string, tagHex: string, key: Buffer): Buffer => {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(nonceHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
};

export const encryptTransaction = (partyId: string, payload: any, masterKeyHex: string): SecureTransaction => {
  const sessionId = crypto.randomBytes(2).toString('hex').toUpperCase();
  logBoxHeader("ENCRYPTION ENGINE: LOCKING DATA", sessionId, colors.blue);
  
  const mk = Buffer.from(masterKeyHex, 'hex');
  logEntry("Master Key", `${colors.yellow}${masterKeyHex.substring(0, 12)}...${colors.reset}`, "🔑");

  const dek = crypto.randomBytes(32);
  const dekThumb = dek.toString('hex').substring(0, 24);
  logEntry("Generated DEK", `${colors.green}${dekThumb}...${colors.reset}`, "🎲");

  const payloadBuf = Buffer.from(JSON.stringify(payload));
  const p = encryptGCM(payloadBuf, dek);
  logEntry("Payload Size", `${payloadBuf.length} bytes`, "📦");

  const k = encryptGCM(dek, mk);
  logEntry("Envelope Wrap", "DEK secured via Master Key wrapping.", "✉️");

  console.log(`\n  ${colors.bgBlue}${colors.bright}  SUCCESS  ${colors.reset} ${colors.blue}Record for [${partyId}] is now encrypted.${colors.reset}`);
  logBoxFooter(colors.blue);

  return {
    partyId,
    payload_ct: p.ciphertext,
    payload_nonce: p.nonce,
    payload_tag: p.tag,
    dek_wrapped: k.ciphertext,
    dek_wrap_nonce: k.nonce,
    dek_wrap_tag: k.tag,
  };
};

export const decryptTransaction = (record: SecureTransaction, masterKeyHex: string): any => {
  const sessionId = crypto.randomBytes(2).toString('hex').toUpperCase();
  logBoxHeader("DECRYPTION ENGINE: UNLOCKING DATA", sessionId, colors.magenta);

  // 1. Validate Master Key Format
  if (masterKeyHex.length !== 64) {
    const errCode = CryptoErrors.INVALID_KEY;
    console.log(`\n  ${colors.red}${colors.bright} ❌ CONFIG ERROR ${colors.reset}`);
    console.log(`  ${colors.red}Code: ${errCode} | Master Key length is invalid.${colors.reset}`);
    logBoxFooter(colors.red);
    throw new Error(errCode);
  }

  // 2. Strict Validation for Nonces (Must be 12 bytes / 24 hex chars)
  if (record.dek_wrap_nonce.length !== 24 || record.payload_nonce.length !== 24) {
    const errCode = CryptoErrors.INVALID_NONCE;
    console.log(`\n  ${colors.red}${colors.bright} ❌ SECURITY ERROR ${colors.reset}`);
    console.log(`  ${colors.red}Code: ${errCode} | Nonce length invalid (Expected 12 bytes/24 hex).${colors.reset}`);
    logBoxFooter(colors.red);
    throw new Error(errCode);
  }

  // 3. Strict Validation for Tags (Must be 16 bytes / 32 hex chars)
  if (record.dek_wrap_tag.length !== 32 || record.payload_tag.length !== 32) {
    // If the tag is explicitly wrong length (e.g. empty string), we catch it here before crypto
    const errCode = CryptoErrors.INTEGRITY_FAIL; 
    console.log(`\n  ${colors.red}${colors.bright} ❌ SECURITY ERROR ${colors.reset}`);
    console.log(`  ${colors.red}Code: ${errCode} | Auth Tag length invalid (Expected 16 bytes/32 hex).${colors.reset}`);
    logBoxFooter(colors.red);
    throw new Error(errCode);
  }

  // 4. Ciphertext Sanity Check (New)
  // Ensures ciphertext is valid hex and even length before processing
  const isHex = (h: string) => /^[0-9A-Fa-f]*$/.test(h) && h.length % 2 === 0;
  if (!isHex(record.payload_ct) || !isHex(record.dek_wrapped)) {
    const errCode = CryptoErrors.CIPHERTEXT_CORRUPT;
    console.log(`\n  ${colors.red}${colors.bright} ❌ DATA CORRUPTION ${colors.reset}`);
    console.log(`  ${colors.red}Code: ${errCode} | Ciphertext contains invalid Hex or partial bytes.${colors.reset}`);
    logBoxFooter(colors.red);
    throw new Error(errCode);
  }

  const mk = Buffer.from(masterKeyHex, 'hex');
  
  try {
    logEntry("Phase 1", "Unwrapping DEK with Master Key...", "🔓");
    const dek = decryptGCM(record.dek_wrapped, record.dek_wrap_nonce, record.dek_wrap_tag, mk);
    
    logEntry("Phase 2", "Decrypting payload with restored DEK...", "📄");
    const payloadBuf = decryptGCM(record.payload_ct, record.payload_nonce, record.payload_tag, dek);
    
    const result = JSON.parse(payloadBuf.toString('utf8'));
    
    console.log(`\n  ${colors.bgMagenta}${colors.bright}  VERIFIED  ${colors.reset} ${colors.magenta}Integrity check passed.${colors.reset}`);
    console.log(`  ${colors.dim}────────────────────────────────────────────────────────────────${colors.reset}`);
    console.log(JSON.stringify(result, null, 2).split('\n').map(l => `  ${colors.white}${l}${colors.reset}`).join('\n'));
    logBoxFooter(colors.magenta);
    
    return result;
  } catch (err: any) {
    console.log(`\n  ${colors.red}${colors.bright} ❌ ACCESS DENIED ${colors.reset}`);
    
    // Map Node.js internal errors to our Standard Codes
    let errorCode = CryptoErrors.UNKNOWN;
    let description = "Unknown Error";

    if (err.message.includes('authenticate') || err.message.includes('bad decrypt') || err.message.includes('Invalid authentication tag')) {
      errorCode = CryptoErrors.INTEGRITY_FAIL;
      // Updated message to be more descriptive
      description = "Integrity Check Failed (Ciphertext Tampered or Tag Mismatch)";
    } else if (err.message.includes('Invalid initialization vector')) {
      errorCode = CryptoErrors.INVALID_NONCE;
      description = "Invalid Nonce Length (Must be 12 bytes)";
    } else if (err.message.includes('Invalid key length')) {
      errorCode = CryptoErrors.INVALID_KEY;
      description = "Invalid Key Length (Must be 32 bytes)";
    } else if (typeof err.message === 'string' && err.message.startsWith('ER-')) {
      // Pass through our own codes if they were thrown inside try block
      errorCode = err.message;
      description = "Pre-validation failure";
    }

    console.log(`  ${colors.red}Code: ${colors.bright}${errorCode}${colors.reset}`);
    console.log(`  ${colors.red}Desc: ${description}${colors.reset}`);
    logBoxFooter(colors.red);
    
    // Throw only the code to the caller for standardized handling
    throw new Error(errorCode);
  }
};