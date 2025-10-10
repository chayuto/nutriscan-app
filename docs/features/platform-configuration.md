# Platform Configuration for usePermissions

## ✅ app.json Configuration Updated

### Added Permission Plugins

```json
"plugins": [
  "expo-secure-store",
  "expo-font",
  [
    "expo-camera",
    {
      "cameraPermission": "Allow NutriScan to scan nutrition labels with your camera"
    }
  ],
  [
    "expo-image-picker",
    {
      "photosPermission": "Allow NutriScan to access photos from your library to analyze nutrition labels"
    }
  ]
]
```

## 📱 What This Does

### iOS (Info.plist)
Expo will automatically generate:
```xml
<key>NSCameraUsageDescription</key>
<string>Allow NutriScan to scan nutrition labels with your camera</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Allow NutriScan to access photos from your library to analyze nutrition labels</string>
```

### Android (AndroidManifest.xml)
Expo will automatically add:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
```

## 🚀 Ready for Both Platforms

### Development
```bash
# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android

# Expo Go (testing)
npx expo start
```

### Production Build
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## ✅ Verification

The `usePermissions` hook will now work on both platforms:

```typescript
import { usePermissions } from '@/hooks';

function CameraScreen() {
  const { hasPermission, request } = usePermissions('camera');
  
  // On iOS: Shows "Allow NutriScan to scan nutrition labels with your camera"
  // On Android: Shows "Allow NutriScan to scan nutrition labels with your camera"
  
  if (!hasPermission) {
    return <Button onPress={request}>Enable Camera</Button>;
  }
  
  return <Camera />;
}
```

## 📝 Permission Flow

### First App Launch
1. User taps "Take Photo" button
2. `usePermissions('camera')` detects status = 'undetermined'
3. App calls `request()`
4. System shows permission dialog with our custom message
5. User grants/denies
6. Hook updates state accordingly

### Permission Denied
1. `hasPermission` = false
2. `canAskAgain` = true (Android) or false (iOS after "Don't Ask Again")
3. App shows "Open Settings" button
4. `openSettings()` opens device settings
5. User manually enables permission

## 🎯 Best Practices Implemented

✅ Clear, user-friendly permission messages  
✅ Explains WHY permission is needed  
✅ Follows Apple and Google guidelines  
✅ Consistent experience across platforms  
✅ Graceful degradation when denied  

## 🔒 Privacy Considerations

- Permissions requested **only when needed** (not on app launch)
- Clear explanation of data usage
- Settings link for manual control
- No permission data stored or transmitted
- Camera/photos used **only** for nutrition label analysis
