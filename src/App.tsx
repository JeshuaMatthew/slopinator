import { useState, useMemo, useEffect } from 'react';

import botAsking1 from './assets/bot/bot_asking1.png';
import botAsking2 from './assets/bot/bot_asking2.png';
import botConfident1 from './assets/bot/bot_confident1.png';
import botConfident2 from './assets/bot/bot_confident2.png';
import botNeutral1 from './assets/bot/bot_neutral1.png';
import botNeutral2 from './assets/bot/bot_neutral2.png';
import botConfused1 from './assets/bot/bot_confused1.png';
import botConfused2 from './assets/bot/bot_confused2.png';
import botThinking1 from './assets/bot/bot_thinking1.png';
import botThinking2 from './assets/bot/bot_thinking2.png';

const botAskingCycle = [botAsking1, botThinking1, botAsking2, botThinking2];

type Symptom = { id: string; text: string };
type Cause = { id: string; name: string; symptoms: string[] };

const SYMPTOMS: Symptom[] = [
  { id: 'B1', text: 'Tidak ada gambar tertampil di monitor' },
  { id: 'B2', text: 'Terdapat garis horisontal / vertikal ditengah monitor' },
  { id: 'B3', text: 'Tidak ada tampilan awal bios' },
  { id: 'B4', text: 'Muncul pesan error pada bios' },
  { id: 'B5', text: 'Alarm bios berbunyi' },
  { id: 'B6', text: 'Terdengar suara aneh pada HDD' },
  { id: 'B7', text: 'Sering terjadi hang/crash saat menjalankan aplikasi' },
  { id: 'B8', text: 'Selalu Scandisk ketika booting' },
  { id: 'B9', text: 'Muncul pesan error saat menjalankan game atau aplikasi grafis' },
  { id: 'B10', text: 'Device driver informasi tidak terdeteksi dalam device manager' },
  { id: 'B11', text: 'Tiba-tiba OS melakukan restart otomatis' },
  { id: 'B12', text: 'Keluarnya blue screen pada OS Windows' },
  { id: 'B13', text: 'Suara tetap tidak keluar meskipun driver dan setting telah sesuai' },
  { id: 'B14', text: 'Muncul pesan error saat menjalankan aplikasi audio' },
  { id: 'B15', text: 'Muncul pesan error saat pertama OS di load dari HDD' },
  { id: 'B16', text: 'Tidak ada tanda-tanda dari sebagian/seluruh perangkat bekerja' },
  { id: 'B17', text: 'Sering tiba-tiba mati tanpa sebab' },
  { id: 'B18', text: 'Muncul pesan pada windows, bahwa windows kekurangan virtual memori' },
  { id: 'B19', text: 'Aplikasi berjalan dengan lambat, respon yang lambat terhadap inputan' },
  { id: 'B20', text: 'Kinerja grafis terasa sangat berat' },
  { id: 'B21', text: 'Device tidak terdeteksi dalam bios' },
  { id: 'B22', text: 'Informasi deteksi yang salah dalam bios' },
  { id: 'B23', text: 'Hanya sebagian perangkat yang bekerja' },
  { id: 'B24', text: 'Sebagian/seluruh karakter inputan mati' },
  { id: 'B25', text: 'Pointer mouse tidak merespon gerakan mouse' },
];

