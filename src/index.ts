import { Hono } from 'hono'
import { JupyterManager } from './kernal'
import path from "path";
import fs from "fs";
import { Storage } from "@google-cloud/storage";

const storage = new Storage();

const app = new Hono();
const PORT = 8000;

const jupManager = new JupyterManager();
await jupManager.startKernel();

app.post("/execute", async (c) => {
  const body = await c.req.json();

  const { code }: { code: string } = body;

  console.log(`running code: ${code}`);

  const result = await jupManager.runCode(code);

  console.log(`result: ${result}`);

  return c.json({
    result
  });
});

app.get('/upload/:fileName', async (c) => {
  const { fileName } = c.req.param();

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
    return c.json({ publicUrl });
  } catch (err: any) {
    console.log(`[TOOL RESULT] uploadToGCS: Error - ${err.message}`);
    c.status(500);
    return c.json({ error: `Upload failed: ${err.message}` });
  }
});

export default {
  port: PORT,
  fetch: app.fetch
};
