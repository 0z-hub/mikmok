import { Outlet, Navigate, useNavigate } from 'react-router-dom'
import { message } from 'antd'
import request from '../utils/request'

export default function AdminLayout() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  const username = localStorage.getItem('username') || '管理员'

  if (!token) {
    return <Navigate to="/admin/login" replace />
  }
  if (role !== 'ADMIN') {
    return <Navigate to="/login" replace />
  }

  const handleLogout = async () => {
    try {
      await request.post('/api/auth/logout')
    } catch {
      // 退出失败仍清除本地态
    }
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    message.success('已退出')
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="flex flex-col h-screen h-[100dvh] bg-black text-white overflow-hidden max-w-[500px] mx-auto border-x border-white/10 shadow-2xl">
      <header className="flex items-center justify-between px-4 h-12 border-b border-white/10 bg-black/80 backdrop-blur-md shrink-0">
        <span className="text-lg font-bold tracking-wider text-primary">MikMok Admin</span>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-white/80">{username}</span>
          <button
            type="button"
            className="text-xs text-white/40 hover:text-white transition-colors"
            onClick={handleLogout}
          >
            退出
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        <Outlet />
      </main>
    </div>
  )
}
