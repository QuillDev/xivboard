import {Schema, model} from "mongoose";

const schema = new Schema({
    item: {type: Number},
    world: {type: Number},
    hq: {type: Boolean},
    pricePerUnit: {type: Number},
    quantity: {type: Number},
    timestamp: {type: Number},
    onMannequin: {type: Boolean},
    worldName: {type: String},
    worldID: {type: String},
    buyerName: {type: String},
    total: {type: Number}
});

export const SaleModel = model('SaleModel', schema);