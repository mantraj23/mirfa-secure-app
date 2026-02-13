/**
 * 🛡️ CRYPTO ERROR CODE STANDARD
 * ---------------------------------------------------------
 * ER-4001 : Integrity Check Failed (Auth Tag Mismatch / Tampering)
 * ER-4002 : Invalid Nonce Length (Must be 12 bytes)
 * ER-4003 : Invalid Key Length (Must be 32 bytes)
 * ER-4004 : Ciphertext Corrupted (Invalid Hex/Format)
 * ER-5000 : Unknown Decryption Failure
 * ---------------------------------------------------------
 */

import { describe, it, expect } from 'vitest';
import { encryptTransaction, decryptTransaction, CryptoErrors } from './index';

// A valid 64-character hex Master Key for testing
const MOCK_MASTER_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const ALTERNATE_MASTER_KEY = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

// Helper to make the test output readable
const logScenario = (title: string) => {
  console.log(`\n\x1b[36m>>> TEST SCENARIO: ${title}\x1b[0m`);
};

describe('Encryption & Decryption Lifecycle', () => {
  const samplePayload = { amount: 1000, currency: 'USD', note: 'Secret Transfer' };
  const partyId = "user_12345";

  // --- CATEGORY 1: HAPPY PATH ---
  describe('Happy Path (Success)', () => {
    it('should successfully encrypt and decrypt a standard object', () => {
      logScenario("Standard Encrypt -> Decrypt Flow");
      const encrypted = encryptTransaction(partyId, samplePayload, MOCK_MASTER_KEY);
      const decrypted = decryptTransaction(encrypted, MOCK_MASTER_KEY);
      expect(decrypted).toEqual(samplePayload);
    });

    it('should produce different ciphertexts for the same data (Nonces are unique)', () => {
      logScenario("Verifying Nonce Uniqueness (Freshness)");
      const enc1 = encryptTransaction(partyId, samplePayload, MOCK_MASTER_KEY);
      const enc2 = encryptTransaction(partyId, samplePayload, MOCK_MASTER_KEY);
      expect(enc1.payload_ct).not.toBe(enc2.payload_ct);
    });

    it('should handle complex nested objects', () => {
      logScenario("Handling Nested JSON Objects");
      const large = { a: { b: { c: [1, 2, 3], d: "test" } } };
      const encrypted = encryptTransaction(partyId, large, MOCK_MASTER_KEY);
      expect(decryptTransaction(encrypted, MOCK_MASTER_KEY)).toEqual(large);
    });

    it('should maintain number types', () => {
      logScenario("Verifying Data Type Preservation");
      const data = { val: 42 };
      const encrypted = encryptTransaction(partyId, data, MOCK_MASTER_KEY);
      const decrypted = decryptTransaction(encrypted, MOCK_MASTER_KEY);
      expect(typeof decrypted.val).toBe('number');
    });
    
    it('should handle empty strings', () => {
      logScenario("Handling Empty Payload");
      const small = { msg: "" };
      const encrypted = encryptTransaction(partyId, small, MOCK_MASTER_KEY);
      expect(decryptTransaction(encrypted, MOCK_MASTER_KEY)).toEqual(small);
    });
  });

  // --- CATEGORY 2: TAMPERED CIPHERTEXT (Integrity Errors) ---
  describe('Security: Tampered Ciphertext', () => {
    it('should return ER-4001 if a single character in payload_ct is changed (but keeps valid hex)', () => {
      logScenario("Tampering: Bit-flip in Ciphertext (Valid Hex)");
      const enc = encryptTransaction(partyId, samplePayload, MOCK_MASTER_KEY);
      // Ensure we keep it valid hex by flipping 0->1 or 1->0
      enc.payload_ct = enc.payload_ct.slice(0, -1) + (enc.payload_ct.endsWith('0') ? '1' : '0');
      expect(() => decryptTransaction(enc, MOCK_MASTER_KEY)).toThrow(CryptoErrors.INTEGRITY_FAIL);
    });

    it('should return ER-4004 if ciphertext contains invalid hex characters', () => {
      logScenario("Tampering: Corrupted Ciphertext (Invalid Hex)");
      const enc = encryptTransaction(partyId, samplePayload, MOCK_MASTER_KEY);
      enc.payload_ct = enc.payload_ct.replace(/a|b|c|d|e|f|0|1|2|3|4|5|6|7|8|9/i, 'Z'); // Inject 'Z'
      expect(() => decryptTransaction(enc, MOCK_MASTER_KEY)).toThrow(CryptoErrors.CIPHERTEXT_CORRUPT);
    });

    it('should return ER-4004 if ciphertext has odd length (truncated byte)', () => {
      logScenario("Tampering: Truncated Ciphertext (Odd Length)");
      const enc = encryptTransaction(partyId, samplePayload, MOCK_MASTER_KEY);
      enc.payload_ct = enc.payload_ct.slice(0, -1); // Remove last char, making length odd
      expect(() => decryptTransaction(enc, MOCK_MASTER_KEY)).toThrow(CryptoErrors.CIPHERTEXT_CORRUPT);
    });

    it('should return ER-4001 if wrapped DEK is tampered with (Valid Hex)', () => {
      logScenario("Tampering: Corrupting the Encrypted Key (DEK)");
      const enc = encryptTransaction(partyId, samplePayload, MOCK_MASTER_KEY);
      enc.dek_wrapped = enc.dek_wrapped.replace(/[0-9a-f]/, (m) => m === 'a' ? 'b' : 'a');
      expect(() => decryptTransaction(enc, MOCK_MASTER_KEY)).toThrow(CryptoErrors.INTEGRITY_FAIL);
    });

    it('should return ER-4001 if ciphertext is swapped from another record', () => {
      logScenario("Attack: Swapping Ciphertexts between records");
      const enc1 = encryptTransaction(partyId, { data: 1 }, MOCK_MASTER_KEY);
      const enc2 = encryptTransaction(partyId, { data: 2 }, MOCK_MASTER_KEY);
      enc1.payload_ct = enc2.payload_ct;
      expect(() => decryptTransaction(enc1, MOCK_MASTER_KEY)).toThrow(CryptoErrors.INTEGRITY_FAIL);
    });
  });

  // --- CATEGORY 3: TAMPERED TAGS (Integrity Errors) ---
  describe('Security: Tampered Auth Tags', () => {
    it('should return ER-4001 if payload_tag is modified', () => {
      logScenario("Tampering: Modifying Payload Auth Tag");
      const enc = encryptTransaction(partyId, samplePayload, MOCK_MASTER_KEY);
      enc.payload_tag = "00000000000000000000000000000000";
      expect(() => decryptTransaction(enc, MOCK_MASTER_KEY)).toThrow(CryptoErrors.INTEGRITY_FAIL);
    });

    it('should return ER-4001 if dek_wrap_tag is modified', () => {
      logScenario("Tampering: Modifying DEK Auth Tag");
      const enc = encryptTransaction(partyId, samplePayload, MOCK_MASTER_KEY);
      enc.dek_wrap_tag = "f".repeat(32);
      expect(() => decryptTransaction(enc, MOCK_MASTER_KEY)).toThrow(CryptoErrors.INTEGRITY_FAIL);
    });

    it('should return ER-4001 if tags are swapped', () => {
      logScenario("Attack: Swapping Payload Tag with DEK Tag");
      const enc = encryptTransaction(partyId, samplePayload, MOCK_MASTER_KEY);
      const temp = enc.payload_tag;
      enc.payload_tag = enc.dek_wrap_tag;
      enc.dek_wrap_tag = temp;
      expect(() => decryptTransaction(enc, MOCK_MASTER_KEY)).toThrow(CryptoErrors.INTEGRITY_FAIL);
    });

    it('should return ER-4001 with an empty tag string', () => {
      logScenario("Tampering: Empty Tag");
      const enc = encryptTransaction(partyId, samplePayload, MOCK_MASTER_KEY);
      enc.payload_tag = "";
      // Note: We now catch empty/wrong length tags explicitly in index.ts before crypto
      expect(() => decryptTransaction(enc, MOCK_MASTER_KEY)).toThrow(CryptoErrors.INTEGRITY_FAIL);
    });

    it('should return ER-4001 if tag is slightly modified', () => {
      logScenario("Tampering: Single bit flip in Tag");
      const enc = encryptTransaction(partyId, samplePayload, MOCK_MASTER_KEY);
      const lastChar = enc.payload_tag.slice(-1);
      enc.payload_tag = enc.payload_tag.slice(0, -1) + (lastChar === 'a' ? 'b' : 'a');
      expect(() => decryptTransaction(enc, MOCK_MASTER_KEY)).toThrow(CryptoErrors.INTEGRITY_FAIL);
    });
  });

  // --- CATEGORY 4: WRONG CONTEXT (Key/Nonce Errors) ---
  describe('Security: Context Integrity', () => {
    it('should return ER-4001 (Integrity Fail) if wrong Master Key is used', () => {
      logScenario("Context: Wrong Master Key (e.g. Attacker's Key)");
      const enc = encryptTransaction(partyId, samplePayload, MOCK_MASTER_KEY);
      expect(() => decryptTransaction(enc, ALTERNATE_MASTER_KEY)).toThrow(CryptoErrors.INTEGRITY_FAIL);
    });

    it('should return ER-4002 (Invalid Nonce) if payload_nonce length is wrong', () => {
      logScenario("Context: Invalid Nonce Length");
      const enc = encryptTransaction(partyId, samplePayload, MOCK_MASTER_KEY);
      enc.payload_nonce = "abc123"; 
      expect(() => decryptTransaction(enc, MOCK_MASTER_KEY)).toThrow(CryptoErrors.INVALID_NONCE);
    });

    it('should return ER-4001 (Integrity Fail) if dek_wrap_nonce is modified', () => {
      logScenario("Context: Modified Key Envelope Nonce");
      const enc = encryptTransaction(partyId, samplePayload, MOCK_MASTER_KEY);
      enc.dek_wrap_nonce = "f".repeat(24);
      expect(() => decryptTransaction(enc, MOCK_MASTER_KEY)).toThrow(CryptoErrors.INTEGRITY_FAIL);
    });

    it('should return ER-4001 if nonces are swapped', () => {
      logScenario("Context: Swapping Payload Nonce with Key Nonce");
      const enc = encryptTransaction(partyId, samplePayload, MOCK_MASTER_KEY);
      const temp = enc.payload_nonce;
      enc.payload_nonce = enc.dek_wrap_nonce;
      enc.dek_wrap_nonce = temp;
      expect(() => decryptTransaction(enc, MOCK_MASTER_KEY)).toThrow(CryptoErrors.INTEGRITY_FAIL);
    });

    it('should return ER-4001 if the Master Key is valid hex but wrong content', () => {
      logScenario("Context: Valid Hex Format but Wrong Key");
      const wrongKey = "f".repeat(64);
      const enc = encryptTransaction(partyId, samplePayload, MOCK_MASTER_KEY);
      expect(() => decryptTransaction(enc, wrongKey)).toThrow(CryptoErrors.INTEGRITY_FAIL);
    });
  });
});