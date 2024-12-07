const { Telegraf, Markup } = require('telegraf');
const client = require('./Controllers/pg');
const bot = new Telegraf('7957682260:AAGflgkkksIeUX_R6n3vgHToAp8Fa6BpfUw');

// Botni ishga tushurish
function startBot() {
    // Foydalanuvchidan access id olish
    bot.start(ctx => {
        const user = ctx.from;
        ctx.reply(`Salom, ${user.first_name}! Botga xush kelibsiz. Kirish uchun access ID ni jo'nating.`);
    });

    // Foydalanuvchidan text (access ID yoki kanal username) olish
    bot.on('text', async (ctx) => {
        const messageText = ctx.message.text;
    
        // Agar matn @ bilan boshlansa, bu kanal username ekanligini anglatadi
        if (!messageText.startsWith('@')) {
            // Foydalanuvchidan access ID olish
            const accessId = messageText;
            try {
                // Foydalanuvchini access ID bo'yicha qidirish
                const res = await client.query('SELECT * FROM profitboxusers WHERE accessid = $1', [accessId]);
    
                if (res.rows.length > 0) { 
                    const user = res.rows[0];
                    // Foydalanuvchi topilgan bo'lsa, "Shu sizmi?" deb so'rash
                    await ctx.reply(
                        `Sizni topdim, ${user.firstname} ${user.lastname}. Shu sizmi?`,
                        Markup.inlineKeyboard([
                            Markup.button.callback('Ha', 'yes'),
                            Markup.button.callback('Yo\'q', 'no')
                        ])
                    );
                } else {
                    await ctx.reply('Access ID topilmadi. Iltimos, to\'g\'ri access ID yuboring.');
                }
            } catch (err) {
                console.error('Error querying the database', err);
                ctx.reply('Xatolik yuz berdi.');
            }
        } else {
            // Agar matn @ bilan boshlansa, kanal username deb qabul qilamiz
            const channelUsername = messageText;
            try {
                // Kanalga admin yoki a'zo sifatida qo'shilishini tekshirish
                const member = await ctx.telegram.getChatMember(channelUsername, ctx.from.id);
                console.log(member); // Debug uchun kanal ma'lumotlarini chiqarish
    
                if (member.status === 'creator' || member.status === 'member') {
                    // Muvaffaqiyatli ulanishdan keyin bot kanalda post yuboradi
                    await ctx.reply('Siz muvaffaqiyatli ravishda kanalga qo\'shildingiz!');
                    await ctx.telegram.sendMessage(channelUsername, `Salom, ${ctx.from.first_name} kanalga muvaffaqiyatli qo\'shildi!`);
                } else {
                    await ctx.reply('Siz kanalga a\'zo sifatida ulanmadingiz. Iltimos, kanalga qo\'shiling.');
                }
            } catch (error) {
                console.error('Error checking channel membership:', error);
                await ctx.reply('Kanalga ulanishda xatolik yuz berdi. Iltimos, to\'g\'ri kanalni yuboring.');
            }
        }
    });

    // Inline tugmalarni ishlatish
    bot.action('yes', async (ctx) => {
        // Kanal username'ini so'rash
        await ctx.reply('Iltimos, botni admin sifatida qo\'shish uchun kanalning username ni yuboring. (Masalan: @your_channel)');
    });

    bot.action('no', (ctx) => {
        ctx.reply('Kirishni qaytadan amalga oshiring.');
    });

    // Botni ishga tushurish
    bot.launch().then(() => {
        console.log('Bot ishga tushdi!');
    });
}

module.exports = startBot;
