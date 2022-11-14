import {writeFile} from "fs/promises";
import "dotenv/config"
import {SaleModel} from "../../models/SaleModel";
import {connectMongo} from "../util/database";
import {fetchItemData} from "../util/xivapi";
import {Cache} from "../../@types/Cache";

const FILE_NAME = "./cache/db.json";

export const pullData = async () => {
    await connectMongo();

    // get docs for the last week
    const check = (Date.now() - 604800000) / 1000;
    let sales = await SaleModel.find({timestamp: {$gte: check}});
    console.info(`Loaded ${sales.length} documents.`)

    const totalQuantity = {};
    const totalSales = {};
    const totalPrice = {};

    for (const {item, quantity, total, timestamp} of sales) {
        totalQuantity[item] = (totalQuantity[item] ?? 0) + quantity;
        totalSales[item] = (totalSales[item] ?? 0) + 1;
        totalPrice[item] = (totalPrice[item] ?? 0) + total;
    }

    const cache: Cache = {
        totalQuantity,
        totalSales,
        totalPrice,
    }

    await writeFile(FILE_NAME, JSON.stringify(cache), 'utf8');

    console.info("Finished")

}

(async () => {

    let itemData = await fetchItemData();
    let response = await pullData();

    console.info()
})();