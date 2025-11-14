# Generate PWA Icons

Since we don't have ImageMagick or Sharp installed, you can generate icons using one of these methods:

## Option 1: Online Tool (Easiest)
1. Go to https://realfavicongenerator.net/
2. Upload public/icon.svg
3. Generate and download all sizes
4. Extract to public/ folder

## Option 2: Using npm sharp (if you want automation)
```bash
npm install --save-dev sharp-cli
npx sharp-cli -i public/icon.svg -o public/icon-192x192.png resize 192 192
npx sharp-cli -i public/icon.svg -o public/icon-384x384.png resize 384 384
npx sharp-cli -i public/icon.svg -o public/icon-512x512.png resize 512 512
```

## Option 3: Use your design tool
Export icon.svg at these sizes:
- 192x192px → icon-192x192.png
- 384x384px → icon-384x384.png
- 512x512px → icon-512x512.png

Place all PNG files in the public/ directory.
