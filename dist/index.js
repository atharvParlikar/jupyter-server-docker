import express from 'express';
import { JupyterManager } from './kernal.js';
import * as path from "path";
import * as fs from "fs";
import { Storage } from "@google-cloud/storage";
const storage = new Storage();
const app = express();
const PORT = 8000;
const jupManager = new JupyterManager();
app.use(express.json());
app.post("/execute", async (req, res) => {
    const { code } = req.body;
    if (!jupManager.isKernelStarted()) {
        await jupManager.startKernel();
    }
    console.log(`running code: ${code}`);
    const result = await jupManager.runCode(code);
    console.log(`result: ${result}`);
    res.json({
        result
    });
});
app.get('/upload/:fileName', async (req, res) => {
    const { fileName } = req.params;
    try {
        const absPath = path.resolve("../jup/" + fileName);
        if (!fs.existsSync(absPath)) {
            console.log(`[TOOL RESULT] uploadToGCS: File not found`);
            throw new Error(`File not found: ${absPath}`);
        }
        const destination = path.basename(absPath);
        console.log(`[TOOL INFO] Uploading to bucket "assets" as "${destination}"...`);
        const [file] = await storage.bucket("agent-generated-assets").upload(absPath, {
            destination,
            resumable: false,
        });
        // Make it public
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/agent-generated-assets/${destination}`;
        console.log(`[TOOL RESULT] uploadToGCS: Success - ${publicUrl}`);
        res.json({ publicUrl });
    }
    catch (err) {
        console.log(`[TOOL RESULT] uploadToGCS: Error - ${err.message}`);
        res.status(500).json({ error: `Upload failed: ${err.message}` });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
