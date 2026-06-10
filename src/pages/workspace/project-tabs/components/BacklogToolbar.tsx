import React from 'react';
import { Icons } from '../../../../assets/icons';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface BacklogToolbarProps {
  searchKeyword: string;
  setSearchKeyword: (val: string) => void;
  showFilterPanel: boolean;
  setShowFilterPanel: React.Dispatch<React.SetStateAction<boolean>>;
  activeFilterCategory: string;
  setActiveFilterCategory: (val: string) => void;
  filterAssignees: string[];
  setFilterAssignees: React.Dispatch<React.SetStateAction<string[]>>;
  filterAssigneeSearch: string;
  setFilterAssigneeSearch: (val: string) => void;
  filterTypes: string[];
  setFilterTypes: React.Dispatch<React.SetStateAction<string[]>>;
  filterStatuses: string[];
  setFilterStatuses: React.Dispatch<React.SetStateAction<string[]>>;
  filterPriorities: string[];
  setFilterPriorities: React.Dispatch<React.SetStateAction<string[]>>;
  totalActiveFilters: number;
  filterBtnRef: React.RefObject<HTMLButtonElement | null>;
  filterPanelRef: React.RefObject<HTMLDivElement | null>;
  currentProject: any;
}

export function BacklogToolbar({
  searchKeyword, setSearchKeyword,
  showFilterPanel, setShowFilterPanel,
  activeFilterCategory, setActiveFilterCategory,
  filterAssignees, setFilterAssignees,
  filterAssigneeSearch, setFilterAssigneeSearch,
  filterTypes, setFilterTypes,
  filterStatuses, setFilterStatuses,
  filterPriorities, setFilterPriorities,
  totalActiveFilters,
  filterBtnRef, filterPanelRef,
  currentProject
}: BacklogToolbarProps) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="relative">
        <input
          type="text"
          placeholder={t('backlog.search')}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="pl-8 pr-3 py-1.5 text-[13px] border border-border rounded-sm w-48 focus:outline-none focus:border-blue-400"
        />
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Icons.search size={14} />
        </div>
      </div>

      <div className="relative">
        <button
          ref={filterBtnRef}
          onClick={() => setShowFilterPanel(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all shadow-sm ${totalActiveFilters > 0
              ? 'bg-primary/10 border-blue-300 text-blue-700 hover:bg-primary/20'
              : 'bg-background border-border hover:bg-muted text-foreground'
            }`}
        >
          <Icons.filter size={13} className={totalActiveFilters > 0 ? 'text-primary' : 'text-muted-foreground'} />
          <span>{t('backlog.filter')}</span>
          {totalActiveFilters > 0 && (
            <span className="ml-0.5 bg-primary text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {totalActiveFilters}
            </span>
          )}
        </button>

        {/* Filter Dropdown */}
        {showFilterPanel && (
          <div
            ref={filterPanelRef}
            className="absolute top-full left-0 mt-1.5 w-[420px] bg-card border border-border shadow-2xl rounded-xl z-[200] overflow-hidden"
          >
            <div className="flex" style={{ minHeight: 240 }}>
              <div className="w-36 border-r border-border py-1.5 shrink-0 bg-background/60">
                {[
                  { id: 'Assignee', label: t('backlog.filter_assignee'), count: filterAssignees.length },
                  { id: 'Work type', label: t('backlog.filter_type'), count: filterTypes.length },
                  { id: 'Status', label: t('backlog.filter_status'), count: filterStatuses.length },
                  { id: 'Priority', label: t('backlog.filter_priority'), count: filterPriorities.length },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveFilterCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[12px] font-medium text-left transition-colors ${activeFilterCategory === cat.id
                        ? 'bg-card text-blue-700 border-l-2 border-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-card/70 border-l-2 border-transparent'
                      }`}
                  >
                    <span>{cat.label}</span>
                    {cat.count > 0 && (
                      <span className="bg-primary text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shrink-0">{cat.count}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex-1 py-2 px-3 overflow-y-auto max-h-[300px]">
                {activeFilterCategory === 'Assignee' && (
                  <div className="flex flex-col h-full">
                    <div className="sticky top-0 bg-card pb-2 z-10">
                      <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-2.5 py-1.5 focus-within:border-blue-400 focus-within:bg-card transition-all">
                        <Icons.search size={12} className="text-muted-foreground shrink-0" />
                        <input
                          type="text"
                          placeholder={t('backlog.search_assignee')}
                          value={filterAssigneeSearch}
                          onChange={e => setFilterAssigneeSearch(e.target.value)}
                          className="flex-1 text-[12px] text-foreground bg-transparent outline-none placeholder:text-muted-foreground"
                        />
                        {filterAssigneeSearch && (
                          <button onClick={() => setFilterAssigneeSearch('')} className="text-muted-foreground hover:text-muted-foreground shrink-0">
                            <Icons.x size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="overflow-y-auto space-y-0.5">
                      {[
                        { id: 'unassigned', name: t('backlog.unassigned'), avatar: null },
                        ...(currentProject?.members || []).map((m: any) => ({ id: m.id, name: m.name, avatar: m.avatar }))
                      ].filter(member => !filterAssigneeSearch.trim() || member.name.toLowerCase().includes(filterAssigneeSearch.toLowerCase())).map(member => {
                        const checked = filterAssignees.includes(member.id);
                        return (
                          <label key={member.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-background cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => setFilterAssignees(prev => checked ? prev.filter(x => x !== member.id) : [...prev, member.id])}
                              className="rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5"
                            />
                            {member.avatar
                              ? <img  src={member.avatar} alt={member.name} className="w-5 h-5 rounded-full object-cover border border-border shrink-0" />
                              : <div className="w-5 h-5 rounded-full bg-muted border border-dashed border-slate-300 flex items-center justify-center text-muted-foreground shrink-0"><Icons.user size={10} /></div>
                            }
                            <span className="text-[12px] font-medium text-foreground truncate">{member.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                {activeFilterCategory === 'Work type' && (
                  <div className="space-y-0.5">
                    {[{ v: 'Epic', color: 'text-violet-600' }, { v: 'Task', color: 'text-primary' }, { v: 'Incident', color: 'text-rose-600' }, { v: 'Service Request', color: 'text-amber-600' }].map(({ v, color }) => {
                      const checked = filterTypes.includes(v);
                      return (
                        <label key={v} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-background cursor-pointer">
                          <input type="checkbox" checked={checked} onChange={() => setFilterTypes(prev => checked ? prev.filter(x => x !== v) : [...prev, v])} className="rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5" />
                          <span className={`text-[12px] font-semibold ${color}`}>{v}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {activeFilterCategory === 'Status' && (
                  <div className="space-y-0.5">
                    {(currentProject?.statuses || []).map((s: any) => {
                      const checked = filterStatuses.includes(s.statusId);
                      return (
                        <label key={s.statusId} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-background cursor-pointer">
                          <input type="checkbox" checked={checked} onChange={() => setFilterStatuses(prev => checked ? prev.filter(x => x !== s.statusId) : [...prev, s.statusId])} className="rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5" />
                          <span className="text-[12px] font-medium text-foreground">{s.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {activeFilterCategory === 'Priority' && (
                  <div className="space-y-0.5">
                    {['Highest', 'High', 'Medium', 'Low', 'Lowest'].map(priority => {
                      const checked = filterPriorities.includes(priority);
                      return (
                        <label key={priority} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-background cursor-pointer">
                          <input type="checkbox" checked={checked} onChange={() => setFilterPriorities(prev => checked ? prev.filter(x => x !== priority) : [...prev, priority])} className="rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5" />
                          <span className={`text-[12px] font-medium`}>{priority}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-background/50">
              <button
                onClick={() => { setFilterAssignees([]); setFilterTypes([]); setFilterStatuses([]); setFilterPriorities([]); }}
                className={`text-[11px] font-semibold transition-colors ${totalActiveFilters > 0 ? 'text-muted-foreground hover:text-foreground' : 'text-slate-300 cursor-default'
                  }`}
              >
                {t('backlog.clear_all')}
              </button>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="text-[11px] font-bold px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                {t('backlog.done')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
