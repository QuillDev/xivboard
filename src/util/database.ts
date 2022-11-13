import mongoose from "mongoose";

export const connectMongo = async () => {
    console.info("Connecting to mongo")
    await mongoose.connect(process.env.DB_URL);
    console.info("Connected!")
}