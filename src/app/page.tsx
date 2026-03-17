"use client";

import React, { useState, useRef } from 'react';
import domtoimage from 'dom-to-image';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentValue, setCurrentValue] = useState<string>('');
  const [addedValue, setAddedValue] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  const handleFile = async (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    // Otomatik Sayı Tanıma (OCR) v3.0
    setIsScanning(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/analyze-meter', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success && data.detectedValue) {
        setCurrentValue(data.detectedValue);
      }
    } catch (err) {
      console.error("Scanning Error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile || !currentValue || !addedValue) {
      alert('Lütfen tüm alanları doldurun ve bir görsel yükleyin.');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('currentValue', currentValue);
    formData.append('addedValue', addedValue);

    try {
      const response = await fetch('/api/meter-update', {
        method: 'POST',
        body: formData,
      });

      const resData = await response.json();
      if (response.ok) {
        setResult(resData.data);
      } else {
        alert(resData.error || 'İşlem sırasında hata oluştu.');
      }
    } catch (err) {
      alert('Sunucuya erişilemedi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = async () => {
    if (!downloadRef.current) return;
    
    try {
      console.log("MCE v3.0 Engine: Starting high-fidelity capture...");
      const dataUrl = await domtoimage.toPng(downloadRef.current, {
        quality: 1.0,
        bgcolor: '#000000',
        cacheBust: true,
      });
      
      const link = document.createElement('a');
      link.download = `mce-v3-guncelleme-${Date.now()}.png`; // PNG formatında indirme
      link.href = dataUrl;
      link.click();
      console.log("MCE V3: Image saved as PNG");
    } catch (err: any) {
      console.error("Capture error:", err);
      alert(`İndirme Hatası (v2.1): ${err.message}. \n\nEğer 'lab' hatası alıyorsanız lütfen tarayıcı sekmesini kapatıp tekrar açın veya CMD+Shift+R ile sert yenileme yapın.`);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-50">
      <div className="max-w-3xl w-full">
        <header className="text-center mb-12">
          <h1 className="text-6xl font-black bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent mb-2 drop-shadow-sm">
            MCE V3 Motoru
          </h1>
          <p className="text-slate-400 text-lg font-medium">Yeni Nesil Akıllı Sayaç Analiz ve Generative Edit Paneli</p>
        </header>

        <div className="glass rounded-3xl p-8 border border-slate-800 shadow-2xl relative">
          {!result ? (
            <div className={`space-y-8 ${isProcessing ? 'opacity-30 pointer-events-none' : ''}`}>
              {/* UPLOAD AREA */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-10 cursor-pointer transition-all duration-300 bg-slate-900/40 hover:bg-slate-900/60 text-center"
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <img src={previewUrl} className="max-h-52 mx-auto rounded-lg shadow-lg border border-slate-700" alt="Preview"/>
                    <p className="text-indigo-400 font-semibold">{selectedFile?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📸</div>
                    <h3 className="text-xl font-bold">Sayaç Görselini Buraya Bırakın</h3>
                    <p className="text-slate-500">Dosya seçmek için tıklayın</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={onFileChange} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>

              {/* INPUTS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    1. Mevcut Okuma (Fotoğraftaki)
                    {isScanning && (
                      <span className="flex items-center gap-1 text-emerald-400 text-[10px] animate-pulse font-bold">
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        AI TARANIYOR...
                      </span>
                    )}
                  </label>
                  <input 
                    type="number" 
                    step="0.001"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder={isScanning ? "AI okuyor..." : "Örn: 2289,790"}
                    className={`w-full bg-slate-900 border ${isScanning ? 'border-emerald-500/50 text-emerald-300' : 'border-slate-700'} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-lg`}
                    disabled={isScanning}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 uppercase tracking-widest">Eklenecek Sayı (Artış)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    value={addedValue}
                    onChange={(e) => setAddedValue(e.target.value)}
                    placeholder="Örn: 1,278"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-lg"
                  />
                </div>
              </div>

              {/* ACTION BUTTON */}
              <button 
                onClick={handleProcess}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
              >
                Hesapla ve Görsel Talebi Oluştur →
              </button>
            </div>
          ) : (
            /* RESULT VIEW */
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 font-semibold mb-4">
                <span className="text-xl">✓</span>
                <span>Yapay Zeka Sunucusu Talebi Başarıyla İşledi</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Mevcut Okuma</p>
                  <p className="text-2xl font-black text-slate-200">{result.originalReading.toString().replace('.', ',')} m³</p>
                </div>
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Yeni Hedef</p>
                  <p className="text-2xl font-black text-emerald-400">{result.finalReading.toFixed(3).replace('.', ',')} m³</p>
                </div>
              </div>

              {/* DRAWABLE AREA - Profesyonel Mekanik Sayaç Render Modu */}
              <div ref={downloadRef} className="relative rounded-2xl overflow-hidden border-4 border-slate-900 shadow-2xl bg-black select-none">
                <img src={previewUrl!} className="w-full h-auto object-contain block" alt="Result original" crossOrigin="anonymous" />
                
                {/* Noise Filter for Texture Mapping */}
                <svg className="hidden">
                  <filter id="noiseFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                    <feComponentTransfer>
                      <feFuncR type="linear" slope="0.4" />
                      <feFuncG type="linear" slope="0.4" />
                      <feFuncB type="linear" slope="0.4" />
                    </feComponentTransfer>
                  </filter>
                  <filter id="bloom">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </svg>

                {/* AI Tarafından Belirlenen Mekanik Tambur Katmanı - Generative Pixel Mimic */}
                <div 
                  style={{
                    position: 'absolute',
                    top: `${result.coordinates?.top || 50}%`,
                    left: `${result.coordinates?.left || 50}%`,
                    width: `${result.coordinates?.width || 30}%`,
                    height: `${result.coordinates?.height || 8}%`,
                    transform: `translate(-50%, -50%) skew(${result.renderStyle?.skew || 0}deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    zIndex: 20,
                  }}
                  className="rounded-[1px]"
                >
                  <div style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    filter: `blur(${result.renderStyle?.blur || 0.15}px) brightness(${result.renderStyle?.brightness || 1}) contrast(1.2)`,
                    gap: '1px'
                  }}>
                    {result.finalReading.toFixed(3).replace('.', ',').split('').map((char: string, idx: number) => {
                      const isComma = char === ',';
                      const isDecimal = idx > result.finalReading.toFixed(3).length - 4;
                      
                      return (
                        <div 
                          key={idx}
                          style={{
                            flex: isComma ? '0.3' : '1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            // Rakamın kendi arka planı (Kutu görüntüsünü yok etmek için her haneye özel zemin)
                            backgroundColor: isComma ? 'transparent' : (isDecimal ? '#b91c1c' : '#0a0a0a'),
                            borderRadius: '1px',
                            boxShadow: isComma ? 'none' : 'inset 0 0 8px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.5)',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Tambur Doku ve Işık Efektleri */}
                          {!isComma && (
                            <div className="absolute inset-0 z-0">
                               {/* Üst ve Alt Gölgeler (Tambur Yuvarlaklığı için) */}
                              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/80 via-black/20 to-transparent" />
                              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                              {/* Kir/Toz Katmanı (Fotoğraf dokusuyla uyum) */}
                              <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ filter: 'url(#noiseFilter)' }} />
                            </div>
                          )}

                          <span style={{ 
                            fontSize: isComma ? 'min(2vw, 18px)' : 'min(3.2vw, 28px)',
                            fontFamily: '"Impact", "Arial Narrow", sans-serif', // Daha mekanik ve dar font
                            fontWeight: '900',
                            color: isComma ? (isDecimal ? '#fff' : '#ccc') : (isDecimal ? '#ffffff' : '#f0f0f0'),
                            position: 'relative',
                            zIndex: 1,
                            transform: isComma ? 'none' : 'scaleY(1.1) translateY(-1px)',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                            opacity: 0.95
                          }}>
                            {char}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Plastik Kapak / Cam Cam Efekti (Parlama) */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-40 mix-blend-overlay" />

                {/* Plastik Kapak / Cam Parlaması Efekti */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-30" />

                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/95 to-transparent p-4">
                   <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] text-center font-bold">
                    MCE AI V3 ENGINE • VERIFIED PIXEL RECONSTRUCTION
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-[11px] text-center text-indigo-300 bg-indigo-500/10 py-3 px-4 rounded-xl border border-indigo-500/20 leading-relaxed">
                   <strong>V3 AI Analizi:</strong> {result.aiMessage}
                </p>
                <button 
                  onClick={downloadImage}
                  className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-2xl transition-all shadow-2xl shadow-emerald-500/40 active:scale-[0.98] border-b-4 border-emerald-800 uppercase"
                >
                  GÖRSELİ PNG OLARAK İNDİR 📥
                </button>
                <button 
                  onClick={() => {setResult(null); setPreviewUrl(null); setSelectedFile(null);}}
                  className="w-full py-2 text-slate-500 hover:text-slate-300 transition-colors text-sm font-medium"
                >
                  ← Yeni İşlem Başlat
                </button>
              </div>
            </div>
          )}

          {/* LOADER */}
          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/20 backdrop-blur-md rounded-3xl z-50">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
              <h3 className="text-2xl font-bold text-white mb-2 italic">MCE Server İşliyor...</h3>
              <p className="text-indigo-400 animate-pulse">Görsel analiz ediliyor ve rakam tamburları düzenleniyor.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
