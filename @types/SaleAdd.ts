export type WSEvent = {
    event: string;
};

export type SaleAdd = WSEvent & {
    item: number;
    world: number;
    sales: BasicSale[]
};

export type BasicSale = {
    hq: boolean;
    pricePerUnit: number;
    quantity: number;
    timestamp: number;
    onMannequin: boolean;
    worldName?: string;
    worldID?: string;
    buyerName: string;
    total: number;
};
export type Sale = BasicSale & {
    item: number;
    world: number;
};