import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Upload, Button, message } from 'antd'
import request from '../utils/request'

const MAX_FILE_SIZE = 100 * 1024 * 1024
const MOCK_DEBUG_TOKEN = 'mock-token-for-debug'

export default function Publish() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const beforeUpload = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      message.error('视频文件不能超过 100MB')
      return Upload.LIST_IGNORE
    }
    return false
  }

  const handleSubmit = async (values) => {
    const file = values.file?.[0]?.originFileObj
    if (!file) {
      message.error('请上传视频文件')
      return
    }

    const formData = new FormData()
    formData.append('title', values.title)
    if (values.description) {
      formData.append('description', values.description)
    }
    formData.append('file', file)

    setLoading(true)

    if (localStorage.getItem('token') === MOCK_DEBUG_TOKEN) {
      setTimeout(() => {
        message.success('模拟发布成功！')
        navigate('/manage')
        setLoading(false)
      }, 1000)
      return
    }

    try {
      await request.post('/api/video/upload', formData)
      message.success('上传成功')
      navigate('/manage')
    } catch {
      // 错误信息由 request 拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <Card title="发布视频">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="视频标题"
            name="title"
            rules={[{ required: true, message: '请输入视频标题' }]}
          >
            <Input placeholder="请输入视频标题" />
          </Form.Item>

          <Form.Item label="视频描述" name="description">
            <Input.TextArea rows={4} placeholder="请输入视频描述（可选）" />
          </Form.Item>

          <Form.Item
            label="视频文件"
            name="file"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) return e
              return e?.fileList
            }}
            rules={[{ required: true, message: '请上传视频文件' }]}
          >
            <Upload accept="video/*" maxCount={1} beforeUpload={beforeUpload}>
              <Button>选择视频</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              提交
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
