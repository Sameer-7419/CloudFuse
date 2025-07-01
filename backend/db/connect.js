import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        console.log('MongoDB: Already connected');
        return;
    }
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;