
const { bot, fetch } = require('../lib');

const FOOTER = '\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*';

bot(
  {
    pattern: 'waifu ?(.*)',
    desc: 'Get safe waifu images from API',
    type: 'AHMII',
  },
  async (message, match) => {
    try {
      match = match.trim();

      if (!match) {
        return await message.send(
          '*Usage:*\n' +
          '.waifu [tag]\n' +
          '.waifu tags' +
          FOOTER
        );
      }

      if (match.toLowerCase() === 'tags') {
        return getWaifuTags(message);
      }

      const tag = match || 'waifu';

      const apiUrl = 'https://api.waifu.im/search';

      const params = new URLSearchParams();
      params.append('included_tags', tag);
      params.set('is_nsfw', 'false');
      params.set('height', '>=2000');

      const requestUrl = `${apiUrl}?${params.toString()}`;

      const response = await fetch(requestUrl);

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      const images = data.images || [];

      if (images.length > 0) {
        for (const image of images) {
          await message.sendFromUrl(image.url, { buffer: false });
        }
      } else {
        await message.send(
          'No waifu images found for this tag.' + FOOTER
        );
      }
    } catch (error) {
      console.error('[WAIFU ERROR]', error.message);

      await message.send(
        'Failed to retrieve waifu images.' + FOOTER
      );
    }
  }
);

const getWaifuTags = async (message) => {
  const versatileTags = [
    'maid',
    'waifu',
    'marin-kitagawa',
    'mori-calliope',
    'raiden-shogun',
    'selfies',
    'uniform',
    'kamisato-ayaka',
  ];

  const responseMessage =
    '*Available Tags:*\n\n' +
    '*Versatile Tags:*\n' +
    versatileTags.join(', ') +
    FOOTER;

  await message.send(responseMessage);
};
