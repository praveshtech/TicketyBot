require('dotenv').config();
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

// 2. Define the /support Slash Command
const supportCommand = new SlashCommandBuilder()
    .setName('support')
    .setDescription('Sets up the Tickety support panel in the current channel.');

// Helper: Auto-Category Overflow (Jab 50 full ho jaye to 2️⃣, 3️⃣... banaye)
const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

async function getAvailableTicketCategory(guild, staffRoles) {
    await guild.channels.fetch(); 

    const baseCategoryId = '1504229014540124180';
    const baseCategory = guild.channels.cache.get(baseCategoryId);

    if (baseCategory && baseCategory.children.cache.size < 50) {
        return { category: baseCategory, numberEmoji: '1️⃣' };
    }

    for (let i = 2; i <= 10; i++) {
        const emoji = numberEmojis[i - 1];
        const categoryName = `${emoji} SUPPORT / ISSUES`;

        let existingCategory = guild.channels.cache.find(
            c => c.type === ChannelType.GuildCategory && c.name.startsWith(emoji)
        );

        if (existingCategory) {
            if (existingCategory.children.cache.size < 50) {
                return { category: existingCategory, numberEmoji: emoji };
            }
        } else {
            const newCategory = await guild.channels.create({
                name: categoryName,
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: guild.client.user.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.ManageChannels,
                            PermissionsBitField.Flags.ManageMessages
                        ],
                    },
                    ...staffRoles.map(roleId => ({
                        id: roleId,
                        type: 0,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory
                        ]
                    }))
                ]
            });
            return { category: newCategory, numberEmoji: emoji };
        }
    }

    return { category: baseCategory, numberEmoji: '1️⃣' };
}

