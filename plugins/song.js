
const { bot, yts, song } = require('../lib/');

bot(
  {
    pattern: 'song ?(.*)',
    fromMe: true,
    desc: 'Download YouTube Audio',
    type: 'download',
  },
  async (message, match) => {
    match = match || (message.reply_message && message.reply_message.text);

    if (!match) {
      return await message.send('_Example : song ghost_');
    }

    const result = await yts(match, 0, 1, message.id);

    if (!result.length) {
      return await message.send(`*${match} not found*`);
    }

    const { title, id } = result[0];

    await message.send(`_Downloading ${title}_`);

    const { buffer } = await song(id, message.id);

    if (!buffer) {
      return await message.send('Failed!');
    }

    await message.send(
      buffer,
      {
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`
      },
      'audio'
    );

    await message.send('*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*');
  }
);
