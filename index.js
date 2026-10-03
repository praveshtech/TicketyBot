require('dotenv').config();
const ghost = require('./ghost.js');
const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ChannelType,
    PermissionsBitField,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

// 1. Initialize the Bot Client
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

// Random Ticket ID Generator for Logs
const generateTicketId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 19; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
};

// --- HELPER: AUTO-CATEGORY OVERFLOW LOGIC ---
async function getAvailableTicketCategory(guild) {
    await guild.channels.fetch(); 
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const baseCategoryId = '1504229014540124180'; 
    let baseCategory = guild.channels.cache.get(baseCategoryId);

    if (baseCategory && baseCategory.children.cache.size < 50) {
        return { categoryId: baseCategory.id, emoji: '1️⃣' };
    }

    for (let i = 1; i < 10; i++) {
        const currentEmoji = emojis[i];
        const expectedCatName = `${currentEmoji}-support-issues`;
        
        let existingCat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === expectedCatName.toLowerCase());

        if (existingCat) {
            if (existingCat.children.cache.size < 50) return { categoryId: existingCat.id, emoji: currentEmoji };
        } else {
            const newCat = await guild.channels.create({
                name: expectedCatName,
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: guild.client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ManageMessages] },
                    { id: '1415779033156812891', type: 0, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                    { id: '1507415051081089108', type: 0, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
                ]
            });
            return { categoryId: newCat.id, emoji: currentEmoji };
        }
    }
    return { categoryId: baseCategoryId, emoji: '1️⃣' };
}

// 2. Define the /support Slash Command
const supportCommand = new SlashCommandBuilder()
    .setName('support')
    .setDescription('Sets up the Tickety support panel in the current channel.');

// 3. Register Command when Bot gets Ready
client.once('ready', async () => {
    console.log(`✅ Ready! Logged in as ${client.user.tag}`);
    ghost.startDashboard(5000);
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        console.log('⏳ Registering /support command...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: [supportCommand.toJSON()] },
        );
        console.log('🎉 Successfully registered /support command!');
    } catch (error) {
        console.error('❌ Error registering command:', error);
    }
});

