
const { bot, forwardOrBroadCast, parsedJid } = require('../lib/');

bot(
  {
    pattern: 'vv ?(.*)',
    fromMe: true,
    desc: 'Anti View Once',
    type: 'whatsapp',
  },
  async (message, match) => {
    if (
      !message.reply_message ||
      (
        !message.reply_message.image &&
        !message.reply_message.video &&
        !message.reply_message.audio
      )
    ) {
      return await message.send(
        '*Example\n- Reply to a view once image, video or audio*\n- vv jid (optional)\n\n' +
        '*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*'
      );
    }

    const [jid] = parsedJid(match);
    
    await forwardOrBroadCast(jid || message.jid, message, {
      viewOnce: false
    });

    await message.send('*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*');
  }
);
