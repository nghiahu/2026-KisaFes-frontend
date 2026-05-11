import { createBrowserRouter } from 'react-router-dom'
import LandingLayout from '../layouts/LandingLayout'
import AuthLayout from '../layouts/AuthLayout'
import WelcomeBack from '../pages/WelcomeBack'
import OAuth2RedirectHandler from '../pages/OAuth2RedirectHandler'

export const router = createBrowserRouter([
  {
    path: '/',
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
    path: '/welcome',
    element: <WelcomeBack />,
  },
  {
    path: '/oauth2/redirect',
    element: <OAuth2RedirectHandler />,
  },
])
