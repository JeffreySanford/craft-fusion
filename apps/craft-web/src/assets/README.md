# Assets Required for Craft Fusion

This guide provides information about all assets required by the application and how to manage them.

## Directory Structure

```
assets/
├── images/
│   ├── logos/
│   │   ├── agency2.png
│   │   ├── agency3.png
│   │   └── ...
│   ├── default-avatar.png
│   ├── logo.png
│   └── ...
├── video/
│   ├── haynes-astronauts.mp4
│   ├── haynes-astronauts.ogg
│   ├── light-theme-background.mp4
│   ├── dark-theme-background.mp4
│   └── ...
└── fonts/
    └── ...
```

## Required Assets

### Videos

#### Background Videos

Located in `assets/video/`:

- `haynes-astronauts.mp4` (1280x720 or higher, H.264 codec)
  - Used for video background and the space video component
  - File size: Aim for 5-10MB for performance
  - Duration: 30-60 seconds looping video recommended

- `haynes-astronauts.ogg` (Same dimensions)
  - Alternative format for better browser compatibility
  - Required for Firefox and some other browsers

- `light-theme-background.mp4` - Light theme video background
- `dark-theme-background.mp4` - Dark theme video background
- `cosmic-glow-background.mp4` - Vibrant1 theme video background
- `solar-flare-background.mp4` - Vibrant2 theme video background

#### Placeholder Videos

If you don't have specific themed videos, you can use simple gradients or static videos. Here are some free resources:

- [Pexels Free Stock Videos](https://www.pexels.com/videos/)
- [Pixabay Free Videos](https://pixabay.com/videos/)
- [Coverr](https://coverr.co/)

### Images

#### Logo Files

Located in `assets/images/`:

- `logo.png` (200x200px, transparent background)
  - Used in the header component
  - Should have transparent background for theme compatibility
  - SVG format also supported for better scaling

#### Avatar/User Images

Located in `assets/images/`:

- `default-avatar.png` (200x200px, circular design recommended)
  - Used for guest users and as fallback for user avatars
  - Should be neutral and professional looking

#### Partner/Agency Logos

Located in `assets/images/logos/`:

- `agency2.png` - Used in the footer component
- `agency3.png` - Used in the footer component

## Creating Default Assets

### Default Avatar

If you need to create a `default-avatar.png`:

1. Create a 200x200 pixel image
2. Fill with a light gray background (#e0e0e0)
3. Add a simple silhouette of a person in a darker gray (#9e9e9e)
4. Save as PNG with transparency

Alternatively, use this SVG code directly in your components:

```html
<svg viewBox="0 0 24 24" class="default-avatar-svg">
  <circle cx="12" cy="8" r="4" fill="#9e9e9e" />
  <path d="M12 14c-6.1 0-8 4-8 4v2h16v-2s-1.9-4-8-4z" fill="#9e9e9e" />
</svg>
```

### Default Logo

If you need a temporary logo:

1. Use a simple geometric shape or text-based logo
2. Ensure it looks good in both light and dark themes
3. Save in both PNG and SVG formats if possible

## Troubleshooting Asset Loading Issues

### Common Problems and Solutions

1. **404 Not Found Errors**
   - Check file paths match exactly what's referenced in code
   - Ensure proper case sensitivity in filenames
   - Verify assets are included in the Angular build process

2. **Video Not Playing**
   - Ensure video formats are web-compatible (MP4/H.264 for Chrome/Safari, WebM for best compatibility)
   - Check video codecs are supported by browsers (H.264, VP9)
   - Reduce filesize if videos are too large (aim for <10MB)

3. **Images Not Displaying**
   - Verify file formats are supported (PNG, JPG, SVG preferred)
   - Check paths are relative to the deployed application
   - Ensure image dimensions are appropriate for their use

### Testing Assets

Run this command to verify all referenced assets exist:
```bash
ng serve --configuration=development
```

Then check the browser console for any 404 errors related to assets.

## Alternative Solutions

### Fallback Strategies

If you don't have the exact assets required, you can:

1. **Update Service Classes**:
   - `VideoBackgroundService`: Change video paths in `defaultVideos` object
   - `FooterComponent`: Update logo paths
   - `HeaderComponent`: Modify logo and default avatar paths

2. **Use CSS Fallbacks**:
   - For missing images, provide CSS background colors
   - For missing videos, use CSS gradients

### Online Asset Tools

- [Placeholder.com](https://placeholder.com/) - Generate placeholder images
- [Canva](https://www.canva.com/) - Free logo creation
- [Google Fonts](https://fonts.google.com/icons) - Material icons for UI elements

## Adding New Assets

1. Create the necessary directory structure if it doesn't exist
2. Add files to the appropriate directories
3. Make sure filenames match exactly what's referenced in code
4. Restart the application to load the new assets
5. Consider compressing large assets for better performance

### Optimizing Assets for Performance

- Compress images using [TinyPNG](https://tinypng.com/)
- Optimize videos using [Handbrake](https://handbrake.fr/)
- Convert videos to WebM format for better compression
- Consider using progressive loading for large assets