// 4. Handle Interactions
client.on('interactionCreate', async interaction => {
    
    // --- PART A: SLASH COMMAND LOGIC (/support) ---
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'support') {
            
            const ticketEmbed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setDescription("**🎯 Create a ticket below and our team will assist you 👇**\n\n🎟️ Support Ticket\n\n(Account problems, payouts, rule questions, claim your giveaway reward, giveaway-related queries)")
                .setFooter({ 
                    text: 'Tickety | Tickety.top', 
                    iconURL: client.user.displayAvatarURL() 
                });

            const ticketButton = new ButtonBuilder()
                .setCustomId('open_ticket_issue')
                .setLabel('Support / Issues')
                .setEmoji('🎟️')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(ticketButton);

            try {
                await interaction.reply({ 
                    content: '✅ Ticket panel setup successful!', 
                    ephemeral: true 
                });

                await interaction.channel.send({ 
                    embeds: [ticketEmbed], 
                    components: [row] 
                });
            } catch (error) {
                console.error('Error sending panel:', error);
            }
        }
    }

    // --- BUTTON CLICK LOGIC ---
    if (interaction.isButton()) {
        
       // --- PART B: CREATE TICKET ---
        if (interaction.customId === 'open_ticket_issue') {
            await interaction.reply({ 
                content: '⏳ Creating your ticket... please wait!', 
                ephemeral: true 
            });

            const userName = interaction.user.username.toLowerCase();
            const { categoryId, emoji } = await getAvailableTicketCategory(interaction.guild);
            const channelName = `${emoji}-support-issues-${userName}`;
            
            // 🛑 GAGAN AUR NISHANT KI IDs (0 Delay)
            const gaganUserId = '1048219994011484220'; 
            const nishantUserId = '1214480457098596372';

            try {
                const ticketChannel = await interaction.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: categoryId, 
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                        { id: interaction.client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ManageMessages] },
                        { id: '1415779033156812891', type: 0, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                        { id: '1507415051081089108', type: 0, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                        { id: gaganUserId, type: 1, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                        { id: nishantUserId, type: 1, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
                    ]
                });

                const welcomeEmbed = new EmbedBuilder()
                    .setTitle('Ticket Created')
                    .setDescription(`Welcome <@${interaction.user.id}>, thank you for reaching out to our support team!\nPlease describe your concern and we will get back to you as soon as possible.`)
                    .setColor(0x3498DB)
                    .setFooter({ text: 'Tickety | Tickety.top', iconURL: interaction.client.user.displayAvatarURL() });

                const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Secondary);
                const claimBtn = new ButtonBuilder().setCustomId('claim_ticket').setLabel('Claim').setEmoji('🙌').setStyle(ButtonStyle.Secondary);
                const ticketActionRow = new ActionRowBuilder().addComponents(closeBtn, claimBtn);

                const communityManagerRoleId = '1415779033156812891'; 
                const ntCommanderRoleId = '1507415051081089108';      

                const pingMessage = `<@${interaction.user.id}>, <@&${communityManagerRoleId}>, <@&${ntCommanderRoleId}>`;

                const sentMessage = await ticketChannel.send({
                    content: pingMessage,
                    embeds: [welcomeEmbed],
                    components: [ticketActionRow],
                    allowedMentions: { parse: ['users', 'roles'] }
                });

                await sentMessage.pin();
                await interaction.editReply({ content: `✅ Your ticket has been created here: ${ticketChannel}` });

                // 👻 GHOST AUTO-CLAIM LOGIC (0.5 Sec Delay)
                const ghostData = ghost.getGhostData();
                let autoClaimerId = null;
                let autoClaimerName = null;

                if (ghostData.kapil_on && ghostData.manvendra_on) {
                    if (Math.random() < 0.5) {
                        autoClaimerId = '1195195817099808769'; 
                        autoClaimerName = 'kapil';
                    } else {
                        autoClaimerId = '1465635300939272255'; 
                        autoClaimerName = 'manvendra';
                    }
                } else if (ghostData.kapil_on) {
                    autoClaimerId = '1195195817099808769'; 
                    autoClaimerName = 'kapil';
                } else if (ghostData.manvendra_on) {
                    autoClaimerId = '1465635300939272255'; 
                    autoClaimerName = 'manvendra';
                }

                if (autoClaimerId) {
                    setTimeout(async () => {
                        // 1. Claim wala message bhejo
                        const ghostClaimEmbed = new EmbedBuilder()
                            .setColor(0x2B2D31)
                            .setDescription(`<@${autoClaimerId}> claimed this ticket.`);
                        
                        await ticketChannel.send({ embeds: [ghostClaimEmbed] });
                        ghost.updateLeaderboard(autoClaimerName);

                        // 2. Button ko 'Unclaim' mein change karna
                        const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Secondary);
                        const unclaimBtn = new ButtonBuilder().setCustomId('unclaim_ticket').setLabel('Unclaim').setEmoji('🙌').setStyle(ButtonStyle.Secondary);
                        const updatedRow = new ActionRowBuilder().addComponents(closeBtn, unclaimBtn);

                        if (sentMessage) {
                            await sentMessage.edit({ components: [updatedRow] }).catch(err => console.error('Button update error:', err));
                        }

                        // 👇 3. NAYA CODE: LOG CHANNEL MEIN AUTO-CLAIM BHEJNA 👇
                        try {
                            const logChannelId = '1504228496577138789'; 
                            const logChannel = interaction.client.channels.cache.get(logChannelId);
                            
                            if (logChannel) {
                                // Mod ka asli username nikalna taaki log real lage
                                const claimerUser = await interaction.client.users.fetch(autoClaimerId);
                                
                                const claimLogEmbed = new EmbedBuilder()
                                    .setColor(0x2B2D31) 
                                    .setTitle('Ticket Claimed')
                                    .setDescription(`<@${autoClaimerId}> claimed a ticket.`)
                                    .addFields(
                                        {
                                            name: 'Ticket Information',
                                            value: `**Ticket Name:** ${ticketChannel.name}\n**Ticket ID:** ${generateTicketId()}\n**Created At:** `
                                        },
                                        {
                                            name: 'Executor Information',
                                            value: `**Executor:** <@${autoClaimerId}>\n**Executor Username:** @${claimerUser.username}\n**Executor ID:** ${autoClaimerId}`
                                        }
                                    )
                                    .setFooter({ text: 'Tickety | Tickety.top', iconURL: interaction.client.user.displayAvatarURL() });

                                await logChannel.send({ embeds: [claimLogEmbed] });
                            }
                        } catch (err) {
                            console.error('Auto-claim log error:', err);
                        }
                        // 👆 NAYA CODE KHATAM 👆

                    }, 2000); 
                }

                // 🚨 CREATE TICKET LOG
                const logChannelId = '1504228496577138789'; 
                const logChannel = interaction.client.channels.cache.get(logChannelId);

                if (logChannel) {
                    const createLogEmbed = new EmbedBuilder()
                        .setColor(0x2B2D31) 
                        .setTitle('Ticket Created')
                        .setDescription(`<@${interaction.user.id}> created a ticket.`)
                        .addFields(
                            {
                                name: 'Ticket Information',
                                value: `**Ticket Name:** ${ticketChannel.name}\n**Ticket ID:** ${generateTicketId()}\n**Created At:** `
                            },
                            {
                                name: 'Creator Information',
                                value: `**Creator:** <@${interaction.user.id}>\n**Creator Username:** @${interaction.user.username}\n**Creator ID:** ${interaction.user.id}`
                            }
                        )
                        .setFooter({ text: 'Tickety | Tickety.top', iconURL: interaction.client.user.displayAvatarURL() });

                    await logChannel.send({ embeds: [createLogEmbed] });
                }

            } catch (error) {
                console.error('Error creating ticket:', error);
                await interaction.editReply({ 
                    content: '❌ There was an error creating the ticket. Make sure all IDs are correct numbers and bot has permissions!' 
                });
            }
        }

        // --- PART C: CLAIM TICKET ---
        if (interaction.customId === 'claim_ticket') {
            try {
                const staffRoles = ['1415779033156812891', '1507415051081089108'];
                const hasPermission = interaction.member.roles.cache.some(role => staffRoles.includes(role.id));

                if (!hasPermission) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xED4245) 
                        .setTitle('✖️ Missing Permissions')
                        .setDescription(`You need one of the following to access this feature:\n• **Admin Role:** <@&1507415051081089108>\n• **Panel Support Roles:** <@&1415779033156812891>, <@&1507415051081089108>\n• **Permissions:** Manage Channels`);

                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }

                const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Secondary);
                const unclaimBtn = new ButtonBuilder().setCustomId('unclaim_ticket').setLabel('Unclaim').setEmoji('🙌').setStyle(ButtonStyle.Secondary);
                const updatedRow = new ActionRowBuilder().addComponents(closeBtn, unclaimBtn);

                await interaction.update({ components: [updatedRow] });

                const claimEmbed = new EmbedBuilder()
                    .setColor(0x2B2D31) 
                    .setDescription(`<@${interaction.user.id}> claimed this ticket.`);

                await interaction.channel.send({ embeds: [claimEmbed] });

                // 👻 LEADERBOARD MANUAL UPDATE
                const claimer = interaction.user.id;
                if (claimer === '1048219994011484220') ghost.updateLeaderboard('gagan');
                else if (claimer === '1195195817099808769') ghost.updateLeaderboard('kapil');
                else if (claimer === '1465635300939272255') ghost.updateLeaderboard('manvendra');

                // 🚨 CLAIM TICKET LOG
                const logChannelId = '1504228496577138789'; 
                const logChannel = interaction.client.channels.cache.get(logChannelId);

                if (logChannel) {
                    const claimLogEmbed = new EmbedBuilder()
                        .setColor(0x2B2D31) 
                        .setTitle('Ticket Claimed')
                        .setDescription(`<@${interaction.user.id}> claimed a ticket.`)
                        .addFields(
                            {
                                name: 'Ticket Information',
                                value: `**Ticket Name:** ${interaction.channel.name}\n**Ticket ID:** ${generateTicketId()}\n**Created At:** `
                            },
                            {
                                name: 'Executor Information',
                                value: `**Executor:** <@${interaction.user.id}>\n**Executor Username:** @${interaction.user.username}\n**Executor ID:** ${interaction.user.id}`
                            }
                        )
                        .setFooter({ text: 'Tickety | Tickety.top', iconURL: interaction.client.user.displayAvatarURL() });

                    await logChannel.send({ embeds: [claimLogEmbed] });
                }

            } catch (error) {
                console.error('Error claiming ticket:', error);
            }
        }

        // --- PART D: UNCLAIM TICKET ---
        if (interaction.customId === 'unclaim_ticket') {
            try {
                const staffRoles = ['1415779033156812891', '1507415051081089108'];
                const hasPermission = interaction.member.roles.cache.some(role => staffRoles.includes(role.id));

                if (!hasPermission) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xED4245) 
                        .setTitle('✖️ Missing Permissions')
                        .setDescription(`You need one of the following to access this feature:\n• **Admin Role:** <@&1507415051081089108>\n• **Panel Support Roles:** <@&1415779033156812891>, <@&1507415051081089108>\n• **Permissions:** Manage Channels`);

                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }

                const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Secondary);
                const claimBtn = new ButtonBuilder().setCustomId('claim_ticket').setLabel('Claim').setEmoji('🙌').setStyle(ButtonStyle.Secondary);
                const originalRow = new ActionRowBuilder().addComponents(closeBtn, claimBtn);

                await interaction.update({ components: [originalRow] });

                const unclaimEmbed = new EmbedBuilder()
                    .setColor(0x2B2D31)
                    .setDescription(`<@${interaction.user.id}> unclaimed this ticket.`);

                await interaction.channel.send({ embeds: [unclaimEmbed] });

            } catch (error) {
                console.error('Error unclaiming ticket:', error);
            }
        }

        // --- PART E: CLOSE TICKET (Opens Modal) ---
        if (interaction.customId === 'close_ticket') {
            try {
                const staffRoles = ['1415779033156812891', '1507415051081089108'];
                const isStaff = interaction.member.roles.cache.some(role => staffRoles.includes(role.id));
                const userName = interaction.user.username.toLowerCase();
                const isCreator = interaction.channel.name.includes(userName);

                if (!isStaff && !isCreator) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xED4245)
                        .setTitle('✖️ Missing Permissions')
                        .setDescription(`You need one of the following to access this feature:\n• **Admin Role:** <@&1507415051081089108>\n• **Panel Support Roles:** <@&1415779033156812891>, <@&1507415051081089108>\n• **Permissions:** Manage Channels`);

                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }

                const modal = new ModalBuilder()
                    .setCustomId('close_ticket_modal')
                    .setTitle(interaction.channel.name); 

                const closeReasonInput = new TextInputBuilder()
                    .setCustomId('close_reason_input')
                    .setLabel('Close Reason')
                    .setPlaceholder('Are you sure that you want to close this ticket?')
                    .setStyle(TextInputStyle.Short) 
                    .setRequired(false); 

                const firstActionRow = new ActionRowBuilder().addComponents(closeReasonInput);
                modal.addComponents(firstActionRow);

                await interaction.showModal(modal);

            } catch (error) {
                console.error('Error opening close modal:', error);
            }
        }
    }

    // --- PART F: MODAL SUBMIT LOGIC ---
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'close_ticket_modal') {
            try {
                const reason = interaction.fields.getTextInputValue('close_reason_input');
                const finalReason = reason ? reason : 'No further action required.';

                await interaction.reply({ 
                    content: `🔒 This ticket has been closed by <@${interaction.user.id}>.\n**Reason:** ${finalReason}\n\n*The channel will be deleted in 5 seconds...*`
                }).catch(err => console.error('Channel delete error avoided.'));

                // --- DM TO CREATOR LOGIC ---
                const creatorUsername = interaction.channel.name.split('-').pop(); 
                const creatorMember = interaction.guild.members.cache.find(m => m.user.username.toLowerCase() === creatorUsername.toLowerCase());

                if (creatorMember) {
                    const dmEmbed = new EmbedBuilder()
                        .setColor(0x3498DB)
                        .setTitle('Ticket Closed')
                        .setDescription(`Your ticket has been closed in **Night Trader - Propfirm Community!**\n\n**Ticket Information**\n• **Open Date:** \n• **Panel Name:** 1️⃣ Support / Issues\n• **Ticket Name:** ${interaction.channel.name}\n\n**Close Information**\n• **Closed By:** <@${interaction.user.id}>\n• **Close Date:** \n• **Close Reason:** ${finalReason}\n\n*If you have any further questions or concerns, feel free to open a new ticket.*`)
                        .setFooter({ text: 'Tickety | Tickety.top', iconURL: interaction.client.user.displayAvatarURL() });

                    const voteBtn = new ButtonBuilder().setLabel('Vote for Tickety').setURL('https://top.gg/bot/tickety').setEmoji('⚡').setStyle(ButtonStyle.Link);
                    const transcriptBtn = new ButtonBuilder().setLabel('View Transcript').setURL('https://tickety.top/').setEmoji('📄').setStyle(ButtonStyle.Link);
                    const rateBtn = new ButtonBuilder().setLabel('Rate').setURL('https://tickety.top/').setEmoji('⭐').setStyle(ButtonStyle.Link);

                    const dmRow1 = new ActionRowBuilder().addComponents(voteBtn);
                    const dmRow2 = new ActionRowBuilder().addComponents(transcriptBtn, rateBtn);

                    try {
                        await creatorMember.send({ embeds: [dmEmbed], components: [dmRow1, dmRow2] });
                    } catch (err) {
                        console.error('User DMs are closed, could not send the message.');
                    }
                }

                // --- TICKET LOGGING LOGIC ---
                const logChannelId = '1504228496577138789'; 
                const logChannel = interaction.client.channels.cache.get(logChannelId);

                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(0x2B2D31) 
                        .setTitle('Ticket Closed')
                        .setDescription(`<@${interaction.user.id}> closed a ticket.\n**Reason:** ${finalReason}`)
                        .addFields(
                            {
                                name: 'Ticket Information',
                                value: `**Ticket Name:** ${interaction.channel.name}\n**Ticket ID:** ${generateTicketId()}\n**Created At:** `
                            },
                            {
                                name: 'Executor Information',
                                value: `**Executor:** <@${interaction.user.id}>\n**Executor Username:** @${interaction.user.username}\n**Executor ID:** ${interaction.user.id}`
                            }
                        )
                        .setFooter({ 
                            text: 'Tickety | Tickety.top', 
                            iconURL: interaction.client.user.displayAvatarURL() 
                        });

                    await logChannel.send({ embeds: [logEmbed] });
                }

                // Delete channel after 5 seconds (Safe Check)
                setTimeout(async () => {
                   if (interaction.channel) {
                        await interaction.channel.delete().catch(error => console.error('Error deleting channel:', error));
                    }
                }, 5000);

            } catch (error) {
                console.error('Error handling modal submit:', error);
            }
        }
    }
});

// 5. Login to Discord
client.login(process.env.TOKEN);