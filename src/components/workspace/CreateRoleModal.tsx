import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icons } from '../../assets/icons';
import { projectService } from '../../services/project.service';

import { Button } from '@/components/ui/Button';
import type { CreateRoleModalProps } from '../../types/components.interface';
const roleSchema = z.object({
  name: z.string().min(1, 'Tên Role không được để trống'),
  permissions: z.array(z.string()).min(1, 'Vui lòng chọn ít nhất 1 quyền cho role này.')
});

type RoleFormValues = z.infer<typeof roleSchema>;



const PERMISSION_GROUPS = [
  {
    name: 'Dự án',
    permissions: [
      { id: 'PROJECT_VIEW', label: 'Xem dự án' },
      { id: 'PROJECT_UPDATE', label: 'Cập nhật dự án' },
      { id: 'PROJECT_CREATE', label: 'Tạo dự án' },
      { id: 'PROJECT_DELETE', label: 'Xóa dự án' },
      { id: 'PROJECT_ARCHIVE', label: 'Lưu trữ dự án' },
    ]
  },
  {
    name: 'Công việc',
    permissions: [
      { id: 'TASK_VIEW', label: 'Xem công việc' },
      { id: 'TASK_CREATE', label: 'Tạo công việc' },
      { id: 'TASK_UPDATE', label: 'Sửa công việc' },
      { id: 'TASK_DELETE', label: 'Xóa công việc' },
      { id: 'TASK_ASSIGN', label: 'Giao việc' },
      { id: 'TASK_CHANGE_STATUS', label: 'Đổi trạng thái' },
    ]
  },
  {
    name: 'Bảng (Board)',
    permissions: [
      { id: 'BOARD_VIEW', label: 'Xem bảng' },
      { id: 'BOARD_UPDATE', label: 'Cấu hình bảng' },
    ]
  },
  {
    name: 'Thành viên',
    permissions: [
      { id: 'MEMBER_INVITE', label: 'Mời thành viên' },
      { id: 'MEMBER_REMOVE', label: 'Xóa thành viên' },
      { id: 'MEMBER_UPDATE_ROLE', label: 'Đổi quyền thành viên' },
    ]
  },
  {
    name: 'Bình luận & Đính kèm',
    permissions: [
      { id: 'COMMENT_CREATE', label: 'Tạo bình luận' },
      { id: 'COMMENT_UPDATE', label: 'Sửa bình luận' },
      { id: 'COMMENT_DELETE', label: 'Xóa bình luận' },
      { id: 'ATTACHMENT_UPLOAD', label: 'Tải file' },
      { id: 'ATTACHMENT_DELETE', label: 'Xóa file' },
    ]
  },
  {
    name: 'Phân quyền',
    permissions: [
      { id: 'ROLE_MANAGE', label: 'Quản lý Role' },
      { id: 'PERMISSION_MANAGE', label: 'Quản lý Phân quyền' },
    ]
  }
];

const PRESET_TEMPLATES = [
  {
    id: 'ADMIN',
    name: 'Admin',
    description: 'Toàn quyền',
    permissions: [
      'PROJECT_VIEW', 'PROJECT_UPDATE', 'MEMBER_INVITE', 'MEMBER_REMOVE', 'MEMBER_UPDATE_ROLE',
      'TASK_CREATE', 'TASK_UPDATE', 'TASK_DELETE', 'BOARD_UPDATE', 'ROLE_MANAGE', 'TASK_VIEW', 'TASK_ASSIGN', 'TASK_CHANGE_STATUS', 'BOARD_VIEW', 'COMMENT_CREATE', 'COMMENT_UPDATE', 'COMMENT_DELETE', 'ATTACHMENT_UPLOAD', 'ATTACHMENT_DELETE', 'PERMISSION_MANAGE'
    ]
  },
  {
    id: 'MEMBER',
    name: 'Member',
    description: 'Quyền cơ bản',
    permissions: [
      'PROJECT_VIEW', 'TASK_VIEW', 'TASK_CREATE', 'TASK_UPDATE', 'COMMENT_CREATE', 'TASK_CHANGE_STATUS', 'TASK_ASSIGN', 'BOARD_VIEW', 'ATTACHMENT_UPLOAD'
    ]
  },
  {
    id: 'VIEWER',
    name: 'Viewer',
    description: 'Chỉ xem',
    permissions: [
      'PROJECT_VIEW', 'TASK_VIEW', 'BOARD_VIEW'
    ]
  },
  {
    id: 'CUSTOM',
    name: 'Tùy chỉnh',
    description: 'Tự chọn',
    permissions: []
  }
];

