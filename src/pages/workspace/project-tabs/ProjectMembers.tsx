import { useState } from 'react';
import { Icons } from '../../../assets/icons';
import { projectService } from '../../../services/project.service';
import defaultMan from '../../../assets/avatar_def_man.png';
import CreateRoleModal from '../../../components/workspace/CreateRoleModal';
import ConfirmModal from '../../../components/common/ConfirmModal';

interface ProjectMembersProps {
  currentProject: any;
  onUpdate: () => void;
}

export default function ProjectMembers({ currentProject, onUpdate }: ProjectMembersProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Modal states
  const [memberToRemove, setMemberToRemove] = useState<any>(null);
  const [memberToRestore, setMemberToRestore] = useState<any>(null);
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
        title: "Lỗi",
        message: err.response?.data?.message || "Có lỗi xảy ra"
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
        title: "Lỗi",
        message: err.response?.data?.message || "Có lỗi xảy ra"
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleChangeRole = async (userId: string, roleId: string) => {
    if (isOwner(userId)) {
      setAlertInfo({ title: "Thông báo", message: "Không thể đổi quyền của chủ sở hữu." });
      return;
    }
    setLoadingAction(`role_${userId}`);
    try {
      await projectService.changeMemberRole(currentProject.id, userId, roleId);
      onUpdate();
    } catch (err: any) {
      setAlertInfo({
        title: "Lỗi",
        message: err.response?.data?.message || "Có lỗi xảy ra"
      });
    } finally {
      setLoadingAction(null);
      setShowRoleMenu(null);
    }
  };

  const getRoleName = (member: any) => {
    if (isOwner(member.id)) return 'Owner';
    if (member.roleName) return member.roleName;
    return 'Member';
  };

  const filteredMembers = currentProject.members.filter((member: any) => {
    if (filter === 'ACTIVE') return member.active !== false;
    if (filter === 'INACTIVE') return member.active === false;
    return true;
  });

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Thành viên dự án</h2>
          <p className="text-sm text-slate-500 mt-1">Quản lý thành viên và phân quyền trong dự án</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'ACTIVE' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Đang hoạt động
            </button>
            <button
              onClick={() => setFilter('INACTIVE')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'INACTIVE' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Đã xóa
            </button>
          </div>
          <button 
            onClick={() => setShowCreateRole(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors"
          >
            <Icons.settings size={16} />
            <span>Thêm Custom Role</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member: any) => (
          <div key={member.id} className={`bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm transition-all ${member.active === false ? 'opacity-60 grayscale hover:opacity-80' : 'hover:shadow-md'}`}>
            <div className="flex items-center gap-3">
              <img src={member.avatar || defaultMan} alt={member.name} className="w-12 h-12 rounded-full border-2 border-slate-100 object-cover" />
              <div>
                <h3 className={`font-bold text-sm flex items-center gap-2 ${member.active === false ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                  {member.name}
                  {member.active === false && (
                    <span className="text-[10px] font-normal text-red-500 bg-red-50 px-1.5 py-0.5 rounded no-underline">
                      Đã rời đi
                    </span>
                  )}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${isOwner(member.id) ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                  {getRoleName(member)}
                </span>
              </div>
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowRoleMenu(showRoleMenu === member.id ? null : member.id)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                disabled={loadingAction === `remove_${member.id}` || loadingAction === `role_${member.id}` || loadingAction === `restore_${member.id}`}
              >
                {loadingAction === `remove_${member.id}` || loadingAction === `role_${member.id}` || loadingAction === `restore_${member.id}` ? (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-slate-500 animate-spin" />
                ) : (
                  <Icons.moreVertical size={16} />
                )}
              </button>

              {showRoleMenu === member.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowRoleMenu(null)} />
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 shadow-lg rounded-xl z-20 py-1 overflow-hidden">
                    {member.active !== false ? (
                      <>
                        <div className="px-3 py-2 border-b border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đổi quyền</span>
                        </div>
                        {currentProject.customRoles?.map((role: any) => (
                          <button 
                            key={role.id}
                            onClick={() => handleChangeRole(member.id, role.id)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${member.roleId === role.id ? 'text-blue-600 font-bold' : 'text-slate-700'}`}
                          >
                            {role.name}
                            {member.roleId === role.id && <Icons.check size={14} />}
                          </button>
                        ))}
                        {!currentProject.customRoles?.length && (
                          <div className="px-4 py-2 text-xs text-slate-400 text-center">Không có role custom</div>
                        )}
                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <button 
                            onClick={() => {
                              if (isOwner(member.id)) {
                                setAlertInfo({ title: "Thông báo", message: "Không thể xóa chủ sở hữu khỏi dự án." });
                              } else {
                                setMemberToRemove(member);
                                setShowRoleMenu(null);
                              }
                            }}
                            className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${
                              isOwner(member.id) 
                                ? 'text-slate-400 cursor-not-allowed' 
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                            disabled={isOwner(member.id)}
                          >
                            <Icons.trash2 size={14} /> Xóa khỏi dự án
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
                        <Icons.refreshCw size={14} /> Khôi phục thành viên
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreateRole && (
        <CreateRoleModal
          projectId={currentProject.id}
          onClose={() => setShowCreateRole(false)}
          onSuccess={() => {
            setShowCreateRole(false);
            onUpdate();
          }}
        />
      )}

      {/* Modal Xóa Thành Viên */}
      <ConfirmModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        title="Xóa thành viên"
        message={`Bạn có chắc chắn muốn xóa thành viên ${memberToRemove?.name} khỏi dự án? Hành động này không thể hoàn tác.`}
        confirmText="Xóa thành viên"
        cancelText="Hủy"
        isDestructive={true}
        isLoading={loadingAction === `remove_${memberToRemove?.id}`}
      />

      {/* Modal Khôi Phục Thành Viên */}
      <ConfirmModal
        isOpen={!!memberToRestore}
        onClose={() => setMemberToRestore(null)}
        onConfirm={handleRestoreMember}
        title="Khôi phục thành viên"
        message={`Bạn có muốn khôi phục thành viên ${memberToRestore?.name} tham gia lại vào dự án?`}
        confirmText="Khôi phục"
        cancelText="Hủy"
        isDestructive={false}
        isLoading={loadingAction === `restore_${memberToRestore?.id}`}
      />

      {/* Modal Thông Báo / Lỗi */}
      <ConfirmModal
        isOpen={!!alertInfo}
        onClose={() => setAlertInfo(null)}
        onConfirm={() => setAlertInfo(null)}
        title={alertInfo?.title || ''}
        message={alertInfo?.message}
        confirmText="Đóng"
        cancelText="" // Ẩn nút hủy
      />
    </div>
  );
}
