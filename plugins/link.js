
const { bot } = require('../lib/');
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');

// ==========================================
// CONFIGURATION
// ==========================================

const API_URL = 'https://spider-avik.zone.id/upload';

const FOOTER = '*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*';

// ==========================================
// MEDIA LINK UPLOADER
// ==========================================

bot(
    {
        pattern: 'link ?(.*)',
        fromMe: true,
        desc: 'Uploads replied media and generates a link',
        type: 'media',
    },

    async (message, match) => {

        let mediaPath = null;

        try {

            // CHECK REPLIED MEDIA

            if (
                !message.reply_message ||
                (
                    !message.reply_message.image &&
                    !message.reply_message.video &&
                    !message.reply_message.audio &&
                    !message.reply_message.sticker &&
                    !message.reply_message.document
                )
            ) {
                return await message.send(
                    '*Please reply to a media file (photo, video, audio, sticker, or document).*'
                    + '\n\n' + FOOTER
                );
            }

            await message.send(
                '*Uploading to Spider-Avik Zone... ⏳*\n\n' +
                FOOTER
            );

            // DOWNLOAD MEDIA

            mediaPath = await message.reply_message
                .downloadAndSaveMediaMessage('temp_upload');

            if (!mediaPath || !fs.existsSync(mediaPath)) {
                throw new Error('Media download failed');
            }

            // FORM DATA SETUP

            const form = new FormData();

            form.append(
                'file',
                fs.createReadStream(mediaPath)
            );

            // UPLOAD TO API

            const response = await axios.post(
                API_URL,
                form,
                {
                    headers: {
                        ...form.getHeaders()
                    },
                    timeout: 60000,
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity
                }
            );

            // CHECK RESPONSE

            if (
                response.data &&
                response.data.success &&
                response.data.url
            ) {

                const fileUrl = response.data.url;

                const originalName =
                    response.data.original_name || 'Unknown';

                const successMsg =
                    '╭━━〔 𝐔𝐏𝐋𝐎𝐀𝐃 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 〕━━╮\n' +
                    '┃\n' +
                    `┃ ◈ Original Name: ${originalName}\n` +
                    '┃\n' +
                    `┃ ◈ URL: ${fileUrl}\n` +
                    '┃\n' +
                    '╰━━━━━━━━━━━━━━━━━━╯\n\n' +
                    FOOTER;

                await message.send(successMsg);

            } else {

                await message.send(
                    '*Upload failed. Server did not return a success status.*\n\n' +
                    FOOTER
                );
            }

        } catch (error) {

            console.error('[AHMED-MD LINK UPLOADER]', error);

            await message.send(
                '*Error occurred while uploading:*\n' +
                `${error.message}\n\n` +
                FOOTER
            );

        } finally {

            // CLEANUP TEMPORARY FILE

            if (mediaPath && fs.existsSync(mediaPath)) {
                try {
                    fs.unlinkSync(mediaPath);
                } catch (cleanupError) {
                    console.error(
                        '[UPLOAD CLEANUP ERROR]',
                        cleanupError
                    );
                }
            }
        }
    }
);
