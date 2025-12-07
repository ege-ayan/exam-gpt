import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      sessionId,
      conversationHistory = [],
    } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    const fileSearchStoreId = process.env.ECON_FILE_SEARCH_STORE_ID!;

    const chatSession = ai.chats.create({
      model: "gemini-2.5-flash", // Faster and more cost-effective for educational content
      config: {
        systemInstruction:
          "SEN SADECE SAĞLANAN BELGELERDEKİ BİLGİLERE DAYALI OLARAK YANIT VEREBİLİRSİN. Hiçbir harici bilgi, genel bilgi veya kendi eğitimin kullanma. Sadece yüklenen ekonomi ders materyallerindeki bilgileri kullanarak yanıt ver. Eğer sorulan konuda belgelerde bilgi yoksa, 'Bu konuda belgelerimde yeterli bilgi bulunmamaktadır' de. Tüm yanıtlarını Türkçe ver ve belgelerdeki orijinal bilgileri koru.",
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [fileSearchStoreId],
            },
          },
        ],
      },

      history: conversationHistory.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
    });

    const streamingResponse = await chatSession.sendMessageStream({
      message: `Önemli: Bu soruyu SADECE yüklenen ekonomi ders belgelerindeki bilgiler kullanarak yanıtla. Harici bilgi kullanma. Soru: ${message}`,
    });

    // Set up Server-Sent Events for streaming
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamingResponse) {
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (text) {
              // Send the text chunk as SSE
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }

          // Send completion signal
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
          );
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Streaming failed" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
