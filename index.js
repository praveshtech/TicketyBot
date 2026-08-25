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

// --- FIREBASE SETUP ---
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-key.json'); // Make sure this file exists!

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Helper Function: Update Mod Stats
async function updateModStats(userId, username, fieldToIncrement) {
    const modRef = db.collection('nt_mod_stats').doc(userId);
    try {
        const updateData = {};
        updateData[fieldToIncrement] = admin.firestore.FieldValue.increment(1);
        updateData['username'] = username; 
        updateData['lastActive'] = admin.firestore.FieldValue.serverTimestamp();
        await modRef.set(updateData, { merge: true });
    } catch (error) {
        console.error('Error updating Firebase:', error);
    }
}
// ----------------------

// 1. Initialize the Bot Client
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

// 2. Define Slash Commands
const supportCommand = new SlashCommandBuilder()
    .setName('support')
    .setDescription('Sets up the Tickety support panel.');

const modStatsCommand = new SlashCommandBuilder()
    .setName('modstats')
    .setDescription('Shows the live leaderboard for moderator activity.');

// 3. Register Commands
client.once('ready', async () => {
    console.log(`✅ Ready! Logged in as ${client.user.tag}`);
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: [supportCommand.toJSON(), modStatsCommand.toJSON()] },
        );
        console.log('🎉 Commands registered successfully!');
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
});

// --- MESSAGE TRACKER (Live Chat Activity) ---
client.on('messageCreate', async message => {
    if (message.author.bot) return; // Ignore bots

    // Updated with new @support_team role ID
    const staffRoles = ['1415779033156812891', '1541719797447000084'];
    if (message.member && message.member.roles.cache.some(role => staffRoles.includes(role.id))) {
        await updateModStats(message.author.id, message.author.username, 'messagesSent');
    }
});
// --------------------------------------------