export default function CreateRoleModal({ projectId, onClose, onSuccess, roleToEdit }: CreateRoleModalProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: roleToEdit ? roleToEdit.name : '',
      permissions: roleToEdit ? roleToEdit.permissions || [] : []
    }
  });

  const selectedPermissions = watch('permissions') || [];
  const [selectedPreset, setSelectedPreset] = useState('CUSTOM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPreset !== 'CUSTOM') {
      const preset = PRESET_TEMPLATES.find(p => p.id === selectedPreset);
      if (preset) {
        setValue('permissions', preset.permissions, { shouldValidate: true });
      }
    }
  }, [selectedPreset, setValue]);

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPreset('CUSTOM');
    const newPerms = selectedPermissions.includes(permissionId)
      ? selectedPermissions.filter((id: string) => id !== permissionId)
      : [...selectedPermissions, permissionId];
    setValue('permissions', newPerms, { shouldValidate: true });
  };

  const handleToggleGroup = (groupPermissions: string[]) => {
    setSelectedPreset('CUSTOM');
    const allIncluded = groupPermissions.every(p => selectedPermissions.includes(p));
    let newPerms: string[];
    if (allIncluded) {
      newPerms = selectedPermissions.filter((p: string) => !groupPermissions.includes(p));
    } else {
      const newSet = new Set([...selectedPermissions, ...groupPermissions]);
      newPerms = Array.from(newSet);
    }
    setValue('permissions', newPerms, { shouldValidate: true });
  };

  const onRoleSubmit = async (data: RoleFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (roleToEdit) {
        await projectService.updateCustomRole(projectId, roleToEdit.id, {
          name: data.name.trim(),
          permissions: data.permissions
        });
      } else {
        await projectService.addCustomRole(projectId, {
          name: data.name.trim(),
          permissions: data.permissions
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý Role');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-3xl rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Icons.shield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">
                {roleToEdit ? 'Chỉnh sửa vai trò & quyền hạn' : 'Tạo quyền mới (Custom Role)'}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {roleToEdit ? `Đang chỉnh sửa cấu hình vai trò ${roleToEdit.name}` : 'Xây dựng nhóm quyền riêng biệt cho dự án'}
              </p>
            </div>
          </div>
          <Button 
            onClick={onClose}
            className="text-muted-foreground hover:text-muted-foreground p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <Icons.x size={24} />
          </Button>
        </div>

        <div className="overflow-y-auto p-6 flex-1 bg-background/30">
          <form id="create-role-form" onSubmit={handleSubmit(onRoleSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tên Role */}
              <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <Icons.pencil size={16} className="text-primary" />
                  Tên Role
                </label>
                <input
                  type="text"
                  placeholder="VD: Senior Developer"
                  className={`w-full px-4 py-3 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all font-medium ${errors.name ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-border focus:border-primary focus:ring-primary/20'}`}
                  {...register('name')}
                />
                {errors.name && <p className="text-destructive text-xs mt-2 font-medium">{errors.name.message}</p>}
              </div>

              {/* Mẫu có sẵn */}
              <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <Icons.layers size={16} className="text-primary" />
                  Mẫu nhanh
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TEMPLATES.map((preset) => (
                    <Button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPreset(preset.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        selectedPreset === preset.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:border-slate-300 hover:bg-background'
                      }`}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Danh sách quyền (Grid) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-base font-bold text-foreground flex items-center gap-2">
                  <Icons.checkSquare size={18} className="text-primary" />
                  Chi tiết phân quyền
                </label>
                <div className="flex items-center gap-3">
                  {errors.permissions && <span className="text-destructive text-xs font-medium">{errors.permissions.message}</span>}
                  <span className="text-sm font-medium text-muted-foreground bg-card px-3 py-1 rounded-full border border-border shadow-sm">
                    Đã chọn {selectedPermissions.length} quyền
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PERMISSION_GROUPS.map((group) => {
                  const groupPermIds = group.permissions.map(p => p.id);
                  const allIncluded = groupPermIds.every(p => selectedPermissions.includes(p));
                  const someIncluded = groupPermIds.some(p => selectedPermissions.includes(p));

                  return (
                    <div key={group.name} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                        <h4 className="font-bold text-sm text-foreground">{group.name}</h4>
                        <Button
                          type="button"
                          onClick={() => handleToggleGroup(groupPermIds)}
                          className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                            allIncluded ? 'bg-primary/20 text-primary' : 
                            someIncluded ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground hover:bg-accent'
                          }`}
                        >
                          {allIncluded ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                        </Button>
                      </div>
                      <div className="space-y-2.5">
                        {group.permissions.map((perm) => {
                          const isChecked = selectedPermissions.includes(perm.id);
                          return (
                            <label 
                              key={perm.id} 
                              onClick={() => handleTogglePermission(perm.id)}
                              className="flex items-center gap-3 cursor-pointer group"
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                isChecked ? 'bg-primary border-primary' : 'bg-card border-border group-hover:border-blue-400'
                              }`}>
                                {isChecked && <Icons.check size={12} className="text-white" />}
                              </div>
                              <span className={`text-sm select-none transition-colors ${isChecked ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                {perm.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive text-sm font-medium rounded-xl flex items-center gap-2 border border-red-100">
                <Icons.alertCircle size={16} />
                {error}
              </div>
            )}
          </form>
        </div>
        
        <div className="p-6 border-t border-border bg-card shrink-0 flex items-center justify-end gap-3">
          <Button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            form="create-role-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {roleToEdit ? 'Đang cập nhật...' : 'Đang tạo...'}
              </>
            ) : (
              roleToEdit ? 'Cập nhật Role' : 'Tạo Role Mới'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
