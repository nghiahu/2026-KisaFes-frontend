import React, { useRef, useState, useEffect } from 'react';
import { Icons } from '../../../../../assets/icons';
import { useProjectList } from './ProjectListContext';
import { useLanguage } from '../../../../../contexts/LanguageContext';

export function ProjectListToolbar() {
  const {
    currentProject,
    searchKeyword,
    setSearchKeyword,
    tasksState: { setCurrentPage },
    filtersState: {
      activeFilterCategory, setActiveFilterCategory,
      filterAssignees, setFilterAssignees,
      filterAssigneeSearch, setFilterAssigneeSearch,
      filterTypes, setFilterTypes,
      filterStatuses, setFilterStatuses,
      filterPriorities, setFilterPriorities,
      groupBy, setGroupBy,
      totalActiveFilters, clearAllFilters
    }
  } = useProjectList();
  
  const { t } = useLanguage();

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');

  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const groupBtnRef = useRef<HTMLButtonElement>(null);
  const groupDropdownRef = useRef<HTMLDivElement>(null);

  const projectMembers = currentProject?.members?.filter((m: any) => m.active !== false) || [];

  const GROUP_OPTIONS = [
    { id: 'status', label: t('list.group_status') },
    { id: 'assignee', label: t('list.group_assignee') },
    { id: 'priority', label: t('list.group_priority') },
    { id: 'type', label: t('list.group_type') },
    { id: 'reporter', label: t('list.group_reporter') },
  ];

  const PRIORITIES = [
    { label: 'Highest', icon: <Icons.chevronsUp size={12} className="text-rose-500" />, color: 'text-rose-600' },
    { label: 'High', icon: <Icons.chevronUp size={12} className="text-orange-500" />, color: 'text-orange-500' },
    { label: 'Medium', icon: <Icons.equal size={12} strokeWidth={3} className="text-amber-500" />, color: 'text-amber-500' },
    { label: 'Low', icon: <Icons.chevronDown size={12} className="text-blue-400" />, color: 'text-blue-400' },
    { label: 'Lowest', icon: <Icons.chevronsDown size={12} className="text-muted-foreground" />, color: 'text-muted-foreground' },
  ];

  const getPriorityIcon = (priority: string | null | undefined) => {
    const p = PRIORITIES.find(x => x.label?.toLowerCase() === (priority || '').toLowerCase());
    return p ? p.icon : <Icons.equal size={12} strokeWidth={3} className="text-amber-500" />;
  };

  const getPriorityColor = (priority: string | null | undefined) => {
    const p = PRIORITIES.find(x => x.label?.toLowerCase() === (priority || '').toLowerCase());
    return p ? p.color : 'text-muted-foreground';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideFilter = filterPanelRef.current ? !filterPanelRef.current.contains(event.target as Node) : true;
      const isOutsideFilterBtn = filterBtnRef.current ? !filterBtnRef.current.contains(event.target as Node) : true;
      if (isOutsideFilter && isOutsideFilterBtn) {
        setShowFilterPanel(false);
      }

      const isOutsideGroup = groupDropdownRef.current ? !groupDropdownRef.current.contains(event.target as Node) : true;
      const isOutsideGroupBtn = groupBtnRef.current ? !groupBtnRef.current.contains(event.target as Node) : true;
      if (isOutsideGroup && isOutsideGroupBtn) {
        setShowGroupDropdown(false);
      }
    };
    if (showFilterPanel || showGroupDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterPanel, showGroupDropdown]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 bg-card border-b border-border shrink-0">
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative">
          <Icons.search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('list.search_work')}
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 pr-3 py-1.5 w-44 bg-background/50 border border-border hover:border-slate-300 focus:border-blue-500 focus:bg-card rounded-lg text-xs font-semibold text-foreground outline-none transition-all shadow-sm"
          />
        </div>

        {/* Filter Button */}
        <div className="relative">
          <button
            ref={filterBtnRef}
            onClick={() => { setShowFilterPanel(v => !v); setShowGroupDropdown(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all shadow-sm ${
              totalActiveFilters > 0
                ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                : 'bg-background border-border hover:bg-muted text-foreground'
            }`}
          >
            <Icons.filter size={13} className={totalActiveFilters > 0 ? 'text-blue-500' : 'text-muted-foreground'} />
            <span>{t('list.filter')}</span>
            {totalActiveFilters > 0 && (
              <span className="ml-0.5 bg-blue-600 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
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
                {/* Left: Filter Categories */}
                <div className="w-36 border-r border-border py-1.5 shrink-0 bg-background/60">
                  {[
                    { id: 'Assignee', label: t('list.group_assignee'), count: filterAssignees.length },
                    { id: 'Work type', label: t('list.group_type'), count: filterTypes.length },
                    { id: 'Status', label: t('list.group_status'), count: filterStatuses.length },
                    { id: 'Priority', label: t('list.group_priority'), count: filterPriorities.length },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveFilterCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-[12px] font-medium text-left transition-colors ${
                        activeFilterCategory === cat.id
                          ? 'bg-card text-blue-700 border-l-2 border-blue-600 shadow-sm'
                          : 'text-muted-foreground hover:bg-card/70 border-l-2 border-transparent'
                      }`}
                    >
                      <span>{cat.label}</span>
                      {cat.count > 0 && (
                        <span className="bg-blue-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shrink-0">{cat.count}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Right: Filter Values */}
                <div className="flex-1 py-2 px-3 overflow-y-auto max-h-[300px]">
                  {activeFilterCategory === 'Assignee' && (
                    <div className="flex flex-col h-full">
                      <div className="sticky top-0 bg-card pb-2 z-10">
                        <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-2.5 py-1.5 focus-within:border-blue-400 focus-within:bg-card transition-all">
                          <Icons.search size={12} className="text-muted-foreground shrink-0" />
                          <input
                            type="text"
                            placeholder={t('list.filter_search_assignee')}
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
                          { id: 'unassigned', name: t('list.unassigned'), avatar: null },
                          ...projectMembers.map((m: any) => ({ id: m.id, name: m.name, avatar: m.avatar }))
                        ].filter(member => !filterAssigneeSearch.trim() || member.name.toLowerCase().includes(filterAssigneeSearch.toLowerCase())).map(member => {
                          const checked = filterAssignees.includes(member.id);
                          return (
                            <label key={member.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-background cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => setFilterAssignees(prev => checked ? prev.filter(x => x !== member.id) : [...prev, member.id])}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
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
                      {[{ v: 'Epic', color: 'text-violet-600' }, { v: 'Task', color: 'text-blue-600' }, { v: 'Incident', color: 'text-rose-600' }, { v: 'Service Request', color: 'text-amber-600' }].map(({ v, color }) => {
                        const checked = filterTypes.includes(v);
                        return (
                          <label key={v} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-background cursor-pointer">
                            <input type="checkbox" checked={checked} onChange={() => setFilterTypes(prev => checked ? prev.filter(x => x !== v) : [...prev, v])} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
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
                            <input type="checkbox" checked={checked} onChange={() => setFilterStatuses(prev => checked ? prev.filter(x => x !== s.statusId) : [...prev, s.statusId])} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
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
                            <input type="checkbox" checked={checked} onChange={() => setFilterPriorities(prev => checked ? prev.filter(x => x !== priority) : [...prev, priority])} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
                            <span className="flex items-center gap-1.5">
                              {getPriorityIcon(priority)}
                              <span className={`text-[12px] font-medium ${getPriorityColor(priority)}`}>{priority}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-background/50">
                <button
                  onClick={clearAllFilters}
                  className={`text-[11px] font-semibold transition-colors ${
                    totalActiveFilters > 0 ? 'text-muted-foreground hover:text-foreground' : 'text-slate-300 cursor-default'
                  }`}
                >
                  {t('list.filter_clear_all')}
                </button>
                <button
                  onClick={() => setShowFilterPanel(false)}
                  className="text-[11px] font-bold px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('list.filter_done')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Group Button */}
        <div className="relative">
          <button
            ref={groupBtnRef}
            onClick={() => { setShowGroupDropdown(v => !v); setShowFilterPanel(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all shadow-sm ${
              groupBy
                ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                : 'bg-background border-border hover:bg-muted text-foreground'
            }`}
          >
            <Icons.layers size={13} className={groupBy ? 'text-blue-500' : 'text-muted-foreground'} />
            <span>{t('list.group')}{groupBy ? `: ${GROUP_OPTIONS.find(g => g.id === groupBy)?.label}` : ''}</span>
          </button>

          {/* Group Dropdown */}
          {showGroupDropdown && (
            <div
              ref={groupDropdownRef}
              className="absolute top-full left-0 mt-1.5 w-[240px] bg-card border border-border shadow-2xl rounded-xl py-2 z-[200] overflow-hidden"
            >
              <div className="px-3 pb-2">
                <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-2.5 py-1.5 focus-within:border-blue-400 focus-within:bg-card transition-all">
                  <Icons.search size={12} className="text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    placeholder={t('list.group_search')}
                    value={groupSearch}
                    onChange={e => setGroupSearch(e.target.value)}
                    autoFocus
                    className="flex-1 text-[12px] text-foreground bg-transparent outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="max-h-[260px] overflow-y-auto">
                <div className="px-3 py-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('list.group_all_fields')}</span>
                </div>
                {GROUP_OPTIONS.filter(g => g.label.toLowerCase().includes(groupSearch.toLowerCase())).map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setGroupBy(groupBy === opt.id ? null : opt.id); setShowGroupDropdown(false); setGroupSearch(''); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[13px] font-medium transition-colors text-left ${
                      groupBy === opt.id ? 'bg-blue-50 text-blue-700' : 'text-foreground hover:bg-background'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {groupBy === opt.id && <Icons.check size={13} className="text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="border-t border-border mt-1 pt-1 px-3">
                <button
                  onClick={() => { setGroupBy(null); setShowGroupDropdown(false); }}
                  className={`text-[12px] font-medium py-1.5 transition-colors ${
                    groupBy ? 'text-muted-foreground hover:text-foreground' : 'text-slate-300 cursor-default'
                  }`}
                >
                  {t('list.group_clear')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="text-[11px] font-bold text-muted-foreground">{t('list.saved_filters')} v</span>
        <div className="flex items-center border border-border rounded-lg overflow-hidden p-0.5 bg-background shadow-sm">
          <button className="p-1 bg-card rounded-md shadow-sm border border-border text-foreground shrink-0">
            <Icons.listTodo size={13} />
          </button>
          <button className="p-1 text-muted-foreground hover:text-muted-foreground shrink-0">
            <Icons.kanbanSquare size={13} />
          </button>
        </div>
        <button className="p-1.5 text-muted-foreground hover:text-muted-foreground rounded-lg hover:bg-background transition-colors">
          <Icons.moreHorizontal size={14} />
        </button>
      </div>
    </div>
  );
}
