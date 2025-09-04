import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "../classes/Command";
import { teamManager } from "..";
import { errorEmbed, genericEmbedBuilder } from "../util/util";

const UnregisterCommand: Command = {
    enabled: true,
    name: "unregister",
    description: "Unregister from the Nightreign Tournament. ",
    run: async (interaction: ChatInputCommandInteraction) => {
        if (!teamManager.memberIsRegistered(interaction.user.id)) return interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`You are not registered.`).buildContainer()] })
        let r = teamManager.unRegisterMember(interaction.user.id)

        if (!r) {
            interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [errorEmbed(`We couldn't process this request. Please try again.`).buildContainer()] })
            return;
        } else {
            interaction.reply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], components: [genericEmbedBuilder(`## Successfully Unregistered\nYou've unregistered from the ECO Nightreign Tournament`, "Success").buildContainer()] })
        }

    }
}

export default UnregisterCommand;