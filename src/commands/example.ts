import { ChatInputCommandInteraction } from "discord.js";
import { Command } from "../classes/Command";

const ExampleCommand: Command = {
    enabled: false,
    name: "example",
    description: "Example Command!",
    run: async (interaction: ChatInputCommandInteraction) => {
        interaction.reply("Hello World!")
    }
}

export default ExampleCommand;