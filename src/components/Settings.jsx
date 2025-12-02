import React, { useState } from 'react';

export default function Settings({ onClose }) {
  const [selectedMapStyle, setSelectedMapStyle] = useState('default');

  return (
    <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">設定</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-64px)] p-4">
          <section className="mb-6">
            <h3 className="text-sm font-bold text-gray-600 mb-3">地図スタイル</h3>
            <div className="space-y-2">
              <button className="w-full p-3 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition-colors">
                標準
              </button>
              <button className="w-full p-3 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition-colors">
                衛星写真
              </button>
              <button className="w-full p-3 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition-colors">
                地形図
              </button>
            </div>
          </section>

          <section className="mb-6">
            <h3 className="text-sm font-bold text-gray-600 mb-3">アプリ情報</h3>
            <p className="text-xs text-gray-500">バージョン 0.1.0</p>
          </section>
        </div>
      </div>
    </div>
  );
}
