const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const inputFolder = path.join(__dirname, 'apps/craft-web/src/assets/images');
const outputFolder = path.join(__dirname, 'apps/craft-web/src/assets/images/compressed');

(async () => {
  const imagemin = (await import('imagemin')).default;
  const imageminPngquant = (await import('imagemin-pngquant')).default;
  const imageminMozjpeg = (await import('imagemin-mozjpeg')).default;
  const imageminSvgo = (await import('imagemin-svgo')).default;

  // Ensure the output folder exists
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  // Resize images using sharp
  const resizeImage = async (filePath, outputFilePath) => {
    await sharp(filePath)
      .resize(800, 800, { // Resize to a maximum of 800x800 pixels
        fit: sharp.fit.inside,
        withoutEnlargement: true
      })
      .toFile(outputFilePath);
  };

  // Get all image files in the input folder
  const imageFiles = fs.readdirSync(inputFolder).filter(file => /\.(jpg|png|svg)$/.test(file));

  // Resize images and save them to the output folder
  for (const file of imageFiles) {
    const inputFilePath = path.join(inputFolder, file);
    const outputFilePath = path.join(outputFolder, file);
    await resizeImage(inputFilePath, outputFilePath);
  }

  // Compress resized images
  const files = await imagemin([`${outputFolder}/*.{jpg,png,svg}`], {
    destination: outputFolder,
    plugins: [
      imageminPngquant({
        quality: [0.6, 0.8]
      }),
      imageminMozjpeg({
        quality: 75
      }),
      imageminSvgo({
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                removeViewBox: false
              }
            }
          }
        ]
      })
    ]
  });

  console.log('Images optimized:', files);
})();