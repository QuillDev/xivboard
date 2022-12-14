import {deserialize, serialize} from "bson";
import "dotenv/config"
import {BasicSale, Sale, SaleAdd, WSEvent} from "../../@types/SaleAdd";
import {SaleModel} from "../../models/SaleModel";
import {connectMongo} from "../util/database";
import {openMarketSocket} from "../util/websocket";
import {fetchItemData} from "../util/xivapi";
import * as winston from "winston";


let itemData;
let saleCache: BasicSale[] = [];

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.json(), winston.format.timestamp()),
    transports: [
        new winston.transports.File({filename: 'error.log', level: 'error'}),
        new winston.transports.File({filename: 'combined.log'}),
        new winston.transports.Console({format: winston.format.combine(winston.format.timestamp(), winston.format.simple())})
    ],
});


const connectWebsocket = () => {
    const ws = openMarketSocket();

    ws.on('open', () => {
        logger.info("Opened Websocket.");
        ws.send(serialize({event: "unsubscribe", channel: "sales/add{world=74}"}));
        ws.send(serialize({event: "subscribe", channel: "sales/add{world=74}"}));
    });

    ws.on('close', () => {
        logger.info("Closed Websocket.");
        ws.terminate();
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
                logger.info(`New Sale: ${itemName.en} (id: ${item}) x${qty} for ${total}gil`);
            }
        }
    });

    ws.on('error', (err) => {
        logger.error(err)
        ws.terminate();
        connectWebsocket();
    });
}

const startPushTask = () => {
    logger.info("Starting Push Task")
    setTimeout(async () => {
        logger.info("Posting data to DB");
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
        logger.info(`Wrote ${docs.length} new documents`)
        saleCache = [];

    }, 1000 * 60 * 3)
}

const startScraping = async () => {
    itemData = await fetchItemData();
    connectWebsocket();
    startPushTask();
}

(async () => {
    await startScraping();
})();