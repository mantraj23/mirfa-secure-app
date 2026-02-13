import crypto from "crypto";

export const encryptGCM = (data: Buffer, key: Buffer) => {
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
  return {
    ciphertext: ciphertext.toString('hex'),
    nonce: nonce.toString('hex'),
    tag: cipher.getAuthTag().toString('hex'),
  };
};

export const decryptGCM = (
  dataHex: string,
  nonceHex: string,
  tagHex: string,
  key: Buffer
): Buffer => {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(nonceHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final()
  ]);
};