const CAUSES: Cause[] = [
  { id: 'A1', name: 'MONITOR RUSAK', symptoms: ['B1', 'B2'] },
  { id: 'A2', name: 'MEMORI RUSAK', symptoms: ['B3', 'B4', 'B5', 'B11', 'B12'] },
  { id: 'A3', name: 'HDD RUSAK', symptoms: ['B6', 'B7', 'B8', 'B10', 'B21', 'B22'] },
  { id: 'A4', name: 'VGA RUSAK', symptoms: ['B1', 'B3', 'B5', 'B9', 'B10', 'B12', 'B13'] },
  { id: 'A5', name: 'SOUND CARD RUSAK', symptoms: ['B10', 'B13', 'B14'] },
  { id: 'A6', name: 'OS BERMASALAH', symptoms: ['B11', 'B12', 'B15'] },
  { id: 'A7', name: 'APLIKASI RUSAK', symptoms: ['B12'] },
  { id: 'A8', name: 'PSU RUSAK', symptoms: ['B7', 'B16', 'B17'] },
  { id: 'A9', name: 'PROSESOR RUSAK', symptoms: ['B1', 'B3', 'B4', 'B5'] },
  { id: 'A10', name: 'MEMORY KURANG (PERLU UPGRADE MEMORY)', symptoms: ['B18', 'B19'] },
  { id: 'A11', name: 'MEMORY VGA KURANG (PERLU UPGRADE VGA)', symptoms: ['B9', 'B20'] },
  { id: 'A12', name: 'CLOCK PROSESOR KURANG TINGGI (PERLU UPGRADE)', symptoms: ['B19'] },
  { id: 'A13', name: 'KABEL IDE RUSAK', symptoms: ['B21'] },
  { id: 'A14', name: 'KURANG DAYA PADA PSU (PERLU UPGRADE PSU)', symptoms: ['B5', 'B23'] },
  { id: 'A15', name: 'PERANGKAT USB RUSAK', symptoms: ['B10'] },
  { id: 'A16', name: 'KEYBOARD RUSAK', symptoms: ['B10', 'B24'] },
  { id: 'A17', name: 'MOUSE RUSAK', symptoms: ['B10', 'B25'] },
];

