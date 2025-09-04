import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command } from "../classes/Command";
import { panelManager } from "..";

const ExampleCommand: Command = {
    enabled: true,
    name: "sandbox",
    description: "Example Command!",
    run: async (interaction: ChatInputCommandInteraction) => {
        let set = await panelManager.sendPanel();
        // console.log(set)
        // if (!set) return interaction.reply("Failed")
        // interaction.reply("Success!")
        interaction.deferReply({ flags: [MessageFlags.Ephemeral] })
    }

}

export default ExampleCommand;