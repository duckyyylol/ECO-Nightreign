import { ApplicationCommandOptionType, Attachment, AttachmentBuilder, AutocompleteInteraction, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Colors, ComponentType, MessageFlags, SeparatorSpacingSize, TimestampStyles, Utils } from "discord.js";
import { Command } from "../classes/Command";
import { join } from "path";
import { TMComponentBuilder } from "../classes/ComponentBuilder";
import { addTime, attachmentUrl, errorEmbed, formatTimestamp, genericEmbedBuilder, timestampInFuture } from "../util/util";
import { generateCustomId, parseCustomId } from "../util/customIdUtils";
import { TeamManager } from "../classes/TeamManager";
import { teamManager } from "..";

export interface Skin {
    id: string;
    for: string; // nightfarer id
    image: string;
    name: string;
    default: boolean;
}
export interface Nightfarer {
    id: string;
    name: string;
    skins: Skin[]
}

export interface LazyNightfarer {
    id: string;
    skinId: string;
}

const mediaPath = join(process.cwd(), "data", "media", "nightfarers")

export const nightfarers: Nightfarer[] = [
    {
        id: "wylder",
        name: "Wylder",
        skins: [
            {
                id: "default",
                for: "wylder",
                default: true,
                image: join(mediaPath, `wylder`, 'default.png'),
                name: "Default"
            },
            {
                id: "dawn",
                for: "wylder",
                default: false,
                image: join(mediaPath, `wylder`, 'dawn.png'),
                name: "Dawn"
            },
            {
                id: "darkness",
                for: "wylder",
                default: false,
                image: join(mediaPath, `wylder`, 'darkness.png'),
                name: "Darkness"
            },
            {
                id: "rememberance",
                for: "wylder",
                default: false,
                image: join(mediaPath, `wylder`, 'rememberance.png'),
                name: "Rememberance"
            },
            {
                id: "abysswalker",
                for: "wylder",
                default: false,
                image: join(mediaPath, `wylder`, 'abysswalker.png'),
                name: "Abysswalker"
            },
            {
                id: "lion-knight",
                for: "wylder",
                default: false,
                image: join(mediaPath, `wylder`, 'lionknight.png'),
                name: "Lion Knight"
            }
        ]
    },
    {
        id: "guardian",
        name: "Guardian",
        skins: [
            {
                id: "default",
                for: "guardian",
                default: true,
                image: join(mediaPath, `guardian`, 'default.png'),
                name: "Default"
            },
            {
                id: "dawn",
                for: "guardian",
                default: false,
                image: join(mediaPath, `guardian`, 'dawn.png'),
                name: "Dawn"
            },
            {
                id: "darkness",
                for: "guardian",
                default: false,
                image: join(mediaPath, `guardian`, 'darkness.png'),
                name: "Darkness"
            },
            {
                id: "rememberance",
                for: "guardian",
                default: false,
                image: join(mediaPath, `guardian`, 'rememberance.png'),
                name: "Rememberance"
            },
            {
                id: "sunlight-knight",
                for: "guardian",
                default: false,
                image: join(mediaPath, `guardian`, 'sunlightknight.png'),
                name: "Sunlight Knight"
            },
            {
                id: "wayfarer",
                for: "guardian",
                default: false,
                image: join(mediaPath, `guardian`, 'wayfarer.png'),
                name: "Wayfarer"
            }
        ]
    },
    {
        id: "ironeye",
        name: "Ironeye",
        skins: [
            {
                id: "default",
                for: "ironeye",
                default: true,
                image: join(mediaPath, `ironeye`, 'default.png'),
                name: "Default"
            },
            {
                id: "dawn",
                for: "ironeye",
                default: false,
                image: join(mediaPath, `ironeye`, 'dawn.png'),
                name: "Dawn"
            },
            {
                id: "darkness",
                for: "ironeye",
                default: false,
                image: join(mediaPath, `ironeye`, 'darkness.png'),
                name: "Darkness"
            },
            {
                id: "rememberance",
                for: "ironeye",
                default: false,
                image: join(mediaPath, `ironeye`, 'rememberance.png'),
                name: "Rememberance"
            },
            {
                id: "ringfinger",
                for: "ironeye",
                default: false,
                image: join(mediaPath, `ironeye`, 'ringfinger.png'),
                name: "Ringfinger"
            },
            {
                id: "sellsword",
                for: "ironeye",
                default: false,
                image: join(mediaPath, `ironeye`, 'sellsword.png'),
                name: "Sellsword"
            }
        ]
    },
    {
        id: "duchess",
        name: "Duchess",
        skins: [
            {
                id: "default",
                for: "duchess",
                default: true,
                image: join(mediaPath, `duchess`, 'default.png'),
                name: "Default"
            },
            {
                id: "dawn",
                for: "duchess",
                default: false,
                image: join(mediaPath, `duchess`, 'dawn.png'),
                name: "Dawn"
            }
            ,
            {
                id: "darkness",
                for: "duchess",
                default: false,
                image: join(mediaPath, `duchess`, 'darkness.png'),
                name: "Darkness"
            },
            {
                id: "rememberance",
                for: "duchess",
                default: false,
                image: join(mediaPath, `duchess`, 'rememberance.png'),
                name: "Rememberance"
            },
            {
                id: "black-leather",
                for: "duchess",
                default: false,
                image: join(mediaPath, `duchess`, 'blackleather.png'),
                name: "Black Leather"
            },
            {
                id: "wraith",
                for: "duchess",
                default: false,
                image: join(mediaPath, `duchess`, 'wraith.png'),
                name: "Wraith"
            }
        ]
    },
    {
        id: "raider",
        name: "Raider",
        skins: [

            {
                id: "default",
                for: "raider",
                default: true,
                image: join(mediaPath, `raider`, 'default.png'),
                name: "Default"
            },
            {
                id: "dawn",
                for: "raider",
                default: false,
                image: join(mediaPath, `raider`, 'dawn.png'),
                name: "Dawn"
            },
            {
                id: "darkness",
                for: "raider",
                default: false,
                image: join(mediaPath, `raider`, 'darkness.png'),
                name: "Darkness"
            },
            {
                id: "rememberance",
                for: "raider",
                default: false,
                image: join(mediaPath, `raider`, 'rememberance.png'),
                name: "Rememberance"
            },
            {
                id: "rock-like",
                for: "raider",
                default: false,
                image: join(mediaPath, `raider`, 'rocklike.png'),
                name: "Rock-Like"
            },
            {
                id: "catarina",
                for: "raider",
                default: false,
                image: join(mediaPath, `raider`, 'catarina.png'),
                name: "Catarina"
            }
        ]
    },
    {
        id: "revenant",
        name: "Revenant",
        skins: [
            {
                id: "default",
                for: "revenant",
                default: true,
                image: join(mediaPath, `revenant`, 'default.png'),
                name: "Default"
            },
            {
                id: "dawn",
                for: "revenant",
                default: false,
                image: join(mediaPath, `revenant`, 'dawn.png'),
                name: "Dawn"
            },
            {
                id: "darkness",
                for: "revenant",
                default: false,
                image: join(mediaPath, `revenant`, 'darkness.png'),
                name: "Darkness"
            },
            {
                id: "rememberance",
                for: "revenant",
                default: false,
                image: join(mediaPath, `revenant`, 'rememberance.png'),
                name: "Rememberance"
            },
            {
                id: "sister",
                for: "revenant",
                default: false,
                image: join(mediaPath, `revenant`, 'sister.png'),
                name: "The Sister in the Painting"
            },
            {
                id: "dragon-school",
                for: "revenant",
                default: false,
                image: join(mediaPath, `revenant`, 'dragonschool.png'),
                name: "Dragon School"
            }
        ]
    },
    {
        id: "recluse",
        name: "Recluse",
        skins: [
            {
                id: "default",
                for: "recluse",
                default: true,
                image: join(mediaPath, `recluse`, 'default.png'),
                name: "Default"
            },
            {
                id: "dawn",
                for: "recluse",
                default: false,
                image: join(mediaPath, `recluse`, 'dawn.png'),
                name: "Dawn"
            },
            {
                id: "darkness",
                for: "recluse",
                default: false,
                image: join(mediaPath, `recluse`, 'darkness.png'),
                name: "Darkness"
            },
            {
                id: "rememberance",
                for: "recluse",
                default: false,
                image: join(mediaPath, `recluse`, 'rememberance.png'),
                name: "Rememberance"
            },
            {
                id: "heretic",
                for: "recluse",
                default: false,
                image: join(mediaPath, `recluse`, 'heretic.png'),
                name: "Heretic Sorcerer"
            },
            {
                id: "emerald",
                for: "recluse",
                default: false,
                image: join(mediaPath, `recluse`, 'emerald.png'),
                name: "Emerald Fate"
            }
        ]
    },
    {
        id: "executor",
        name: "Executor",
        skins: [
            {
                id: "default",
                for: "executor",
                default: true,
                image: join(mediaPath, `executor`, 'default.png'),
                name: "Default"
            },
            {
                id: "dawn",
                for: "executor",
                default: false,
                image: join(mediaPath, `executor`, 'dawn.png'),
                name: "Dawn"
            },
            {
                id: "darkness",
                for: "executor",
                default: false,
                image: join(mediaPath, `executor`, 'darkness.png'),
                name: "Darkness"
            },
            {
                id: "rememberance",
                for: "executor",
                default: false,
                image: join(mediaPath, `executor`, 'rememberance.png'),
                name: "Rememberance"
            },
            {
                id: "thorns",
                for: "executor",
                default: false,
                image: join(mediaPath, `executor`, 'thorns.png'),
                name: "Thorns"
            },
            {
                id: "sable-church",
                for: "executor",
                default: false,
                image: join(mediaPath, `executor`, 'sablechurch.png'),
                name: "Sable Church"
            }
        ]
    }
]

