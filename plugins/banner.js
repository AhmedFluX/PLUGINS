const axios = require('axios');
const { cmd } = require('../command');

const banners = [
  "https://files.catbox.moe/j8n15v.jpeg",
  "https://files.catbox.moe/gw527d.jpeg",
  "https://files.catbox.moe/hsv3aj.jpeg",
  "https://files.catbox.moe/adcn5j.jpeg",
  "https://files.catbox.moe/q3pqpy.jpeg",
  "https://files.catbox.moe/ltb9qq.jpeg",
  "https://files.catbox.moe/3ruwph.jpeg",
  "https://files.catbox.moe/0raj3u.jpeg",
  "https://files.catbox.moe/n4x96t.jpeg",
  "https://files.catbox.moe/73jps3.jpeg",
  "https://files.catbox.moe/n96wa6.jpeg",
  "https://files.catbox.moe/h059ik.jpeg",
  "https://files.catbox.moe/qdpvrc.jpeg",
  "https://files.catbox.moe/efvpw9.jpeg",
  "https://files.catbox.moe/zx81dr.jpeg",
  "https://files.catbox.moe/3utvwz.jpeg",
  "https://files.catbox.moe/qmq5j3.jpeg",
  "https://files.catbox.moe/h7bh7s.jpeg",
  "https://files.catbox.moe/hqcw3f.jpeg",
  "https://files.catbox.moe/ywhjnz.jpeg",
  "https://files.catbox.moe/dspn7o.jpeg",
  "https://files.catbox.moe/anajh1.jpeg",
  "https://files.catbox.moe/ndxnk8.jpeg",
];

cmd(
  {
    pattern: 'banner',
    alias: ['banners'],
    desc: 'Send specific or random banners',
    category: 'fun',
    filename: __filename,
  },
  async (message, match) => {
    let count = (match || '').trim().toLowerCase();

    if (!count) {
      let randomImage = banners[Math.floor(Math.random() * banners.length)];
      await sendBanner(message, randomImage);
      return await message.sendMessage(
        message.chat,
        `📥 *For downloading specific banners, use:*\n\`.banner {number}\`\n🖼 *Example:*\n\`.banner 3\`\n\n📂 *For all banners:*\n\`.banner all\``,
        'text'
      );
    }

    if (count === "all") {
      return await sendAllBanners(message);
    }

    let number = parseInt(count);
    if (isNaN(number) || number < 1 || number > banners.length) {
      return await message.sendMessage(
        message.chat,
        `❌ Invalid banner number! Please choose between *1 to ${banners.length}*\nExample: \`.banner 2\``,
        'text'
      );
    }

    await sendBanner(message, banners[number - 1]);
  }
);

async function sendBanner(message, imageUrl) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const bannerBuffer = Buffer.from(response.data);

    await message.sendMessage(
      message.chat,
      bannerBuffer,
      'image',
      {
        mimetype: 'image/jpeg',
        caption: 'More:https://goto.now/9y7fN'
      }
    );
  } catch (error) {
    console.error('Banner send error:', error.message);
    await message.sendMessage(
      message.chat,
      '⚠️ Error loading banner, try again later.',
      'text'
    );
  }
}

async function sendAllBanners(message) {
  await message.sendMessage(
    message.chat,
    `📤 Sending all ${banners.length} banners one by one...`,
    'text'
  );

  for (let i = 0; i < banners.length; i++) {
    await sendBanner(message, banners[i]);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  await message.sendMessage(
    message.chat,
    "✅ *All banners have been sent!*",
    'text'
  );
}
