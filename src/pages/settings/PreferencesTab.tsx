import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Icons } from '../../assets/icons';

export default function PreferencesTab() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languageOptions = [
    { id: 'vi', label: 'Tiếng Việt (Việt Nam)', flag: 'VN', color: 'bg-[#0052cc]' },
    { id: 'en', label: 'English (US)', flag: 'EN', color: 'bg-slate-500' }
  ];

  const currentLang = languageOptions.find(l => l.id === language) || languageOptions[0];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-card rounded-2xl shadow-sm border border-border dark:bg-slate-800 dark:border-slate-700">
        <div className="p-6 border-b border-border dark:border-slate-700">
          <h3 className="text-lg font-bold text-foreground dark:text-white">{t('settings.theme')}</h3>
          <p className="text-sm text-muted-foreground mt-1 dark:text-muted-foreground">{t('settings.theme.desc')}</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Light Theme */}
          <button 
            onClick={() => setTheme('light')}
            className={`flex flex-col items-center gap-4 group p-1`}
          >
            <div className={`relative w-full aspect-[1.6/1] rounded-xl overflow-hidden flex flex-col transition-all bg-white ${theme === 'light' ? 'border border-blue-500 shadow-sm ring-1 ring-blue-500' : 'border border-slate-200 hover:border-slate-300 shadow-sm'}`}>
              
              {/* Checkmark */}
              {theme === 'light' && (
                <div className="absolute top-3 right-3 w-[22px] h-[22px] bg-[#0052cc] rounded-full flex items-center justify-center text-white z-10 shadow-sm">
                  <Icons.check size={14} strokeWidth={3} />
                </div>
              )}

              {/* Mockup Header */}
              <div className="h-8 border-b border-slate-100 w-full flex items-center px-4 gap-1.5 shrink-0">
                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
              </div>
              
              {/* Mockup Content */}
              <div className="flex-1 p-5 flex flex-col gap-3">
                <div className="h-3 w-[85%] bg-blue-100/60 rounded-full"></div>
                <div className="h-3 w-[55%] bg-blue-100/60 rounded-full"></div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-[14px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-foreground transition-colors">
              <Icons.sun size={18} />
              {t('theme.light')}
            </div>
          </button>

          {/* Dark Theme */}
          <button 
            onClick={() => setTheme('dark')}
            className={`flex flex-col items-center gap-4 group p-1`}
          >
            <div className={`relative w-full aspect-[1.6/1] rounded-xl overflow-hidden flex flex-col transition-all bg-[#1b1b1d] ${theme === 'dark' ? 'border border-blue-500 shadow-sm ring-1 ring-blue-500' : 'border border-slate-200 dark:border-slate-700 hover:border-slate-300 shadow-sm'}`}>
              
              {/* Checkmark */}
              {theme === 'dark' && (
                <div className="absolute top-3 right-3 w-[22px] h-[22px] bg-[#0052cc] rounded-full flex items-center justify-center text-white z-10 shadow-sm">
                  <Icons.check size={14} strokeWidth={3} />
                </div>
              )}

              {/* Mockup Header */}
              <div className="h-8 border-b border-white/5 w-full flex items-center px-4 gap-1.5 bg-[#141517] shrink-0">
                <div className="w-2 h-2 rounded-full bg-white/10"></div>
                <div className="w-2 h-2 rounded-full bg-white/10"></div>
                <div className="w-2 h-2 rounded-full bg-white/10"></div>
              </div>
              
              {/* Mockup Content */}
              <div className="flex-1 p-5 flex flex-col gap-3">
                <div className="h-3 w-[85%] bg-white/5 rounded-full"></div>
                <div className="h-3 w-[55%] bg-white/5 rounded-full"></div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-[14px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-foreground transition-colors">
              <Icons.moon size={18} />
              {t('theme.dark')}
            </div>
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border dark:bg-slate-800 dark:border-slate-700">
        <div className="p-6 border-b border-border dark:border-slate-700">
          <h3 className="text-lg font-bold text-foreground dark:text-white">{t('settings.language')}</h3>
          <p className="text-sm text-muted-foreground mt-1 dark:text-muted-foreground">{t('settings.language.desc')}</p>
        </div>
        <div className="p-6">
          <div className="relative max-w-[320px]" ref={langDropdownRef}>
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 transition-colors bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-[18px] ${currentLang.color} rounded flex items-center justify-center text-[10px] text-white font-bold leading-none`}>
                  {currentLang.flag}
                </div>
                <span className="text-[14px] font-medium text-slate-700 dark:text-slate-300">{currentLang.label}</span>
              </div>
              <Icons.chevronDown size={18} className="text-slate-500" />
            </button>
            
            {isLangOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden z-20 py-1">
                {languageOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setLanguage(option.id);
                      setIsLangOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${language === option.id ? 'bg-slate-50 dark:bg-slate-700/50' : ''}`}
                  >
                    <div className={`w-6 h-[18px] ${option.color} rounded flex items-center justify-center text-[10px] text-white font-bold leading-none`}>
                      {option.flag}
                    </div>
                    <span className="text-[14px] font-medium text-slate-700 dark:text-slate-300">{option.label}</span>
                    {language === option.id && (
                      <Icons.check size={16} className="text-[#0052cc] ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
