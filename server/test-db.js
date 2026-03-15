import mongoose from 'mongoose';
import 'dotenv/config';

const testConnection = async () => {
    try {
        console.log('Testing connection to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ Success!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    }
};

testConnection();
