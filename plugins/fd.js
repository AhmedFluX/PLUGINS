const { bot } = require('../lib');

bot(
  {
    pattern: 'fd ?(.*)',
    fromMe: true,
    desc: 'Forwards the replied message',
    type: 'misc',
  },
  async (message, match) => {
    try {
      if (!message.quoted) {
        return await message.send('Reply to something');
      }

      const text = match[1]?.trim();
      if (!text) {
        return await message.send('Number do jisko forward karna hai\nExample: .fd 923001234567');
      }

      // Number saaf karo
      let jid = text.replace(/[^0-9]/g, '');
      if (!jid.endsWith('@s.whatsapp.net')) {
        jid = jid + '@s.whatsapp.net';
      }

      await message.forwardMessage(jid, message.quoted);

      await message.send('Done, forward kar diya ✅');
    } catch (err) {
      console.error('FD error:', err.message);
      await message.send(`❌ Error: ${err.message}`);
    }
  }
);
