import WebSocket from "ws";

const WS_ADDRESS = "wss://universalis.app/api/ws";


export const openMarketSocket = (): WebSocket => {
    const ws = new WebSocket(WS_ADDRESS);
    return ws;
}