# NutriScan AI

## App Concept Summary

**NutriScan AI** is a mobile application that simplifies nutritional awareness. Users can take a photo of any food nutrition label, and the app will use AI to instantly extract key nutritional data. This information is then displayed in a simple, visual report with progress bars, immediately highlighting which nutrients (like sugar, fat, or sodium) exceed pre-set or user-defined daily limits.

The core goal is to provide fast, easy-to-understand feedback on food choices without manual data entry.

---

## Implementation Plan

### Core Features

- **Image Capture**: Use the phone's camera to photograph a nutrition label.
- **AI Data Extraction**: Upload the image to an AI service (OpenAI Vision) to parse nutritional values (per 100g).
- **Visual Reporting**: Display extracted data (Calories, Fat, Sugar, etc.) using clear, color-coded horizontal progress bars.
- **Threshold Alerting**: Flag nutrients that exceed their daily limit with a prominent red color and warning icon.
- **Customizable Limits**: Allow users to set their own daily nutritional goals.

### Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **AI Service**: OpenAI Vision API (gpt-4o)
- **Local Storage**: `expo-secure-store` for saving user settings
- **Camera/Image Library**: `expo-camera` & `expo-image-picker`

---

## Development Phases

### Phase 1: Project Setup & Core UI

#### Initialize Project

1. Run the following command:

   ```bash
   npx create-expo-app nutriscan-app --template blank-typescript
   ```

2. Install necessary dependencies:

   ```bash
   expo-camera expo-image-picker expo-secure-store
   ```

#### Build UI Shell

- Create a single-file architecture (`App.tsx`) managing different views (home, report, settings) with state.
- Develop the main UI components:
  - **HomeScreen**: Buttons for "Take Photo" and "Select from Library".
  - **SettingsScreen**: A form with inputs for user-defined thresholds.
  - **ReportScreen**: Placeholder for the visual report.
- Implement the custom `NutrientProgressBar` component.

---

### Phase 2: Camera & AI Integration

#### Implement Image Capture

- Integrate `expo-camera` for a live camera view and `expo-image-picker` to select from the device library.
- Convert the selected image to a base64 string for API submission.

#### Connect to OpenAI API

- Write the `analyzeImage` function to send the base64 image to the OpenAI API.
- **Crucial**: Craft a precise system prompt to ensure the API returns data in a consistent JSON format:

  ```json
  {
    "calories": 250,
    "fat": 15.5,
    "sugars": null,
    ...
  }
  ```

- Implement loading indicators and robust error handling for API calls.

---

### Phase 3: State Management & Final Polish

#### Manage State & Data Flow

- Use `useState` hooks to manage the application state (e.g., `isLoading`, `nutritionData`, `userThresholds`).
- Parse the API response and update the `nutritionData` state.
- Pass the data to the `ReportScreen` to render the `NutrientProgressBar` components dynamically.

#### Implement Settings Persistence

- Use `expo-secure-store` to save and load user-defined thresholds, ensuring they persist between app sessions.

#### Testing & Refinement

- Test with various nutrition labels under different lighting conditions.
- Refine the UI/UX for clarity and ease of use.
- Ensure the app is responsive and performs well on both iOS and Android.

---

## Getting Started

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npx expo start
   ```

---

## License

MIT
