import { ApplicationCommandOptionChoiceData, ApplicationCommandOptionType, AutocompleteInteraction, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Colors, ComponentType, MessageFlags, PermissionFlagsBits, TimestampStyles } from "discord.js";
import { Command } from "../classes/Command";
import { panelManager, teamManager, } from "..";
import { addTime, errorEmbed, formatTimestamp, genericEmbedBuilder } from "../util/util";
import { TMComponentBuilder } from "../classes/ComponentBuilder";
import { LazyStoredMember, Team, TeamMember, TeamRoles } from "../classes/TeamManager";
import { Nightfarer, nightfarers, Skin } from "./register";
import { createCustomId, generateCustomId } from "../util/customIdUtils";
import { Search } from "js-search";

const TeamsCommand: Command = {
    enabled: true,
    name: "teams",
    description: "Manage Teams",
    defaultMemberPermissions: [PermissionFlagsBits.ModerateMembers],
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "create",
            description: "Create a new team",
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "leader",
                    description: "The team leader",
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: "team-name",
                    description: "The team's name!",
                    max_length: 40,
                    required: true
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "delete",
            description: "[DANGER] Delete a team",
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "team",
                    description: "The team to delete (search to find a team)",
                    required: true,
                    autocomplete: true
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "edit-name",
            description: "Change a team's name",
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "team",
                    description: "The team to receive a new name (search to find a team)",
                    required: true,
                    autocomplete: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    max_length: 40,
                    name: "new-name",
                    description: "The new name of the team",
                    required: true
                },
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "add-member",
            description: "Add someone to a team",
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "member",
                    description: "The member to add to a team",
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: "team",
                    description: "The team to add this member to (search to find a team)",
                    required: true,
                    autocomplete: true
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "remove-member",
            description: "Remove someone from their team",
            options: [
                {
                    type: ApplicationCommandOptionType.User,
                    name: "member",
                    description: "The member to remove from their team",
                    required: true
                }
            ]
        }
    ],
    autocomplete: async (interaction: AutocompleteInteraction) => {
        console.log(interaction.options.getFocused())
        if (interaction.options.getFocused(true).name === "team") {
            let teamList = teamManager.getTeamList();
            let MAX_OPTIONS = 6;
            const search = new Search("name");
            search.addIndex("name")

            let mems: ApplicationCommandOptionChoiceData[] = [];
            teamList.forEach(t => {
                search.addDocument(t);
                if (mems.length < MAX_OPTIONS) {
                    mems.push({ name: t.name, value: t.id })
                }
            })

            const query = interaction.options.getFocused(true).value.trim();
            if (query.length > 0) {
                mems = [];
                for (let v of search.search(query)) {
                    if (mems.length >= MAX_OPTIONS) break;
                    let r = v as Team;
                    mems.push({ name: r.name, value: r.id })
                }
                // interaction.respond(mems)
                // return;
            } else {
                mems = [];
                teamList.forEach(t => {
                    console.log(t)
                    if (mems.length < MAX_OPTIONS) {
                        mems.push({ name: t.name, value: t.id })
                    }
                })
                // return;
            }
            interaction.respond(mems)
            // interaction.respond(teamList.map(t => ({ name: t.name, value: t.id })))
        }
    },
    run: async (interaction: ChatInputCommandInteraction) => {
        switch (interaction.options.getSubcommand(true)) {
            case "create": {
                const leader = interaction.options.getUser("leader", true)
                const teamName = interaction.options.getString("team-name", true)

                if (!teamManager.memberIsRegistered(leader.id)) return interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`This user is not registered. Please tell them to register before creating their team.`).buildContainer()] })

                let registeredMember: LazyStoredMember = teamManager.getTeamData().registered_users[leader.id];
                if (!registeredMember) return interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`This user is not registered. Please tell them to register before creating their team.`).buildContainer()] })
                let nightfarer: Nightfarer = nightfarers.find(n => n.id === registeredMember.nightfarerLazy.id)
                let skin: Skin = nightfarer.skins.find(s => s.id === registeredMember.nightfarerLazy.skinId)
                if (!nightfarer || !skin) return interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`This user is not registered. Please tell them to register before creating their team.`).buildContainer()] })

                let timeoutSeconds = 30;

                const confirmCon = new TMComponentBuilder().setAccentColor(Colors.Yellow);
                confirmCon.addTextDisplay(`## Creating Team\nPlease confirm your selections\n\n## ${teamName}\n- 👑 ${leader.username} (${nightfarer.name} - ${skin.name})`)
                confirmCon.addSeparator()
                confirmCon.addButtonActionRow([new ButtonBuilder().setCustomId(generateCustomId(interaction, "confirm")).setLabel(`Create Team`).setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId(generateCustomId(interaction, "cancel")).setLabel(`Cancel Create Team`).setStyle(ButtonStyle.Danger)])
                confirmCon.addTextDisplay(`-# This interaction expires ${formatTimestamp(Math.floor(addTime(timeoutSeconds) / 1000), TimestampStyles.RelativeTime)}`)

                const response = await interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [confirmCon.buildContainer()], withResponse: true })
                response.resource.message.awaitMessageComponent({ componentType: ComponentType.Button, filter: i => i.user.id === interaction.user.id, time: timeoutSeconds * 1000 }).then((waiter: ButtonInteraction) => {
                    if (!waiter || waiter.customId.includes("cancel")) {

                        interaction.editReply({ components: [errorEmbed(`Interaction cancelled.`).buildContainer()] })
                        return;
                    }
                    if (waiter.customId.includes("confirm")) {
                        let r = teamManager.createTeam({ id: leader.id, role: TeamRoles.LEADER, nightfarerLazy: registeredMember.nightfarerLazy, metadata: { downs: 0, kills: 0, runes_total: 0 } }, teamName)
                        if (!r || r === null) {
                            interaction.editReply({ components: [errorEmbed(`Something went wrong while processing your request. Please try again.`).buildContainer()] })
                            return;
                        } else {
                            interaction.editReply({ components: [genericEmbedBuilder(`## Successfully Created Team (${r.name})\n-# ID ${r.id}`).buildContainer()] })
                        }
                    }
                }).catch(e => {
                    interaction.editReply({ components: [errorEmbed(`Interaction Expired. Please run </teams create:${interaction.commandId}> to try again.`).buildContainer()] })

                })

                break;
            }
            case "add-member": {
                let teamId = interaction.options.getString("team", true);
                let member = interaction.options.getUser("member", true);

                try {
                    let team = teamManager.getTeamById(teamId);
                    if (!team) {
                        interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`The chosen team was invalid.`).buildContainer()] })
                        return;
                    }
                    if (team.members.length === 3) {
                        interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`This team is already at maximum capacity (${team.members.length}/3)`).buildContainer()] })
                        return;
                    }
                    if (!teamManager.memberIsRegistered(member.id)) {
                        interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`This member has not registered for the event.`).buildContainer()] })
                        return;
                    }
                    let registeredMember: LazyStoredMember = teamManager.getTeamData().registered_users[member.id];
                    if (!registeredMember || !registeredMember?.registered) {
                        interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`This member has not registered for the event.`).buildContainer()] })
                        return;
                    }
                    let memberIsInTeam = teamManager.memberIsInTeam(member.id)
                    if (memberIsInTeam !== null) {
                        interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`This member is already in a team. (${memberIsInTeam.name})`).buildContainer()] })
                        return;
                    }
                    teamManager.addMemberToTeam(team.id, { id: registeredMember.id, metadata: { downs: 0, kills: 0, runes_total: 0 }, nightfarerLazy: registeredMember.nightfarerLazy, role: TeamRoles.MEMBER })
                    const finaleCon = new TMComponentBuilder().setAccentColor(Colors.Green);
                    finaleCon.addTextDisplay(`### Member Added to Team (${team.members.length + 1}/3 Members)\n-# Team ID: ${team.id}`)
                    interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [finaleCon.buildContainer()] })
                    await panelManager.sendPanel()
                } catch (e) {
                    interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`Something went wrong while adding this member to a team. Please try again.`).buildContainer()] })
                }

                break;
            }
            case "remove-member": {
                // let teamId = interaction.options.getString("team", true);
                let member = interaction.options.getUser("member", true);

                try {
                    let team = teamManager.memberIsInTeam(member.id)
                    if (!team) {
                        interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`The member is not in a team.`).buildContainer()] })
                        return;
                    }
                    let teamMember: TeamMember = team.members.find(m => m.id === member.id)
                    if (!teamMember) {
                        interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`The member is not in a team.`).buildContainer()] })
                        return;
                    }
                    if (teamMember.role === TeamRoles.LEADER) {
                        interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`The team leader can not be removed. Please delete the team, or change the team's leader instead.`).buildContainer()] })
                        return;
                    }
                    teamManager.removeMemberFromTeam(teamMember)
                    // teamManager.addMemberToTeam(team.id, { id: registeredMember.id, metadata: { downs: 0, kills: 0, runes_total: 0 }, nightfarerLazy: registeredMember.nightfarerLazy, role: TeamRoles.MEMBER })
                    const finaleCon = new TMComponentBuilder().setAccentColor(Colors.Green);
                    finaleCon.addTextDisplay(`### Member Removed from Team (${team.members.length - 1}/3 Members)\n-# Team ID: ${team.id}`)
                    interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [finaleCon.buildContainer()] })
                    await panelManager.sendPanel()
                } catch (e) {
                    interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`Something went wrong while removing this member from their team. Please try again.`).buildContainer()] })
                }

                break;
            }

            default:
                // what!?
                break;
        }
    }
}

export default TeamsCommand;