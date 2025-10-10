// This runs BEFORE everything else (including Expo)
// Mock structuredClone before any Expo module tries to use it
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Set up Expo globals
global.__ExpoImportMetaRegistry = {};
global.__requireCycleIgnorePatterns = [];
