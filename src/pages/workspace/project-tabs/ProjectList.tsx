import React from 'react';
import { ProjectListProvider } from './components/list-view/ProjectListContext';
import { ProjectListToolbar } from './components/list-view/ProjectListToolbar';
import { ProjectListTable } from './components/list-view/ProjectListTable';
import { ProjectListPagination } from './components/list-view/ProjectListPagination';
import { ProjectListModals } from './components/list-view/ProjectListModals';

interface ProjectListProps {
  currentProject: any;
  projectId: string;
}

export default function ProjectList({ currentProject, projectId }: ProjectListProps) {
  return (
    <ProjectListProvider currentProject={currentProject} projectId={projectId}>
      <div className="flex flex-col h-full bg-background relative">
        <ProjectListToolbar />
        <ProjectListTable />
        <ProjectListPagination />
        <ProjectListModals />
      </div>
    </ProjectListProvider>
  );
}
