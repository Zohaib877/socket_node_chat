import crypto from 'crypto';

function ensureValidKeyLength(key) {
    const keyBuffer = Buffer.from(key, 'utf-8');
    if (keyBuffer.length === 16) {
        return keyBuffer;
    }
    if (keyBuffer.length > 16) {
        return keyBuffer.slice(0, 16);
    }
    const paddedKey = Buffer.alloc(16);
    keyBuffer.copy(paddedKey);
    return paddedKey;
}

function decrypt(encryptedPhoneNumber, key) {
    const validKey = ensureValidKeyLength(key);

    const decodedBytes = Buffer.from(encryptedPhoneNumber, 'base64');

    const iv = decodedBytes.slice(0, 16);
    const encryptedBytes = decodedBytes.slice(16);

    const decipher = crypto.createDecipheriv('aes-128-cbc', validKey, iv);
    let decrypted = decipher.update(encryptedBytes, undefined, 'utf-8');
    decrypted += decipher.final('utf-8');

    return decrypted;
}

export { ensureValidKeyLength, decrypt };