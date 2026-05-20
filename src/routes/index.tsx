import { createBrowserRouter, Navigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import OAuth2RedirectHandler from '../pages/OAuth2RedirectHandler'
import LandingLayout from '../layouts/LandingLayout'
import ProfileLayout from '../layouts/ProfileLayout'
import ProfileSettings from '../pages/ProfileSettings'
import RootLayout from '../layouts/RootLayout'
import WorkspaceLayout from '../layouts/WorkspaceLayout'
import Dashboard from '../pages/workspace/Dashboard'
import Projects from '../pages/workspace/Projects'
import CreateProject from '../pages/workspace/CreateProject'
import ProjectDetail from '../pages/workspace/ProjectDetail'
import ProtectedRoute from './ProtectedRoute'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
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
        element: <ProtectedRoute><ProfileLayout /></ProtectedRoute>,
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
        element: <ProtectedRoute><WorkspaceLayout /></ProtectedRoute>,
        children: [
          {
            path: '',
            element: <Dashboard />,
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
        ],
      },
      {
        path: '/oauth2/redirect',
        element: <OAuth2RedirectHandler />,
      },
    ],
  },
])

