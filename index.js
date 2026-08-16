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
    PermissionsBitField, // Yahan comma missing tha, fix kar diya
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

// 1. Initialize the Bot Client with required intents
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

// 4. Handle Interactions (Slash Commands, Button Clicks & Modal Submits)
client.on('interactionCreate', async interaction => {
    
    // --- PART A: SLASH COMMAND LOGIC (/support) ---
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'support') {
            
            // Main Support Panel Embed
            const ticketEmbed = new EmbedBuilder()
                .setColor(0x3498DB) // Matched blue color
                .setDescription("**🎯 Create a ticket below and our team will assist you 👇**\n\n🎟️ Support Ticket\n\n(Account problems, payouts, rule questions, claim your giveaway reward, giveaway-related queries)")
                .setFooter({ 
                    text: 'Tickety | Tickety.top', 
                    iconURL: client.user.displayAvatarURL() 
                });

            // "Support / Issues" Button
            const ticketButton = new ButtonBuilder()
                .setCustomId('open_ticket_issue')
                .setLabel('Support / Issues')
                .setEmoji('🎟️')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(ticketButton);

            try {
                // Silently acknowledge the command executor
                await interaction.reply({ 
                    content: '✅ Ticket panel setup successful!', 
                    ephemeral: true 
                });

                // Send the actual panel to the channel
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
            const channelName = `1️⃣-support--issues-${userName}`;

            try {
                const ticketChannel = await interaction.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: '1538250489840279653', // <-- YE NAYI LINE ADD KI HAI (Category ID)
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

                const communityManagerRoleId = '1538228489738653757'; 
                const ntCommanderRoleId = '1538228843469340822';      

                const pingMessage = `<@${interaction.user.id}>, <@&${communityManagerRoleId}>, <@&${ntCommanderRoleId}>`;

                const sentMessage = await ticketChannel.send({
                    content: pingMessage,
                    embeds: [welcomeEmbed],
                    components: [ticketActionRow]
                });

                await sentMessage.pin();

                await interaction.editReply({ 
                    content: `✅ Your ticket has been created here: ${ticketChannel}`, 
                });

            } catch (error) {
                console.error('Error creating ticket:', error);
                await interaction.editReply({ 
                    content: '❌ There was an error creating the ticket. Please check the bot permissions!' 
                });
            }
        }

        // --- PART C: CLAIM TICKET ---
        if (interaction.customId === 'claim_ticket') {
            try {
                const staffRoles = ['1538228489738653757', '1538228843469340822'];
                const hasPermission = interaction.member.roles.cache.some(role => staffRoles.includes(role.id));

                if (!hasPermission) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xED4245) 
                        .setTitle('✖️ Missing Permissions')
                        .setDescription(`You need one of the following to access this feature:\n• **Admin Role:** <@&1538228843469340822>\n• **Panel Support Roles:** <@&1538228489738653757>, <@&1538228843469340822>\n• **Permissions:** Manage Channels`);

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

        // --- PART D: UNCLAIM TICKET (Ye miss ho gaya tha) ---
        if (interaction.customId === 'unclaim_ticket') {
            try {
                const staffRoles = ['1538228489738653757', '1538228843469340822'];
                const hasPermission = interaction.member.roles.cache.some(role => staffRoles.includes(role.id));

                if (!hasPermission) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xED4245) 
                        .setTitle('✖️ Missing Permissions')
                        .setDescription(`You need one of the following to access this feature:\n• **Admin Role:** <@&1538228843469340822>\n• **Panel Support Roles:** <@&1538228489738653757>, <@&1538228843469340822>\n• **Permissions:** Manage Channels`);

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

        // --- PART E: CLOSE TICKET (Opens Modal) ---
        if (interaction.customId === 'close_ticket') {
            try {
                const staffRoles = ['1538228489738653757', '1538228843469340822'];
                const isStaff = interaction.member.roles.cache.some(role => staffRoles.includes(role.id));
                const userName = interaction.user.username.toLowerCase();
                const isCreator = interaction.channel.name.includes(userName);

                if (!isStaff && !isCreator) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xED4245)
                        .setTitle('✖️ Missing Permissions')
                        .setDescription(`You need one of the following to access this feature:\n• **Admin Role:** <@&1538228843469340822>\n• **Panel Support Roles:** <@&1538228489738653757>, <@&1538228843469340822>\n• **Permissions:** Manage Channels`);

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
                // Get the reason from the form
                const reason = interaction.fields.getTextInputValue('close_reason_input');
                const finalReason = reason ? reason : 'No reason provided';

                // Send the final closing message in the ticket
                await interaction.reply({ 
                    content: `🔒 This ticket has been closed by <@${interaction.user.id}>.\n**Reason:** ${finalReason}\n\n*The channel will be deleted in 5 seconds...*`
                });

                // --- TICKET LOGGING LOGIC STARTS HERE ---
                // Yahan aapki actual Logs Channel ID set kar di gayi hai
                const logChannelId = '1538244777001099366'; 
                const logChannel = interaction.client.channels.cache.get(logChannelId);

                if (logChannel) {
                    // Random Ticket ID generator (e.g. bs3U24CN7l4ZRyr295e)
                    const generateTicketId = () => {
                        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                        let result = '';
                        for (let i = 0; i < 19; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
                        return result;
                    };

                    const logEmbed = new EmbedBuilder()
                        .setColor(0x3498DB) // Same Blue color
                        .setTitle('Ticket Closed')
                        .setDescription(`<@${interaction.user.id}> closed a ticket.\n**Reason:** ${finalReason}`)
                        .addFields(
                            {
                                name: 'Ticket Information',
                                // `>` creates the gray vertical blockquote line
                                // <t:...:F> creates the native Discord timestamp
                                value: `> **Ticket Name:** ${interaction.channel.name}\n> **Ticket ID:** ${generateTicketId()}\n> **Created At:** <t:${Math.floor(interaction.channel.createdTimestamp / 1000)}:F>`
                            },
                            {
                                name: 'Executor Information',
                                value: `> **Executor:** <@${interaction.user.id}>\n> **Executor Username:** @${interaction.user.username}\n> **Executor ID:** ${interaction.user.id}`
                            }
                        )
                        .setFooter({ 
                            text: 'Tickety | Tickety.top', 
                            iconURL: interaction.client.user.displayAvatarURL() 
                        });

                    // Send the log embed to the logs channel
                    await logChannel.send({ embeds: [logEmbed] });
                } else {
                    console.error('Log channel not found! Make sure the ID is correct and bot has access to it.');
                }
                // --- TICKET LOGGING LOGIC ENDS HERE ---

                // Delete channel after 5 seconds
                setTimeout(async () => {
                    await interaction.channel.delete().catch(error => console.error('Error deleting channel:', error));
                }, 5000);

            } catch (error) {
                console.error('Error handling modal submit:', error);
            }
        }
    }
});

// 5. Login to Discord with your Bot's Token
client.login(process.env.TOKEN);