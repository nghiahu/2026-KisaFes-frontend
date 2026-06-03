import { useState } from 'react';
import { Icons } from '../../../assets/icons';
import { projectService } from '../../../services/project.service';
import defaultMan from '../../../assets/avatar_def_man.png';
import CreateRoleModal from '../../../components/workspace/CreateRoleModal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { useAppSelector } from '../../../store/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ProjectMembersProps {
  currentProject: any;
  onUpdate: () => void;
  onOpenInviteModal?: () => void;
}

export default function ProjectMembers({ currentProject, onUpdate, onOpenInviteModal }: ProjectMembersProps) {
  const queryClient = useQueryClient();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<any>(null);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const { user } = useAppSelector(state => state.auth);
  const { t } = useLanguage();

  const hasRoleManagePermission = () => {
    if (!user) return false;
    if (currentProject.ownerId === user.id) return true;
    
    const memberObj = currentProject.members?.find((m: any) => m.id === user.id);
    if (!memberObj) return false;
    
    const roleId = memberObj.roleId;
    const roleObj = currentProject.customRoles?.find((r: any) => r.id === roleId);
    if (!roleObj) return false;
    
    return roleObj.permissions?.includes('ROLE_MANAGE') || roleObj.permissions?.includes('PERMISSION_MANAGE');
  };

  const handleOpenCreateRole = () => {
    if (!hasRoleManagePermission()) {
      import('../../../utils/permission-denied-event').then(({ permissionDeniedEvent }) => {
        permissionDeniedEvent.emit(t('members.no_permission'));
      });
      return;
    }
    setShowCreateRole(true);
  };

  const handleOpenEditRole = (role: any) => {
    if (!hasRoleManagePermission()) {
      import('../../../utils/permission-denied-event').then(({ permissionDeniedEvent }) => {
        permissionDeniedEvent.emit(t('members.no_permission'));
      });
      return;
    }
    setRoleToEdit(role);
  };

  const getFriendlyPermissionName = (permId: string) => {
    const allPerms = [
      { id: 'PROJECT_VIEW', label: 'Xem dự án' },
      { id: 'PROJECT_UPDATE', label: 'Cấu hình dự án' },
      { id: 'PROJECT_CREATE', label: 'Tạo dự án' },
      { id: 'PROJECT_DELETE', label: 'Xóa dự án' },
      { id: 'PROJECT_ARCHIVE', label: 'Lưu trữ dự án' },
      { id: 'TASK_VIEW', label: 'Xem công việc' },
      { id: 'TASK_CREATE', label: 'Tạo công việc' },
      { id: 'TASK_UPDATE', label: 'Sửa công việc' },
      { id: 'TASK_DELETE', label: 'Xóa công việc' },
      { id: 'TASK_ASSIGN', label: 'Giao việc' },
      { id: 'TASK_CHANGE_STATUS', label: 'Đổi trạng thái' },
      { id: 'BOARD_VIEW', label: 'Xem bảng' },
      { id: 'BOARD_UPDATE', label: 'Cấu hình bảng' },
      { id: 'MEMBER_INVITE', label: 'Mời thành viên' },
      { id: 'MEMBER_REMOVE', label: 'Xóa thành viên' },
      { id: 'MEMBER_UPDATE_ROLE', label: 'Đổi quyền thành viên' },
      { id: 'COMMENT_CREATE', label: 'Tạo bình luận' },
      { id: 'COMMENT_UPDATE', label: 'Sửa bình luận' },
      { id: 'COMMENT_DELETE', label: 'Xóa bình luận' },
      { id: 'ATTACHMENT_UPLOAD', label: 'Tải file' },
      { id: 'ATTACHMENT_DELETE', label: 'Xóa file' },
      { id: 'ROLE_MANAGE', label: 'Quản lý Role' },
      { id: 'PERMISSION_MANAGE', label: 'Quản lý Phân quyền' }
    ];
    return allPerms.find(p => p.id === permId)?.label || permId;
  };

  // Modal states
  const [memberToRemove, setMemberToRemove] = useState<any>(null);
  const [memberToRestore, setMemberToRestore] = useState<any>(null);
  const [teamToRemove, setTeamToRemove] = useState<any>(null);
  const [alertInfo, setAlertInfo] = useState<{title: string, message: string} | null>(null);

  const isOwner = (memberId: string) => currentProject.ownerId === memberId;

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    setLoadingAction(`remove_${memberToRemove.id}`);
    try {
      await projectService.removeMember(currentProject.id, memberToRemove.id);
      onUpdate();
      setMemberToRemove(null);
    } catch (err: any) {
      setAlertInfo({
        title: t('members.error_title'),
        message: err.response?.data?.message || t('members.error_default')
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRestoreMember = async () => {
    if (!memberToRestore) return;
    
    setLoadingAction(`restore_${memberToRestore.id}`);
    try {
      await projectService.restoreMember(currentProject.id, memberToRestore.id);
      onUpdate();
      setMemberToRestore(null);
    } catch (err: any) {
      setAlertInfo({
        title: t('members.error_title'),
        message: err.response?.data?.message || t('members.error_default')
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleChangeRole = async (userId: string, roleId: string) => {
    if (isOwner(userId)) {
      setAlertInfo({ title: t('members.notification_title'), message: t('members.cannot_change_owner') });
      return;
    }
    setLoadingAction(`role_${userId}`);
    try {
      await projectService.changeMemberRole(currentProject.id, userId, roleId);
      onUpdate();
    } catch (err: any) {
      setAlertInfo({
        title: t('members.error_title'),
        message: err.response?.data?.message || t('members.error_default')
      });
    } finally {
      setLoadingAction(null);
      setShowRoleMenu(null);
    }
  };

  const getRoleName = (member: any) => {
    if (isOwner(member.id)) return t('members.owner_role');
    if (member.roleName) return member.roleName;
    return t('members.member_role');
  };

  const filteredMembers = currentProject.members.filter((member: any) => {
    if (filter === 'ACTIVE') return member.active !== false;
    if (filter === 'INACTIVE') return member.active === false;
    return true;
  });

  const { data: projectTeams = [], refetch: refetchProjectTeams } = useQuery({
    queryKey: ['projectTeams', currentProject.id],
    queryFn: () => projectService.getProjectTeams(currentProject.id),
  });

  const handleRemoveTeam = async () => {
    if (!teamToRemove) return;
    setLoadingAction(`remove_team_${teamToRemove.id}`);
    try {
      await projectService.removeTeamFromProject(currentProject.id, teamToRemove.id);
      refetchProjectTeams();
      queryClient.invalidateQueries({ queryKey: ['project', currentProject.id] });
      setTeamToRemove(null);
    } catch (err: any) {
      setAlertInfo({
        title: t('members.error_title'),
        message: err.response?.data?.message || t('members.error_remove_team')
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('members.title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('members.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-muted p-1 rounded-lg">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'ALL' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('members.filter_all')}
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'ACTIVE' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('members.filter_active')}
            </button>
            <button
              onClick={() => setFilter('INACTIVE')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'INACTIVE' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('members.filter_inactive')}
            </button>
          </div>
          <button 
            onClick={handleOpenCreateRole}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors"
          >
            <Icons.settings size={16} />
            <span>{t('members.add_custom_role')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member: any) => (
          <div key={member.id} className={`bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm transition-all ${member.active === false ? 'opacity-60 grayscale hover:opacity-80' : 'hover:shadow-md'}`}>
            <div className="flex items-center gap-3">
              <img src={member.avatar || defaultMan} alt={member.name} className="w-12 h-12 rounded-full border-2 border-border object-cover" />
              <div>
                <h3 className={`font-bold text-sm flex items-center gap-2 ${member.active === false ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {member.name}
                  {member.active === false && (
                    <span className="text-[10px] font-normal text-red-500 bg-red-50 px-1.5 py-0.5 rounded no-underline">
                      {t('members.left_project')}
                    </span>
                  )}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${isOwner(member.id) ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                  {getRoleName(member)}
                </span>
              </div>
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowRoleMenu(showRoleMenu === member.id ? null : member.id)}
                className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-background rounded-lg transition-colors"
                disabled={loadingAction === `remove_${member.id}` || loadingAction === `role_${member.id}` || loadingAction === `restore_${member.id}`}
              >
                {loadingAction === `remove_${member.id}` || loadingAction === `role_${member.id}` || loadingAction === `restore_${member.id}` ? (
                  <div className="w-4 h-4 rounded-full border-2 border-border border-t-slate-500 animate-spin" />
                ) : (
                  <Icons.moreVertical size={16} />
                )}
              </button>

              {showRoleMenu === member.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowRoleMenu(null)} />
                  <div className="absolute right-0 mt-1 w-48 bg-card border border-border shadow-lg rounded-xl z-20 py-1 overflow-hidden">
                    {member.active !== false ? (
                      <>
                        <div className="px-3 py-2 border-b border-border">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('members.change_role')}</span>
                        </div>
                        {currentProject.customRoles?.map((role: any) => (
                          <button 
                            key={role.id}
                            onClick={() => handleChangeRole(member.id, role.id)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-background transition-colors flex items-center justify-between ${member.roleId === role.id ? 'text-blue-600 font-bold' : 'text-foreground'}`}
                          >
                            {role.name}
                            {member.roleId === role.id && <Icons.check size={14} />}
                          </button>
                        ))}
                        {!currentProject.customRoles?.length && (
                          <div className="px-4 py-2 text-xs text-muted-foreground text-center">{t('members.no_custom_role')}</div>
                        )}
                        <div className="border-t border-border mt-1 pt-1">
                          <button 
                            onClick={() => {
                              if (isOwner(member.id)) {
                                setAlertInfo({ title: t('members.notification_title'), message: t('members.cannot_remove_owner') });
                              } else {
                                setMemberToRemove(member);
                                setShowRoleMenu(null);
                              }
                            }}
                            className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${
                              isOwner(member.id) 
                                ? 'text-muted-foreground cursor-not-allowed' 
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                            disabled={isOwner(member.id)}
                          >
                            <Icons.trash2 size={14} /> {t('members.remove_from_project')}
                          </button>
                        </div>
                      </>
                    ) : (
                      <button 
                        onClick={() => {
                          setMemberToRestore(member);
                          setShowRoleMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors text-blue-600 hover:bg-blue-50"
                      >
                        <Icons.refreshCw size={14} /> {t('members.restore_member')}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Danh sách Nhóm (Teams) */}
      <div className="border-t border-border pt-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Icons.users size={20} className="text-emerald-600" />
              {t('members.teams_title')}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t('members.teams_subtitle')}</p>
          </div>
          {onOpenInviteModal && (
            <button 
              onClick={onOpenInviteModal}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm font-bold transition-colors"
            >
              <Icons.plus size={16} />
              <span>{t('members.add_team')}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectTeams.map((team: any) => (
            <div key={team.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                {team.avatar ? (
                  <img src={team.avatar} alt={team.name} className="w-12 h-12 rounded-xl object-cover border border-border shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
                    <Icons.users size={24} />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-foreground truncate">{team.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{team.description || t('members.no_description')}</p>
                </div>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setTeamToRemove(team)}
                  className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  disabled={loadingAction === `remove_team_${team.id}`}
                  title={t('members.remove_team_title')}
                >
                  {loadingAction === `remove_team_${team.id}` ? (
                    <div className="w-4 h-4 rounded-full border-2 border-border border-t-rose-500 animate-spin" />
                  ) : (
                    <Icons.trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}
          {(!projectTeams || projectTeams.length === 0) && (
            <div className="col-span-full py-8 text-center text-muted-foreground text-sm italic">
              {t('members.no_teams')}
            </div>
          )}
        </div>
      </div>

      {/* Danh sách vai trò custom */}
      <div className="border-t border-border pt-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Icons.shield size={20} className="text-blue-600" />
              {t('members.roles_title')}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t('members.roles_subtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentProject.customRoles?.map((role: any) => (
            <div key={role.id} className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Icons.shield size={16} className="text-blue-500" />
                    {role.name}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                    {t('members.permissions_count').replace('{count}', String(role.permissions?.length || 0))}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {role.permissions?.slice(0, 3).map((p: string) => (
                    <span key={p} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                      {getFriendlyPermissionName(p)}
                    </span>
                  ))}
                  {role.permissions?.length > 3 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-background text-muted-foreground font-bold">
                      {t('members.more_permissions').replace('{count}', String(role.permissions.length - 3))}
                    </span>
                  )}
                  {(!role.permissions || role.permissions.length === 0) && (
                    <span className="text-[10px] text-muted-foreground italic">{t('members.no_permissions')}</span>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-border flex justify-end">
                {role.name?.toLowerCase().includes("owner") ? null : (
                  <button
                    onClick={() => handleOpenEditRole(role)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Icons.pencil size={12} />
                    {t('members.edit_permissions')}
                  </button>
                )}
              </div>
            </div>
          ))}
          {!currentProject.customRoles?.length && (
            <div className="col-span-full py-8 text-center text-muted-foreground text-sm italic">
              {t('members.no_custom_roles')}
            </div>
          )}
        </div>
      </div>

      {(showCreateRole || roleToEdit) && (
        <CreateRoleModal
          projectId={currentProject.id}
          roleToEdit={roleToEdit}
          onClose={() => {
            setShowCreateRole(false);
            setRoleToEdit(null);
          }}
          onSuccess={() => {
            setShowCreateRole(false);
            setRoleToEdit(null);
            onUpdate();
          }}
        />
      )}

      {/* Modal Xóa Thành Viên */}
      <ConfirmModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        title={t('members.remove_member_title')}
        message={t('members.remove_member_msg').replace('{name}', memberToRemove?.name)}
        confirmText={t('members.remove_member_btn')}
        cancelText={t('members.cancel')}
        isDestructive={true}
        isLoading={loadingAction === `remove_${memberToRemove?.id}`}
      />

      {/* Modal Khôi Phục Thành Viên */}
      <ConfirmModal
        isOpen={!!memberToRestore}
        onClose={() => setMemberToRestore(null)}
        onConfirm={handleRestoreMember}
        title={t('members.restore_title')}
        message={t('members.restore_msg').replace('{name}', memberToRestore?.name)}
        confirmText={t('members.restore_btn')}
        cancelText={t('members.cancel')}
        isDestructive={false}
        isLoading={loadingAction === `restore_${memberToRestore?.id}`}
      />

      {/* Modal Xóa Nhóm */}
      <ConfirmModal
        isOpen={!!teamToRemove}
        onClose={() => setTeamToRemove(null)}
        onConfirm={handleRemoveTeam}
        title={t('members.remove_team_title')}
        message={t('members.remove_team_msg').replace('{name}', teamToRemove?.name)}
        confirmText={t('members.remove_team_btn')}
        cancelText={t('members.cancel')}
        isDestructive={true}
        isLoading={loadingAction === `remove_team_${teamToRemove?.id}`}
      />

      {/* Modal Thông Báo / Lỗi */}
      <ConfirmModal
        isOpen={!!alertInfo}
        onClose={() => setAlertInfo(null)}
        onConfirm={() => setAlertInfo(null)}
        title={alertInfo?.title || ''}
        message={alertInfo?.message}
        confirmText={t('members.close')}
        cancelText="" // Ẩn nút hủy
      />
    </div>
  );
}
