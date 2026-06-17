import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Button, Tabs, message } from 'antd'
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

  const handleDebugLogin = () => {
    localStorage.setItem('token', 'mock-token-for-debug')
    localStorage.setItem('username', '调试用户')
    navigate('/recommend')
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
        <Form form={loginForm} layout="vertical" onFinish={handleLogin}>
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loginLoading}>
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
        <Form form={registerForm} layout="vertical" onFinish={handleRegister}>
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item
            label="确认密码"
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
            <Input.Password placeholder="请再次输入密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={registerLoading}>
              注册
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
        padding: 16,
      }}
    >
      <Card
        title="欢迎"
        style={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 12,
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        }}
      >
        <Tabs activeKey={activeKey} onChange={setActiveKey} items={tabItems} />
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Button type="link" onClick={handleDebugLogin}>
            🚀 调试模式（跳过登录）
          </Button>
        </div>
      </Card>
    </div>
  )
}
