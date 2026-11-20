const { cmd } = require('../command')

const FOOTER = '*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*'

const SAFE_TAGS = [
  'maid',
  'waifu',
  'marin-kitagawa',
  'mori-calliope',
  'raiden-shogun',
  'oppai',
  'selfies',
  'uniform',
  'kamisato-ayaka'
]

cmd({
  pattern: 'waifu ?(.*)',
  alias: [],
  desc: 'Get safe waifu images',
  category: 'fun',
  filename: __filename
}, async (conn, mek, m, context) => {
  const { from, q, reply } = context

  try {
    const input = (q || '').trim().toLowerCase()

    if (input === 'tags') {
      const response = await fetch('https://api.waifu.im/tags')

      if (!response.ok) {
        return reply('Unable to fetch tags. Please try again.')
      }

      const data = await response.json()
      const tags = data.versatile || []

      const tagList = tags
        .map(tag => `• ${tag.name || tag}`)
        .join('\n')

      return reply(
        `╭━━〔 𝐖𝐀𝐈𝐅𝐔 𝐓𝐀𝐆𝐒 〕━━╮\n${tagList}\n╰━━━━━━━━━━━━━━╯\n\n${FOOTER}`
      )
    }

    const tag = input || 'waifu'

    if (!SAFE_TAGS.includes(tag)) {
      return reply(
        `Invalid tag!\n\nAvailable tags:\n${SAFE_TAGS.join(', ')}\n\nUse: .waifu tags`
      )
    }

    const url = new URL('https://api.waifu.im/search')
    url.searchParams.set('included_tags', tag)
    url.searchParams.set('is_nsfw', 'false')

    const response = await fetch(url.toString())

    if (!response.ok) {
      return reply('Waifu API is currently unavailable. Try again later.')
    }

    const data = await response.json()
    const images = data.images || []

    if (!images.length) {
      return reply('No images found for this tag.')
    }

    const selected = images[Math.floor(Math.random() * images.length)]

    await conn.sendMessage(
      from,
      {
        image: { url: selected.url },
        caption: `╭━━〔 𝐖𝐀𝐈𝐅𝐔 〕━━╮\n┃ Tag: ${tag}\n╰━━━━━━━━━━━━━━╯\n\n${FOOTER}`
      },
      { quoted: mek }
    )
  } catch (error) {
    console.error('WAIFU ERROR:', error)
    return reply('Something went wrong while fetching the image.')
  }
})
