import { ApplicationCommandOptionType, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelSelectMenuInteraction, ChannelType, ChatInputCommandInteraction, Colors, ComponentType, MessageFlags, PermissionFlagsBits, Role, RoleSelectMenuInteraction, SeparatorSpacingSize, TextChannel, ThreadChannel } from "discord.js";
import { Command } from "../classes/Command";
import { TMComponentBuilder } from "../classes/ComponentBuilder";
import { generateCustomId, parseCustomId } from "../util/customIdUtils";
import { errorEmbed, genericEmbedBuilder } from "../util/util";
import { defaultEmbedColor, panelManager, teamManager } from "..";

const SetupCommand: Command = {
    enabled: true,
    name: "setup",
    defaultMemberPermissions: [PermissionFlagsBits.Administrator],
    description: "Set up the bot, and configure which channels it uses.",
    run: async (interaction: ChatInputCommandInteraction) => {
        if (teamManager.getConfigValue("setup")) {
            const alreadySetup = new TMComponentBuilder().setAccentColor(defaultEmbedColor);
            alreadySetup.addTextDisplay(`## Setup Already Complete\nYou've already completed the initial setup for the bot. If you need to change configuration values, please run \`/host config\` to change the configuration.`)
            interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [alreadySetup.buildContainer()] })
            return;
        }
        const introCon = new TMComponentBuilder().setAccentColor(Colors.Gold);
        introCon.addTextDisplay(`## Bot Setup - Introduction\nWelcome to the setup wizard for the ECO Nightreign Tournament bot! Here's what this bot will be doing:\n> 1. Managing registration for members participating in the tournament, and allowing them to choose their nightfarer as well as their preferred skin\n> 2. Provide event hosts (you!) with a single panel to manage points, rounds, and the rest of the tournament!\n\nTo continue setting up the bot, please click the green continue button below. To cancel setup, simply ignore or dismiss this message.`)
        const continueButton = new ButtonBuilder().setCustomId(generateCustomId(interaction, "continue")).setLabel("Continue").setStyle(ButtonStyle.Success)
        introCon.addSeparator(SeparatorSpacingSize.Large, false)
        introCon.addButtonActionRow([continueButton])
        introCon.addSeparator(SeparatorSpacingSize.Large, true)
        introCon.addTextDisplay(`-# Made by [@ducky.lol](https://ducky.wiki) • This attribution will not appear in public-facing components.`)
        // channelSelectCon.addTextDisplay(`### Points Panel Channel\n-# Please select the channel in which the points panel will be sent. It is recommended that this channel is private to event hosts only, and free of clutter such as chats. The points panel will be available to anyone `)

        function buildRoleSelectContainer(role: Role | null, invalid: boolean = false, next: boolean = false): TMComponentBuilder {
            let roleSelectCon = new TMComponentBuilder().setAccentColor(Colors.Orange)
            roleSelectCon.addTextDisplay(`## Bot Setup - Event Host Role`)
            roleSelectCon.addSeparator()
            roleSelectCon.addTextDisplay(`### Event Host Role\n-# Please select the role for tournament hosts. Anyone with this role will have full access to the points panel.`)
            roleSelectCon.addRoleSelectMenu(parseCustomId(generateCustomId(interaction, "role")), "Select Event Host role", [], false, 0, 1)
            roleSelectCon.addSeparator(SeparatorSpacingSize.Small, false)
            if (!invalid && !next) roleSelectCon.addTextDisplay(role !== null ? `**Selected Role:** ${role.name}` : `Please select a role to continue`)
            if (!invalid && next) roleSelectCon.addButtonAccessorySection(`**Selected Role:** ${role.name}\n\n-# If this is your preferred role, press "Confirm" to continue with setup.`, ButtonStyle.Success, "Confirm", parseCustomId(generateCustomId(interaction, "confirm-role")))
            if (invalid) roleSelectCon.addTextDisplay(`You've selected an invalid role. Please select a new role to continue.`)

            roleSelectCon.addSeparator(SeparatorSpacingSize.Large, true)
            roleSelectCon.addTextDisplay(`-# Made by [@ducky.lol](https://ducky.wiki) • This attribution will not appear in public-facing components.`)
            return roleSelectCon;
        }

        const timeout = 1200e3
        const res = await interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [introCon.buildContainer()], withResponse: true })
        res.resource.message.awaitMessageComponent({ componentType: ComponentType.Button, filter: i => i.user.id === interaction.user.id, time: timeout }).then(async (waiter: ButtonInteraction) => {

            // roleSelectCon.addSeparator(SeparatorSpacingSize.Large, true)
            // roleSelectCon.addTextDisplay(`-# Made by [@ducky.lol](https://ducky.wiki) • This attribution will not appear in public-facing components.`)
            waiter.deferUpdate()
            const res2 = await interaction.editReply({ components: [buildRoleSelectContainer(null).buildContainer()] })

            const col = res2.createMessageComponentCollector({ componentType: ComponentType.RoleSelect, filter: i => i.user.id === waiter.user.id, time: timeout })
            col.on("collect", async (role: RoleSelectMenuInteraction) => {
                role.deferUpdate()
                // console.log(role.values)
                const realRole = waiter.guild.roles.cache.get(role.values[0]);
                // console.log(realRole)
                if (!realRole) {
                    interaction.editReply({ components: [buildRoleSelectContainer(null, true).buildContainer()] })
                }
                if (realRole) {
                    if (realRole.managed) {
                        interaction.editReply({ components: [buildRoleSelectContainer(null, true).buildContainer()] })
                        return;
                    }

                    const res3 = await interaction.editReply({ components: [buildRoleSelectContainer(realRole, false, true).buildContainer()] })
                    res3.awaitMessageComponent({ componentType: ComponentType.Button, filter: i => i.customId.includes("confirm-role") && i.user.id === waiter.user.id, time: timeout }).then(async (confirmed: ButtonInteraction) => {
                        col.stop(`role-${realRole.id}`)
                    }).catch(e => {
                        interaction.editReply({ components: [errorEmbed(`This interaction has expired`).buildContainer()] })
                    })

                }

            })

            col.once("end", async (final, reason) => {
                if (reason === "time") {
                    interaction.editReply({ components: [errorEmbed(`This interaction has expired`).buildContainer()] })
                } else if (reason.includes("role-")) {
                    let roleId = reason.split("role-")[1]
                    let realRole = interaction.guild.roles.cache.get(roleId);
                    if (!realRole) {
                        interaction.editReply({ components: [errorEmbed(`This interaction is invalid. Please try again.`).buildContainer()] })
                        return;
                    }
                    try {
                        let set = teamManager.setRoleConfigKey("host", roleId)
                        console.log("SET", set)
                        if (!set) {
                            interaction.editReply({ components: [errorEmbed(`This interaction is invalid. Please try again.`).buildContainer()] })

                            return;
                        } else {

                            interaction.followUp({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [genericEmbedBuilder(`The Event Host role has been set to @${realRole.name} (${realRole.id})`).buildContainer()] })

                            function buildPanelChannelSelectContainer(channel: TextChannel | null, invalid: boolean = false, next: boolean = false): TMComponentBuilder {
                                let panelSelectCon = new TMComponentBuilder().setAccentColor(Colors.Orange)
                                panelSelectCon.addTextDisplay(`## Bot Setup - Points Panel Channel`)
                                panelSelectCon.addSeparator()
                                panelSelectCon.addTextDisplay(`### Points Panel Channel\n-# Please select the channel in which the points panel will be sent. It is recommended that this channel is private to event hosts only, and free of clutter such as chats. The points panel will be available to anyone with the **${realRole.name}** role within the chosen channel.\n\n-# Please ensure the bot has permission to send messages, embed links, and attach files in the chosen channel.`)
                                panelSelectCon.addChannelSelectMenu(parseCustomId(generateCustomId(interaction, "pointspanel")), "Select Points Panel channel", [ChannelType.GuildText], [], false, 0, 1)
                                panelSelectCon.addSeparator(SeparatorSpacingSize.Small, false)
                                if (!invalid && !next) panelSelectCon.addTextDisplay(channel !== null ? `**Selected Channel:** ${channel.name}` : `Please select a channel to continue`)
                                if (!invalid && next) panelSelectCon.addButtonAccessorySection(`**Selected Channel:** ${channel.name}\n\n-# If this is your preferred channel, press "Confirm" to continue with setup.`, ButtonStyle.Success, "Confirm", parseCustomId(generateCustomId(interaction, "confirm-channel")))
                                if (invalid) panelSelectCon.addTextDisplay(`You've selected an invalid channel. Please select a new channel to continue.`)

                                panelSelectCon.addSeparator(SeparatorSpacingSize.Large, true)
                                panelSelectCon.addTextDisplay(`-# Made by [@ducky.lol](https://ducky.wiki) • This attribution will not appear in public-facing components.`)
                                return panelSelectCon;
                            }

                            const res4 = await interaction.editReply({ components: [buildPanelChannelSelectContainer(null).buildContainer()] })
                            const col2 = res4.createMessageComponentCollector({ componentType: ComponentType.ChannelSelect, filter: i => i.user.id === interaction.user.id, time: timeout })
                            col2.on("collect", async (panelChannel: ChannelSelectMenuInteraction) => {
                                panelChannel.deferUpdate()
                                const realChannel: TextChannel = interaction.guild.channels.cache.get(panelChannel.values[0]) as TextChannel
                                if (!realChannel) {
                                    interaction.editReply({ components: [buildPanelChannelSelectContainer(null, true, false).buildContainer()] })
                                    return;
                                }
                                if (!realChannel.isSendable() || !realChannel.isTextBased()) {
                                    interaction.editReply({ components: [buildPanelChannelSelectContainer(null, true, false).buildContainer()] })
                                    return;
                                }

                                const res5 = await interaction.editReply({ components: [buildPanelChannelSelectContainer(realChannel, false, true).buildContainer()] })
                                res5.awaitMessageComponent({ componentType: ComponentType.Button, filter: i => i.customId.includes("confirm-channel") && i.user.id === waiter.user.id, time: timeout }).then(async (confirmed: ButtonInteraction) => {
                                    col2.stop(`channel-${realChannel.id}`)
                                }).catch(e => {
                                    interaction.editReply({ components: [errorEmbed(`This interaction has expired`).buildContainer()] })

                                })


                            })
                            col2.once("end", async (final, reason) => {
                                if (reason === "time") {
                                    interaction.editReply({ components: [errorEmbed(`This interaction has expired`).buildContainer()] })
                                    return
                                }
                                if (reason.includes("channel-")) {
                                    let channelId = reason.split("channel-")[1]
                                    const realChannel: TextChannel = interaction.guild.channels.cache.get(channelId) as TextChannel
                                    if (!realChannel) {
                                        interaction.editReply({ components: [errorEmbed(`This interaction is invalid. Please try again.`).buildContainer()] })
                                        return;
                                    }
                                    try {
                                        const set2 = teamManager.setChannelConfigKey("panel", channelId)
                                        if (!set2) {
                                            interaction.editReply({ components: [errorEmbed(`This interaction is invalid. Please try again.`).buildContainer()] })
                                            return;
                                        }

                                        interaction.followUp({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [genericEmbedBuilder(`The Points Panel channel has been set to <#${realChannel.id}> (${realChannel.id})`).buildContainer()] })

                                        function buildLeaderboardChannelSelectContainer(channel: TextChannel | null, invalid: boolean = false, next: boolean = false): TMComponentBuilder {
                                            let leaderboardSelectCon = new TMComponentBuilder().setAccentColor(Colors.Orange)
                                            leaderboardSelectCon.addTextDisplay(`## Bot Setup - Leaderboard Channel`)
                                            leaderboardSelectCon.addSeparator()
                                            leaderboardSelectCon.addTextDisplay(`### Leaderboard Channel\n-# Please select the channel in which the leaderboard will be sent. This channel should be viewable by anyone and not cluttered with things like chat.\n\n-# Please ensure the bot has permission to send messages, embed links, and attach files in the chosen channel.`)
                                            leaderboardSelectCon.addChannelSelectMenu(parseCustomId(generateCustomId(interaction, "leaderboard")), "Select Leaderboard channel", [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.PublicThread], [], false, 0, 1)
                                            leaderboardSelectCon.addSeparator(SeparatorSpacingSize.Small, false)
                                            if (!invalid && !next) leaderboardSelectCon.addTextDisplay(channel !== null ? `**Selected Channel:** ${channel.name}` : `Please select a channel to continue`)
                                            if (!invalid && next) leaderboardSelectCon.addButtonAccessorySection(`**Selected Channel:** ${channel.name}\n\n-# If this is your preferred channel, press "Confirm" to continue with setup.`, ButtonStyle.Success, "Confirm", parseCustomId(generateCustomId(interaction, "confirm-channel")))
                                            if (invalid) leaderboardSelectCon.addTextDisplay(`You've selected an invalid channel. Please select a new channel to continue.`)

                                            leaderboardSelectCon.addSeparator(SeparatorSpacingSize.Large, true)
                                            leaderboardSelectCon.addTextDisplay(`-# Made by [@ducky.lol](https://ducky.wiki) • This attribution will not appear in public-facing components.`)
                                            return leaderboardSelectCon;
                                        }

                                        const res6 = await interaction.editReply({ components: [buildLeaderboardChannelSelectContainer(null, false, false).buildContainer()] })
                                        const col3 = res6.createMessageComponentCollector({ componentType: ComponentType.ChannelSelect, filter: i => i.user.id === interaction.user.id, time: timeout })


                                        col3.on("collect", async (leaderboardChannel: ChannelSelectMenuInteraction) => {
                                            leaderboardChannel.deferUpdate()
                                            const realChannel: TextChannel = interaction.guild.channels.cache.get(leaderboardChannel.values[0]) as TextChannel
                                            if (!realChannel) {
                                                interaction.editReply({ components: [buildLeaderboardChannelSelectContainer(null, true, false).buildContainer()] })
                                                return;
                                            }
                                            if (!realChannel.isSendable() || !realChannel.isTextBased()) {
                                                interaction.editReply({ components: [buildLeaderboardChannelSelectContainer(null, true, false).buildContainer()] })
                                                return;
                                            }

                                            const res7 = await interaction.editReply({ components: [buildLeaderboardChannelSelectContainer(realChannel, false, true).buildContainer()] })
                                            res7.awaitMessageComponent({ componentType: ComponentType.Button, filter: i => i.customId.includes("confirm-channel") && i.user.id === waiter.user.id, time: timeout }).then(async (confirmed: ButtonInteraction) => {
                                                col3.stop(`channel-${realChannel.id}`)
                                            }).catch(e => {
                                                interaction.editReply({ components: [errorEmbed(`This interaction has expired`).buildContainer()] })

                                            })


                                        })
                                        col3.once("end", async (final, destination) => {
                                            if (destination === "time") {
                                                interaction.editReply({ components: [errorEmbed(`This interaction has expired`).buildContainer()] })
                                                return;
                                            }
                                            if (destination.includes("channel-")) {
                                                let channelId = destination.split("channel-")[1]
                                                const realChannel: TextChannel | ThreadChannel = interaction.guild.channels.cache.get(channelId) as TextChannel | ThreadChannel
                                                if (!realChannel || !realChannel.isSendable()) {
                                                    interaction.editReply({ components: [errorEmbed(`This interaction is invalid. Please try again.`).buildContainer()] })

                                                    return;
                                                }

                                                try {
                                                    const set3 = teamManager.setChannelConfigKey("leaderboard", channelId)
                                                    if (!set3) {
                                                        interaction.editReply({ components: [errorEmbed(`This interaction is invalid. Please try again.`).buildContainer()] })

                                                        return;
                                                    }

                                                    interaction.followUp({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [genericEmbedBuilder(`The Leaderboard channel has been set to <#${realChannel.id}> (${realChannel.id})`).buildContainer()] })

                                                    let hostRole = interaction.guild.roles.cache.get(teamManager.getConfigValue("roles.host"))
                                                    let panelChannel = interaction.guild.channels.cache.get(teamManager.getConfigValue("channels.panel"))
                                                    let leaderboardChannel = interaction.guild.channels.cache.get(teamManager.getConfigValue("channels.leaderboard"))

                                                    const finalCon = new TMComponentBuilder().setAccentColor(Colors.Green)
                                                    finalCon.addTextDisplay(`## Bot Setup - Setup Complete`)
                                                    finalCon.addSeparator()
                                                    finalCon.addTextDisplay(`### You've completed the setup wizard!\nHere's a recap:\n> - **Leaderboard Channel:** <#${leaderboardChannel.id}>\n> - **Points Panel Channel:** <#${panelChannel.id}>\n> - **Event Host Role:** @${hostRole.name}`)

                                                    try {
                                                        teamManager.toggleSetup();
                                                        (panelChannel as TextChannel).send({ flags: [MessageFlags.IsComponentsV2], components: [panelManager.getPanel().buildContainer()] }).then(m => { teamManager.setMessageConfigKey("panel", m.id) })
                                                        finalCon.addTextDisplay(`### The points panel has been automatically sent to <#${panelChannel.id}>`)
                                                    } catch (e) {
                                                        interaction.followUp({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`Failed to send the points panel. Please run the \`/host reload-panel\` command to send the panel.`).buildContainer()] })

                                                    }

                                                    interaction.editReply({ components: [finalCon.buildContainer()] })
                                                } catch (e) {
                                                    interaction.editReply({ components: [errorEmbed(`This interaction is invalid. Please try again.`).buildContainer()] })

                                                }
                                            }
                                        })




                                    } catch (e) {
                                        interaction.editReply({ components: [errorEmbed(`This interaction is invalid. Please try again.`).buildContainer()] })

                                    }
                                }
                            })

                        }

                    } catch (e) {
                        console.log(e)
                        interaction.editReply({ components: [errorEmbed(`This interaction is invalid. Please try again.`).buildContainer()] })
                    }
                }
            })

        }).catch(e => {
            interaction.editReply({ components: [errorEmbed(`This interaction has expired`).buildContainer()] })
        })
    }
}

export default SetupCommand;