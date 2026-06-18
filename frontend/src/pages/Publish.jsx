import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Upload, Button, message } from 'antd'
import { InboxOutlined, CloudUploadOutlined, CheckCircleFilled } from '@ant-design/icons'
import request from '../utils/request'

const MAX_FILE_SIZE = 150 * 1024 * 1024
const MOCK_DEBUG_TOKEN = 'mock-token-for-debug'

export default function Publish() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState([])

  const beforeUpload = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      message.error('视频文件不能超过 150MB')
      return Upload.LIST_IGNORE
    }
    return false
  }

  const handleChange = ({ fileList: newFileList }) => {
    setFileList(newFileList)
    // 如果上传了文件且标题为空，则自动填充文件名（不含后缀）
    const file = newFileList[0]?.originFileObj
    if (file && !form.getFieldValue('title')) {
      const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
      form.setFieldsValue({ title: fileName })
    }
  }

  const handleSubmit = async (values) => {
    const file = values.file?.[0]?.originFileObj
    if (!file) {
      message.error('请上传视频文件')
      return
    }

    const formData = new FormData()
    formData.append('title', values.title)
    formData.append('description', values.description || '')
    formData.append('file', file)

    setLoading(true)

    if (localStorage.getItem('token') === MOCK_DEBUG_TOKEN) {
      setTimeout(() => {
        message.success('模拟发布成功！')
        navigate('/manage')
        setLoading(false)
      }, 1500)
      return
    }

    try {
      await request.post('/api/my/videos', formData, { timeout: 120000 })
      message.success('上传成功')
      navigate('/manage')
    } catch {
      // 错误信息由 request 拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-black p-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="mb-8 mt-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <span className="w-2 h-6 bg-primary rounded-full mr-3"></span>
            发布新作品
          </h2>
          <p className="text-white/40 text-sm mt-2">分享你的精彩瞬间，让更多人看到</p>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          {/* 上传区域 */}
          <Form.Item
            name="file"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
            rules={[{ required: true, message: '请上传视频文件' }]}
          >
            <Upload.Dragger
              accept="video/*"
              maxCount={1}
              beforeUpload={beforeUpload}
              onChange={handleChange}
              className="publish-dragger !bg-card-bg !border-white/10 !rounded-2xl hover:!border-primary transition-colors overflow-hidden"
              showUploadList={false}
            >
              {fileList.length > 0 ? (
                <div className="py-10 flex flex-col items-center">
                  <CheckCircleFilled className="text-5xl text-green-500 mb-4" />
                  <p className="text-white font-medium">{fileList[0].name}</p>
                  <p className="text-white/40 text-xs mt-2">点击或拖拽更换视频</p>
                </div>
              ) : (
                <div className="py-10">
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined className="text-primary text-5xl" />
                  </p>
                  <p className="text-white font-medium text-base mt-4">点击或将视频拖拽到此处</p>
                  <p className="text-white/40 text-xs mt-2 px-6">支持 MP4, WebM 等格式，大小不超过 150MB</p>
                </div>
              )}
            </Upload.Dragger>
          </Form.Item>

          {/* 表单输入 */}
          <div className="bg-card-bg rounded-2xl p-6 border border-white/5 space-y-4 shadow-xl">
            <Form.Item
              label={<span className="text-white/60 text-xs uppercase tracking-wider">视频标题</span>}
              name="title"
              rules={[{ required: true, message: '请输入视频标题' }]}
              className="mb-0"
            >
              <Input
                placeholder="给你的作品起个吸引人的标题吧..."
                className="!bg-transparent !border-0 !border-b !border-white/10 !rounded-0 !px-0 !text-white !text-lg placeholder:!text-white/20 focus:!border-primary !shadow-none transition-all"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-white/60 text-xs uppercase tracking-wider">视频描述 (可选)</span>}
              name="description"
              className="mb-0"
            >
              <Input.TextArea
                rows={3}
                showCount
                maxLength={100}
                placeholder="添加更多细节描述..."
                className="!bg-transparent !border-0 !border-b !border-white/10 !rounded-0 !px-0 !text-white placeholder:!text-white/20 focus:!border-primary !shadow-none transition-all resize-none"
              />
            </Form.Item>
          </div>

          <div className="mt-8">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              size="large"
              icon={<CloudUploadOutlined />}
              className="h-14 !rounded-2xl !text-lg font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              立即发布
            </Button>
          </div>
        </Form>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .publish-dragger .ant-upload-btn { padding: 0 !important; }
        .publish-dragger:hover { border-color: #FE2C55 !important; }
      `}} />
    </div>
  )
}
