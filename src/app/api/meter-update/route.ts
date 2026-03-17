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
                aiMessage: "Gemini API anahtarı ayarlanmamış. Rakamlar varsayılan konuma yerleştirildi.",
                coordinates: { top: 40, left: 30, width: 40, height: 20 } // Varsayılan demo koordinatları
            }
        });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imageData = await file.arrayBuffer();
    const base64Image = Buffer.from(imageData).toString('base64');

    const prompt = `
      Bu bir sayaç fotoğrafıdır. Fotoğrafı bir görsel düzenleme uzmanı gibi analiz et.
      
      GÖREVİN:
      1. Fotoğraftaki ana sayaç numarasının (tamburların) bulunduğu alanı tespit et.
      2. Bu alanın fotoğrafın bütününe göre koordinatlarını (yüzde cinsinden: top, left, width, height) belirle.
      3. Rakamların font stilini (serifik, sans-serif, dijital), rengini ve oradaki ışık yoğunluğunu (parlaklık) analiz et.
      4. Yeni değer şudur: ${(parseFloat(currentReading) + parseFloat(addedValue)).toFixed(3)}
      
      YANITINI KESİNLİKLE ŞU JSON FORMATINDA VER:
      {
        "coordinates": { "top": number, "left": number, "width": number, "height": number },
        "style": { "font": string, "color": string, "brightness": number },
        "verified": boolean,
        "ai_comment": string,
        "total": number
      }
      
      Not: Koordinatlar 0-100 arası (yüzde) tam değerler olmalıdır. ai_comment kısmında fotoğrafın orijinalliği hakkında kısa bilgi ver.
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

    if (!aiData) throw new Error("AI koordinat verisi üretemedi.");

    return NextResponse.json({
      success: true,
      data: {
        originalReading: parseFloat(currentReading),
        added: parseFloat(addedValue),
        finalReading: aiData.total || (parseFloat(currentReading) + parseFloat(addedValue)),
        status: aiData.verified ? 'AI Akıllı Koordinat Tespiti' : 'Görsel Analiz Başarılı',
        aiMessage: aiData.ai_comment,
        coordinates: aiData.coordinates,
        renderStyle: aiData.style,
        v2Engine: 'Gemini 1.5 Vision Engine'
      }
    });

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: "Gemini API Hatası: " + error.message }, { status: 500 });
  }
}
