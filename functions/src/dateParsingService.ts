/**
 * Date Parsing Service
 * 
 * Handles natural language date parsing for relative and absolute dates
 */

import * as chrono from 'chrono-node';

/**
 * Parse natural language date strings into Date objects
 * Handles both relative ("last Thursday", "past week") and absolute ("February 5th") dates
 */
export function parseDate(dateString: string, referenceDate?: Date): Date | null {
  const reference = referenceDate || new Date();
  
  try {
    // Use chrono-node for natural language parsing
    const parsed = chrono.parseDate(dateString, reference);
    
    if (parsed) {
      console.log(`📅 Parsed "${dateString}" as ${parsed.toISOString()}`);
      return parsed;
    }
    
    // Try some common patterns manually if chrono fails
    const lowerStr = dateString.toLowerCase().trim();
    
    // Handle "since X" patterns
    if (lowerStr.startsWith('since ')) {
      const afterSince = lowerStr.substring(6);
      return parseDate(afterSince, reference);
    }
    
    console.warn(`⚠️ Could not parse date: "${dateString}"`);
    return null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

/**
 * Parse a date range from natural language
 * Returns [startDate, endDate] tuple
 */
export function parseDateRange(rangeString: string, referenceDate?: Date): [Date, Date] | null {
  const reference = referenceDate || new Date();
  const lowerStr = rangeString.toLowerCase().trim();
  
  try {
    // Handle "last X" patterns
    if (lowerStr.startsWith('last ')) {
      const period = lowerStr.substring(5);
      
      if (period === 'week' || period === '7 days') {
        const end = new Date(reference);
        const start = new Date(reference);
        start.setDate(start.getDate() - 7);
        return [start, end];
      }
      
      if (period === 'month' || period === '30 days') {
        const end = new Date(reference);
        const start = new Date(reference);
        start.setDate(start.getDate() - 30);
        return [start, end];
      }
      
      if (period === 'day' || period === 'yesterday') {
        const start = new Date(reference);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        return [start, end];
      }
      
      // Try parsing as a day name (e.g., "last Thursday")
      const dayDate = parseDate(rangeString, reference);
      if (dayDate) {
        const start = new Date(dayDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dayDate);
        end.setHours(23, 59, 59, 999);
        return [start, end];
      }
    }
    
    // Handle "past X" patterns
    if (lowerStr.startsWith('past ')) {
      const period = lowerStr.substring(5);
      
      if (period.includes('week')) {
        const weeks = parseInt(period) || 1;
        const end = new Date(reference);
        const start = new Date(reference);
        start.setDate(start.getDate() - (weeks * 7));
        return [start, end];
      }
      
      if (period.includes('day')) {
        const days = parseInt(period) || 1;
        const end = new Date(reference);
        const start = new Date(reference);
        start.setDate(start.getDate() - days);
        return [start, end];
      }
      
      if (period.includes('month')) {
        const months = parseInt(period) || 1;
        const end = new Date(reference);
        const start = new Date(reference);
        start.setMonth(start.getMonth() - months);
        return [start, end];
      }
    }
    
    // Handle "since X" patterns - from X to now
    if (lowerStr.startsWith('since ')) {
      const afterSince = lowerStr.substring(6);
      const startDate = parseDate(afterSince, reference);
      if (startDate) {
        return [startDate, new Date(reference)];
      }
    }
    
    // Handle "yesterday"
    if (lowerStr === 'yesterday') {
      const start = new Date(reference);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
    
    // Handle "today"
    if (lowerStr === 'today') {
      const start = new Date(reference);
      start.setHours(0, 0, 0, 0);
      const end = new Date(reference);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
    
    // Handle "this week"
    if (lowerStr === 'this week') {
      const end = new Date(reference);
      const start = new Date(reference);
      // Go back to Monday
      const dayOfWeek = start.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start.setDate(start.getDate() - daysToMonday);
      start.setHours(0, 0, 0, 0);
      return [start, end];
    }
    
    // Try using chrono to parse the entire range
    const results = chrono.parse(rangeString, reference);
    if (results.length > 0) {
      const first = results[0];
      if (first.start && first.end) {
        return [first.start.date(), first.end.date()];
      } else if (first.start) {
        // Single date - treat as that day
        const start = new Date(first.start.date());
        start.setHours(0, 0, 0, 0);
        const end = new Date(first.start.date());
        end.setHours(23, 59, 59, 999);
        return [start, end];
      }
    }
    
    console.warn(`⚠️ Could not parse date range: "${rangeString}"`);
    return null;
  } catch (error) {
    console.error('Error parsing date range:', error);
    return null;
  }
}

/**
 * Extract all date references from a text string
 */
export function extractDates(text: string, referenceDate?: Date): Array<{
  text: string;
  date: Date;
  index: number;
}> {
  const reference = referenceDate || new Date();
  
  try {
    const results = chrono.parse(text, reference);
    
    return results.map(result => ({
      text: result.text,
      date: result.start.date(),
      index: result.index,
    }));
  } catch (error) {
    console.error('Error extracting dates:', error);
    return [];
  }
}

/**
 * Format a date range as human-readable string
 */
export function formatDateRange(start: Date, end: Date): string {
  const now = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  // Check if it's today
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  
  if (start >= todayStart && end <= todayEnd) {
    return 'today';
  }
  
  // Check if it's yesterday
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setHours(23, 59, 59, 999);
  
  if (start >= yesterdayStart && end <= yesterdayEnd) {
    return 'yesterday';
  }
  
  // Check if it's last N days
  const daysDiff = Math.round((end.getTime() - start.getTime()) / oneDayMs);
  if (daysDiff === 7) {
    return 'last week';
  }
  if (daysDiff === 30) {
    return 'last month';
  }
  
  // Default formatting
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  return `${startStr} - ${endStr}`;
}

