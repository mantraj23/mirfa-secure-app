import crypto from "crypto";
import { encryptGCM } from "./gcm.js";
import { SecureTransaction } from "./types.js";
import { colors, logBoxHeader, logBoxFooter, logEntry } from "./logger.js";

export const encryptTransaction = (
  partyId: string,
  payload: any,
  masterKeyHex: string
): SecureTransaction => {

  const sessionId = crypto.randomBytes(2).toString("hex").toUpperCase();
  logBoxHeader("ENCRYPTION ENGINE: LOCKING DATA", sessionId, colors.blue);

  const mk = Buffer.from(masterKeyHex, "hex");

  const dek = crypto.randomBytes(32);

  const payloadBuf = Buffer.from(JSON.stringify(payload));
  const p = encryptGCM(payloadBuf, dek);

  const k = encryptGCM(dek, mk);

  // 🔐 SAFE LOGGING (no sensitive info)
  logEntry("Party ID", partyId, "👤");
  logEntry("Payload Size", `${payloadBuf.length} bytes`, "📦");
  logEntry("Algorithm", "AES-256-GCM (Envelope)", "🔐");

  console.log(
    `\n  ${colors.bgBlue}${colors.bright}  SUCCESS  ${colors.reset} ${colors.blue}Encryption completed successfully.${colors.reset}`
  );

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
