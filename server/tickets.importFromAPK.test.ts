import { describe, it, expect } from 'vitest';

describe('tickets.importFromAPK endpoint', () => {
  it('should validate APK_SYNC_TOKEN is configured', () => {
    const token = process.env.APK_SYNC_TOKEN;
    expect(token).toBeDefined();
    expect(token).toHaveLength(64); // Token SHA256 hex = 64 chars
  });

  it('should have correct token format', () => {
    const token = process.env.APK_SYNC_TOKEN;
    expect(token).toMatch(/^[a-f0-9]{64}$/); // Hex string
  });

  it('should be different from default token', () => {
    const token = process.env.APK_SYNC_TOKEN;
    expect(token).not.toBe('default-token-change-me');
  });
});
