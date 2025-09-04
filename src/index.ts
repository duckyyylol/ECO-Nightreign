import { ActionRowBuilder, APISelectMenuOption, ApplicationCommandData, AttachmentBuilder, AutocompleteInteraction, BaseInteraction, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Client, Colors, ComponentType, Events, Guild, GuildMemberRoleManager, IntentsBitField, Message, MessageFlags, ModalBuilder, ModalSubmitInteraction, SeparatorSpacingSize, StringSelectMenuInteraction, TeamMember, TextInputBuilder, TextInputStyle, } from "discord.js"
import "dotenv/config"
import { readdirSync } from "fs";
import { join } from "path";
import { Command } from "./classes/Command";
import { PointDeductionValues, pointGroups, PointSource, PointValues, pointValuesSafe, Team, TeamManager, TeamRoles } from "./classes/TeamManager";
import { PanelManager } from "./classes/PanelManager";
import { appEmoji, appEmojiData, appEmojiId, attachmentUrl, chunk, errorEmbed, genericEmbedBuilder, nightfarerEmoji } from "./util/util";
import { TMComponentBuilder } from "./classes/ComponentBuilder";
import { nightfarers } from "./commands/register";
import { createCustomId, generateCustomId, parseCustomId } from "./util/customIdUtils";

// const commands = new Map<string, Function>()

const client: Client = new Client({
    intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMembers, IntentsBitField.Flags.GuildMessages]
})

let isReady = false;
export const defaultEmbedColor = 0x2b2d31;
export let teamManager: TeamManager;
export let panelManager: PanelManager;
export let guild: Guild;
// teamId, user id
export const panelSessions: Map<string, string> = new Map<string, string>();

const dataPath = join(process.cwd(), "data")
const mediaPath = join(process.cwd(), "data", "media")


const desiredExt = process.argv.includes("-dev") ? ".ts" : ".js"

const loadCommands = () => {
    console.log("Loading Commands...")
    let commands: ApplicationCommandData[] = [];
    const dir = readdirSync(join(__dirname, "commands")).filter(f => f.endsWith(desiredExt))
    dir.forEach((file, i) => {
        const cmd: Command = require(join(__dirname, "commands", file)).default;
        if (!cmd) return console.log(`Command file ${file} failed to load`)
        if (!cmd.name) return console.log(`Didn't load command file ${file} - no name`)
        if (!cmd.enabled) return console.log(`Didn't load command file ${file} - disabled`)
        if (!cmd.description) return console.log(`Didn't load command file ${file} - no description`)
        if (!cmd.run) return console.log(`Didn't load command file ${file} - no run method`)

        const commandOpts = (({ enabled, run, ...o }) => o)(cmd);

        commands.push(commandOpts);
        console.log(`Loaded command ${cmd.name} (${i + 1}/${dir.length})`)
    })
    console.log(`Refreshing Command List... (${dir.length} commands)`)
    client.application.commands.set(commands).then(() => {
        console.log(`Successfully refreshed command list`)
    }).catch(e => {
        console.log(`Failed to refresh command list`)

    })
}

client.once(Events.ClientReady, async () => {
    isReady = true;
    await client.application.emojis.fetch()
    guild = await client.guilds.fetch(process.env.GUILD_ID)
    await guild.members.fetch()
    teamManager = new TeamManager(client);
    panelManager = new PanelManager(client);
    loadCommands()
    console.log(`Logged in as ${client.user?.username}`)
})

