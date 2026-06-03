import { useState } from 'react';
import { Icons } from '../assets/icons';
import { useLanguage } from '../contexts/LanguageContext';
import ProfileTab from './settings/ProfileTab';
import PreferencesTab from './settings/PreferencesTab';

type Tab = 'profile' | 'preferences' | 'notifications' | 'security';

export default function ProfileSettings() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const { t } = useLanguage();

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'profile', label: t('settings.profile'), icon: <Icons.user size={18} /> },
    { id: 'preferences', label: t('settings.preferences'), icon: <Icons.slidersHorizontal size={18} /> },
    { id: 'notifications', label: t('settings.notifications'), icon: <Icons.bell size={18} /> },
    { id: 'security', label: t('settings.security'), icon: <Icons.shield size={18} /> },
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Icons.settings className="text-slate-400" /> {t('settings.title')}
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="flex flex-col gap-1 sticky top-24">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full min-w-0">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'preferences' && <PreferencesTab />}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center dark:bg-slate-800 dark:border-slate-700">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.bell size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Notifications Coming Soon</h3>
              <p className="text-slate-500 dark:text-slate-400">We are working on bringing you fine-grained notification controls.</p>
            </div>
          )}
          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center dark:bg-slate-800 dark:border-slate-700">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.shield size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Security Settings Coming Soon</h3>
              <p className="text-slate-500 dark:text-slate-400">Change password, 2FA, and session management will be here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