export default function App() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'result'>('start');
  const [candidates, setCandidates] = useState<Cause[]>(CAUSES);
  const [askedSymptoms, setAskedSymptoms] = useState<Set<string>>(new Set());
  const [finalResult, setFinalResult] = useState<Cause[] | null>(null);
  
  const [currentBotImage, setCurrentBotImage] = useState(botNeutral1);
  const [botImageIndex, setBotImageIndex] = useState(0);
  const [squashTrigger, setSquashTrigger] = useState(0);

  const currentQuestion = useMemo(() => {
    if (gameState !== 'playing' || candidates.length <= 1) return null;
    const symptomCounts: Record<string, number> = {};
    candidates.forEach((cause) => {
      cause.symptoms.forEach((symp) => {
        if (!askedSymptoms.has(symp)) {
          symptomCounts[symp] = (symptomCounts[symp] || 0) + 1;
        }
      });
    });

    let bestSymptomId: string | null = null;
    let minDiff = Infinity;
    const target = candidates.length / 2;

    for (const [sympId, count] of Object.entries(symptomCounts)) {
      const diff = Math.abs(count - target);
      if (diff < minDiff) {
        minDiff = diff;
        bestSymptomId = sympId;
      }
    }
    return SYMPTOMS.find((s) => s.id === bestSymptomId) || null;
  }, [candidates, askedSymptoms, gameState]);

  useEffect(() => {
    if (gameState === 'playing') {
      if (candidates.length <= 1 || !currentQuestion) {
        setFinalResult(candidates.length === 1 ? candidates : null);
        setGameState('result');
        setSquashTrigger(v => v + 1);
      }
    }
  }, [candidates, currentQuestion, gameState]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (gameState === 'start') {
        setCurrentBotImage(prev => prev === botNeutral1 ? botNeutral2 : botNeutral1);
        setSquashTrigger(v => v + 1);
      } else if (gameState === 'result') {
        if (finalResult && finalResult.length > 0) {
          setCurrentBotImage(prev => prev === botConfident1 ? botConfident2 : botConfident1);
        } else {
          setCurrentBotImage(prev => prev === botConfused1 ? botConfused2 : botConfused1);
        }
        setSquashTrigger(v => v + 1);
      }
    }, 3000); 
    return () => clearInterval(interval);
  }, [gameState, finalResult]);

  const handleAnswer = (answer: 'yes' | 'no' | 'skip') => {
    if (!currentQuestion) return;
    const newAsked = new Set(askedSymptoms);
    newAsked.add(currentQuestion.id);
    setAskedSymptoms(newAsked);

    const nextIndex = (botImageIndex + 1) % botAskingCycle.length;
    setBotImageIndex(nextIndex);
    setCurrentBotImage(botAskingCycle[nextIndex]);
    setSquashTrigger(v => v + 1); 

    if (answer === 'yes') {
      setCandidates(candidates.filter((c) => c.symptoms.includes(currentQuestion.id)));
    } else if (answer === 'no') {
      setCandidates(candidates.filter((c) => !c.symptoms.includes(currentQuestion.id)));
    }
  };

  const restartGame = () => {
    setCandidates(CAUSES);
    setAskedSymptoms(new Set());
    setFinalResult(null);
    setBotImageIndex(0);
    setCurrentBotImage(botNeutral1);
    setSquashTrigger(v => v + 1);
    setGameState('start');
  };

  return (
    <>
      <style>
        {`
          /* Latar Awan Seamless Loop */
          @keyframes drift {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); } /* Bergeser sejauh 1 dari 2 gambar */
          }
          .animate-clouds {
            display: flex;
            width: 200%;
            animation: drift 40s linear infinite;
          }
          
          /* Animasi Idle Bobbing (Mengambang Naik Turun Perlahan) */
          @keyframes bobbing {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          .bot-bob {
            animation: bobbing 4s ease-in-out infinite;
          }

          /* Animasi Squash & Stretch saat gambar berubah */
          @keyframes squash {
            0% { transform: scale(1, 1); }
            30% { transform: scale(1.15, 0.85); }
            60% { transform: scale(0.9, 1.1); }
            100% { transform: scale(1, 1); }
          }
          .bot-squash {
            animation: squash 0.5s cubic-bezier(0.28, 0.84, 0.42, 1);
          }

          /* CSS Kustom Gelembung Awan Penuh */
          .cloud-bubble-wrapper {
            position: relative;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 3rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
            z-index: 10;
          }
          /* Lingkaran pembentuk awan */
          .cloud-part-1 { position: absolute; top: -30px; left: 15%; width: 100px; height: 100px; background: rgba(255, 255, 255, 0.95); border-radius: 50%; z-index: -1; }
          .cloud-part-2 { position: absolute; top: -45px; right: 20%; width: 130px; height: 130px; background: rgba(255, 255, 255, 0.95); border-radius: 50%; z-index: -1; }
          .cloud-part-3 { position: absolute; bottom: -20px; left: 40%; width: 80px; height: 80px; background: rgba(255, 255, 255, 0.95); border-radius: 50%; z-index: -1; }
          
          /* Lingkaran pemikiran (Thought bubbles) yang mengarah ke bot */
          .thought-1 { position: absolute; bottom: 20px; left: -30px; width: 25px; height: 25px; background: #fff; border-radius: 50%; opacity: 0.9; }
          .thought-2 { position: absolute; bottom: 10px; left: -60px; width: 15px; height: 15px; background: #fff; border-radius: 50%; opacity: 0.8; }
          
          @media (max-width: 768px) {
            .thought-1 { top: -25px; left: 50%; bottom: auto; transform: translateX(-50%); }
            .thought-2 { top: -45px; left: 50%; bottom: auto; transform: translateX(-50%); }
          }
        `}
      </style>

      {/* Kontainer Utama - Gradien Langit dari Atas(Terang) ke Bawah(Gelap) */}
      <div className="relative min-h-screen bg-gradient-to-b from-sky-100 via-sky-400 to-blue-900 flex items-center justify-center p-4 overflow-hidden font-sans">
        
        {/* Latar Belakang SVG Awan Bawah Seamless */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none z-0 opacity-80">
          <div className="animate-clouds text-sky-50/60">
            {[1, 2].map((key) => (
              <svg key={key} className="w-full h-auto" viewBox="0 0 1440 320" preserveAspectRatio="none">
                {/* SVG path yang dirancang mulus dari y=256 kembali ke y=256 */}
                <path fill="currentColor" fillOpacity="1" d="M0,256L48,245.3C96,235,192,213,288,213.3C384,213,480,235,576,245.3C672,256,768,256,864,245.3C960,235,1056,213,1152,213.3C1248,213,1344,235,1392,245.3L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              </svg>
            ))}
          </div>
        </div>

        {/* Konten Utama Terbagi 2 (Setengah Bot, Setengah Dialog) */}
        <div className="relative z-10 w-full max-w-6xl flex flex-col md:flex-row items-center justify-center gap-10 lg:gap-16">
          
          {/* SISI KIRI: KARAKTER BOT (Memenuhi Setengah Layar) */}
          <div className="w-full md:w-1/2 flex items-center justify-center">
            <div className="bot-bob w-full flex justify-center">
              {/* key={squashTrigger} memaksa animasi squash di-restart setiap kali berubah */}
              <img 
                key={squashTrigger}
                src={currentBotImage} 
                alt="Slopinator" 
                className="bot-squash object-contain drop-shadow-2xl max-h-[45vh] md:max-h-[65vh] w-auto transition-all duration-200"
              />
            </div>
          </div>

          {/* SISI KANAN: SPEECH BUBBLE AWAN */}
          <div className="w-full md:w-1/2 flex flex-col justify-center px-4">
            
            {/* Wrapper Awan */}
            <div className="cloud-bubble-wrapper p-8 md:p-10 w-full mt-4 md:mt-0 relative">
              
              {/* Elemen Pembentuk Bentuk Awan di CSS */}
              <div className="cloud-part-1"></div>
              <div className="cloud-part-2"></div>
              <div className="cloud-part-3"></div>
              <div className="thought-1"></div>
              <div className="thought-2"></div>

              {/* KONTEN BERDASARKAN STATE */}

              {/* SCREEN: START */}
              {gameState === 'start' && (
                <div className="text-center relative z-20">
                  <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-blue-900">
                    Slopinator
                  </h1>
                  <p className="text-lg md:text-xl text-slate-700 leading-relaxed mb-8 font-medium">
                    Hii, saya <i>Slopinator</i>, saya bisa menebak permasalahan dari komputer anda hanya dengan bertanya beberapa pertanyaan.
                  </p>
                  <button
                    onClick={() => {
                      setGameState('playing');
                      setSquashTrigger(v => v + 1);
                    }}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-extrabold text-lg py-4 px-8 rounded-full transition-transform transform hover:scale-105 shadow-[0_5px_15px_rgba(250,204,21,0.5)] border-2 border-yellow-200"
                  >
                    Mulai Konsultasi
                  </button>
                </div>
              )}

              {gameState === 'playing' && currentQuestion && (
                <div className="relative z-20 space-y-6 flex flex-col text-center">
                  <p className="text-sm font-bold text-yellow-500 uppercase tracking-widest mb-1">
                    Pertanyaan {askedSymptoms.size + 1}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold leading-relaxed text-blue-900 min-h-[120px] flex items-center justify-center">
                    Apakah "{currentQuestion.text}" ?
                  </h2>

                  <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                    <button
                      onClick={() => handleAnswer('yes')}
                      className="flex-1 bg-yellow-400 hover:bg-yellow-300 py-3 px-4 rounded-full font-extrabold text-blue-900 transition-all shadow-md transform hover:-translate-y-1 border border-yellow-200"
                    >
                      Ya, Benar
                    </button>
                    <button
                      onClick={() => handleAnswer('no')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 px-4 rounded-full font-extrabold text-yellow-50 transition-all shadow-md transform hover:-translate-y-1 border border-blue-500"
                    >
                      Tidak
                    </button>
                    <button
                      onClick={() => handleAnswer('skip')}
                      className="flex-1 bg-sky-200 hover:bg-sky-300 py-3 px-4 rounded-full font-extrabold text-blue-900 transition-all shadow-md transform hover:-translate-y-1 border border-sky-300"
                    >
                      Ragu-ragu
                    </button>
                  </div>
                </div>
              )}

              {/* SCREEN: RESULT */}
              {gameState === 'result' && (
                <div className="relative z-20 text-center space-y-4">
                  <h2 className="text-xl font-bold text-blue-800 mb-2">
                    Hasil Analisa Saya:
                  </h2>
                  
                  {finalResult && finalResult.length > 0 ? (
                    <div className="space-y-4">
                      {finalResult.map((res) => (
                        <div key={res.id} className="bg-blue-50/80 p-4 rounded-2xl border border-blue-100">
                          <span className="text-sm font-black text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full mb-2 inline-block">Kode: {res.id}</span>
                          <h3 className="text-2xl md:text-3xl font-extrabold text-blue-900 mt-2">{res.name}</h3>
                        </div>
                      ))}
                      {finalResult.length > 1 && (
                        <p className="text-sm text-sky-700 font-medium">
                          *Gejala Anda merujuk pada beberapa kemungkinan di atas.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-50 p-6 rounded-2xl border border-red-100 mt-4">
                      <h3 className="text-2xl font-bold text-red-600">
                        Maaf, kerusakan tidak ditemukan di database.
                      </h3>
                    </div>
                  )}

                  <button
                    onClick={restartGame}
                    className="mt-8 w-full bg-yellow-400 hover:bg-yellow-300 text-blue-900 py-4 px-8 rounded-full font-extrabold transition-all shadow-lg transform hover:scale-105 border-2 border-yellow-200"
                  >
                    Konsultasi Ulang
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </>
  );
}