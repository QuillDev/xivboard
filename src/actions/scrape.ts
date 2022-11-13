import {deserialize, serialize} from "bson";
import "dotenv/config"
import {BasicSale, Sale, SaleAdd, WSEvent} from "../../@types/SaleAdd";
import {SaleModel} from "../../models/SaleModel";
import {connectMongo} from "../util/database";
import {openMarketSocket} from "../util/websocket";
import {fetchItemData} from "../util/xivapi";


let itemData;
let saleCache: BasicSale[] = [];

const connectWebsocket = () => {


    try {
        const ws = openMarketSocket();

        ws.on('open', () => {
            ws.send(serialize({event: "subscribe", channel: "sales/add{world=74}"}));
            ws.send(serialize({event: "subscribe", channel: "sales/remove{world=74}"}));
        });

        ws.on('close', () => {
            connectWebsocket();
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
    } catch (e) {
        console.error(e);
        connectWebsocket();
    }
}

const startPushTask = () => {
    console.info("Starting Push Task")
    setTimeout(async () => {
        console.info("Posting Data to DB")
        const docs = saleCache.map((sale) => {
            return {
                insertOne: {
                    document: {
                        ...sale
                    }
                }
            }
        });

        await connectMongo();
        await SaleModel.bulkWrite(docs);
        console.info(`Wrote ${docs.length} new documents @ ${Date.now().toString()}`);
        saleCache = [];

    }, 1000 * 60 * 30)
}

(async () => {
    itemData = await fetchItemData();
    connectWebsocket();
    startPushTask();
})();