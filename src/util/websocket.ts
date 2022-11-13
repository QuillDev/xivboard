import WebSocket from "ws";

const WS_ADDRESS = "wss://universalis.app/api/ws";


export const openMarketSocket = (): WebSocket => {
    const ws = new WebSocket(WS_ADDRESS);

    ws.once('open', () => {
        console.info(`Connection Opened ${WS_ADDRESS}`);
    });

    ws.once('close', () => {
        console.info(`Connection Closed ${WS_ADDRESS}`);
    });

    return ws;
}