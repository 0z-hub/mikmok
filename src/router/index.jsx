import { createBrowserRouter } from 'react-router-dom'
import Placeholder from '../components/Placeholder'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Placeholder title="登录" />,
  },
  {
    path: '/manage',
    element: <Placeholder title="管理" />,
  },
  {
    path: '/publish',
    element: <Placeholder title="发布" />,
  },
])

export default router
