import { useState, useEffect } from 'react';
import { Icons } from '../../assets/icons';
import { useNavigate } from 'react-router-dom';
import { teamService } from '../../services/team.service';
import type { Team } from '../../types/team.interface';
import CreateTeamModal from '../../components/workspace/CreateTeamModal';
import { Skeleton } from '../../components/ui/Skeleton';
import defaultMan from '../../assets/avatar_def_man.png';
import { useLanguage } from '../../contexts/LanguageContext';

const isValidImageUrl = (url: string | undefined | null) => {
  if (!url) return false;
  if (url === 'null' || url === 'undefined') return false;
  if (url.startsWith('blob:')) return false;
  return true;
};

export default function Teams() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { t } = useLanguage();

  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const data = await teamService.getTeams();
      setTeams(data);
    } catch (error) {
      console.error('Failed to load teams', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (team.description && team.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('teams.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('teams.desc')}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
        >
          <Icons.plus size={18} strokeWidth={2.5} />
          {t('teams.create_team')}
        </button>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Icons.search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('teams.search_placeholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-6 border border-border h-[220px] flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="w-12 h-12 rounded-xl bg-muted" />
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="h-5 w-3/4 bg-muted" />
                  <Skeleton className="h-3 w-1/2 bg-muted" />
                </div>
              </div>
              <Skeleton className="h-4 w-full bg-muted mb-2" />
              <Skeleton className="h-4 w-4/5 bg-muted" />
              <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                <Skeleton className="h-6 w-20 bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTeams.map(team => (
            <div
              key={team.id}
              onClick={() => navigate(`/workspace/teams/${team.id}`)}
              className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col group h-[220px]"
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center shrink-0 border border-border shadow-sm relative group overflow-hidden transition-all hover:scale-105">
                  {isValidImageUrl(team.avatar) ? (
                    <img  src={team.avatar} alt={team.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Icons.users size={24} className="text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-base truncate group-hover:text-blue-600 transition-colors">
                    {team.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {team.description || t('teams.no_description')}
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {team.members.slice(0, 3).map((member, i) => (
                      <div key={member.id} className="w-8 h-8 rounded-full border-2 border-white bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center z-10 hover:z-20 transition-transform hover:scale-110 shadow-sm overflow-hidden" title={member.name}>
                        {isValidImageUrl(member.avatar) ? (
                          <img  src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground">{member.name.charAt(0)}</span>
                        )}
                      </div>
                    ))}
                    {team.members.length > 3 && (
                      <div className="w-7 h-7 rounded-full bg-muted border-2 border-white flex items-center justify-center text-[10px] font-bold text-muted-foreground z-0">
                        +{team.members.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground ml-1">
                    {team.members.length} {team.members.length === 1 ? t('teams.member') : t('teams.members')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground mb-4">
            <Icons.users size={32} />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">{t('teams.no_teams')}</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            {searchQuery ? t('teams.no_teams_search') : t('teams.no_teams_yet')}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors"
            >
              {t('teams.create_first')}
            </button>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateTeamModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadTeams}
        />
      )}
    </div>
  );
}
