"use client";

import React, { useState, useRef } from 'react';

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
      // Dynamic import to avoid SSR issues
      const domtoimage = (await import('dom-to-image')).default;

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
        <header className="text-center mb-12 relative">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1 rounded-full text-[10px] font-black tracking-[0.3em] uppercase animate-pulse shadow-xl shadow-emerald-500/10">
              v3.6 PIXEL-PERFECT SEAMLESS ENGINE
            </span>
          </div>
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
                    1. Mevcut Okuma (Sol:5, Sağ:3)
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
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Mevcut Okuma</p>
                  <p className="text-2xl font-black text-slate-200">{result.originalReading?.toString().replace('.', ',')} m³</p>
                </div>
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Yeni Hedef</p>
                  <p className="text-2xl font-black text-emerald-400">
                    {typeof result.finalReading === 'number' ? result.finalReading.toFixed(3).replace('.', ',') : '...'} m³
                  </p>
                </div>
              </div>

              {/* DRAWABLE AREA - SEAMLESS FUSION V3.6 */}
              <div ref={downloadRef} className="relative rounded-2xl overflow-hidden shadow-2xl bg-black select-none">
                <img src={previewUrl!} className="w-full h-auto object-contain block" alt="Result original" />
                
                {/* Noise Filter */}
                <svg className="hidden">
                  <filter id="seamlessNoise">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                    <feComponentTransfer>
                      <feFuncR type="linear" slope="0.3" />
                      <feFuncG type="linear" slope="0.3" />
                      <feFuncB type="linear" slope="0.3" />
                    </feComponentTransfer>
                  </filter>
                </svg>

                {/* PIXEL FUSION ELEMENT (V3.6) */}
                {typeof result.finalReading === 'number' && (
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
                  >
                    <div style={{
                      display: 'flex',
                      width: '100%',
                      height: '100%',
                      filter: `blur(${result.renderStyle?.blur || 0.45}px) contrast(1.1) saturate(0.9)`, // Renk doygunluğunu fotoğrafla eşlemek için azalttık
                      // "Kare kare" görünümü yok etmek için padding ve gap değerlerini mekanik tambur yapısına çektik
                    }}>
                      {(() => {
                        // 5+3 KURALI UYGULAMASI (Kusursuz Hizalama)
                        const [intPart, decPart] = result.finalReading.toFixed(3).split('.');
                        const paddedInt = intPart.padStart(5, '0').slice(-5);
                        const paddedDec = decPart.padEnd(3, '0').slice(0, 3);
                        const digits = [...paddedInt.split(''), ',', ...paddedDec.split('')];

                        return digits.map((char: string, idx: number) => {
                          const isComma = char === ',';
                          const isDecimal = idx > 5;
                          
                          return (
                            <div 
                              key={idx}
                              style={{
                                flex: isComma ? '0.08' : '1', // Virgül alanını çok daralttık
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                // Orijinal Sayaç Rengi ile Fusion
                                backgroundColor: isComma ? 'transparent' : (isDecimal ? (result.renderStyle?.red || '#911212') : (result.renderStyle?.black || '#131314')),
                                height: '100%',
                                // Kutu görünümünü yok eden "Seamless Border" tekniği
                                borderRight: isComma ? 'none' : '0.5px solid rgba(0,0,0,0.15)',
                                overflow: 'hidden'
                              }}
                            >
                              {!isComma && (
                                <div className="absolute inset-0 z-0 opacity-100">
                                   {/* Mekanik Derinlik Gölgesi (Üst ve Alt Oklüzyon) */}
                                  <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-10" />
                                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
                                  
                                  {/* ISO Kumlanması (Tüm Tambura Yayılması) */}
                                  <div className="absolute inset-0 opacity-[0.14]" style={{ filter: 'url(#seamlessNoise)', mixBlendMode: 'overlay' }} />
                                </div>
                              )}

                              <span style={{ 
                                fontSize: isComma ? '0' : 'min(3.6vw, 32px)',
                                fontFamily: '"Arial", sans-serif', // Daha standart/mekanik bir font
                                fontWeight: '900',
                                color: isComma ? 'transparent' : (result.renderStyle?.ink || '#dadada'),
                                // DOKU KARŞIMI: Rakamları piksellerin içine gömer (V3.6)
                                mixBlendMode: 'hard-light',
                                position: 'relative',
                                zIndex: 40,
                                opacity: 0.88,
                                transform: 'scaleY(1.15) scaleX(0.9)',
                                letterSpacing: '-0.02em',
                                textShadow: isComma ? 'none' : '0.5px 0.5px 0.5px rgba(255,255,255,0.05), -0.5px -0.5px 0.5px rgba(0,0,0,0.4)',
                              }}>
                                {char === ',' ? '' : char}
                              </span>

                              {/* Işık Yansıması (Environmental Highlighting) */}
                              {!isComma && (
                                <div className="absolute inset-0 z-50 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-20 mix-blend-screen pointer-events-none" />
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* ÇERÇEVE GÖLGESİ (Pencerenin Sayaç Üzerindeki Oklüzyonu - Kutu görüntüsünü bitiren ana dokunuş) */}
                    <div className="absolute inset-0 z-[60] shadow-[inset_0_0_20px_rgba(0,0,0,1)] pointer-events-none border border-black/20" />
                  </div>
                )}

                {/* Koruyucu Toz ve Çizik Katmanı (Ultra-Reality) */}
                <div className="absolute inset-0 z-[70] pointer-events-none opacity-20 mix-blend-overlay" style={{ filter: 'url(#seamlessNoise)' }} />
                
                {/* Genel Atmosferik Cam Parlaması */}
                <div className="absolute inset-0 z-[80] pointer-events-none bg-gradient-to-br from-white/10 via-transparent to-black/30 opacity-40 mix-blend-soft-light" />
                
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/95 via-black/40 to-transparent p-4 z-[90] text-center">
                   <p className="text-slate-500 text-[9px] uppercase tracking-[0.6em] font-black opacity-30">
                    MCE V3.6 • FINAL SEAMLESS RECONSTRUCTION
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
