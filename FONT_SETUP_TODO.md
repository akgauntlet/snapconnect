# Custom Fonts Setup - TODO

The app is currently using system fonts. To add the intended custom fonts for the cyber gaming theme:

## Required Font Files

Add these font files to the corresponding directories:

### `assets/fonts/Inter/`
- Inter-Regular.ttf
- Inter-Medium.ttf  
- Inter-SemiBold.ttf
- Inter-Bold.ttf

### `assets/fonts/Orbitron/`
- Orbitron-Light.ttf
- Orbitron-Regular.ttf
- Orbitron-Medium.ttf
- Orbitron-Bold.ttf
- Orbitron-Black.ttf

### `assets/fonts/JetBrainsMono/`
- JetBrainsMono-Regular.ttf
- JetBrainsMono-Medium.ttf
- JetBrainsMono-Bold.ttf

## Download Sources

- **Inter**: [Google Fonts](https://fonts.google.com/specimen/Inter)
- **Orbitron**: [Google Fonts](https://fonts.google.com/specimen/Orbitron)  
- **JetBrains Mono**: [JetBrains Official](https://www.jetbrains.com/lp/mono/)

## After Adding Fonts

1. Update `src/config/fonts.js` to use the actual font files
2. Update `tailwind.config.js` to reference the proper font families
3. Restart the development server

The current setup uses system fonts as fallbacks, so the app will work perfectly while you add the custom fonts later. 
