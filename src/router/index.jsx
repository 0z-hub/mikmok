import { createBrowserRouter, Navigate } from 'react-router-dom'
import Login from '../pages/Login'
import Manage from '../pages/Manage'
import Publish from '../pages/Publish'
import MainLayout from '../layouts/MainLayout'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/manage" replace />,
      },
      {
        path: 'manage',
        element: <Manage />,
      },
      {
        path: 'publish',
        element: <Publish />,
      },
    ],
  },
])

export default router
