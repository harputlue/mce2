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
        return NextResponse.json({
            success: true,
            data: {
                originalReading: parseFloat(currentReading),
                added: parseFloat(addedValue),
                finalReading: parseFloat(currentReading) + parseFloat(addedValue),
                status: "Demo Modu (API Key Eksik)",
                aiMessage: "Gemini API anahtarı ayarlanmamış. Varsayılan yerleşim kullanılıyor.",
                coordinates: { top: 40, left: 50, width: 40, height: 10 },
                renderStyle: { color: '#ffffff', brightness: 1, skew: 0, bgTone: 'black' }
            }
        });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imageData = await file.arrayBuffer();
    const base64Image = Buffer.from(imageData).toString('base64');

    const prompt = `
      Bu bir sayaç fotoğrafıdır. Fotoğrafı bir "Dijital Görüntü İşleme Uzmanı" gibi analiz et.
      
      GÖREVİN:
      1. Rakamların (tamburların) tam olarak bulunduğu kutunun koordinatlarını belirle.
      2. Rakamların üzerine binen yeni metnin "gerçekçi" görünmesi için şu verileri JSON olarak ver:
         - coordinates: { top: %, left: %, width: %, height: % } (Kutunun tam konumu)
         - style: 
             - color: Rakamların rengi (hex koduna yakın tahmin)
             - brightness: Ortam ışığına göre parlaklık (0.5 - 1.5)
             - skew: Fotoğrafın perspektifine göre eğim açısı (derece)
             - bgTone: Rakamların arkasındaki tambur zemini rengi (black/gray/white)
             - blur: Fotoğrafın netliğine göre uygulanacak bulanıklık (pixel cinsinden 0-2)
         - ai_comment: Fotoğrafın dokusu hakkında teknik bilgi.
      
      YENİ DEĞER: ${(parseFloat(currentReading) + parseFloat(addedValue)).toFixed(3)}
      
      YANIT FORMATI:
      {
        "coordinates": { "top": number, "left": number, "width": number, "height": number },
        "style": { "color": string, "brightness": number, "skew": number, "bgTone": string, "blur": number },
        "verified": true,
        "ai_comment": string,
        "total": number
      }
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
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const aiData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!aiData) throw new Error("AI görsel analiz verisi oluşturamadı.");

    return NextResponse.json({
      success: true,
      data: {
        originalReading: parseFloat(currentReading),
        added: parseFloat(addedValue),
        finalReading: aiData.total || (parseFloat(currentReading) + parseFloat(addedValue)),
        aiMessage: aiData.ai_comment,
        coordinates: aiData.coordinates,
        renderStyle: aiData.style,
        v2Engine: 'Gemini 1.5 Pro Rendering Assistant'
      }
    });

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: "Gemini API Hatası: " + error.message }, { status: 500 });
  }
}
