const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY?.trim();

if (!SUPABASE_URL) {
    throw new Error(
        "Missing SUPABASE_URL environment variable. Set it in backend/.env."
    );
}

if (!SUPABASE_SECRET_KEY) {
    throw new Error(
        "Missing SUPABASE_SECRET_KEY environment variable. Set it in backend/.env."
    );
}

if (!/^https?:\/\//i.test(SUPABASE_URL)) {
    throw new Error(
        "Invalid SUPABASE_URL. It must start with http:// or https://"
    );
}

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    }
);

module.exports = supabase;