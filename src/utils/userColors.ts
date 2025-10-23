/**
 * User Color Utilities
 * 
 * Consistent color generation for user avatars
 */

import { Colors } from '../constants/Colors';

/**
 * Get avatar color for a user
 * Uses the user's avatarColor if available, otherwise generates one from their UID
 */
export function getUserAvatarColor(user: { uid: string; avatarColor?: string } | null): string {
  if (!user) {
    return Colors.primary;
  }
  
  if (user.avatarColor) {
    return user.avatarColor;
  }
  
  // Generate a consistent color from UID if no avatarColor is set
  return generateColorFromString(user.uid);
}

/**
 * Generate a consistent color from a string (like UID)
 * Uses a hash function to ensure the same string always produces the same color
 */
export function generateColorFromString(str: string): string {
  // Color palette for user avatars
  const colors = [
    '#D4A574', // Primary (gold)
    '#4A90E2', // Blue
    '#7B68EE', // Purple
    '#50C878', // Emerald
    '#FF6B6B', // Coral
    '#4ECDC4', // Turquoise
    '#FF8C42', // Orange
    '#95E1D3', // Mint
    '#F38181', // Pink
    '#AA96DA', // Lavender
    '#3498DB', // Bright Blue
    '#E74C3C', // Red
    '#2ECC71', // Green
    '#F39C12', // Amber
    '#9B59B6', // Violet
  ];
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Get index from hash
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

