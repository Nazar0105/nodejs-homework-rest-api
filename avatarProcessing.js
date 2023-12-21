// avatarProcessing.js
const Jimp = require('jimp');

const processAvatar = async (buffer) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const image = await Jimp.read(buffer);
    
    // Змінити розміри аватарки
    const resizedImage = image.resize(250, 250);
    
    // Отримати буфер обробленої аватарки
    const processedBuffer = await resizedImage.getBufferAsync(Jimp.MIME_JPEG);

    return processedBuffer;
  } catch (error) {
    throw error;
  }
};

module.exports = { processAvatar };