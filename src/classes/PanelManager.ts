import { APISelectMenuOption, Client, Colors, Message, MessageFlags, PublicThreadChannel, SelectMenuComponentOptionData, SeparatorSpacingSize, TextChannel } from "discord.js";
import { TMComponentBuilder } from "./ComponentBuilder";
import { defaultEmbedColor, guild, teamManager } from "..";
import { Team, TeamMember } from "./TeamManager";
import { nightfarerEmoji } from "../util/util";
import { createCustomId, generateCustomId, parseCustomId } from "../util/customIdUtils";

export class PanelManager {
    client: Client;
    constructor(client: Client) {
        this.client = client;
    }

    panelTeamOptions(): APISelectMenuOption[] {
        return teamManager.getTeamList().sort((a, b) => b.metadata.points - a.metadata.points).map(t => ({ label: t.name, value: t.id }))
    }

    getPanel(): TMComponentBuilder {
        const panel = new TMComponentBuilder().setAccentColor(defaultEmbedColor);
        const teams = teamManager.getTeamList();

        teams.sort((a, b) => b.metadata.points - a.metadata.points).forEach((team: Team) => {
            panel.addTextDisplay(`### \`⭐ ${team.metadata.points}pt${team.metadata.points === 1 ? "" : "s"}\` \`👥 ${team.members.length}\` ${team.name}`)
            // let t = "";
            // team.members.forEach(m => {
            //     let member = guild.members.cache.get(m.id);
            //     // console.log(member)
            //     t += (`\n- ${nightfarerEmoji(this.client, m.nightfarerLazy)} ${member.user.username}`)
            // })
            // panel.addTextDisplay(t)
            panel.addSeparator(SeparatorSpacingSize.Small, false)
        })
        panel.addSeparator()
        panel.addTextDisplay(`## Points Panel\nPlease use the selector below to use the points panel.`)
        panel.addStringSelectMenu(parseCustomId(createCustomId({ action: "points-select", interactionId: Date.now().toString() })), "Select a Team", this.panelTeamOptions())
        return panel;
    }

    async getPanelMessage(): Promise<Message<true>> {
        const panelChannel: TextChannel | PublicThreadChannel = guild.channels.cache.get(teamManager.getConfigValue("channels.panel")) as TextChannel | PublicThreadChannel
        console.log("PANEL", panelChannel.id)
        await panelChannel.messages.fetch()
        const panelMessage = panelChannel.messages.cache.get(teamManager.getConfigValue("messages.panel"))
        console.log("MESSAGE", panelMessage?.content)
        if (!panelMessage) return null;

        return panelMessage;
    }

    async sendPanel(channel?: TextChannel): Promise<boolean> {
        let con = this.getPanel().buildContainer();
        let v;
        let ch = await this.getPanelMessage();
        if (!ch || ch == null) {
            if (!channel) channel = guild.channels.cache.get(teamManager.getConfigValue("channels.panel")) as TextChannel;
            if (!channel) return false;
            channel.send({ flags: [MessageFlags.IsComponentsV2], components: [con] }).then(m => {
                let s = teamManager.setMessageConfigKey("panel", m.id)
                v = s
            }).catch(e => {
                console.log(e)
                v = false;
            })

            return v;
        } else {
            if (ch.deletable) ch.delete();
            ch.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [con] }).then(m => {
                let s = teamManager.setMessageConfigKey("panel", m.id)
                v = s
            }).catch(e => {
                console.log(e)
                v = false;
            })
        }

        return v;

    }
}