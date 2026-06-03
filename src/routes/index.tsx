import { createBrowserRouter, Navigate } from 'react-router-dom'
import React, { Suspense } from 'react'
import AuthLayout from '../layouts/AuthLayout'
import OAuth2RedirectHandler from '../pages/OAuth2RedirectHandler'
import LandingLayout from '../layouts/LandingLayout'
import ProtectedRoute from './ProtectedRoute'

// Lazy loaded layouts
const ProfileLayout = React.lazy(() => import('../layouts/ProfileLayout'))
const RootLayout = React.lazy(() => import('../layouts/RootLayout'))
const WorkspaceLayout = React.lazy(() => import('../layouts/WorkspaceLayout'))

// Lazy loaded pages
const ProfileSettings = React.lazy(() => import('../pages/ProfileSettings'))
const Dashboard = React.lazy(() => import('../pages/workspace/Dashboard'))
const Projects = React.lazy(() => import('../pages/workspace/Projects'))
const CreateProject = React.lazy(() => import('../pages/workspace/CreateProject'))
const ProjectDetail = React.lazy(() => import('../pages/workspace/ProjectDetail'))
const Inbox = React.lazy(() => import('../pages/workspace/Inbox'))
const MyTasks = React.lazy(() => import('../pages/workspace/MyTasks'))
const Teams = React.lazy(() => import('../pages/workspace/Teams'))
const TeamDetail = React.lazy(() => import('../pages/workspace/TeamDetail'))
const GlobalCalendar = React.lazy(() => import('../pages/workspace/GlobalCalendar'))
const GlobalReports = React.lazy(() => import('../pages/workspace/GlobalReports'))

const SuspenseLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-[#F4F5F7]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

export const router = createBrowserRouter([
  {
    element: (
      <Suspense fallback={<SuspenseLoader />}>
        <RootLayout />
      </Suspense>
    ),
    children: [
      {
        path: '/',
        element: <Navigate to="/software/kisa" replace />,
      },
      {
        path: '/software/kisa',
        element: <LandingLayout />,
      },
      {
        path: '/login',
        element: <AuthLayout />,
      },
      {
        path: '/signup',
        element: <AuthLayout />,
      },
      {
        path: '/signup/otp',
        element: <AuthLayout />,
      },
      {
        path: '/signup/profile',
        element: <AuthLayout />,
      },
      {
        path: '/forgot-password',
        element: <AuthLayout />,
      },
      {
        path: '/forgot-password/otp',
        element: <AuthLayout />,
      },
      {
        path: '/forgot-password/reset',
        element: <AuthLayout />,
      },
      {
        path: '/profile',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<SuspenseLoader />}>
              <ProfileLayout />
            </Suspense>
          </ProtectedRoute>
        ),
        children: [
          {
            path: '',
            element: <ProfileSettings />,
          },
          {
            path: 'security',
            element: <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200"><h2 className="text-xl font-bold">Bảo mật</h2><p className="mt-2 text-slate-500">Tính năng đang được phát triển.</p></div>,
          },
          {
            path: 'notifications',
            element: <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200"><h2 className="text-xl font-bold">Thông báo</h2><p className="mt-2 text-slate-500">Tính năng đang được phát triển.</p></div>,
          }
        ]
      },
      {
        path: '/workspace',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<SuspenseLoader />}>
              <WorkspaceLayout />
            </Suspense>
          </ProtectedRoute>
        ),
        children: [
          {
            path: '',
            element: <Navigate to="projects" replace />,
          },
          {
            path: 'projects',
            element: <Projects />,
          },
          {
            path: 'projects/new',
            element: <CreateProject />,
          },
          {
            path: 'projects/:projectId',
            element: <ProjectDetail />,
          },
          {
            path: 'inbox',
            element: <Inbox />,
          },
          {
            path: 'my-tasks',
            element: <MyTasks />,
          },
          {
            path: 'teams',
            element: <Teams />,
          },
          {
            path: 'teams/:teamId',
            element: <TeamDetail />,
          },
          {
            path: 'calendar',
            element: <GlobalCalendar />,
          },
          {
            path: 'reports',
            element: <GlobalReports />,
          },
          {
            path: 'settings',
            element: <ProfileSettings />,
          },
        ],
      },
      {
        path: '/oauth2/redirect',
        element: <OAuth2RedirectHandler />,
      },
    ],
  },
])

