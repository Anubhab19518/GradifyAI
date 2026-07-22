require("dotenv").config();

const connectDB = async () => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn("Supabase is not fully configured yet. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
        return;
    }

    console.log("Supabase configuration loaded.");
};

module.exports = connectDB;