// 4. Handle Interactions
client.on('interactionCreate', async interaction => {
    
    // --- PART A: SLASH COMMAND LOGIC ---
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'support') {
            const ticketEmbed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setDescription("**🎯 Create a ticket below and our team will assist you 👇**\n\n🎟️ Support Ticket\n\n(Account problems, payouts, rule questions, claim your giveaway reward, giveaway-related queries)")
                .setFooter({ text: 'Tickety | Tickety.top', iconURL: client.user.displayAvatarURL() });

            const ticketButton = new ButtonBuilder()
                .setCustomId('open_ticket_issue')
                .setLabel('Support / Issues')
                .setEmoji('🎟️')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(ticketButton);

            await interaction.reply({ content: '✅ Ticket panel setup successful!', ephemeral: true });
            await interaction.channel.send({ embeds: [ticketEmbed], components: [row] });
        }

        // --- NEW COMMAND: /modstats ---
        if (interaction.commandName === 'modstats') {
            // Updated with new @support_team role ID
            const staffRoles = ['1415779033156812891', '1541719797447000084'];
            const isStaff = interaction.member.roles.cache.some(role => staffRoles.includes(role.id));
            
            if (!isStaff) {
                return interaction.reply({ content: '❌ Only Staff can view the leaderboard.', ephemeral: true });
            }

            await interaction.deferReply(); 

            try {
                const snapshot = await db.collection('nt_mod_stats').get();
                if (snapshot.empty) {
                    return interaction.editReply('No moderator stats recorded yet.');
                }

                let statsArray = [];
                snapshot.forEach(doc => {
                    statsArray.push({ id: doc.id, ...doc.data() });
                });

                statsArray.sort((a, b) => (b.ticketsClosed || 0) - (a.ticketsClosed || 0));

                let leaderboardText = '';
                statsArray.forEach((stat, index) => {
                    const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🔹';
                    const closed = stat.ticketsClosed || 0;
                    const claimed = stat.ticketsClaimed || 0;
                    const msgs = stat.messagesSent || 0;
                    leaderboardText += `${rank} **${stat.username}**\n> 🔒 Closed: \`${closed}\` | 🙌 Claimed: \`${claimed}\` | 💬 Msgs: \`${msgs}\`\n\n`;
                });

                const statsEmbed = new EmbedBuilder()
                    .setTitle('📊 Support Team Leaderboard')
                    .setDescription(leaderboardText)
                    .setColor(0xF1C40F)
                    .setFooter({ text: 'Night Trader Stats System' });

                await interaction.editReply({ embeds: [statsEmbed] });

            } catch (error) {
                console.error('Error fetching stats:', error);
                await interaction.editReply('❌ Failed to fetch stats from database.');
            }
        }
    }

    // --- BUTTON CLICK LOGIC ---
    if (interaction.isButton()) {
        
       // --- PART B: CREATE TICKET ---
        if (interaction.customId === 'open_ticket_issue') {
            await interaction.reply({ content: '⏳ Creating your ticket...', ephemeral: true });
            const userName = interaction.user.username.toLowerCase();
            const channelName = `1️⃣-support--issues-${userName}`;

            try {
                const ticketChannel = await interaction.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: '1504229014540124180', 
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                        { id: interaction.client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ManageMessages] }
                    ]
                });

                const welcomeEmbed = new EmbedBuilder()
                    .setTitle('Ticket Created')
                    .setDescription(`Welcome <@${interaction.user.id}>, thank you for reaching out to our support team!\nPlease describe your concern.`)
                    .setColor(0x3498DB);

                const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Secondary);
                const claimBtn = new ButtonBuilder().setCustomId('claim_ticket').setLabel('Claim').setEmoji('🙌').setStyle(ButtonStyle.Secondary);
                const ticketActionRow = new ActionRowBuilder().addComponents(closeBtn, claimBtn);

                // Ping message updated with new @support_team role ID
                const pingMessage = `<@${interaction.user.id}>, <@&1415779033156812891>, <@&1541719797447000084>`;
                const sentMessage = await ticketChannel.send({ content: pingMessage, embeds: [welcomeEmbed], components: [ticketActionRow] });
                await sentMessage.pin();

                await interaction.editReply({ content: `✅ Your ticket has been created here: ${ticketChannel}` });

            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: '❌ Error creating the ticket.' });
            }
        }

        // --- PART C: CLAIM TICKET ---
        if (interaction.customId === 'claim_ticket') {
            try {
                // Updated with new @support_team role ID
                const staffRoles = ['1415779033156812891', '1541719797447000084'];
                if (!interaction.member.roles.cache.some(role => staffRoles.includes(role.id))) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xED4245) 
                        .setTitle('✖️ Missing Permissions')
                        .setDescription(`You need one of the following to access this feature:\n• **Support Roles:** <@&1415779033156812891>, <@&1541719797447000084>`);
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }

                const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Secondary);
                const unclaimBtn = new ButtonBuilder().setCustomId('unclaim_ticket').setLabel('Unclaim').setEmoji('🙌').setStyle(ButtonStyle.Secondary);
                const updatedRow = new ActionRowBuilder().addComponents(closeBtn, unclaimBtn);

                await interaction.update({ components: [updatedRow] });
                await interaction.channel.send({ content: `<@${interaction.user.id}> claimed this ticket.` });

                // --- ADD TO FIREBASE: TICKET CLAIMED ---
                await updateModStats(interaction.user.id, interaction.user.username, 'ticketsClaimed');

            } catch (error) {
                console.error(error);
            }
        }

        // --- PART D: UNCLAIM TICKET ---
        if (interaction.customId === 'unclaim_ticket') {
            // Updated with new @support_team role ID
            const staffRoles = ['1415779033156812891', '1541719797447000084'];
            if (!interaction.member.roles.cache.some(role => staffRoles.includes(role.id))) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xED4245) 
                    .setTitle('✖️ Missing Permissions')
                    .setDescription(`You need one of the following to access this feature:\n• **Support Roles:** <@&1415779033156812891>, <@&1541719797447000084>`);
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Secondary);
            const claimBtn = new ButtonBuilder().setCustomId('claim_ticket').setLabel('Claim').setEmoji('🙌').setStyle(ButtonStyle.Secondary);
            const originalRow = new ActionRowBuilder().addComponents(closeBtn, claimBtn);
            await interaction.update({ components: [originalRow] });
            await interaction.channel.send({ content: `<@${interaction.user.id}> unclaimed this ticket.` });
        }

        // --- PART E: CLOSE TICKET (Opens Modal) ---
        if (interaction.customId === 'close_ticket') {
            // Updated with new @support_team role ID
            const staffRoles = ['1415779033156812891', '1541719797447000084'];
            const isStaff = interaction.member.roles.cache.some(role => staffRoles.includes(role.id));
            const userName = interaction.user.username.toLowerCase();
            const isCreator = interaction.channel.name.includes(userName);

            if (!isStaff && !isCreator) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xED4245)
                    .setTitle('✖️ Missing Permissions')
                    .setDescription(`You need one of the following to access this feature:\n• **Support Roles:** <@&1415779033156812891>, <@&1541719797447000084>`);
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            const modal = new ModalBuilder().setCustomId('close_ticket_modal').setTitle(interaction.channel.name); 
            const closeReasonInput = new TextInputBuilder().setCustomId('close_reason_input').setLabel('Close Reason').setStyle(TextInputStyle.Short).setRequired(false); 
            modal.addComponents(new ActionRowBuilder().addComponents(closeReasonInput));
            await interaction.showModal(modal);
        }
    }

    // --- PART F: MODAL SUBMIT LOGIC ---
    if (interaction.isModalSubmit() && interaction.customId === 'close_ticket_modal') {
        try {
            const reason = interaction.fields.getTextInputValue('close_reason_input') || 'No further action required.';
            await interaction.reply({ content: `🔒 Closed by <@${interaction.user.id}>.\n**Reason:** ${reason}\n\n*Deleting in 5 seconds...*` });

            // --- ADD TO FIREBASE: TICKET CLOSED ---
            await updateModStats(interaction.user.id, interaction.user.username, 'ticketsClosed');

            // --- LOGGING ---
            const logChannel = interaction.client.channels.cache.get('1504228496577138789');
            if (logChannel) {
                const logEmbed = new EmbedBuilder().setColor(0x3498DB).setTitle('Ticket Closed').setDescription(`Closed by <@${interaction.user.id}>\n**Reason:** ${reason}`);
                await logChannel.send({ embeds: [logEmbed] });
            }

            setTimeout(async () => await interaction.channel.delete().catch(console.error), 5000);
        } catch (error) {
            console.error(error);
        }
    }
});

client.login(process.env.TOKEN);