/**
 * App Entry Point
 * Main application component with navigation
 */

import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App(): JSX.Element {
  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}
