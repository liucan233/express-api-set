import sharp from 'sharp';

const compressImage = () => {
  const sharpInstance = sharp('', {});
  return (
    sharpInstance
      // .resize({ width: 100, height: 100 })
      .webp({
        quality: 40,
      })
      .toFile('/Users/bytedance/Desktop/tmp.webp')
  );
};

compressImage().then(() => {
  console.log('success');
});
