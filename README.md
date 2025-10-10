# NutriScan AI

[![React Native](https://img.shields.io/badge/React%20Native-0.74-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-51+-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🎯 App Concept

**NutriScan AI** is a modern mobile application that simplifies nutritional awareness through AI-powered label scanning. Users photograph food nutrition labels, and the app instantly extracts key nutritional data using OpenAI Vision API. Results are displayed in a visually striking report with color-coded progress bars that immediately highlight nutrients exceeding daily limits.

### Core Value Proposition
- **Fast**: Scan labels in seconds, no manual entry
- **Clear**: Visual progress bars with threshold alerts
- **Smart**: AI-powered data extraction (OpenAI Vision)
- **Personal**: Customizable daily nutritional goals
- **Beautiful**: Modern dark theme with neon accents

---

## ✨ Features

### MVP (v1.0)
- 📸 **Image Capture**: Camera + gallery photo selection
- 🤖 **AI Analysis**: OpenAI Vision API extraction
- 📊 **Visual Reports**: Color-coded nutrition progress bars
- ⚠️ **Threshold Alerts**: Instant warnings for exceeded limits
- ⚙️ **Custom Goals**: User-defined daily nutritional targets
- 💾 **Persistence**: Secure local storage of settings

### Coming Soon
- 📚 Scan history and favorites
- 🔍 Barcode scanning
- ⚖️ Product comparison
- 🍽️ Meal planning
- 📈 Nutritional insights
- 🔗 Social sharing

---

## 🎨 Design System

**Neon Clarity Theme** - A modern dark design with glassmorphism effects and vibrant gradients.

### Visual Identity
- **Colors**: Deep space blue (#111827) with teal-to-lime gradient (#34D399 → #A3E635)
- **Typography**: Inter font family
- **Effects**: Glassmorphism with blur and translucency
- **Animations**: Smooth 300ms transitions with haptic feedback

See [Design System Documentation](./docs/00-design-system-summary.md) for complete specifications.

## 🛠️ Technology Stack

### Core Framework
- **React Native** + **Expo SDK 51+** - Cross-platform mobile development
- **TypeScript 5.9** - Type-safe development
- **Node.js 18+** - Runtime environment

### UI & Design
- `expo-linear-gradient` - Gradient buttons and effects
- `@react-native-community/blur` - Glassmorphism blur effects
- `@expo-google-fonts/inter` - Inter font family
- Custom theme system (colors, typography, spacing)

### Camera & Images
- `expo-camera` - Camera capture functionality
- `expo-image-picker` - Gallery photo selection
- `expo-image-manipulator` - Image compression and optimization

### Storage & State
- `expo-secure-store` - Secure local storage for settings
- React Context API - Global state management
- `useState`/`useReducer` - Local component state

### AI & API
- **OpenAI Vision API** (`gpt-4o`) - Nutrition label extraction
- Custom retry logic with exponential backoff
- Comprehensive error handling

### Development Tools
- ESLint + Prettier - Code formatting and linting
- Husky - Git hooks for pre-commit checks
- Jest + React Native Testing Library - Unit testing
- TypeScript strict mode - Type safety

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode (macOS only)
- Android: Android Studio
- OpenAI API key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/chayuto/nutriscan-app.git
   cd nutriscan-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your OpenAI API key:
   ```
   EXPO_PUBLIC_OPENAI_API_KEY=sk-your-api-key-here
   ```

4. **Install required Expo packages**
   ```bash
   expo install expo-camera expo-image-picker expo-secure-store
   expo install expo-linear-gradient @react-native-community/blur
   expo install expo-font @expo-google-fonts/inter
   ```

5. **Start development server**
   ```bash
   npx expo start
   ```

6. **Run on device**
   - Scan QR code with Expo Go app (iOS/Android)
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

---

## 📚 Documentation

Comprehensive documentation is available in the [`/docs`](./docs) folder:

- **[README.md](./docs/README.md)** - Documentation index and navigation
- **[00-design-system-summary.md](./docs/00-design-system-summary.md)** - Design system quick reference
- **[01-architecture.md](./docs/01-architecture.md)** - System architecture and patterns
- **[02-type-system.md](./docs/02-type-system.md)** - TypeScript type definitions
- **[03-api-integration.md](./docs/03-api-integration.md)** - OpenAI Vision API integration
- **[04-implementation-checklist.md](./docs/04-implementation-checklist.md)** - Build roadmap (9 phases)
- **[05-ui-specifications.md](./docs/05-ui-specifications.md)** - Detailed UI/UX specifications

### Quick Links
- [Design Tokens](./docs/00-design-system-summary.md#design-tokens-reference)
- [Component Library](./docs/00-design-system-summary.md#key-components-to-build)
- [Implementation Checklist](./docs/04-implementation-checklist.md)
- [Copilot Instructions](./.github/copilot-instructions.md)

---

## 🏗️ Project Structure

```
nutriscan-app/
├── docs/                          # 📚 Complete documentation
├── src/                           # 💻 Source code
│   ├── components/                # Reusable UI components
│   ├── screens/                   # Main app screens
│   ├── hooks/                     # Custom React hooks
│   ├── services/                  # API and business logic
│   ├── types/                     # TypeScript type definitions
│   ├── utils/                     # Helper functions
│   ├── context/                   # React Context providers
│   └── theme/                     # Design system (colors, typography, etc.)
├── assets/                        # 🎨 Images, icons, fonts
├── __tests__/                     # 🧪 Test files
├── .github/                       # GitHub configuration
│   └── copilot-instructions.md    # AI assistant instructions
├── App.tsx                        # Application entry point
├── app.json                       # Expo configuration
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript configuration
└── .env.example                   # Environment variables template
```

---

## 🚀 Development Workflow

### 1. Setup Phase
- ✅ Install dependencies
- ✅ Configure environment
- ✅ Setup theme system
- ✅ Create folder structure

### 2. Core Development
- 🔄 Build reusable components (buttons, cards, inputs)
- 🔄 Implement screen layouts (Home, Camera, Report, Settings)
- 🔄 Integrate OpenAI Vision API
- 🔄 Add camera and image picker functionality
- 🔄 Implement settings persistence

### 3. Polish & Testing
- ⏳ Add animations and transitions
- ⏳ Implement loading and error states
- ⏳ Accessibility audit
- ⏳ Performance optimization
- ⏳ Testing (unit, integration, E2E)

### 4. Deployment
- ⏳ Configure app.json for stores
- ⏳ Generate app icons and splash screens
- ⏳ Create privacy policy and terms
- ⏳ Submit to App Store and Google Play

---

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Test Structure
- `__tests__/unit/` - Unit tests for utilities and services
- `__tests__/integration/` - Integration tests for API calls
- `__tests__/e2e/` - End-to-end user flow tests

---

## 🎯 Performance Targets

- ⚡ App launch: < 2 seconds
- 🤖 Image analysis: < 30 seconds
- 🎬 Screen transitions: < 300ms
- 📱 60 FPS animations
- 📦 Bundle size: < 50MB
- ✅ 80%+ code coverage
- ♿ WCAG AA accessibility compliance

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the [Copilot Instructions](./.github/copilot-instructions.md)
4. Ensure all tests pass and linting is clean
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Maintain 80%+ test coverage
- Ensure accessibility compliance
- Document complex logic
- Use semantic commit messages

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for Vision API
- [Expo](https://expo.dev/) for amazing mobile framework
- [React Native](https://reactnative.dev/) community
- [Inter font](https://rsms.me/inter/) by Rasmus Andersson

---

## 📞 Support

- 📖 [Documentation](./docs/README.md)
- 🐛 [Issue Tracker](https://github.com/chayuto/nutriscan-app/issues)
- 💬 [Discussions](https://github.com/chayuto/nutriscan-app/discussions)

---

## 🗺️ Roadmap

### v1.0 (MVP) - Current
- [x] Project setup and architecture
- [ ] Core UI components
- [ ] Camera integration
- [ ] OpenAI Vision API
- [ ] Nutrition report screen
- [ ] Settings and persistence

### v1.1 (Q1 2026)
- [ ] Scan history
- [ ] Favorite items
- [ ] Search and filter

### v1.2 (Q2 2026)
- [ ] Barcode scanning
- [ ] Product comparison
- [ ] Enhanced analytics

### v2.0 (Q3 2026)
- [ ] Meal planning
- [ ] Dietary recommendations
- [ ] Social features
- [ ] Cloud sync

---

**Built with ❤️ for better nutritional awareness**
