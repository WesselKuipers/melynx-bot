import * as Discord from "discord.js"

export interface Command {
    run(client: Discord.Client, message: Discord.Message, params: string[]): void;
    config: CommandConfig;
    help: CommandHelp;
}

export interface CommandConfig {
    enabled: boolean;
    aliases: string[];
    permissionLevel: number;
    guildOnly: boolean;
    cooldown: Number;
}

export interface CommandHelp {
    name: string;
    description: string;
    usage: string;
}