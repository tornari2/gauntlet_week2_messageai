/**
 * App Entry Point
 * Main application component with navigation
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App(): React.ReactElement {
  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}
