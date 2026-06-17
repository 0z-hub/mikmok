import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { Layout, Menu, Button, Space, message } from 'antd'
import {
  VideoCameraOutlined,
  UploadOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import request from '../utils/request'

const { Header, Sider, Content } = Layout

const menuItems = [
  {
    key: '/manage',
    icon: <VideoCameraOutlined />,
    label: '我的视频',
  },
  {
    key: '/publish',
    icon: <UploadOutlined />,
    label: '发布视频',
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
    menuItems.find((item) => location.pathname.startsWith(item.key))?.key ||
    '/manage'

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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: '#001529',
        }}
      >
        <div
          style={{
            color: '#fff',
            fontSize: 18,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={() => navigate('/manage')}
        >
          简易抖音
        </div>
        <Space>
          <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{username}</span>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            style={{ color: 'rgba(255, 255, 255, 0.85)' }}
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </Space>
      </Header>

      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            style={{ height: '100%', borderRight: 0 }}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>
        <Content style={{ background: '#f0f2f5', padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
