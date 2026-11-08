import React, { useState } from 'react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    step: 'Tahap 1 dari 4',
    title: 'Selamat Datang di Studio Peta Taktis',
    subtitle: 'Alat Desain Level & Simulasi Navigasi AI Berbasis Web',
    content:
      'Aplikasi ini dirancang untuk membantu Game Developer merancang struktur ruangan (level) secara otomatis maupun manual, sekaligus menguji bagaimana kecerdasan buatan (AI) mencari rute tercepat di dalam peta secara langsung.',
    points: [
      'Berjalan 100% secara lokal di browser Anda tanpa koneksi server eksternal.',
      'Visualisasi langsung cara kerja algoritma pencarian rute di balik layar.',
      'Hasil desain peta dapat diekspor menjadi file JSON untuk digunakan di Unity atau Godot Engine.',
    ],
  },
  {
    step: 'Tahap 2 dari 4',
    title: 'Membangun & Mengedit Struktur Peta',
    subtitle: 'Kombinasi Generasi Prosedural dan Kuas Manual',
    content:
      'Anda tidak perlu menggambar peta dari nol. Gunakan fitur pembuat ruangan otomatis di panel sebelah kiri, lalu sesuaikan bentuknya menggunakan alat gambar yang tersedia.',
    points: [
      'Klik tombol "Buat Peta Baru" untuk menghasilkan susunan ruangan dan lorong secara instan.',
      'Pilih alat "Gambar Dinding" atau "Buka Lantai", lalu klik dan geser (drag) mouse di atas kanvas untuk mengubah bentuk ruangan.',
      'Gunakan "Pintu / Celah Sempit" (warna kuning amber) untuk menandai area yang memperlambat pergerakan karakter.',
    ],
  },
  {
    step: 'Tahap 3 dari 4',
    title: 'Menguji Algoritma Pencarian Rute AI',
    subtitle: 'Membandingkan A-Star (A*), Dijkstra, dan BFS',
    content:
      'Setiap kali Anda mengubah dinding atau memindahkan titik karakter, komputer langsung menghitung ulang jalur terbaik dari Titik Awal (A) menuju Titik Tujuan (B).',
    points: [
      'A-Star (A*): Algoritma paling cerdas dan efisien, langsung mengarah ke target dan menghindari pintu sempit jika ada jalan memutar yang lebih cepat.',
      'Dijkstra: Memeriksa seluruh kemungkinan jalan ke segala arah dengan tetap menghitung beban pintu sempit.',
      'Breadth-First Search (BFS): Mencari jumlah kotak paling sedikit tanpa memedulikan beban pintu sempit.',
    ],
  },
  {
    step: 'Tahap 4 dari 4',
    title: 'Membaca Statistik & Ekspor Data',
    subtitle: 'Analisis Performa dan Integrasi Engine',
    content:
      'Perhatikan panel Ringkasan Data di kiri bawah untuk melihat seberapa cepat algoritma bekerja dalam satuan milidetik (ms) dan berapa banyak kotak yang harus diperiksa AI.',
    points: [
      'Area berwarna biru muda transparan di kanvas menunjukkan kotak mana saja yang sedang "dipikirkan" atau diperiksa oleh AI.',
      'Gunakan menu pilihan Tema di pojok kanan atas untuk mengganti suasana ruang kerja sesuai kenyamanan mata Anda.',
      'Klik "Unduh Data Peta (.JSON)" di kiri bawah jika Anda ingin menyimpan matriks level ini.',
    ],
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const active = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-xl bg-white border border-slate-300 shadow-2xl rounded-lg overflow-hidden text-slate-800">
        {/* Top Progress Header */}
        <div className="px-6 py-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              {active.step}
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">{active.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
          >
            Tutup Panduan
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-4 h-1.5 bg-slate-200">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`transition-colors ${
                idx <= currentStep ? 'bg-sky-600' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {active.subtitle}
          </p>
          <p className="text-sm leading-relaxed text-slate-700">{active.content}</p>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2.5">
            {active.points.map((pt, i) => (
              <div key={i} className="flex items-start space-x-2.5 text-sm text-slate-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0" />
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex space-x-1.5">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-6 h-2 rounded-full transition-colors ${
                  idx === currentStep ? 'bg-sky-600' : 'bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
              >
                Sebelumnya
              </button>
            )}

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded hover:bg-sky-700 transition-colors"
              >
                Selanjutnya
              </button>
            ) : (
              <button
                onClick={() => {
                  setCurrentStep(0);
                  onClose();
                }}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded hover:bg-emerald-700 transition-colors"
              >
                Mulai Gunakan Studio
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};