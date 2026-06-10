import React, { useEffect } from 'react';
import { Icons } from '../assets/icons';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function NetworkError() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Retry logic
  const handleRetry = () => {
    // Return to dashboard cleanly, allowing the app to remount properly
    window.location.href = '/workspace';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="relative w-40 h-40 flex items-center justify-center mb-8">
        <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full animate-ping opacity-75"></div>
        <div className="relative bg-red-50 dark:bg-red-950/50 w-32 h-32 rounded-full flex items-center justify-center border-4 border-red-100 dark:border-red-900 shadow-xl z-10">
          <Icons.serverCrash size={56} className="text-red-500 animate-pulse" />
        </div>
        <div className="absolute top-0 right-2 bg-white dark:bg-slate-800 rounded-full p-2 shadow-md z-20">
          <Icons.wifiOff size={20} className="text-slate-400" />
        </div>
      </div>
      
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 text-center text-slate-800 dark:text-slate-100">
        {t('network_error.title') || 'Connection Lost'}
      </h1>
      
      <p className="text-muted-foreground text-center mb-8 max-w-md text-sm sm:text-base leading-relaxed">
        {t('network_error.desc') || "We couldn't connect to the server. Please check your internet connection or try again later. The backend might be offline."}
      </p>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={handleRetry} 
          className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center gap-2"
        >
          <Icons.refreshCw size={18} />
          {t('network_error.retry') || 'Try Again'}
        </button>
        <button 
          onClick={() => navigate('/workspace')} 
          className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-sm transition-colors"
        >
          {t('not_found.go_home') || 'Go to Dashboard'}
        </button>
      </div>
    </div>
  );
}
