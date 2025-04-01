# Asset Placeholders

## Missing Images

The following image assets need to be created or placed in this directory:

- `default-avatar.png`: Default user avatar (200x200px recommended)
- `logo.png`: Application logo (200x60px recommended)
- `logos/angular.png`: Angular logo
- `logos/typescript.png`: TypeScript logo
- `logos/nestjs.png`: NestJS logo
- `logos/agency1.png`: Agency logo placeholder
- `logos/agency2.png`: Agency logo placeholder
- `logos/agency3.png`: Agency logo placeholder
- `avatars/avatar-1.png`: User avatar placeholder

## Temporary Solution

For development, you can use the generated placeholder images. If you continue 
to see 404 errors for these images, ensure that:

1. All directories exist:
   - `assets/images/`
   - `assets/images/logos/`
   - `assets/images/avatars/`

2. Image paths in the code match the actual file locations

3. Assets are properly configured in `project.json` to be copied during build:
   ```json
   "assets": [
     "apps/craft-web/src/assets"
   ]
   ```

## Using Default Images

If specific images aren't available, the application should fall back to default images:

```typescript
// Example of image path handling with fallback
getImagePath(path: string): string {
  try {
    return path || 'assets/images/default-avatar.png';
  } catch {
    return 'assets/images/default-avatar.png';
  }
}
```

Last updated: 2025-03-31
