import Discord from "discord.js";

export interface Settings extends Discord.ClientOptions {
    "token": string;
    "prefix": string;
    "disabledEvents": Discord.WSEventType[];
}

export default Settings;