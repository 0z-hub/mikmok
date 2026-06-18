import { createBrowserRouter } from 'react-router-dom'
import Login from '../pages/Login'
import AdminLogin from '../pages/AdminLogin'
import Manage from '../pages/Manage'
import Publish from '../pages/Publish'
import Recommend from '../pages/Recommend'
import Admin from '../pages/Admin'
import MainLayout from '../layouts/MainLayout'
import AdminLayout from '../layouts/AdminLayout'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Admin />,
      },
    ],
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Recommend />,
      },
      {
        path: 'recommend',
        element: <Recommend />,
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