const RegisterCommand: Command = {
    enabled: true,
    name: "register",
    description: "Sign up and register for the ECO Nightreign Tournament!",
    options: [
        {
            name: "nightfarer",
            description: "Your Nightfarer",
            type: ApplicationCommandOptionType.String,
            // autocomplete: true,
            required: true,
            choices: nightfarers.map((n: Nightfarer) => ({ name: n.name, value: n.id }))
        },
        {
            name: "garb",
            description: "Which drip you rocking?",
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
        }
    ],
    autocomplete: async (interaction: AutocompleteInteraction) => {
        const opt = interaction.options.getFocused(true);

        if (opt.name === "garb") {
            const chosenNightfarer = interaction.options.getString("nightfarer")
            console.log(chosenNightfarer)
            if (!chosenNightfarer || chosenNightfarer === "") return interaction.respond([{ name: "Couldn't Load Options - Please clear the command and select a nightfarer", value: "error" }])
            if (chosenNightfarer) interaction.respond(nightfarers.find(n => n.id === chosenNightfarer).skins.map((s: Skin) => ({ name: s.name, value: s.id })))
        }
    },
    run: async (interaction: ChatInputCommandInteraction) => {
        const nightfarerId = interaction.options.getString("nightfarer", true)
        const garbId = interaction.options.getString("garb", true)

        const nightfarer: Nightfarer = nightfarers.find(n => n.id === nightfarerId)
        if (!nightfarer) return;
        const garb: Skin = nightfarer.skins.find(s => s.id === garbId)

        // interaction.reply(`${nightfarer.name} - ${garb.name}`)

        let timeoutSeconds = 30;
        let image = new AttachmentBuilder(garb.image).setName(`${garb.id}.png`)
        const confirmationCon = new TMComponentBuilder().setAccentColor(Colors.Gold);
        confirmationCon.addMediaGallery([{ media: { url: attachmentUrl(image) } }]);
        confirmationCon.addSeparator();
        confirmationCon.addTextDisplay(`-# Please confirm your selection.\n# ${nightfarer.name} (${garb.name})`);
        confirmationCon.addSeparator();
        confirmationCon.addButtonAccessorySection(`Pleased with your selection, Nightfarer? Press the fancy green button to sign up for the ~~Radahn Festival~~ Nightreign Tournament!`, ButtonStyle.Success, `Register as ${nightfarer.name}`, parseCustomId(generateCustomId(interaction, "confirm")));
        confirmationCon.addSeparator(SeparatorSpacingSize.Large, false);
        confirmationCon.addButtonAccessorySection(`Having second thoughts? Think it through and try again later.`, ButtonStyle.Danger, `Cancel Sign Up`, parseCustomId(generateCustomId(interaction, "cancel")))
        confirmationCon.addSeparator(SeparatorSpacingSize.Large, true);
        confirmationCon.addTextDisplay(`-# This interaction expires ${formatTimestamp(Math.floor(addTime(timeoutSeconds) / 1000), TimestampStyles.RelativeTime)}`)

        let response = await interaction.reply({ flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral], components: [confirmationCon.buildContainer()], files: [image], withResponse: true })
        // let valid = true;
        response.resource.message.awaitMessageComponent({ componentType: ComponentType.Button, filter: i => i.user.id === interaction.user.id, time: timeoutSeconds * 1000, }).then(async (waiter: ButtonInteraction) => {
            console.log(waiter.customId)
            if (!waiter || waiter.customId.includes("cancel")) {
                // await waiter.deferUpdate()
                interaction.editReply({ components: [errorEmbed(`Sign up cancelled.`).buildContainer()] })
                return;
            }
            if (waiter.customId.includes("confirm")) {
                // await waiter.deferUpdate()
                let r = teamManager.registerMember(waiter.user.id, { id: nightfarer.id, skinId: garb.id })
                if (!r) {
                    interaction.editReply({ components: [errorEmbed(`Something went wrong while processing your registration. Please try again.`).buildContainer()] })
                    return;
                } else {
                    interaction.editReply({ components: [genericEmbedBuilder(`## Successfully Registered`, "Success").addSeparator().addThumbnailAccessorySection(`You've registered for the ECO Nightreign Tournament!\n\n**Please DM a tournament host to confirm your team placement.**\n\nBest of luck, Nightfarer!`, attachmentUrl(image)).buildContainer()] })
                }

            }

        }).catch(e => {
            console.log(e)
            interaction.editReply({ components: [errorEmbed(`Interaction Expired. Please run </register:${interaction.commandId}> again to sign up.`).buildContainer()] })
        })



    }
}

export default RegisterCommand;