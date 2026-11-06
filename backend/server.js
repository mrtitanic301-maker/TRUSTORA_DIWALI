
const express = require("express");
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        error: "Too many upload attempts. Please try again later."
    }
});
const cors = require("cors");     
const { rateLimit } = require("express-rate-limit");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");
require("dotenv").config();

const app = express();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase backend environment variables missing.");
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.use(cors({
    origin: [
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "https://trustora-diwali.netlify.app"
    ]
}));

app.use(express.json());

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4"
        ];

        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG, WEBP and MP4 files allowed"));
        }
    }
});

app.get("/", (req, res) => {
    res.send("TRUSTORA Backend is running!");
});

// Upload photo or video
app.post("/api/upload/:surpriseId", uploadLimiter, upload.single("media"), async (req, res) => {
    let filePath;

    try {
        const surpriseId = req.params.surpriseId;

        if (!/^[0-9a-f-]{36}$/i.test(surpriseId)) {
            return res.status(400).json({ error: "Invalid surprise ID" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "No file selected" });
        }

        const { data: surprise, error: findError } = await supabase
            .from("surprises")
            .select("media_paths")
            .eq("public_id", surpriseId)
            .maybeSingle();

        if (findError) throw findError;

        if (!surprise) {
            return res.status(404).json({ error: "Surprise not found" });
        }

        const extensions = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
            "video/mp4": "mp4"
        };

        const extension = extensions[req.file.mimetype];
        filePath = `${surpriseId}/${randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
            .from("TRUSTORA")
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (uploadError) throw uploadError;

        const paths = [...(surprise.media_paths || []), filePath];

        const { error: updateError } = await supabase
            .from("surprises")
            .update({ media_paths: paths })
            .eq("public_id", surpriseId);

        if (updateError) {
            await supabase.storage.from("TRUSTORA").remove([filePath]);
            throw updateError;
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Upload error:", error.message);

        if (filePath) {
            await supabase.storage.from("TRUSTORA").remove([filePath]);
        }

        res.status(500).json({ error: "Upload failed. Please try again." });
    }
});

// Get temporary media links when recipient opens surprise
app.get("/api/media/:surpriseId", async (req, res) => {
    try {
        const surpriseId = req.params.surpriseId;

        if (!/^[0-9a-f-]{36}$/i.test(surpriseId)) {
            return res.status(400).json({ error: "Invalid surprise ID" });
        }

        const { data: surprise, error } = await supabase
            .from("surprises")
            .select("media_paths")
            .eq("public_id", surpriseId)
            .maybeSingle();

        if (error) throw error;

        if (!surprise) {
            return res.status(404).json({ error: "Surprise not found" });
        }

        const paths = surprise.media_paths || [];

        const media = await Promise.all(paths.map(async (path) => {
            const { data, error: signedError } = await supabase.storage
                .from("TRUSTORA")
                .createSignedUrl(path, 3600);

            if (signedError) throw signedError;

            return {
                path,
                url: data.signedUrl,
                type: path.endsWith(".mp4") ? "video" : "image"
            };
        }));

        res.json({ media });
    } catch (error) {
        console.error("Media error:", error.message);
        res.status(500).json({ error: "Could not load media." });
    }
});

app.use((err, req, res, next) => {
    res.status(400).json({
        error: err.message || "Invalid request"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`TRUSTORA server running on port ${PORT}`);
});
