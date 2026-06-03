import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Icons } from '../../assets/icons';

export default function PreferencesTab() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-card rounded-2xl shadow-sm border border-border dark:bg-slate-800 dark:border-slate-700">
        <div className="p-6 border-b border-border dark:border-slate-700">
          <h3 className="text-lg font-bold text-foreground dark:text-white">{t('settings.theme')}</h3>
          <p className="text-sm text-muted-foreground mt-1 dark:text-muted-foreground">{t('settings.theme.desc')}</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setTheme('light')}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-border hover:border-blue-200 dark:border-slate-700 dark:hover:border-slate-600'}`}
          >
            <div className="w-full aspect-[4/3] rounded-md bg-muted border border-border overflow-hidden flex flex-col">
              <div className="h-3 bg-card border-b border-border w-full flex items-center px-1 gap-0.5">
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
              </div>
              <div className="flex-1 bg-background flex">
                <div className="w-1/4 h-full bg-slate-200/50 border-r border-border"></div>
                <div className="flex-1 p-2 flex flex-col gap-1">
                  <div className="h-1.5 w-1/2 bg-card rounded"></div>
                  <div className="h-1 w-full bg-slate-200 rounded mt-1"></div>
                  <div className="h-1 w-3/4 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground dark:text-slate-300">
              <Icons.sun size={16} />
              {t('theme.light')}
            </div>
          </button>

          <button 
            onClick={() => setTheme('dark')}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-border hover:border-blue-200 dark:border-slate-700 dark:hover:border-slate-600'}`}
          >
            <div className="w-full aspect-[4/3] rounded-md bg-slate-900 border border-slate-700 overflow-hidden flex flex-col">
              <div className="h-3 bg-slate-800 border-b border-slate-700 w-full flex items-center px-1 gap-0.5">
                <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                <div className="w-1 h-1 rounded-full bg-slate-600"></div>
              </div>
              <div className="flex-1 bg-slate-900 flex">
                <div className="w-1/4 h-full bg-slate-800/50 border-r border-slate-700"></div>
                <div className="flex-1 p-2 flex flex-col gap-1">
                  <div className="h-1.5 w-1/2 bg-slate-800 rounded"></div>
                  <div className="h-1 w-full bg-slate-700 rounded mt-1"></div>
                  <div className="h-1 w-3/4 bg-slate-700 rounded"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground dark:text-slate-300">
              <Icons.settings size={16} /> {/* Should be Moon, but fallback to settings */}
              {t('theme.dark')}
            </div>
          </button>

          <button 
            onClick={() => setTheme('system')}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-border hover:border-blue-200 dark:border-slate-700 dark:hover:border-slate-600'}`}
          >
            <div className="w-full aspect-[4/3] rounded-md overflow-hidden flex border border-border dark:border-slate-700">
              <div className="flex-1 bg-muted flex flex-col">
                <div className="h-3 bg-card border-b border-border w-full"></div>
                <div className="flex-1 bg-background flex">
                  <div className="w-1/3 h-full bg-slate-200/50 border-r border-border"></div>
                </div>
              </div>
              <div className="flex-1 bg-slate-900 flex flex-col border-l border-slate-700">
                <div className="h-3 bg-slate-800 border-b border-slate-700 w-full"></div>
                <div className="flex-1 bg-slate-900 flex">
                  <div className="flex-1"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground dark:text-slate-300">
              <Icons.monitorUp size={16} />
              {t('theme.system')}
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
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => setLanguage('en')}
              className={`flex-1 flex items-center justify-between p-4 rounded-xl border-2 transition-all ${language === 'en' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-border hover:border-blue-200 dark:border-slate-700 dark:hover:border-slate-600'}`}
            >
              <div className="flex items-center gap-3 text-sm font-semibold text-foreground dark:text-white">
                <div className="w-8 h-6 bg-slate-200 rounded flex items-center justify-center text-xs overflow-hidden">
                  EN
                </div>
                English
              </div>
              {language === 'en' && <Icons.checkCircle2 size={20} className="text-blue-500" />}
            </button>

            <button 
              onClick={() => setLanguage('vi')}
              className={`flex-1 flex items-center justify-between p-4 rounded-xl border-2 transition-all ${language === 'vi' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-border hover:border-blue-200 dark:border-slate-700 dark:hover:border-slate-600'}`}
            >
              <div className="flex items-center gap-3 text-sm font-semibold text-foreground dark:text-white">
                <div className="w-8 h-6 bg-rose-500 rounded flex items-center justify-center text-xs overflow-hidden text-white font-bold">
                  VN
                </div>
                Tiếng Việt
              </div>
              {language === 'vi' && <Icons.checkCircle2 size={20} className="text-blue-500" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
