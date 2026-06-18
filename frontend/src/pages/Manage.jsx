import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Empty, Form, Input, Modal, Popconfirm, message } from 'antd'
import {
  HeartFilled,
  DeleteOutlined,
  EditOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PlayCircleFilled,
} from '@ant-design/icons'
import request from '../utils/request'

const PAGE_SIZE = 10
const MOCK_DEBUG_TOKEN = 'mock-token-for-debug'
const MOCK_TOTAL = 15

const ALL_MOCK_LIST = [
  { id: 1, title: '第一次拍的视频', createTime: '2026-06-15T10:00:00', likeCount: 12, videoUrl: '' },
  { id: 2, title: '课程作业演示', createTime: '2026-06-16T14:30:00', likeCount: 5, videoUrl: '' },
  { id: 3, title: '搞笑日常Vlog', createTime: '2026-06-17T09:15:00', likeCount: 8, videoUrl: '' },
  { id: 4, title: '周末旅行记录', createTime: '2026-06-10T16:20:00', likeCount: 23, videoUrl: '' },
  { id: 5, title: '美食探店第一弹', createTime: '2026-06-11T11:45:00', likeCount: 17, videoUrl: '' },
]

function formatTime(time) {
  if (!time) return '-'
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return time
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Manage() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [editingVideo, setEditingVideo] = useState(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const username = localStorage.getItem('username') || '用户'

  const fetchList = useCallback(async (currentPage) => {
    setLoading(true)
    try {
      if (localStorage.getItem('token') === MOCK_DEBUG_TOKEN) {
        const start = (currentPage - 1) * PAGE_SIZE
        const pageList = ALL_MOCK_LIST.slice(start, start + PAGE_SIZE)
        setList(pageList)
        setTotal(MOCK_TOTAL)
        return
      }

      const res = await request.get('/api/my/videos', {
        params: { page: currentPage, size: PAGE_SIZE },
      })
      setList(res.data?.list || [])
      setTotal(Number(res.data?.total) || 0)
    } catch {
      // 错误信息由 request 拦截器统一处理
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchList(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleWatch = (video) => {
    if (!video.videoUrl) {
      message.warning('该视频暂无可播放地址')
      return
    }
    navigate('/recommend', {
      state: {
        startVideo: {
          id: video.id,
          title: video.title,
          description: video.description || '',
          videoUrl: video.videoUrl,
          authorName: username,
          likeCount: video.likeCount ?? 0,
          isLiked: false,
        },
      },
    })
  }

  const handleDelete = async (videoId) => {
    try {
      await request.delete(`/api/my/videos/${videoId}`)
      message.success('删除成功')
      const isLastItemOnPage = list.length === 1
      const nextPage = isLastItemOnPage && page > 1 ? page - 1 : page
      if (nextPage !== page) {
        setPage(nextPage)
      } else {
        fetchList(page)
      }
    } catch {
      // 错误信息由 request 拦截器统一处理
    }
  }

  const handleEditOpen = (video) => {
    setEditingVideo(video)
    form.setFieldsValue({
      title: video.title,
      description: video.description || '',
    })
  }

  const handleEditClose = () => {
    setEditingVideo(null)
    form.resetFields()
  }

  const handleEditSubmit = async (values) => {
    if (!editingVideo) return

    setEditSubmitting(true)
    try {
      if (localStorage.getItem('token') === MOCK_DEBUG_TOKEN) {
        setList((prev) =>
          prev.map((v) =>
            v.id === editingVideo.id
              ? { ...v, title: values.title, description: values.description || '' }
              : v,
          ),
        )
        message.success('修改成功')
        handleEditClose()
        return
      }

      const res = await request.put(`/api/my/videos/${editingVideo.id}`, {
        title: values.title,
        description: values.description || '',
      })
      const updated = res.data
      setList((prev) =>
        prev.map((v) => (v.id === editingVideo.id ? { ...v, ...updated } : v)),
      )
      message.success('修改成功')
      handleEditClose()
    } catch {
      // 错误信息由 request 拦截器统一处理
    } finally {
      setEditSubmitting(false)
    }
  }

  return (
    <div className="min-h-full bg-black pb-20">
      {/* 个人信息头部 */}
      <div className="bg-gradient-to-b from-card-bg to-black p-6 pt-8 border-b border-white/5">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary text-3xl">
            <UserOutlined />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">{username}</h2>
            <div className="flex space-x-4 text-sm text-white/60">
              <span><strong className="text-white">{total}</strong> 作品</span>
              <span><strong className="text-white">{list.reduce((acc, cur) => acc + (cur.likeCount || 0), 0)}</strong> 获赞</span>
            </div>
          </div>
        </div>
      </div>

      {/* 视频列表 */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium flex items-center">
            <span className="w-1 h-4 bg-primary rounded-full mr-2"></span>
            我的作品
          </h3>
          <span className="text-xs text-white/40">共 {total} 个</span>
        </div>

        {loading && list.length === 0 ? (
          <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
        ) : list.length > 0 ? (
          <div className="space-y-3">
            {list.map((video) => (
              <div key={video.id} className="bg-card-bg rounded-xl overflow-hidden border border-white/5 flex p-3 shadow-lg">
                {/* 左侧缩略图 */}
                <button
                  type="button"
                  className="relative w-28 h-20 shrink-0 bg-black rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => handleWatch(video)}
                  aria-label={`预览视频：${video.title}`}
                >
                  {video.videoUrl ? (
                    <video
                      src={video.videoUrl}
                      className="w-full h-full object-cover pointer-events-none"
                      preload="metadata"
                      muted
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10">
                      <span className="text-2xl">🎬</span>
                    </div>
                  )}
                  {video.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayCircleFilled className="text-2xl text-white/90" />
                    </div>
                  )}
                </button>

                {/* 右侧内容信息 */}
                <div className="ml-3 flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <button
                      type="button"
                      className="text-white font-medium text-sm line-clamp-1 mb-1 text-left w-full hover:text-primary transition-colors cursor-pointer"
                      onClick={() => handleWatch(video)}
                    >
                      {video.title}
                    </button>
                    <div className="flex items-center space-x-3 text-[10px] text-white/40">
                      <span className="flex items-center">
                        <ClockCircleOutlined className="mr-1" />
                        {formatTime(video.createdAt || video.createTime)}
                      </span>
                      <span className="flex items-center">
                        <HeartFilled className="mr-1 text-primary/60" />
                        {video.likeCount ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      className="h-7 px-2 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-md"
                      onClick={() => handleEditOpen(video)}
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="确定删除该视频吗？"
                      okText="确定"
                      cancelText="取消"
                      onConfirm={() => handleDelete(video.id)}
                      overlayClassName="dark-popconfirm"
                    >
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        className="h-7 px-2 text-xs hover:bg-red-500/10 rounded-md"
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span className="text-white/40">暂无作品，快去发布吧</span>}
            />
            <div className="mt-6 flex justify-center">
              <Button type="primary" shape="round" onClick={() => navigate('/publish')}>
                发布第一个视频
              </Button>
            </div>
          </div>
        )}

        {/* 分页 */}
        {total > PAGE_SIZE && (
          <div className="mt-8 flex justify-center space-x-2">
            <Button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="bg-card-bg border-white/10 text-white disabled:opacity-30"
            >
              上一页
            </Button>
            <Button
              disabled={page * PAGE_SIZE >= total}
              onClick={() => setPage(p => p + 1)}
              className="bg-card-bg border-white/10 text-white disabled:opacity-30"
            >
              下一页
            </Button>
          </div>
        )}
      </div>

      <Modal
        title="编辑作品"
        open={!!editingVideo}
        onCancel={handleEditClose}
        footer={null}
        destroyOnHidden
        className="edit-video-modal"
        styles={{
          content: { background: '#161823', padding: 0 },
          header: { background: '#161823', borderBottom: '1px solid rgba(255,255,255,0.1)' },
          body: { background: '#161823', padding: '20px 24px 24px' },
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleEditSubmit} requiredMark={false}>
          <div className="bg-black/30 rounded-xl p-4 border border-white/10 space-y-4">
            <Form.Item
              label={<span className="text-white/60 text-xs">视频标题</span>}
              name="title"
              rules={[
                { required: true, message: '请输入视频标题' },
                { max: 100, message: '标题不能超过 100 字' },
              ]}
              className="mb-0"
            >
              <Input
                placeholder="视频标题"
                maxLength={100}
                className="edit-video-input"
              />
            </Form.Item>
            <Form.Item
              label={<span className="text-white/60 text-xs">视频描述（可选）</span>}
              name="description"
              rules={[{ max: 100, message: '描述不能超过 100 字' }]}
              className="mb-0"
            >
              <Input.TextArea
                rows={3}
                showCount
                maxLength={100}
                placeholder="添加更多细节描述..."
                className="edit-video-textarea"
              />
            </Form.Item>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={handleEditClose} className="!bg-white/10 !border-white/10 !text-white">
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={editSubmitting}>
              保存
            </Button>
          </div>
        </Form>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .edit-video-modal .ant-modal-title { color: #fff !important; }
        .edit-video-modal .ant-modal-close { color: rgba(255,255,255,0.45) !important; }
        .edit-video-modal .ant-modal-close:hover { color: #fff !important; }
        .edit-video-modal .edit-video-input,
        .edit-video-modal .edit-video-input input {
          color: #fff !important;
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid rgba(255,255,255,0.15) !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        .edit-video-modal .edit-video-input input::placeholder {
          color: rgba(255,255,255,0.25) !important;
        }
        .edit-video-modal .edit-video-input input:focus {
          border-bottom-color: #FE2C55 !important;
        }
        .edit-video-modal .edit-video-textarea,
        .edit-video-modal .edit-video-textarea textarea {
          color: #fff !important;
          background: rgba(0,0,0,0.25) !important;
          border: 1px solid rgba(255,255,255,0.15) !important;
          border-radius: 8px !important;
          box-shadow: none !important;
        }
        .edit-video-modal .edit-video-textarea textarea::placeholder {
          color: rgba(255,255,255,0.25) !important;
        }
        .edit-video-modal .edit-video-textarea textarea:focus {
          border-color: #FE2C55 !important;
        }
        .edit-video-modal .ant-input-textarea-show-count::after {
          color: rgba(255,255,255,0.35) !important;
        }
      `}} />
    </div>
  )
}
