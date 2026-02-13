import crypto from "crypto";
import { decryptGCM } from "./gcm";
import { SecureTransaction } from "./types";
import { CryptoErrors } from "./errors";
import { colors, logBoxHeader, logBoxFooter, logEntry } from "./logger";

export const decryptTransaction = (
  record: SecureTransaction,
  masterKeyHex: string
): any => {

  const sessionId = crypto.randomBytes(2).toString("hex").toUpperCase();
  logBoxHeader("DECRYPTION ENGINE: UNLOCKING DATA", sessionId, colors.magenta);

  if (masterKeyHex.length !== 64) {
    const errCode = CryptoErrors.INVALID_KEY;
    console.log(`\n  ${colors.red}${colors.bright} ❌ CONFIG ERROR ${colors.reset}`);
    console.log(`  ${colors.red}Code: ${errCode}${colors.reset}`);
    logBoxFooter(colors.red);
    throw new Error(errCode);
  }

  if (record.dek_wrap_nonce.length !== 24 || record.payload_nonce.length !== 24) {
    const errCode = CryptoErrors.INVALID_NONCE;
    console.log(`\n  ${colors.red}${colors.bright} ❌ SECURITY ERROR ${colors.reset}`);
    console.log(`  ${colors.red}Code: ${errCode}${colors.reset}`);
    logBoxFooter(colors.red);
    throw new Error(errCode);
  }

  if (record.dek_wrap_tag.length !== 32 || record.payload_tag.length !== 32) {
    const errCode = CryptoErrors.INTEGRITY_FAIL;
    console.log(`\n  ${colors.red}${colors.bright} ❌ SECURITY ERROR ${colors.reset}`);
    console.log(`  ${colors.red}Code: ${errCode}${colors.reset}`);
    logBoxFooter(colors.red);
    throw new Error(errCode);
  }

  const isHex = (h: string) => /^[0-9A-Fa-f]*$/.test(h) && h.length % 2 === 0;
  if (!isHex(record.payload_ct) || !isHex(record.dek_wrapped)) {
    const errCode = CryptoErrors.CIPHERTEXT_CORRUPT;
    console.log(`\n  ${colors.red}${colors.bright} ❌ DATA CORRUPTION ${colors.reset}`);
    console.log(`  ${colors.red}Code: ${errCode}${colors.reset}`);
    logBoxFooter(colors.red);
    throw new Error(errCode);
  }

  const mk = Buffer.from(masterKeyHex, "hex");

  try {
    logEntry("Phase 1", "Unwrapping DEK", "🔓");
    const dek = decryptGCM(record.dek_wrapped, record.dek_wrap_nonce, record.dek_wrap_tag, mk);

    logEntry("Phase 2", "Decrypting Payload", "📄");
    const payloadBuf = decryptGCM(record.payload_ct, record.payload_nonce, record.payload_tag, dek);

    const result = JSON.parse(payloadBuf.toString("utf8"));

    console.log(
      `\n  ${colors.bgMagenta}${colors.bright}  VERIFIED  ${colors.reset} ${colors.magenta}Integrity check passed.${colors.reset}`
    );

    logBoxFooter(colors.magenta);

    return result;
  } catch (err: any) {
    console.log(`\n  ${colors.red}${colors.bright} ❌ ACCESS DENIED ${colors.reset}`);

    let errorCode = CryptoErrors.UNKNOWN;

    if (
      err.message.includes("authenticate") ||
      err.message.includes("bad decrypt") ||
      err.message.includes("Invalid authentication tag")
    ) {
      errorCode = CryptoErrors.INTEGRITY_FAIL;
    } else if (err.message.includes("Invalid initialization vector")) {
      errorCode = CryptoErrors.INVALID_NONCE;
    } else if (err.message.includes("Invalid key length")) {
      errorCode = CryptoErrors.INVALID_KEY;
    } else if (typeof err.message === "string" && err.message.startsWith("ER-")) {
      errorCode = err.message;
    }

    console.log(`  ${colors.red}Code: ${colors.bright}${errorCode}${colors.reset}`);
    logBoxFooter(colors.red);

    throw new Error(errorCode);
  }
};
