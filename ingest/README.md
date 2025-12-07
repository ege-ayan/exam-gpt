# ExamGPT - Gemini Dosya Arama Yükleme Scripti

Bu script, Gemini File Search deposu oluşturur ve öğrencilerin öğrenme materyallerini retrieval-augmented generation (RAG) için yükler.

## Prerequisites

1. **Google AI API Key**: You need a Google AI API key with access to the Gemini API.

   - Get one from: https://aistudio.google.com/app/apikey

2. **Supported File Types**: The script supports various file formats including:
   - PDF files
   - PowerPoint presentations (.pptx)
   - And other formats listed in the [Gemini API documentation](https://ai.google.dev/gemini-api/docs/file-search#supported-file-types)

## Setup

1. **Set your API key as an environment variable:**

   ```bash
   export GOOGLE_API_KEY="your-api-key-here"
   # or
   export GEMINI_API_KEY="your-api-key-here"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Kullanım

İngest script'ini çalıştırın:

```bash
npm run ingest
```

Bu işlem:

1. Benzersiz bir isimle yeni bir file search deposu oluşturur
2. `docs/` klasöründeki tüm dosyaları yükler
3. Tüm yüklemelerin tamamlanmasını bekler
4. File search deposu ID'sini döndürür

## Çıktı

Script şu çıktıları verecektir:

- Her dosya yüklemesi için ilerleme mesajları
- Tamamlandığında file search deposu ID'si

Örnek çıktı:

```
Creating file search store...
File search store created: projects/your-project/locations/us-central1/fileSearchStores/exam-gpt-store-1234567890
Found 8 files to upload
Uploading EKONOMI-1.pptx...
Waiting for EKONOMI-1.pptx upload to complete...
EKONOMI-1.pptx uploaded successfully
...
All files uploaded successfully!
File search store ID: projects/your-project/locations/us-central1/fileSearchStores/exam-gpt-store-1234567890

🎉 File search store created successfully!
Store ID: projects/your-project/locations/us-central1/fileSearchStores/exam-gpt-store-1234567890
You can now use this store ID in your Gemini API calls.
```

## Dağıtım Notları

Bu uygulama Vercel'de sunucusuz dağıtım için optimize edilmiştir:

- **Oturum Yönetimi**: Sohbet oturumları için Zustand ve localStorage kalıcılığı kullanır
- **Sunucusuz Uyumlu**: Sunucu tarafında oturum depolama yok - tüm durum istemci tarafında yönetilir
- **Akış Desteği**: Gerçek zamanlı akış yanıtları sunucusuz ortamlarda çalışır

## Using the File Search Store

Once you have the store ID, you can use it in your Gemini API calls to enable file search:

```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "Your question about the documents",
  config: {
    tools: [
      {
        fileSearch: {
          fileSearchStoreNames: ["your-store-id-here"],
        },
      },
    ],
  },
});
```

## File Search Limits

- **Maximum file size**: 100 MB per document
- **Total storage**: Based on your Google AI tier
- **Supported models**: gemini-3-pro-preview, gemini-2.5-pro, gemini-2.5-flash, etc.

For more details, see the [Gemini File Search documentation](https://ai.google.dev/gemini-api/docs/file-search).
