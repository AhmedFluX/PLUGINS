
const fs = require('fs');
const {
  bot,
  isUrl,
  getTelegramStickers,
  sticker,
  getBuffer,
  sleep
} = require('../lib/');

bot(
  {
    pattern: 'tg ?(.*)',
    desc: 'Download Telegram Stickers',
    type: 'sticker',
  },
  async (message, match) => {
    const input = match || (message.reply_message && message.reply_message.text);
    const url = isUrl(input);

    if (!url) {
      return await message.send('*Example :* tg https://t.me/addstickers/sticker');
    }

    try {
      const results = await getTelegramStickers(url);
      const stickersCount = results.stickers.length;

      if (stickersCount === 0) {
        return await message.send('Stickers not supported');
      }

      await message.send(`Downloading ${stickersCount} from ${results.title}`);

      for (const s of results.stickers) {
        try {
          if (s.name.endsWith('webp')) {
            await message.sendFromUrl(s.url);
          } else {
            const b = await getBuffer(s.url);
            fs.writeFileSync(b.name, b.buffer);

            await message.send(
              await sticker('str', b.name, 2, message.id),
              { isAnimated: b.type === 'video' },
              'sticker'
            );

            if (fs.existsSync(b.name)) {
              fs.unlinkSync(b.name);
            }
          }
        } catch (e) {
          await message.send('tg: An error occurred!');
        }

        await sleep(1000);
      }

      await message.send('*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*');

    } catch (e) {
      console.error('TG Sticker Error:', e);
      await message.send('Unable to download Telegram stickers!');
    }
  }
);
