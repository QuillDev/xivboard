import axios from "axios";
import {writeFile, readFile} from "fs/promises";

const ITEMS_DB = "https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/master/apps/client/src/assets/data/items.json";
const ITEM_DB_CACHE_PATH = "./cache/items.json";

export const fetchItemData = async () => {
    // download items.json
    const rawDB = await axios.get(ITEMS_DB);
    if (rawDB.data) {
        await writeFile(ITEM_DB_CACHE_PATH, JSON.stringify(rawDB.data), {encoding: 'utf-8'});
    }

    return JSON.parse(await readFile(ITEM_DB_CACHE_PATH, "utf-8"));
}