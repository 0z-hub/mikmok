import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Tabs, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import request from '../utils/request'

export default function Login() {
  const navigate = useNavigate()
  const [activeKey, setActiveKey] = useState('login')
  const [loginLoading, setLoginLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()

  const handleLogin = async (values) => {
    setLoginLoading(true)
    try {
      const res = await request.post('/api/auth/login', {
        username: values.username,
        password: values.password,
      })
      const token = res.data?.token
      if (token) {
        localStorage.setItem('token', token)
        localStorage.setItem('username', res.data?.username || values.username)
        localStorage.setItem('role', res.data?.role || 'USER')
        message.success('登录成功')
        navigate('/recommend')
      } else {
        message.error('登录失败：未获取到 token')
      }
    } catch {
      // 错误信息由 request 拦截器统一处理
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegister = async (values) => {
    setRegisterLoading(true)
    try {
      await request.post('/api/auth/register', {
        username: values.username,
        password: values.password,
      })
      message.success('注册成功，请登录')
      registerForm.resetFields()
      setActiveKey('login')
    } catch {
      // 错误信息由 request 拦截器统一处理
    } finally {
      setRegisterLoading(false)
    }
  }

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form form={loginForm} layout="vertical" onFinish={handleLogin} requiredMark={false}>
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined className="text-white/20" />}
              placeholder="用户名"
              className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/20 h-12 !rounded-xl focus:!border-primary"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
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
              loading={loginLoading}
              className="h-12 !rounded-xl font-bold text-base shadow-lg shadow-primary/20"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form form={registerForm} layout="vertical" onFinish={handleRegister} requiredMark={false}>
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined className="text-white/20" />}
              placeholder="用户名"
              className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/20 h-12 !rounded-xl focus:!border-primary"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-white/20" />}
              placeholder="密码"
              className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/20 h-12 !rounded-xl focus:!border-primary"
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请再次输入密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-white/20" />}
              placeholder="确认密码"
              className="!bg-white/5 !border-white/10 !text-white placeholder:!text-white/20 h-12 !rounded-xl focus:!border-primary"
            />
          </Form.Item>
          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={registerLoading}
              className="h-12 !rounded-xl font-bold text-base shadow-lg shadow-primary/20"
            >
              注册
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ]

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center bg-black p-6 relative overflow-hidden max-w-[500px] mx-auto border-x border-white/10 shadow-2xl">
      {/* 背景装饰 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black italic tracking-tighter text-primary mb-2 drop-shadow-2xl">MikMok</h1>
          <p className="text-white/40 tracking-widest text-xs uppercase">Short Video Platform</p>
        </div>

        <div className="bg-card-bg/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
          <Tabs
            activeKey={activeKey}
            onChange={setActiveKey}
            items={tabItems}
            centered
            className="dark-tabs"
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .dark-tabs .ant-tabs-nav::before { border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
        .dark-tabs .ant-tabs-tab { color: rgba(255,255,255,0.4) !important; }
        .dark-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #fff !important; font-weight: bold !important; }
        .dark-tabs .ant-tabs-ink-bar { background: #FE2C55 !important; }
      `}} />
    </div>
  )
}
