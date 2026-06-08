import React from 'react';
import Lottie from 'lottie-react';
import { useNavigate } from 'react-router-dom';
import animationData from '../assets/lottie/404.json';
import { useLanguage } from '../contexts/LanguageContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const LottieComponent = (Lottie as any).default || Lottie;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="w-full max-w-md">
        <LottieComponent animationData={animationData} loop={true} />
      </div>
      <h1 className="text-4xl font-extrabold mt-4 mb-2">404 - {t('not_found.title') || 'Page Not Found'}</h1>
      <p className="text-muted-foreground text-center mb-8 max-w-sm">
        {t('not_found.desc') || "Oops! The page you're looking for doesn't exist or has been moved."}
      </p>
      <button 
        onClick={() => navigate('/workspace')} 
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors"
      >
        {t('not_found.go_home') || 'Go to Dashboard'}
      </button>
    </div>
  );
}
