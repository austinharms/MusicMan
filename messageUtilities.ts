import { APIEmbed } from "discord.js";
import { config } from "./configuration";

export const createEmbed = (title: string, content: string, image?: string) : APIEmbed => {
    const embed: APIEmbed = {
        title,
        description: content,
        color: 1752220,
          footer: {
            text: "Music Man - " + config.version
          }
    };
    
    if (image) embed.image = { url: image };
    return embed;
};

export const createErrorEmbed = (message: string) : APIEmbed => {
    const embed: APIEmbed = {
        title: "Error",
        description: message,
        color: 15158332,
          footer: {
            text: "Music Man - " + config.version
          }
    };

    return embed;
};