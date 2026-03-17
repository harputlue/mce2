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
                status: "Demo Modu",
                coordinates: { top: 50, left: 50, width: 40, height: 10 },
                renderStyle: { 
                    color: '#f0f0f0', 
                    brightness: 1, 
                    skew: 0, 
                    bgTone: 'black',
                    grainIntensity: 0.2,
                    blurAmount: 0.3,
                    redContrast: 1.2
                }
            }
        });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const imageData = await file.arrayBuffer();
    const base64Image = Buffer.from(imageData).toString('base64');

    const prompt = `
      Bu bir sayaç görselidir. Görüntüyü profesyonel bir grafik editörü gibi analiz et.
      SENİN GÖREVİN:
      Rakam penceresinin (display window) koordinatlarını ve fotoğrafa özgü doku özelliklerini tespit etmek.
      
      ANALİZ EDİLECEK NOKTALAR:
      1. coordinates: Sayaç penceresinin (rakamların olduğu alan) tam kutu koordinatları (top%, left%, width%, height%).
      2. pixelStyle: 
         - dominantBlackHex: Sayaçtaki 'siyah' tamburların tam HEX kodu (Örn: #0d0d0d).
         - dominantRedHex: Sayaçtaki 'kırmızı' ondalık alanın tam HEX kodu (Örn: #a31a1a).
         - digitColorHex: Rakamların rengi (Örn: #f2f2f2).
         - noise: Fotoğrafın genel ISO gürültü seviyesi (0 ile 1 arası).
         - blur: Fotoğrafın netlik seviyesi (0.1 ile 1.0 arası pixel değeri).
         - perspectiveSkew: Fotoğrafın yan açısı (derece cinsinden skew).
         - lightingGradient: Işığın geliş yönü (left-to-right, top-to-bottom, center).
      
      YANIT FORMATI (Sadece JSON):
      {
        "coordinates": { "top": number, "left": number, "width": number, "height": number },
        "style": { 
          "black": string, 
          "red": string, 
          "digits": string, 
          "noise": number, 
          "blur": number, 
          "skew": number, 
          "lightDir": string 
        },
        "comment": "Kısa teknik analiz"
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
    const aiData = JSON.parse(response.text().match(/\{[\s\S]*\}/)?.[0] || '{}');

    return NextResponse.json({
      success: true,
      data: {
        originalReading: parseFloat(currentReading),
        added: parseFloat(addedValue),
        finalReading: parseFloat(finalValue),
        aiMessage: aiData.comment,
        coordinates: aiData.coordinates,
        renderStyle: aiData.style,
        v3Engine: 'MCE Pixel Reconstruction Engine v3.1'
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: "İşleme Hatası" }, { status: 500 });
  }
}
