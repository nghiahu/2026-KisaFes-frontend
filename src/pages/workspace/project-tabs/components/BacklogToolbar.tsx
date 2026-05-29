import React from 'react';
import { Icons } from '../../../../assets/icons';

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
  filterBtnRef: React.RefObject<HTMLButtonElement>;
  filterPanelRef: React.RefObject<HTMLDivElement>;
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
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search backlog"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="pl-8 pr-3 py-1.5 text-[13px] border border-slate-200 rounded-sm w-48 focus:outline-none focus:border-blue-400"
        />
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
          <Icons.search size={14} />
        </div>
      </div>

      <div className="relative">
        <button
          ref={filterBtnRef}
          onClick={() => setShowFilterPanel(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all shadow-sm ${totalActiveFilters > 0
              ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
        >
          <Icons.filter size={13} className={totalActiveFilters > 0 ? 'text-blue-500' : 'text-slate-400'} />
          <span>Filter</span>
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
            className="absolute top-full left-0 mt-1.5 w-[420px] bg-white border border-slate-200 shadow-2xl rounded-xl z-[200] overflow-hidden"
          >
            <div className="flex" style={{ minHeight: 240 }}>
              <div className="w-36 border-r border-slate-100 py-1.5 shrink-0 bg-slate-50/60">
                {[
                  { id: 'Assignee', count: filterAssignees.length },
                  { id: 'Work type', count: filterTypes.length },
                  { id: 'Status', count: filterStatuses.length },
                  { id: 'Priority', count: filterPriorities.length },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveFilterCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[12px] font-medium text-left transition-colors ${activeFilterCategory === cat.id
                        ? 'bg-white text-blue-700 border-l-2 border-blue-600 shadow-sm'
                        : 'text-slate-600 hover:bg-white/70 border-l-2 border-transparent'
                      }`}
                  >
                    <span>{cat.id}</span>
                    {cat.count > 0 && (
                      <span className="bg-blue-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shrink-0">{cat.count}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex-1 py-2 px-3 overflow-y-auto max-h-[300px]">
                {activeFilterCategory === 'Assignee' && (
                  <div className="flex flex-col h-full">
                    <div className="sticky top-0 bg-white pb-2 z-10">
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:border-blue-400 focus-within:bg-white transition-all">
                        <Icons.search size={12} className="text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Search assignee..."
                          value={filterAssigneeSearch}
                          onChange={e => setFilterAssigneeSearch(e.target.value)}
                          className="flex-1 text-[12px] text-slate-700 bg-transparent outline-none placeholder:text-slate-400"
                        />
                        {filterAssigneeSearch && (
                          <button onClick={() => setFilterAssigneeSearch('')} className="text-slate-400 hover:text-slate-600 shrink-0">
                            <Icons.x size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="overflow-y-auto space-y-0.5">
                      {[
                        { id: 'unassigned', name: 'Unassigned', avatar: null },
                        ...(currentProject?.members || []).map((m: any) => ({ id: m.id, name: m.name, avatar: m.avatar }))
                      ].filter(member => !filterAssigneeSearch.trim() || member.name.toLowerCase().includes(filterAssigneeSearch.toLowerCase())).map(member => {
                        const checked = filterAssignees.includes(member.id);
                        return (
                          <label key={member.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => setFilterAssignees(prev => checked ? prev.filter(x => x !== member.id) : [...prev, member.id])}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                            {member.avatar
                              ? <img src={member.avatar} alt={member.name} className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0" />
                              : <div className="w-5 h-5 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0"><Icons.user size={10} /></div>
                            }
                            <span className="text-[12px] font-medium text-slate-700 truncate">{member.name}</span>
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
                        <label key={v} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
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
                        <label key={s.statusId} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                          <input type="checkbox" checked={checked} onChange={() => setFilterStatuses(prev => checked ? prev.filter(x => x !== s.statusId) : [...prev, s.statusId])} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
                          <span className="text-[12px] font-medium text-slate-700">{s.label}</span>
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
                        <label key={priority} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                          <input type="checkbox" checked={checked} onChange={() => setFilterPriorities(prev => checked ? prev.filter(x => x !== priority) : [...prev, priority])} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5" />
                          <span className={`text-[12px] font-medium`}>{priority}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => { setFilterAssignees([]); setFilterTypes([]); setFilterStatuses([]); setFilterPriorities([]); }}
                className={`text-[11px] font-semibold transition-colors ${totalActiveFilters > 0 ? 'text-slate-500 hover:text-slate-800' : 'text-slate-300 cursor-default'
                  }`}
              >
                Clear all
              </button>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="text-[11px] font-bold px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
