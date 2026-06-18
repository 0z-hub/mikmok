import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import request from '../utils/request'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      const res = await request.post('/api/auth/login', {
        username: values.username,
        password: values.password,
      })
      const token = res.data?.token
      const role = res.data?.role || 'USER'

      if (!token) {
        message.error('登录失败：未获取到 token')
        return
      }
      if (role !== 'ADMIN') {
        message.error('该账号不是管理员，请使用用户登录')
        return
      }

      localStorage.setItem('token', token)
      localStorage.setItem('username', res.data?.username || values.username)
      localStorage.setItem('role', role)
      message.success('管理员登录成功')
      navigate('/admin', { replace: true })
    } catch {
      // 错误由拦截器处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center bg-black p-6 relative overflow-hidden max-w-[500px] mx-auto border-x border-white/10 shadow-2xl">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-8">
          <SafetyCertificateOutlined className="text-4xl text-primary mb-3" />
          <h1 className="text-3xl font-black text-white mb-1">管理员登录</h1>
          <p className="text-white/40 text-xs">MikMok 系统监控后台</p>
        </div>

        <div className="bg-card-bg/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
          <Form form={form} layout="vertical" onFinish={handleLogin} requiredMark={false}>
            <Form.Item name="username" rules={[{ required: true, message: '请输入管理员账号' }]}>
              <Input
                prefix={<UserOutlined className="text-white/20" />}
                placeholder="管理员账号"
                className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/20 h-12 !rounded-xl focus:!border-primary"
              />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password
                prefix={<LockOutlined className="text-white/20" />}
                placeholder="密码"
                className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/20 h-12 !rounded-xl focus:!border-primary"
              />
            </Form.Item>
            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                className="h-12 !rounded-xl font-bold text-base shadow-lg shadow-primary/20"
              >
                进入监控后台
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className="text-center mt-6">
          <Link to="/login" className="text-white/40 text-sm hover:text-white transition-colors">
            ← 返回用户登录
          </Link>
        </div>
      </div>
    </div>
  )
}