client.on(Events.InteractionCreate, async (int: BaseInteraction) => {
    const handleSlashCommands = (interaction: ChatInputCommandInteraction) => {
        const cmd: Command = require(join(__dirname, "commands", `${interaction.commandName}${desiredExt}`)).default;
        if (!cmd || !cmd.enabled) return;
        if (cmd.run) cmd.run(interaction)
    }
    const handleAutocomplete = (interaction: AutocompleteInteraction) => {
        const cmd: Command = require(join(__dirname, "commands", `${interaction.commandName}${desiredExt}`)).default;
        if (!cmd || !cmd.enabled) return;
        if (cmd.autocomplete) cmd.autocomplete(interaction)
    }

    if (int.isChatInputCommand()) return handleSlashCommands(int as ChatInputCommandInteraction);
    if (int.isAutocomplete()) return handleAutocomplete(int as AutocompleteInteraction);

    if (int.isStringSelectMenu()) {
        if (int.customId.includes("points-select")) {
            let teamId = int.values[0];
            if (!teamId || teamId.length === 0) return int.deferUpdate();
            let t = teamManager.getTeamById(teamId);
            console.log("TEAM", t)
            let member = int.guild.members.cache.get(int.user.id);
            if (!member || !(member.roles.cache.has(teamManager.getConfigValue("roles.host")))) {
                int.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`You don't have the proper role required to use the points panel.`).buildContainer()] })
                return;
            }
            if (t == null) {
                panelManager.sendPanel();
                return;
            }
            if (panelSessions.has(teamId)) {
                int.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`This team is already being managed by <@${panelSessions.get(teamId)}>`).buildContainer()] })
                return;
            }
            let p = [...panelSessions.values()]
            if (p.includes(int.user.id)) {
                int.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`You are already managing a team`).buildContainer()] })
                return;
            }
            panelSessions.set(teamId, int.user.id);
            // int.reply({ flags: [MessageFlags.Ephemeral], content: "Hello! Managing: " + team.name })
            let files = [];
            function buildTeamInfoContainer(team: Team): TMComponentBuilder {
                const manageCon = new TMComponentBuilder().setAccentColor(defaultEmbedColor);
                manageCon.addTextDisplay(`-# Managing Team\n## \`⭐ ${team.metadata.points}pt${team.metadata.points === 1 ? "" : "s"}\` \`👥 ${team.members.length}\` ${team.name}\n-# Rune bonuses are calculated at the end of the event.\n\n- ${appEmoji(int.client, "runes")} \`${team.metadata.runes_avg.toLocaleString()} Avg. Runes\`\n- ${appEmoji(int.client, "loss")} \`${team.metadata.losses} Expedition${team.metadata.losses === 1 ? "" : "s"} Lost\``)
                // manageCon.addSeparator();
                manageCon.addSeparator(SeparatorSpacingSize.Small)

                team.members.forEach(m => {
                    let member = guild.members.cache.get(m.id);
                    let a = new AttachmentBuilder(nightfarers.find(n => n.id === m.nightfarerLazy.id).skins.find(s => s.id === m.nightfarerLazy.skinId).image).setName(`${m.id}.png`)
                    manageCon.addThumbnailAccessorySection(`## ${m.role === TeamRoles.LEADER ? `${appEmoji(int.client, "flag")} ` : ""}${member.user.username}\n- ${appEmoji(int.client, "runes")} \`${m.metadata.runes_total.toLocaleString()} Total Runes\`\n- ${appEmoji(int.client, "enemies")} \`${m.metadata.kills} Enemies Felled\`\n- ${appEmoji(int.client, "downed")} \`${m.metadata.downs} Times Knocked Down\``, attachmentUrl(a))
                    files.push(a);
                })

                return manageCon;
            }

            interface PointButtons {
                group: number;
                button: ButtonBuilder;
                label: string;
                amount: PointValues | PointDeductionValues;
                negative: boolean;
            }

            function buildPanelButtonContainer(team: Team, buttonDisabled: boolean = true): TMComponentBuilder {
                const pointButtons: PointButtons[] = [];
                pointValuesSafe.forEach((pv: PointSource, i) => {
                    let b = new ButtonBuilder().setCustomId(`pv-${pv.id}-${i}`).setStyle(pv.group === 3 ? ButtonStyle.Danger : ButtonStyle.Secondary).setEmoji({ id: appEmojiId(int.client, pv.emoji_name) }).setLabel(`${pv.display} (${pv.group === 3 ? "-" : "+"}${pv.amount})`)
                    pointButtons.push({ group: pv.group, button: b, label: pv.display, amount: pv.amount, negative: false })
                })

                const buttonPanel = new TMComponentBuilder().setAccentColor(Colors.Orange);
                // let chunked = chunk(pointButtons, 3)
                let group1 = pointButtons.filter(g => g.group === 1)
                let group2 = pointButtons.filter(g => g.group === 2)
                let group3 = pointButtons.filter(g => g.group === 3)
                let b = [];
                group1.forEach(g => {
                    b.push(g.button)
                })
                buttonPanel.addTextDisplay(`-# All changes take effect immediately.\n### ${pointGroups["1"]}`)
                buttonPanel.addButtonActionRow(b)
                // buttonPanel.addSeparator(SeparatorSpacingSize.Small, false)
                b = [];
                group2.forEach(g => {
                    b.push(g.button)
                })
                buttonPanel.addTextDisplay(`### ${pointGroups["2"]}`)
                buttonPanel.addButtonActionRow(b)
                // buttonPanel.addSeparator(SeparatorSpacingSize.Small, false)
                b = [];
                group3.forEach(g => {
                    b.push(g.button)
                })
                buttonPanel.addTextDisplay(`### ${pointGroups["3"]}`)
                buttonPanel.addButtonActionRow(b)
                // buttonPanel.addSeparator(SeparatorSpacingSize.Large, true)
                b = [];

                buttonPanel.addTextDisplay(`### 👤 Edit Player Statistics`)
                const enemiesButton = new ButtonBuilder().setCustomId("pm-enemies").setLabel("Edit Enemies Felled").setEmoji({ id: appEmojiId(int.client, "enemies") }).setStyle(ButtonStyle.Secondary)
                const runesButton = new ButtonBuilder().setCustomId("pm-runes").setLabel("Edit Rune Total").setEmoji({ id: appEmojiId(int.client, "runes") }).setStyle(ButtonStyle.Secondary)
                // const downedButton = new ButtonBuilder().setCustomId("pm-downed").setLabel("Edit Knocked Down Amount").setEmoji({ id: appEmojiId(int.client, "downed") }).setStyle(ButtonStyle.Secondary)
                buttonPanel.addButtonActionRow([enemiesButton, runesButton])
                const saveButton = new ButtonBuilder().setCustomId("panel-savechanges").setLabel("End Session").setStyle(ButtonStyle.Primary).setDisabled(buttonDisabled)
                buttonPanel.addSeparator()
                buttonPanel.addButtonActionRow([saveButton])

                return buttonPanel;

            }

            interface SaveData {
                points: number;
                negative: boolean;
            }

            // function buildSavePanel(team: Team, data: SaveData): TMComponentBuilder {
            //     const panel = new TMComponentBuilder().setAccentColor(defaultEmbedColor);
            //     panel.addTextDisplay(`### Save your Changes\n${data.negative ? "Removing" : "Adding"} ${data.points} point${data.points === 1 ? "" : "s"} ${data.negative ? "from" : "to"} ${team.name}`)
            //     panel.addButtonActionRow([saveButton])

            //     return panel;
            // }

            function buildWhoDownedPanel(team: Team): TMComponentBuilder {
                const panel = new TMComponentBuilder().setAccentColor(Colors.Yellow);
                const mems = teamManager.getTeamMemberList(team.id);
                let opts: APISelectMenuOption[] = [];
                mems.forEach(m => {
                    let member = int.guild.members.cache.get(m.id);
                    opts.push({ label: member.user.username, value: member.id })
                })

                panel.addStringSelectMenu(parseCustomId(createCustomId({ action: "whodowned", interactionId: int.id })), "Please choose the player that went down.", opts);

                return panel;
            }

            // function buildPlayerMetaEditor(team: Team, member?: TeamMember) {
            //     const buttonPanel = new TMComponentBuilder().setAccentColor(Colors.Orange)
            // }

            let savePanel: Message = null


            int.reply({ flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral], components: [buildTeamInfoContainer(t).buildContainer(), buildPanelButtonContainer(t).buildContainer()], files, withResponse: true }).then(async res => {
                // SAVE PANEL
                // int.followUp({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [buildSavePanel(t, save).buildContainer()] })
                // SAVE PANEL
                const save: SaveData = {
                    points: 0,
                    negative: false
                }

                const panelCollector = await res.resource.message.createMessageComponentCollector({ componentType: ComponentType.Button, filter: i => i.user.id === int.user.id, time: 99999999 })
                panelCollector.on("collect", async (button: ButtonInteraction) => {
                    // console.log(button.customId)
                    if (button.customId === "panel-savechanges") {
                        button.deferUpdate()
                        panelCollector.stop("ended");
                    }
                    if (button.customId.startsWith("pv-")) {
                        let valueId = button.customId.split("-")[1]
                        console.log("POINT VALUE", valueId)
                        const pointValue = pointValuesSafe.find(s => s.id === valueId)
                        console.log(pointValue)
                        let amount = pointValue.amount
                        if (pointValue.group === 3) amount = amount * -1
                        console.log("POINT AMOUNT", amount)
                        if (valueId === "playerdown") {
                            await button.deferReply({ flags: [MessageFlags.Ephemeral] })
                            await button.editReply({ flags: [MessageFlags.IsComponentsV2], components: [buildWhoDownedPanel(t).buildContainer()] }).then(downedPanel => {
                                downedPanel.awaitMessageComponent({ componentType: ComponentType.StringSelect, filter: i => i.user.id === button.user.id, time: 999999999 }).then(downed => {
                                    const updatedTeam = teamManager.updateMemberKnockedAmount(t.id, downed.values[0], 1)
                                    int.editReply({ components: [buildTeamInfoContainer(updatedTeam).buildContainer(), buildPanelButtonContainer(updatedTeam).buildContainer()] })
                                    button.editReply({ components: [genericEmbedBuilder(`Removed ${pointValue.amount} point${pointValue.amount === 1 ? "" : "s"} from team ${nt.name}\n\n**New Total:** ${nt.metadata.points}`).buildContainer()] })
                                }).catch(e => { })
                            }).catch(e => {
                                console.log(e)
                                int.followUp({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`Could not produce the player meta editor. Please edit knocked down amounts manually.`).buildContainer()] })
                            })
                            let nt = teamManager.removePoints(t.id, PointDeductionValues.PLAYER_KNOCK)
                            int.editReply({ components: [buildTeamInfoContainer(nt).buildContainer(), buildPanelButtonContainer(nt, false).buildContainer()] })

                        } else {
                            await button.deferUpdate()
                            if (amount > 0) {
                                let nt = teamManager.addPoints(t.id, pointValue.amount as PointValues)
                                int.editReply({ components: [buildTeamInfoContainer(nt).buildContainer(), buildPanelButtonContainer(nt, false).buildContainer()] })
                                button.followUp({ flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral], components: [genericEmbedBuilder(`Added ${pointValue.amount} point${pointValue.amount === 1 ? "" : "s"} to team ${nt.name}\n\n**New Total:** ${nt.metadata.points}`).buildContainer()] })
                            }
                            if (amount < 0) {
                                let nt = teamManager.removePoints(t.id, pointValue.amount as PointDeductionValues)
                                int.editReply({ components: [buildTeamInfoContainer(nt).buildContainer(), buildPanelButtonContainer(nt, false).buildContainer()] })
                                button.followUp({ flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral], components: [genericEmbedBuilder(`Removed ${pointValue.amount} point${pointValue.amount === 1 ? "" : "s"} from team ${nt.name}\n\n**New Total:** ${nt.metadata.points}`).buildContainer()] })
                            }
                        }
                    } else if (button.customId.startsWith("pm-")) {
                        // button.deferUpdate()
                        let valueId = button.customId.split("-")[1]
                        console.log("LAUNCH PLAYER META", valueId)
                        if (valueId === "enemies") {
                            const modal = new ModalBuilder().setCustomId("enemies-updated").setTitle(`Editing: Enemies Felled`)
                            t.members.forEach(m => {
                                let row: ActionRowBuilder<TextInputBuilder> = new ActionRowBuilder<TextInputBuilder>()
                                let member = guild.members.cache.get(m.id)
                                const ti = new TextInputBuilder().setCustomId(`enemies-${m.id}`).setLabel(member.user.username).setMinLength(1).setMaxLength(5).setStyle(TextInputStyle.Short).setPlaceholder(`(current ${m.metadata.kills}) + or - number`)
                                row.addComponents([ti])
                                modal.addComponents(row);
                            })

                            await button.showModal(modal)
                            button.awaitModalSubmit({ time: 99999999 }).then(async (submitted: ModalSubmitInteraction) => {
                                let fields = submitted.fields.fields;
                                let nt;
                                fields.forEach(field => {
                                    let userId = field.customId.split("-")[1];
                                    let amount = parseInt(field.value.replace(/\+/gim, "").replace(/\-/gim, ""));
                                    let negative = field.value.startsWith("-");
                                    if (negative) amount = amount * -1;
                                    nt = teamManager.updateMemberEnemiesFelledAmount(t.id, userId, amount)
                                })
                                int.editReply({ components: [buildTeamInfoContainer(nt).buildContainer(), buildPanelButtonContainer(nt, false).buildContainer()] })
                                submitted.reply({ flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral], components: [genericEmbedBuilder(`Updated player statistics`).buildContainer()] })
                            })

                        }
                        if (valueId === "runes") {
                            const modal = new ModalBuilder().setCustomId("runes-updated").setTitle(`Editing: Total Runes`)
                            t.members.forEach(m => {
                                let row: ActionRowBuilder<TextInputBuilder> = new ActionRowBuilder<TextInputBuilder>()
                                let member = guild.members.cache.get(m.id)
                                const ti = new TextInputBuilder().setCustomId(`enemies-${m.id}`).setLabel(member.user.username).setMinLength(2).setMaxLength(15).setStyle(TextInputStyle.Short).setPlaceholder(`(current ${m.metadata.runes_total}) + or - number`)
                                row.addComponents([ti])
                                modal.addComponents(row);
                            })

                            await button.showModal(modal)
                            button.awaitModalSubmit({ time: 99999999 }).then(async (submitted: ModalSubmitInteraction) => {
                                let fields = submitted.fields.fields;
                                let nt;
                                fields.forEach(field => {
                                    let userId = field.customId.split("-")[1];
                                    let amount = parseInt(field.value.replace(/\+/gim, "").replace(/\-/gim, ""));
                                    let negative = field.value.startsWith("-");
                                    if (negative) amount = amount * -1;
                                    nt = teamManager.updateMemberRunesAmount(t.id, userId, amount)
                                })
                                nt = teamManager.calculateRuneAverage(t.id)
                                int.editReply({ components: [buildTeamInfoContainer(nt).buildContainer(), buildPanelButtonContainer(nt, false).buildContainer()] })
                                submitted.reply({ flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral], components: [genericEmbedBuilder(`Updated player statistics`).buildContainer()] })
                            })
                        }
                        if (valueId === "downed") {
                            const modal = new ModalBuilder().setCustomId("downed-updated").setTitle(`Editing: Times Knocked Down`)
                            t.members.forEach(m => {
                                let row: ActionRowBuilder<TextInputBuilder> = new ActionRowBuilder<TextInputBuilder>()
                                let member = guild.members.cache.get(m.id)
                                const ti = new TextInputBuilder().setCustomId(`downed-${m.id}`).setLabel(member.user.username).setMinLength(1).setMaxLength(5).setStyle(TextInputStyle.Short).setPlaceholder(`(current ${m.metadata.downs}) + or - number`)
                                row.addComponents([ti])
                                modal.addComponents(row);
                            })

                            await button.showModal(modal)
                            button.awaitModalSubmit({ time: 99999999 }).then(async (submitted: ModalSubmitInteraction) => {
                                let fields = submitted.fields.fields;
                                let nt;
                                fields.forEach(field => {
                                    let userId = field.customId.split("-")[1];
                                    let amount = parseInt(field.value.replace(/\+/gim, "").replace(/\-/gim, ""));
                                    let negative = field.value.startsWith("-");
                                    if (negative) amount = amount * -1;
                                    nt = teamManager.updateMemberKnockedAmount(t.id, userId, amount)
                                })
                                int.editReply({ components: [buildTeamInfoContainer(nt).buildContainer(), buildPanelButtonContainer(nt, false).buildContainer()] })
                                submitted.reply({ flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral], components: [genericEmbedBuilder(`Updated player statistics`).buildContainer()] })
                            })
                        }
                    }
                })
                panelCollector.once("end", (final, destination) => {
                    let reason = destination;
                    if (reason === "ended") {
                        panelManager.sendPanel();
                        panelSessions.delete(t.id)
                        int.editReply({ flags: [MessageFlags.IsComponentsV2], components: [genericEmbedBuilder(`Successfully ended your session. You can now choose a new team to edit.`).buildContainer()], files: [] })
                    }
                })
            }).catch(e => {
                console.log("SOMETHING FAILED :( (index ln204)")
                console.log(e)
            })
        }
    }
})



client.login(process.env.DISCORD_TOKEN);