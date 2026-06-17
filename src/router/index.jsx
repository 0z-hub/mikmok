import { createBrowserRouter } from 'react-router-dom'
import Login from '../pages/Login'
import Publish from '../pages/Publish'
import Placeholder from '../components/Placeholder'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/manage',
    element: <Placeholder title="管理" />,
  },
  {
    path: '/publish',
    element: <Publish />,
  },
])

export default router
