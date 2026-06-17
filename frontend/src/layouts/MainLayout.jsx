import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { Button, Space, message } from 'antd'
import {
  VideoCameraOutlined,
  PlusCircleFilled,
  PlayCircleOutlined,
} from '@ant-design/icons'
import request from '../utils/request'
import './MainLayout.css'

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

  const selectedKey =
    tabItems.find((item) => location.pathname.startsWith(item.key))?.key ||
    '/recommend'

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
    message.success('已退出')
    navigate('/login')
  }

  const handleTabClick = (key) => {
    if (key === '/recommend') {
      navigate('/recommend')
    } else {
      navigate(key)
    }
  }

  return (
    <div className="mobile-layout">
      {/* 顶部导航 */}
      <header className="mobile-header">
        <span className="mobile-brand" onClick={() => navigate('/recommend')}>
          MikMok
        </span>
        <Space size={12}>
          <span className="mobile-username">{username}</span>
          <Button
            type="text"
            size="small"
            style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}
            onClick={handleLogout}
          >
            退出
          </Button>
        </Space>
      </header>

      {/* 内容区 */}
      <main className="mobile-content">
        <Outlet />
      </main>

      {/* 底部 TabBar */}
      <nav className="mobile-tabbar">
        {tabItems.map((item) => {
          const isActive =
            item.key === '/recommend'
              ? selectedKey === '/recommend'
              : location.pathname.startsWith(item.key)
          return (
            <div
              key={item.key}
              className={`tabbar-item ${item.key === '/publish' ? 'tabbar-publish' : ''} ${isActive ? 'active' : ''}`}
              onClick={() => handleTabClick(item.key)}
            >
              <span className="tabbar-icon">{item.icon}</span>
              <span className="tabbar-label">{item.label}</span>
            </div>
          )
        })}
      </nav>
    </div>
  )
}
