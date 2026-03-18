import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'Görsel yüklenmedi' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API Key eksik' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const imageData = await file.arrayBuffer();
    const base64Image = Buffer.from(imageData).toString('base64');

    const prompt = `
      Bu sayaç fotoğrafındaki ana okuma değerini (mevcut okuma) tespit et.
      Sadece sayısal değeri virgülden sonra 3 hane olacak şekilde ver. 
      Eğer tam sayıysa sonuna ,000 ekle.
      Yanıtı sadece JSON formatında şu anahtarla ver: {"detectedValue": string}
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: file.type
        }
      },
      prompt
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Robust JSON extraction (removes markdown code blocks if any)
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("OCR API Hata: AI Yanıtı JSON formatında değil ->", text);
      throw new Error("AI format hatası");
    }
    
    const aiData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ 
      success: true, 
      detectedValue: aiData.detectedValue.replace(',', '.') // Frontend number input uyumu için nokta kullanıyoruz
    });

  } catch (error: any) {
    console.error("OCR Error:", error);
    return NextResponse.json({ error: "Tarama hatası" }, { status: 500 });
  }
}
