
const { cmd } = require('../command')
const axios = require('axios')

const POWERED_BY = '*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*'

cmd({
    pattern: 'tg',
    alias: ['telegramsticker'],
    desc: 'Download Telegram sticker pack',
    category: 'download',
    react: '🎭',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(`Provide a Telegram sticker pack link.\nExample: .tg https://t.me/addstickers/PackName\n\n${POWERED_BY}`)
        }

        const token = process.env.TELEGRAM_BOT_TOKEN

        if (!token) {
            return reply(`❌ TELEGRAM_BOT_TOKEN is missing from environment variables.\n\n${POWERED_BY}`)
        }

        const match = q.match(/(?:t\.me\/addstickers\/|telegram\.me\/addstickers\/)([a-zA-Z0-9_]+)/i)

        if (!match) {
            return reply(`❌ Invalid Telegram sticker pack link.\n\n${POWERED_BY}`)
        }

        const packName = match[1]

        await reply('⏳ Fetching Telegram sticker pack...')

        const api = `https://api.telegram.org/bot${token}`

        const response = await axios.get(`${api}/getStickerSet`, {
            params: { name: packName },
            timeout: 30000
        })

        if (!response.data?.ok || !response.data.result?.stickers?.length) {
            return reply(`❌ Sticker pack not found or Telegram API error.\n\n${POWERED_BY}`)
        }

        const stickers = response.data.result.stickers
            .filter(sticker => !sticker.is_animated && !sticker.is_video)
            .slice(0, 20)

        if (!stickers.length) {
            return reply(`❌ This pack has no supported static stickers.\n\n${POWERED_BY}`)
        }

        let sent = 0

        for (const sticker of stickers) {
            try {
                const fileResponse = await axios.get(`${api}/getFile`, {
                    params: { file_id: sticker.file_id },
                    timeout: 30000
                })

                const filePath = fileResponse.data?.result?.file_path

                if (!filePath) continue

                const download = await axios.get(
                    `https://api.telegram.org/file/bot${token}/${filePath}`,
                    {
                        responseType: 'arraybuffer',
                        timeout: 30000
                    }
                )

                const buffer = Buffer.from(download.data)

                await conn.sendMessage(from, {
                    sticker: buffer
                }, { quoted: mek })

                sent++
            } catch (error) {
                console.error('TG STICKER ERROR:', error.message)
            }
        }

        return reply(`✅ Sticker pack completed.\n\n📦 Pack: ${packName}\n🎭 Sent: ${sent}\n\n${POWERED_BY}`)

    } catch (error) {
        console.error('TG ERROR:', error)
        return reply(`❌ Telegram error: ${error.message}\n\n${POWERED_BY}`)
    }
})
