import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icons } from '../../assets/icons';
import { teamService } from '../../services/team.service';
import type { Team } from '../../types/team.interface';
import { Skeleton } from '../../components/ui/Skeleton';
import TeamSettings from './team-tabs/TeamSettings';
import AddTeamMemberModal from './team-tabs/AddTeamMemberModal';
import TeamProjectsTab from './team-tabs/TeamProjectsTab';
import TeamTasksTab from './team-tabs/TeamTasksTab';
import { socketService } from '../../services/socketService';

const isValidImageUrl = (url: string | undefined | null) => {
  if (!url) return false;
  if (url === 'null' || url === 'undefined') return false;
  if (url.startsWith('blob:')) return false;
  return true;
};

type TeamTab = 'members' | 'projects' | 'tasks';

export default function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TeamTab>('members');
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [memberToKick, setMemberToKick] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadTeam = useCallback(async () => {
    if (!teamId) return;
    setIsLoading(true);
    try {
      const data = await teamService.getTeamById(teamId);
      setTeam(data);
    } catch (error) {
      console.error('Failed to load team', error);
      navigate('/workspace/teams');
    } finally {
      setIsLoading(false);
    }
  }, [teamId, navigate]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  // Subscribe to real-time UPDATE_TEAM events so members list refreshes immediately
  // after someone accepts a team invitation
  useEffect(() => {
    if (!teamId) return;

    let subscription: { unsubscribe: () => void } | null = null;

    socketService.connect(() => {
      subscription = socketService.subscribe(`/topic/team/${teamId}`, (message: any) => {
        if (message?.type === 'UPDATE_TEAM') {
          // Reload team silently (no loading spinner) so UI stays smooth
          teamService.getTeamById(teamId).then(setTeam).catch(console.error);
        }
      });
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
    // Note: we do not call socketService.disconnect() here because the socket
    // is shared across the app (singleton). Disconnecting here would kill
    // the notification socket too. The notification hook manages the lifecycle.
  }, [teamId]);

  const handleKickMember = async () => {
    if (!team || !memberToKick) return;
    try {
      await teamService.removeMember(team.id, memberToKick.id);
      setTeam({
        ...team,
        members: team.members.filter(m => m.id !== memberToKick.id)
      });
      setMemberToKick(null);
    } catch (error) {
      console.error('Failed to remove member', error);
      // Optional: add toast error here
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col relative w-full overflow-hidden">
        <Skeleton className="h-48 w-full bg-slate-200" />
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative -mt-12">
          <Skeleton className="w-24 h-24 rounded-2xl bg-card border-4 border-slate-50" />
          <Skeleton className="h-8 w-64 bg-slate-200 mt-4" />
          <Skeleton className="h-4 w-96 bg-slate-200 mt-2" />
        </div>
      </div>
    );
  }

  if (!team) return null;

  if (isEditing) {
    return (
      <div className="h-full flex flex-col relative w-full overflow-hidden bg-card">
        <TeamSettings team={team} onUpdate={setTeam} onClose={() => setIsEditing(false)} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative w-full overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto">
        {/* Cover Image */}
        <div className="h-48 w-full bg-slate-200 relative shrink-0">
          {isValidImageUrl(team.coverImage) ? (
            <img src={team.coverImage} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-400 to-indigo-500" />
          )}
          <div className="absolute top-4 left-4">
            <button 
              onClick={() => navigate('/workspace/teams')}
              className="w-10 h-10 rounded-full bg-card/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-card/30 transition-colors"
            >
              <Icons.chevronLeft size={20} />
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12">
          {/* Header Info */}
          <div className="relative -mt-12 mb-6 flex items-end justify-between">
            <div className="flex flex-col">
              <div className="w-24 h-24 rounded-2xl bg-card shadow-sm border-4 border-slate-50 flex items-center justify-center overflow-hidden mb-4 relative z-10">
                {isValidImageUrl(team.avatar) ? (
                  <img src={team.avatar} alt={team.name} className="w-full h-full object-cover" />
                ) : (
                  <Icons.users size={40} className="text-blue-500" />
                )}
              </div>
              <h1 className="text-3xl font-bold text-foreground">{team.name}</h1>
              <p className="text-muted-foreground mt-1 max-w-2xl">{team.description || 'No description provided.'}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-card border border-border text-foreground font-semibold rounded-xl hover:bg-background transition-colors text-sm flex items-center gap-2 shadow-sm"
              >
                <Icons.settings size={16} />
                Settings
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 border-b border-border mb-6">
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'members' ? 'text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Members
              {activeTab === 'members' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'projects' ? 'text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Projects
              {activeTab === 'projects' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'tasks' ? 'text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Work
              {activeTab === 'tasks' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-card rounded-2xl border border-border shadow-sm">
            {activeTab === 'members' && (
              <div className="flex flex-col">
                <div className="p-4 border-b border-border flex items-center justify-between bg-card rounded-t-2xl">
                  <div className="relative w-64">
                    <Icons.search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Find members..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all" 
                    />
                  </div>
                  <button 
                    onClick={() => setIsAddingMember(true)}
                    className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Icons.userPlus size={16} />
                    Add Member
                  </button>
                </div>
                
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-background border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-bold">
                      <th className="px-6 py-3 font-semibold">User</th>
                      <th className="px-6 py-3 font-semibold">Role</th>
                      <th className="px-6 py-3 font-semibold">Joined</th>
                      <th className="px-6 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.members
                      .filter(member => member.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(member => (
                      <tr key={member.id} className="border-b border-slate-50 hover:bg-background/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                              {isValidImageUrl(member.avatar) ? <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" /> : member.name.charAt(0)}
                            </div>
                            <span className="font-semibold text-foreground text-sm">{member.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${member.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <button 
                            onClick={() => setOpenDropdownId(openDropdownId === member.id ? null : member.id)}
                            className="text-muted-foreground hover:text-muted-foreground p-1.5 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                            <Icons.moreHorizontal size={16} />
                          </button>

                          {openDropdownId === member.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)}></div>
                              <div className="absolute right-6 top-10 mt-1 w-32 bg-card rounded-xl shadow-lg border border-border py-1 z-20 text-left">
                                <button
                                  onClick={() => {
                                    setMemberToKick(member);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                >
                                  <Icons.trash2 size={14} />
                                  Kick Member
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'projects' && team && (
              <TeamProjectsTab teamId={team.id} />
            )}

            {activeTab === 'tasks' && team && (
              <TeamTasksTab teamId={team.id} />
            )}
          </div>
        </div>
      </div>

      {isAddingMember && team && (
        <AddTeamMemberModal 
          team={team} 
          onClose={() => setIsAddingMember(false)} 
          onSuccess={(updatedTeam) => {
            setTeam(updatedTeam);
            setIsAddingMember(false);
          }}
        />
      )}

      {/* Confirmation Modal */}
      {memberToKick && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-xl overflow-hidden relative">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <Icons.alertTriangle size={24} />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Remove Member</h2>
              <p className="text-muted-foreground">
                Are you sure you want to remove <span className="font-semibold text-foreground">{memberToKick.name}</span> from the team? They will lose access to team resources.
              </p>
            </div>
            <div className="px-6 py-4 bg-background border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setMemberToKick(null)}
                className="px-4 py-2 font-semibold text-muted-foreground hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleKickMember}
                className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