// 3. Register Command when Bot gets Ready
client.once('ready', async () => {
    console.log(`✅ Ready! Logged in as ${client.user.tag}`);
    
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

    if (interaction.isButton()) {
        
        if (interaction.customId === 'open_ticket_issue') {
            await interaction.reply({ 
                content: '⏳ Creating your ticket... please wait!', 
                ephemeral: true 
            });

            const userName = interaction.user.username.toLowerCase();
            
            const communityManagerRoleId = '1415779033156812891'; 
            const ntCommanderRoleId = '1507415051081089108';      
            const gaganUserId = '1048219994011484220'; 
            const nishantUserId = '1214480457098596372';

            try {
                const { category: targetCategory, numberEmoji } = await getAvailableTicketCategory(
                    interaction.guild, 
                    [communityManagerRoleId, ntCommanderRoleId]
                );

                // ✅ FIX 1: Correct Backticks Syntax applied here
                const channelName = `\({numberEmoji}-support--issues-\){userName}`;

                const ticketChannel = await interaction.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: targetCategory ? targetCategory.id : '1504229014540124180', 
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id, 
                            deny: [PermissionsBitField.Flags.ViewChannel], 
                        },
                        {
                            id: interaction.user.id, 
                            allow: [
                                PermissionsBitField.Flags.ViewChannel, 
                                PermissionsBitField.Flags.SendMessages, 
                                PermissionsBitField.Flags.ReadMessageHistory
                            ],
                        },
                        {
                            id: interaction.client.user.id, 
                            allow: [
                                PermissionsBitField.Flags.ViewChannel, 
                                PermissionsBitField.Flags.SendMessages, 
                                PermissionsBitField.Flags.ManageChannels,
                                PermissionsBitField.Flags.ManageMessages 
                            ],
                        },
                        {
                            id: communityManagerRoleId,
                            type: 0, 
                            allow: [
                                PermissionsBitField.Flags.ViewChannel, 
                                PermissionsBitField.Flags.SendMessages, 
                                PermissionsBitField.Flags.ReadMessageHistory
                            ],
                        },
                        {
                            id: ntCommanderRoleId,
                            type: 0, 
                            allow: [
                                PermissionsBitField.Flags.ViewChannel, 
                                PermissionsBitField.Flags.SendMessages, 
                                PermissionsBitField.Flags.ReadMessageHistory
                            ],
                        },
                        {
                            id: gaganUserId,
                            type: 1, 
                            allow: [
                                PermissionsBitField.Flags.ViewChannel, 
                                PermissionsBitField.Flags.SendMessages, 
                                PermissionsBitField.Flags.ReadMessageHistory
                            ],
                        },
                        {
                            id: nishantUserId,
                            type: 1, 
                            allow: [
                                PermissionsBitField.Flags.ViewChannel, 
                                PermissionsBitField.Flags.SendMessages, 
                                PermissionsBitField.Flags.ReadMessageHistory
                            ],
                        }
                    ]
                });

                const welcomeEmbed = new EmbedBuilder()
                    .setTitle('Ticket Created')
                    .setDescription(`Welcome <@${interaction.user.id}>, thank you for reaching out to our support team!\nPlease describe your concern and we will get back to you as soon as possible.`)
                    .setColor(0x3498DB)
                    .setFooter({ 
                        text: 'Tickety | Tickety.top', 
                        iconURL: interaction.client.user.displayAvatarURL() 
                    });

                const closeBtn = new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Secondary);

                const claimBtn = new ButtonBuilder()
                    .setCustomId('claim_ticket')
                    .setLabel('Claim')
                    .setEmoji('🙌')
                    .setStyle(ButtonStyle.Secondary);

                const ticketActionRow = new ActionRowBuilder().addComponents(closeBtn, claimBtn);

                // ✅ FIX 2: Correct Backticks and Bracket Syntax applied here
                const pingMessage = `<@\({interaction.user.id}>, <@&\){communityManagerRoleId}>, <@&${ntCommanderRoleId}>`;

                const sentMessage = await ticketChannel.send({
                    content: pingMessage,
                    embeds: [welcomeEmbed],
                    components: [ticketActionRow],
                    allowedMentions: { parse: ['users', 'roles'] } 
                });

                await sentMessage.pin();

                await interaction.editReply({ 
                    content: `✅ Your ticket has been created here: ${ticketChannel}`, 
                });

            } catch (error) {
                console.error('Error creating ticket:', error);
                await interaction.editReply({ 
                    content: '❌ There was an error creating the ticket. Make sure all IDs are correct numbers and bot has permissions!' 
                });
            }
        }

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

                const closeBtn = new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Secondary);

                const unclaimBtn = new ButtonBuilder()
                    .setCustomId('unclaim_ticket') 
                    .setLabel('Unclaim')
                    .setEmoji('🙌')
                    .setStyle(ButtonStyle.Secondary);

                const updatedRow = new ActionRowBuilder().addComponents(closeBtn, unclaimBtn);

                await interaction.update({ components: [updatedRow] });

                const claimEmbed = new EmbedBuilder()
                    .setColor(0x2B2D31) 
                    .setDescription(`<@${interaction.user.id}> claimed this ticket.`);

                await interaction.channel.send({ embeds: [claimEmbed] });

            } catch (error) {
                console.error('Error claiming ticket:', error);
            }
        }

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

                const closeBtn = new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Secondary);

                const claimBtn = new ButtonBuilder()
                    .setCustomId('claim_ticket') 
                    .setLabel('Claim')
                    .setEmoji('🙌')
                    .setStyle(ButtonStyle.Secondary);

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

    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'close_ticket_modal') {
            try {
                const reason = interaction.fields.getTextInputValue('close_reason_input');
                const finalReason = reason ? reason : 'No further action required.';

                await interaction.reply({ 
                    content: `🔒 This ticket has been closed by <@\({interaction.user.id}>.\n**Reason:**\){finalReason}\n\n*The channel will be deleted in 5 seconds...*`
                }).catch(err => console.error('Channel delete error avoided.'));

                const creatorUsername = interaction.channel.name.split('-').pop(); 
                const creatorMember = interaction.guild.members.cache.find(m => m.user.username.toLowerCase() === creatorUsername.toLowerCase());

                if (creatorMember) {
                    const dmEmbed = new EmbedBuilder()
                        .setColor(0x3498DB)
                        .setTitle('Ticket Closed')
                        .setDescription(`Your ticket has been closed in **Night Trader - Propfirm Community!**\n\n**Ticket Information**\n• **Open Date:** \n• **Panel Name:** 1️⃣ Support / Issues\n• **Ticket Name:** \({interaction.channel.name}\n\n**Close Information**\n• **Closed By:** <@\){interaction.user.id}>\n• **Close Date:** \n• **Close Reason:** ${finalReason}\n\n*If you have any further questions or concerns, feel free to open a new ticket.*`)
                        .setFooter({ text: 'Tickety | Tickety.top', iconURL: interaction.client.user.displayAvatarURL() });

                    const voteBtn = new ButtonBuilder().setLabel('Vote for Tickety').setURL('https://top.gg/bot/tickety').setEmoji('⚡').setStyle(ButtonStyle.Link);
                    const transcriptBtn = new ButtonBuilder().setLabel('View Transcript').setURL('https://tickety.top/').setEmoji('📄').setStyle(ButtonStyle.Link);
                    const rateBtn = new ButtonBuilder().setLabel('Rate').setURL('https://tickety.top/').setEmoji('⭐').setStyle(ButtonStyle.Link);

                    const dmRow1 = new ActionRowBuilder().addComponents(voteBtn);
                    const dmRow2 = new ActionRowBuilder().addComponents(transcriptBtn, rateBtn);

                    try {
                        await creatorMember.send({ embeds: [dmEmbed], components: [dmRow1, dmRow2] });
                    } catch (err) {
                        console.error('User DMs are closed.');
                    }
                }

                const logChannelId = '1504228496577138789'; 
                const logChannel = interaction.client.channels.cache.get(logChannelId);

                if (logChannel) {
                    const generateTicketId = () => {
                        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                        let result = '';
                        for (let i = 0; i < 19; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
                        return result;
                    };

                    const logEmbed = new EmbedBuilder()
                        .setColor(0x3498DB) 
                        .setTitle('Ticket Closed')
                        .setDescription(`<@\({interaction.user.id}> closed a ticket.\n**Reason:**\){finalReason}`)
                        .addFields(
                            {
                                name: 'Ticket Information',
                                value: `> **Ticket Name:** \({interaction.channel.name}\n> **Ticket ID:**\){generateTicketId()}\n> **Created At:** `
                            },
                            {
                                name: 'Executor Information',
                                value: `> **Executor:** <@${interaction.user.id}>\n> **Executor Username:** @\({interaction.user.username}\n> **Executor ID:**\){interaction.user.id}`
                            }
                        )
                        .setFooter({ 
                            text: 'Tickety | Tickety.top', 
                            iconURL: interaction.client.user.displayAvatarURL() 
                        });

                    await logChannel.send({ embeds: [logEmbed] });
                }

                setTimeout(async () => {
                    await interaction.channel.delete().catch(console.error);
                }, 5000);

            } catch (error) {
                console.error('Error handling modal submit:', error);
            }
        }
    }
});

client.login(process.env.TOKEN);