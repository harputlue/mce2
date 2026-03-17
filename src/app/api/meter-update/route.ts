import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const currentReading = formData.get('currentValue') as string;
    const addedValue = formData.get('addedValue') as string;
    const file = formData.get('image') as File;

    if (!file || !currentReading || !addedValue) {
      return NextResponse.json({ error: 'Eksik veri (görsel veya değerler)' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
        // Fallback for demo if key missing
        console.warn("GEMINI_API_KEY is missing, running simulation Mode.");
        return NextResponse.json({
            success: true,
            data: {
                originalReading: parseFloat(currentReading),
                added: parseFloat(addedValue),
                finalReading: parseFloat(currentReading) + parseFloat(addedValue),
                status: "Demo Modu (API Key Eksik)",
                reason: "Google Gemini API anahtarı ayarlanmamış, simülasyon yapılıyor."
            }
        });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Multi-modal data prepare
    const imageData = await file.arrayBuffer();
    const base64Image = Buffer.from(imageData).toString('base64');

    const prompt = `
      Bu bir elektrik/su/gaz sayacı fotoğrafıdır. 
      Fotoğraftaki mevcut okuma değerini kullanıcı ${currentReading} olarak girmistir.
      Mevcut değer üzerine ${addedValue} m³ eklenecektir.
      Görevin:
      1. Görseldeki sayacın okunabilirliğini kontrol et.
      2. Kullanıcının girdiği ${currentReading} değerinin fotoğrafla uyuşup uyuşmadığını doğrula.
      3. Toplam değeri hesapla: ${parseFloat(currentReading) + parseFloat(addedValue)}
      4. Yeni fotoğrafın üretimi için görselin ışık, açı ve doku özelliklerini teknik olarak analiz et.
      Yanıtını JSON formatında şu anahtarlarla ver: 
      { "verified": boolean, "ai_comment": string, "total": number }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: file.type
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Attempt to extract JSON from AI response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const aiData = jsonMatch ? JSON.parse(jsonMatch[0]) : { ai_comment: text, total: null, verified: false };

    return NextResponse.json({
      success: true,
      data: {
        originalReading: parseFloat(currentReading),
        added: parseFloat(addedValue),
        finalReading: aiData.total || (parseFloat(currentReading) + parseFloat(addedValue)),
        status: aiData.verified ? 'AI Onaylı İşlem' : 'Görsel Analiz Tamamlandı',
        aiMessage: aiData.ai_comment,
        v2Engine: 'Gemini 1.5 Flash Integrated'
      }
    });

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: "Sunucu/AI Hatası: " + error.message }, { status: 500 });
  }
}
