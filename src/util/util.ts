import { APIEmoji, ApplicationEmoji, Attachment, AttachmentBuilder, Client, Colors, formatEmoji, PartialEmoji, RGBTuple, SeparatorSpacingSize, TimestampStyles, TimestampStylesString } from "discord.js";
import { TMComponentBuilder } from "../classes/ComponentBuilder";
import { randomUUID } from "crypto";
import { LazyNightfarer } from "../commands/register";

export const attachmentUrl = (attachment: Attachment | AttachmentBuilder): string => {
    return `attachment://${attachment.name}`
}

export const formatTimestamp = (
    timestamp: number = currentTimestamp(),
    format: TimestampStylesString = "R"
): string => {
    return `<t:${timestamp}:${format}>`;
}

export const currentTimestamp = (): number => {
    let d = new Date();
    let ts = d.getTime();
    let rdTs = Math.round(ts / 1000);

    return rdTs;
}

export const addTime = (add_seconds: number): number => {
    return Date.now() + (add_seconds * 1000);
}

export const timestampInFuture = (offset_seconds: number): number => {
    return offset_seconds * 1000;
}

export const errorEmbed = (what: string): TMComponentBuilder => {
    let con: TMComponentBuilder = new TMComponentBuilder();
    // if (!builder || !con) con = new TMComponentBuilder()
    con.setAccentColor(Colors.Red)
    con.addHeadingWithSeparator(`Something Went Wrong`, 2).addTextDisplay(what)
    return con;
}

export const genericEmbedBuilder = (content: string, type?: "Success" | "Warning" | "Fail", color?: RGBTuple | number): TMComponentBuilder => {
    const con = new TMComponentBuilder().addTextDisplay(content)
    if (!type && !color) {
        con.setAccentColor(Colors.Blurple)
        return con;
    }
    if (type === "Success") con.setAccentColor(Colors.Green)
    if (type === "Warning") con.setAccentColor(Colors.Yellow)
    if (type === "Fail") con.setAccentColor(Colors.Red)
    if (color) con.setAccentColor(color)


    return con;
}

export const appEmoji = (client: Client, emojiName: string): string => {
    // console.log(emojiName.replace(/\-/gim, ""))
    // let em;
    let fetchEmoji: ApplicationEmoji = client.application.emojis.cache.find(e => e.name.toLowerCase() === emojiName.replace(/\-/gim, "").toLowerCase());
    // console.log(fetchEmoji)
    if (!fetchEmoji) return null;
    let parsedEmoji: PartialEmoji | string = fetchEmoji;
    return formatEmoji(fetchEmoji.id, fetchEmoji.animated);
}

export const appEmojiId = (client: Client, emojiName: string): string => {
    // console.log(emojiName.replace(/\-/gim, ""))
    // let em;
    let fetchEmoji: ApplicationEmoji = client.application.emojis.cache.find(e => e.name.toLowerCase() === emojiName.replace(/\-/gim, "").toLowerCase());
    // console.log(fetchEmoji)
    if (!fetchEmoji) return null;
    let parsedEmoji: PartialEmoji | string = fetchEmoji;
    return parsedEmoji.id;
}
export const appEmojiData = (client: Client, emojiName: string): PartialEmoji => {
    // console.log(emojiName.replace(/\-/gim, ""))
    // let em;
    let fetchEmoji: ApplicationEmoji = client.application.emojis.cache.find(e => e.name.toLowerCase() === emojiName.replace(/\-/gim, "").toLowerCase());
    // console.log(fetchEmoji)
    if (!fetchEmoji) return null;
    let parsedEmoji: PartialEmoji = fetchEmoji;
    return parsedEmoji;
}

export const nightfarerEmoji = (client: Client, nightfarer: LazyNightfarer): string => {
    let emojiName = `${nightfarer.id}_${nightfarer.skinId}`
    return appEmoji(client, emojiName) as string;
}

export const chunk = (arr: Array<any>, maxSize: number) => {
    let numChunks = Math.floor((arr.length - 1) / maxSize) + 1;
    let minChunkSize = Math.floor(arr.length / numChunks);
    let numSmallChunks = numChunks * (minChunkSize + 1) - arr.length;

    arr = [...arr]; // avoid muckking the input
    let arrays = [];
    for (let i = 0; i < numChunks; i++)
        if (i < numSmallChunks)
            arrays.push(arr.splice(0, minChunkSize));
        else
            arrays.push(arr.splice(0, minChunkSize + 1));

    return arrays;
};