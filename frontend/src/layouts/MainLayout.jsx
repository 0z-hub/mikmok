import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { message } from 'antd'
import {
  VideoCameraOutlined,
  PlusCircleFilled,
  PlayCircleOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import request from '../utils/request'

const tabItems = [
  {
    key: '/recommend',
    icon: <PlayCircleOutlined />,
    label: '推荐',
  },
  {
    key: '/publish',
    icon: <PlusCircleFilled />,
    label: '发布',
  },
  {
    key: '/manage',
    icon: <VideoCameraOutlined />,
    label: '我的',
  },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const username = localStorage.getItem('username') || '用户'
  const role = localStorage.getItem('role')

  const selectedKey =
    tabItems.find((item) => location.pathname.startsWith(item.key))?.key ||
    (location.pathname.startsWith('/admin') ? '/admin' : '/recommend')

  const handleLogout = async () => {
    if (localStorage.getItem('token') !== 'mock-token-for-debug') {
      try {
        await request.post('/api/auth/logout')
      } catch {
        // 退出接口失败时仍清除本地登录态
      }
    }
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    message.success('已退出')
    navigate('/login')
  }

  const handleTabClick = (key) => {
    navigate(key)
  }

  // 推荐页不显示 Header，其他页面显示
  const isRecommend = location.pathname === '/recommend' || location.pathname === '/'
  const isAdmin = location.pathname.startsWith('/admin')

  const navItems = [
    ...tabItems,
    ...(role === 'ADMIN'
      ? [{ key: '/admin', icon: <DashboardOutlined />, label: '监控' }]
      : []),
  ]

  return (
    <div className="flex flex-col h-screen h-[100dvh] bg-black text-white overflow-hidden max-w-[500px] mx-auto border-x border-white/10 shadow-2xl relative">
      {/* 顶部导航 - 仅在非推荐页显示 */}
      {!isRecommend && (
        <header className="flex items-center justify-between px-4 h-12 border-b border-white/10 bg-black/50 backdrop-blur-md shrink-0">
          <span className="text-lg font-bold tracking-wider text-primary cursor-pointer" onClick={() => navigate('/recommend')}>
            MikMok{isAdmin ? ' Admin' : ''}
          </span>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-white/80">{username}</span>
            <button
              className="text-xs text-white/40 hover:text-white transition-colors"
              onClick={handleLogout}
            >
              退出
            </button>
          </div>
        </header>
      )}

      {/* 内容区 */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <Outlet />
      </main>

      {/* 底部 TabBar */}
      <nav className="flex items-center justify-around h-16 bg-black/90 backdrop-blur-lg border-t border-white/10 shrink-0 z-50">
        {navItems.map((item) => {
          const isActive = item.key === selectedKey
          const isPublish = item.key === '/publish'

          return (
            <div
              key={item.key}
              className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-all active:scale-90 ${
                isActive ? 'text-white' : 'text-white/50'
              }`}
              onClick={() => handleTabClick(item.key)}
            >
              <span className={`text-2xl ${isPublish ? 'text-3xl text-white' : ''}`}>
                {item.icon}
              </span>
              {!isPublish && <span className="text-[10px] mt-1 font-medium">{item.label}</span>}
            </div>
          )
        })}
      </nav>
    </div>
  )
}
