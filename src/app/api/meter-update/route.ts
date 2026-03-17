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
      return NextResponse.json({ error: 'Eksik veri' }, { status: 400 });
    }

    const finalValue = (parseFloat(currentReading) + parseFloat(addedValue)).toFixed(3);

    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ 
            success: true, 
            data: { 
                originalReading: parseFloat(currentReading),
                added: parseFloat(addedValue),
                finalReading: parseFloat(finalValue),
                aiMessage: "Demo Modu: AI Analizi yapılmadı (API Anahtarı eksik).",
                coordinates: { top: 48, left: 45, width: 38, height: 8 },
                design: { integers: 5, decimals: 3, spacing: 0.15 },
                renderStyle: { 
                    black: '#131314', 
                    red: '#911212', 
                    ink: '#dadada', 
                    blur: 0.4, 
                    noise: 0.2, 
                    reflection: 0.3,
                    skew: 0 
                },
                v3Engine: 'MCE Ultra-Reality V3.5 (Demo)'
            } 
        });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const imageData = await file.arrayBuffer();
    const base64Image = Buffer.from(imageData).toString('base64');

    const prompt = `
      Bu bir sayaç fotoğrafıdır. Fotoğraftaki rakamların görüntüsünü "piksel düzeyinde" analiz et.
      
      HEDEF: Orijinal rakamların yerine geçecek YENİ rakamların (${finalValue.replace('.', ',')}) 
      fotoğrafın bir parçası gibi görünmesini sağlamak için teknik veriler üretmek.
      
      ANALİZ KRİTERLERİ:
      1. coordinates: Rakamların (hem siyah hem kırmızı kısım toplamı) tam kapsama alanı (top%, left%, width%, height%).
      2. meterDesign: 
         - integerDigitsCount: Siyah kısımdaki toplam hane sayısı.
         - decimalDigitsCount: Kırmızı kısımdaki toplam hane sayısı.
         - spacing: Rakamlar arasındaki mekanik boşluk seviyesi (0-1 arası).
      3. colorProfile:
         - weatheredBlackHex: Güneşten solmuş siyah tambur rengi (Örn: #1a1a1b).
         - fadedRedHex: Solmuş kırmızı tambur rengi (Örn: #911212).
         - digitInkColor: Rakamların tam rengi (Saf beyaz değildir, genelde krem rengine yakındır).
      4. optics:
         - focalBlur: Fotoğrafın o bölgesindeki netlik bozulması (0.0 - 2.0 pixel).
         - reflectionIntensity: Camın üzerindeki parlamanın gücü (0.0 - 1.0).
         - noisePattern: ISO kumlanma yoğunluğu.
      
      YANIT FORMATI (JSON):
      {
        "coordinates": { "top": number, "left": number, "width": number, "height": number },
        "design": { "integers": number, "decimals": number, "spacing": number },
        "style": { 
          "black": string, 
          "red": string, 
          "ink": string, 
          "blur": number, 
          "noise": number, 
          "reflection": number,
          "skew": number
        },
        "ai_note": "Analiz detayı"
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

    if (!aiData) throw new Error("AI Analiz yapılamadı.");

    // Koordinat Normalizasyonu
    const normalize = (val: number) => val > 100 ? val / 10 : val;
    const coords = {
      top: normalize(aiData.coordinates.top),
      left: normalize(aiData.coordinates.left),
      width: normalize(aiData.coordinates.width),
      height: normalize(aiData.coordinates.height)
    };

    return NextResponse.json({
      success: true,
      data: {
        originalReading: parseFloat(currentReading),
        added: parseFloat(addedValue),
        finalReading: parseFloat(finalValue),
        aiMessage: aiData.ai_note,
        coordinates: coords,
        design: aiData.design,
        renderStyle: aiData.style,
        v3Engine: 'MCE Pixel Perfect V3.4'
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: "API Hatası" }, { status: 500 });
  }
}
