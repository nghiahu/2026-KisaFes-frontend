export default function ProjectRoadmap() {
  return (
    <div className="bg-card rounded-3xl p-6 border border-border shadow-sm flex flex-col gap-4 m-6">
      <div>
        <h3 className="font-bold text-foreground text-lg">Project Timeline & Phases</h3>
        <p className="text-muted-foreground text-xs font-semibold mt-0.5">Visualize project milestones, epics, and high-level roadmap</p>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        <div className="border border-border rounded-3xl p-4 bg-background/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <h4 className="font-bold text-sm text-foreground">Phase 1: Architecture & Auth Cache</h4>
            </div>
            <span className="text-xs text-muted-foreground font-bold">May 1 - May 20 (Completed)</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="border border-border rounded-3xl p-4 bg-background/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <h4 className="font-bold text-sm text-foreground">Phase 2: Project Management Wizard & Categories</h4>
            </div>
            <span className="text-xs text-muted-foreground font-bold">May 20 - Jun 15 (Active)</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: '60%' }} />
          </div>
        </div>

        <div className="border border-border rounded-3xl p-4 bg-background/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-300" />
              <h4 className="font-bold text-sm text-foreground">Phase 3: Sprints & Analytics Timeline</h4>
            </div>
            <span className="text-xs text-muted-foreground font-bold">Jun 15 - Jul 10 (Planning)</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-slate-300 rounded-full" style={{ width: '0%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
