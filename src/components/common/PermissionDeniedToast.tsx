import { useEffect } from 'react';
import { Icons } from '../../assets/icons';
import { permissionDeniedEvent } from '../../utils/permission-denied-event';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';

export default function PermissionDeniedToast() {
  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = permissionDeniedEvent.subscribe((msg) => {
      toast.error(t('common.permission_denied_title') || 'Hành động bị chặn', {
        description: t(msg || '') || msg,
        icon: <Icons.ban size={18} className="text-destructive" />,
        duration: 5000,
      });
    });

    return unsubscribe;
  }, [t]);

  return null;
}
