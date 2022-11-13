import {Cache} from "../../@types/Cache";
import {readFile} from "fs/promises";
import {fetchItemData} from "../util/xivapi";

let items;
const toSortedMap = (obj: any, mapper: (input: any, key: string) => number): Map<string, number> => {
    const map = new Map<string, number>();


    Object.keys(obj).forEach(key => {
        map.set(key, mapper(obj, key))
    });

    return new Map([...map.entries()].sort(([aKey, aVal], [bKey, bVal]) => aVal - bVal));
}

const mapToItemName = <V>(map: Map<string, V>): Map<string, V> => {
    const itemMap = new Map<string, V>();
    for (const [key, val] of map.entries()) {
        itemMap.set(items[key]?.en ?? key, val);
    }

    return itemMap;
}

(async () => {
    items = await fetchItemData();
    const {totalQuantity, totalSales, totalPrice}: Cache = JSON.parse(await readFile("./cache/db.json", 'utf-8'));

    let totalQuantityMap = toSortedMap(totalQuantity, (obj, key) => obj[key] as number);
    let totalSalesMap = toSortedMap(totalSales, (obj, key) => obj[key] as number);
    let totalPriceMap = toSortedMap(totalPrice, (obj, key) => obj[key] as number);

    console.info(mapToItemName(totalPriceMap));
})();