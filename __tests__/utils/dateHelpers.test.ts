/**
 * Date Helper Tests
 */

import { formatMessageTime, formatBubbleTime, formatLastSeen } from '../../src/utils/dateHelpers';

describe('Date Helpers', () => {
  describe('formatMessageTime', () => {
    it('should format recent message as "Just now"', () => {
      const now = new Date();
      expect(formatMessageTime(now)).toBe('Just now');
    });

    it('should format minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatMessageTime(fiveMinutesAgo)).toBe('5m ago');
    });

    it('should format hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatMessageTime(twoHoursAgo)).toBe('2h ago');
    });

    it('should format yesterday', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(formatMessageTime(yesterday)).toBe('Yesterday');
    });

    it('should format this week with weekday', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const result = formatMessageTime(threeDaysAgo);
      // Should be a weekday name (Mon, Tue, etc.)
      expect(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].some(day => result.includes(day))).toBe(true);
    });

    it('should format this year as month and day', () => {
      const janFirst = new Date(new Date().getFullYear(), 0, 1);
      const result = formatMessageTime(janFirst);
      expect(result).toContain('Jan');
    });
  });

  describe('formatBubbleTime', () => {
    it('should format time as 12-hour with AM/PM', () => {
      const morning = new Date('2025-01-20T10:30:00');
      const result = formatBubbleTime(morning);
      expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
    });

    it('should format afternoon time correctly', () => {
      const afternoon = new Date('2025-01-20T14:30:00');
      const result = formatBubbleTime(afternoon);
      expect(result).toContain('PM');
    });
  });

  describe('formatLastSeen', () => {
    it('should return "Online" when user is online', () => {
      const lastSeen = new Date();
      expect(formatLastSeen(lastSeen, true)).toBe('Online');
    });

    it('should format minutes ago when offline', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatLastSeen(fiveMinutesAgo, false)).toBe('Active 5m ago');
    });

    it('should format hours ago when offline', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatLastSeen(twoHoursAgo, false)).toBe('Active 2h ago');
    });

    it('should format yesterday when offline', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(formatLastSeen(yesterday, false)).toBe('Active yesterday');
    });

    it('should format days ago when offline', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatLastSeen(threeDaysAgo, false)).toBe('Active 3 days ago');
    });

    it('should format long time ago', () => {
      const longAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      expect(formatLastSeen(longAgo, false)).toBe('Active a while ago');
    });
  });
});

