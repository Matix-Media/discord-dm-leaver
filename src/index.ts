import axios from "axios";
import { exit } from "process";
import * as readline from "readline/promises";
import { WebSocket } from "ws";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const whitelist: string[] = [];
let lastSequence: number;

while (true) {
    const result = await rl.question("Add a group to whitelist (name or ID) or press RETURN to go to next step: ");
    if (result == "") break;
    whitelist.push(result);
}

const token = await rl.question("Specify your Discord token: ");
rl.close();

console.log("Connecting to Discord...");
const ws = new WebSocket("wss://gateway.discord.gg/?v=6&encoding=json");
ws.on("open", () => {
    //console.log("Connected");
});

const eventHandlers: { [key: string]: (message: unknown) => void | Promise<void> } = {
    READY: async (message: any) => {
        const privateChannels: {
            id: string;
            name?: string;
            type?: number;
            recipients: { username: string; id: string }[];
        }[] = message.d.private_channels;
        //console.log(privateChannels);

        for (const channel of privateChannels) {
            if (whitelist.includes(channel.id) || (channel.name && whitelist.includes(channel.name))) continue;
            if (channel.type && channel.type == 1 && whitelist.includes(channel.recipients[0].id)) continue;

            if (channel.type && channel.type == 3)
                //console.log(channel);
                console.log(`Leaving group ${channel.id}` + (channel.name ? ` (${channel.name})...` : "..."));
            else if (channel.type && channel.type == 1) console.log(`Closing DMs ${channel.id} (${channel.recipients[0].username})...`);
            const response = await axios.delete("https://discord.com/api/v9/channels/" + channel.id + "?silent=false", {
                headers: { authorization: token },
            });
            if (response.headers["x-ratelimit-reset-after"]) {
                await new Promise((resolve) => setTimeout(resolve, Number.parseInt(response.headers["x-ratelimit-reset-after"]) * 1000));
            }
        }
        console.log("Closed all DMs");
        ws.close();
        exit(0);
    },
};

const opHandlers: { [key: number]: (message: unknown) => void | Promise<void> } = {
    0: (message: { t?: string }) => {
        if (!message.t) return;
        //console.log("Message event:", message.t);
        if (!eventHandlers[message.t]) return;
        eventHandlers[message.t](message);
    },
    10: (message: { d: { heartbeat_interval: number } }) => {
        const heartbeatInterval = message.d.heartbeat_interval;
        //console.log("Heartbeat interval:", heartbeatInterval);

        setInterval(() => {
            ws.send(
                JSON.stringify({
                    op: 1,
                    d: lastSequence,
                }),
            );
        }, heartbeatInterval);

        ws.send(
            JSON.stringify({
                op: 2,
                d: {
                    token: token,
                    intents: 513,
                    properties: {
                        $os: "windows",
                        $browser: "chrome",
                        $device: "pc",
                    },
                },
            }),
        );
    },
};

ws.on("message", (data, isBinary) => {
    if (isBinary) return;
    const message = JSON.parse(data.toString());
    //console.log(message);

    if (message.s) {
        lastSequence = message.s;
    }

    if (message.op == undefined) return;
    const op = message.op;
    //console.log("Message OP:", op);
    if (!opHandlers[op]) return;
    opHandlers[op](message);
});
