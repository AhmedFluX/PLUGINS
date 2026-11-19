
const { bot } = require('../lib/')
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

const heartEmojis = ['❤️', '🧡', '💛', '🩷', '🤍', '♥️', '🩶']
const musicEmojis = ['🎧', '🎬']
const flowerEmojis = ['🌼', '🌸', '🌻', '🌺', '💐', '🍁']

const truncateTitle = (title, wordLimit = 35) => {
  const words = (title || 'Unknown Song').trim().split(/\s+/)
  if (words.length <= wordLimit) return title
  return words.slice(0, wordLimit).join(' ') + '......'
}

const footer = '*© 𝐀𝐇𝐌𝐄𝐃-𝐌𝐃*'

bot(
  {
    pattern: 'alexa ?(.*)',
    type: 'misc',
    desc: 'Play Music Using Sayan Official API',
  },
  async (message, match) => {
    match = match || message.reply_message?.text

    if (!match) {
      return await message.send(
        `_*Please Enter A Song Name, Ex: .alexa Teri Ishq Main*_\n\n${footer}`
      )
    }

    const api = `https://api.sayan-nexuswork.workers.dev/music?query=${encodeURIComponent(match)}`

    try {
      const res = await fetch(api)

      if (!res.ok) throw new Error('API request failed')

      const data = await res.json()

      if (data.status !== 'success' || !data.url) {
        return await message.send(
          `_*No Results Found For Your Query, Try Another Song*_\n\n${footer}`
        )
      }

      const randHeart = pickRandom(heartEmojis)
      const randMusic = pickRandom(musicEmojis)
      const randFlower = pickRandom(flowerEmojis)

      const shortTitle = truncateTitle(data.title, 35)

      const caption = `\`☘️ Ꭲɪᴛʟᴇ : ${shortTitle}\`\n\n*⧉ ⏱️ Ꭰᴜʀᴀᴛɪᴏɴ : ${data.duration || 'Unknown'}*\n\n*⧉ 🎭 Ꮩɪᴇᴡꜱ : ${data.views || 'Unknown'}*\n\n*⧉ 📺 Ꮯʜᴀɴɴᴇʟ : ${data.channel || 'Unknown'}*\n\n*⧉ 🎙️ Ꮯʀᴇᴀᴛᴏʀ : ${data.creator || 'Unknown'}*\n\n*Uꜱᴇ Hᴇᴀᴅᴘʜᴏɴᴇꜱ Fᴏʀ Bᴇꜱᴛ Vɪʙᴇ..!! ${randHeart}${randMusic}${randFlower}*\n\n${footer}`

      if (data.thumbnail) {
        await message.sendFromUrl(data.thumbnail, { caption })
      } else {
        await message.send(caption)
      }

      const audioRes = await fetch(data.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://m.youtube.com/'
        }
      })

      if (!audioRes.ok) throw new Error('Audio fetch failed')

      const buffer = Buffer.from(await audioRes.arrayBuffer())

      if (!buffer || buffer.length === 0) {
        return await message.send(
          `_*Audio Buffer Failed, Please Try Again*_\n\n${footer}`
        )
      }

      await message.send(
        buffer,
        {
          mimetype: 'audio/mpeg',
          ptt: false,
          fileName: `${shortTitle}-AHMED-MD.mp3`
        },
        'audio'
      )

    } catch (e) {
      console.error('AHMED-MD ALEXA ERROR:', e)

      await message.send(
        `_*Server Not Responding Right Now, Please Try Again Later*_\n\n${footer}`
      )
    }
  }
)
