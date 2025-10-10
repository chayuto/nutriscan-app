// Jest setup file
require('@testing-library/jest-native/extend-expect');

// Mock structuredClone FIRST (before any Expo imports)
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Mock Expo modules that cause import errors
global.__ExpoImportMetaRegistry = {};
global.__requireCycleIgnorePatterns = [];

// Mock expo-secure-store globally
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Suppress console logs in tests (optional)
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
