import { createBrowserRouter } from 'react-router-dom'
import Login from '../pages/Login'
import Manage from '../pages/Manage'
import Publish from '../pages/Publish'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/manage',
    element: <Manage />,
  },
  {
    path: '/publish',
    element: <Publish />,
  },
])

export default router
