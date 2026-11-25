const { bot } = require('../lib');

bot(
  {
    pattern: 'bunny',
    fromMe: false,
    desc: 'Bunny heart animation',
    type: 'fun',
  },
  async (message) => {
    const emojis = ['❤️‍🩹', '🤍', '🩷', '❤️', '💙', '🩵', '💚', '💜', '🧡', '💗', '💖'];

    let sent = await message.send(`(\\_/)
( •.•)
/>💝)`);

    for (let i = 0; i < emojis.length; i++) {
      await new Promise((r) => setTimeout(r, 250));
      await message.edit(
        `(\\_/)
( •.•)
/>${emojis[i]})`,
        sent.key
      );
    }
  }
);
