import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Settings from './Settings';
import Profile from './Profile';

export default function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { currentUser } = useAuth();

  return (
    <>
      <header className="absolute top-0 left-0 w-full z-50 bg-gradient-to-b from-black/30 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-white font-bold text-lg tracking-wider">
            📍 MAP SNS
          </h1>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md transition-all"
              aria-label="設定"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <button
              onClick={() => setIsProfileOpen(true)}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md transition-all"
              aria-label="プロフィール"
            >
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {isSettingsOpen && <Settings onClose={() => setIsSettingsOpen(false)} />}
      {isProfileOpen && <Profile onClose={() => setIsProfileOpen(false)} />}
    </>
  );
}
