import axios from "axios";
import {deserialize, serialize} from "bson";
import {writeFile, readFile} from "fs/promises";
import WebSocket from "ws";
import {BasicSale, Sale, SaleAdd, WSEvent} from "./@types/SaleAdd";
import mongoose from "mongoose";
import * as dotenv from 'dotenv';
import {SaleModel} from "./models/SaleModel";

dotenv.config();

const WS_ADDRESS = "wss://universalis.app/api/ws";
const ITEMS_DB = "https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/master/apps/client/src/assets/data/items.json";
const ITEM_DB_CACHE_PATH = "./items.json";


let saleCache: BasicSale[] = [];

(async () => {
    console.info("Connecting to mongo")
    await mongoose.connect(process.env.DB_URL);
    console.info("Connected!")

    // download items.json
    const rawDB = await axios.get(ITEMS_DB);
    if (rawDB.data) {
        await writeFile(ITEM_DB_CACHE_PATH, JSON.stringify(rawDB.data), 'utf-8');
    }

    const itemData = JSON.parse(await readFile(ITEM_DB_CACHE_PATH, "utf-8"));


    // open websocket
    const ws = new WebSocket(WS_ADDRESS);

    ws.on('open', () => {
        console.info(`Connection opened for ${WS_ADDRESS}`);
        ws.send(serialize({event: "subscribe", channel: "sales/add"}));
        ws.send(serialize({event: "subscribe", channel: "sales/remove"}));
    });

    ws.on('close', () => {
        console.info(`Connection closed for ${WS_ADDRESS}`)
    });

    ws.on('message', (raw) => {

        const data = deserialize(raw as ArrayBuffer | Buffer | ArrayBufferView) as WSEvent;
        switch (data.event) {
            case "sales/add": {
                const {item, world, sales}: SaleAdd = data as SaleAdd;

                const itemName = itemData[`${item}`];
                let qty = 0;
                let total = 0;
                for (const basicSale of sales) {
                    const sale: Sale = {item, world, ...basicSale};
                    saleCache.push(sale);
                    qty += sale.quantity;
                    total += sale.total;
                }

                console.info(`New Sale: ${itemName.en} (id: ${item}) x${qty} for ${total}gil`)
            }
        }
    });

    setTimeout(async () => {


        const docs = saleCache.map((sale) => {
            return {
                insertOne: {
                    document: {
                        ...sale
                    }
                }
            }
        });

        await SaleModel.bulkWrite(docs);
        console.info(`Wrote ${docs.length} new documents @ ${Date.now().toString()}`);
        saleCache = [];

    }, 1000 * 60 * 10)
})();
