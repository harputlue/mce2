"use client";

import React, { useState, useRef } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentValue, setCurrentValue] = useState<string>('');
  const [addedValue, setAddedValue] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-50">
      <div className="max-w-3xl w-full">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-black bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            MCE Sayaç Pro v2.0
          </h1>
          <p className="text-slate-400 text-lg">Server-Side Sayaç Analiz ve Görsel Güncelleme Motoru</p>
        </header>

        <div className="glass rounded-3xl p-8 border border-slate-800 shadow-2xl">
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
                  <label className="text-sm font-medium text-slate-400 uppercase tracking-widest">Mevcut Okuma (Fotoğraftaki)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder="Örn: 2289,79"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-lg"
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

              <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                <img src={previewUrl!} className="w-full brightness-[0.4] blur-[1px]" alt="Original blurred" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="bg-indigo-600 px-6 py-2 rounded-lg font-black text-2xl shadow-xl border border-indigo-400 animate-pulse-slow">
                    YENİ DEĞER: {result.finalReading.toFixed(3).replace('.', ',')}
                  </div>
                  <p className="text-slate-300 text-sm max-w-sm leading-relaxed italic">
                    {result.aiMessage}
                  </p>
                  <p className="text-slate-500 text-[10px] mt-2 uppercase tracking-tight">
                    Powered by {result.v2Engine || 'MCE Engine v2.0'}
                  </p>
                  <div className="flex gap-4 mt-4">
                    <button 
                      onClick={() => alert('Görsel şu an Antigravity Panelinize aktarılıyor...')}
                      className="px-6 py-2 bg-white text-slate-950 rounded-lg font-bold hover:bg-slate-200 transition-colors"
                    >
                      Yeni Fotoğrafı İndir 📥
                    </button>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {setResult(null); setPreviewUrl(null); setSelectedFile(null);}}
                className="w-full py-4 border border-slate-700 hover:bg-slate-900 rounded-xl font-bold text-slate-400 transition-all"
              >
                Yeni İşlem Başlat
              </button>
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
