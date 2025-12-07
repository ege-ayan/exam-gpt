import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

async function createFileSearchStore() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_API_KEY or GEMINI_API_KEY environment variable is required"
    );
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
  });

  const storeName = `exam-gpt-store-${Date.now()}`;

  console.log("Creating file search store...");

  const fileSearchStore = await ai.fileSearchStores.create({
    config: { displayName: storeName },
  });

  console.log(`File search store created: ${fileSearchStore.name}`);

  const docsPath = path.join(__dirname, "docs");
  const files = fs.readdirSync(docsPath);

  console.log(`Found ${files.length} files to upload`);

  for (const file of files) {
    const filePath = path.resolve(docsPath, file);
    const rawDisplayName = path.parse(file).name;
    const displayName = rawDisplayName.replace(/[^\x00-\x7F]/g, "_");

    console.log(`Uploading ${file}...`);

    const uploadedFile = await ai.files.upload({
      file: filePath,
      config: { name: displayName },
    });

    let operation = await ai.fileSearchStores.importFile({
      fileSearchStoreName: fileSearchStore.name!,
      fileName: uploadedFile.name!,
    });

    while (!operation.done) {
      console.log(`Waiting for ${file} import to complete...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.operations.get({ operation });
    }

    console.log(`${file} uploaded and imported successfully`);
  }

  console.log("All files uploaded successfully!");
  console.log(`File search store ID: ${fileSearchStore.name}`);

  return fileSearchStore.name;
}

if (require.main === module) {
  createFileSearchStore()
    .then((storeId) => {
      console.log(`\n🎉 File search store created successfully!`);
      console.log(`Store ID: ${storeId}`);
      console.log(`You can now use this store ID in your Gemini API calls.`);
    })
    .catch((error) => {
      console.error("Error creating file search store:", error);
      process.exit(1);
    });
}

export { createFileSearchStore };
