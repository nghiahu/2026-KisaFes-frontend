import { useState, useEffect } from 'react';
import { Icons } from '../../assets/icons';
import { permissionDeniedEvent } from '../../utils/permission-denied-event';

export default function PermissionDeniedToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = permissionDeniedEvent.subscribe((msg) => {
      setMessage(msg);
      setIsVisible(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isVisible && message) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000); // Tự động ẩn sau 5 giây
      return () => clearTimeout(timer);
    }
  }, [isVisible, message]);

  if (!message) return null;

  return (
    <div 
      className={`fixed bottom-6 left-6 z-[9999] transition-all duration-500 ease-out transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div className="bg-card border-l-4 border-rose-500 shadow-2xl rounded-r-xl border border-border/80 p-4 max-w-sm flex gap-3.5 items-start backdrop-blur-md bg-card/95">
        <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0 shadow-sm shadow-rose-100 animate-pulse">
          <Icons.ban size={18} />
        </div>
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="text-sm font-black text-foreground tracking-tight">Hành động bị chặn</h4>
          <p className="text-xs font-semibold text-muted-foreground mt-1 leading-relaxed">
            {message}
          </p>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-muted-foreground hover:text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-all shrink-0"
        >
          <Icons.x size={14} />
        </button>
      </div>
    </div>
  );
}
