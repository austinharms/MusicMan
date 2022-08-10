import { Command } from "../command";

const ping: Command = {
    "name": "ping",
    "description": "test command",
    "run": (interaction: any) => {
        console.log(interaction);
    }
};

export default ping;