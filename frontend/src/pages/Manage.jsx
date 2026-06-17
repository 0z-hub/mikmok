import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Empty, Popconfirm, Table, message } from 'antd'
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
  { id: 6, title: '健身打卡 Day7', createTime: '2026-06-12T07:30:00', likeCount: 9, videoUrl: '' },
  { id: 7, title: '宠物猫咪日常', createTime: '2026-06-13T20:10:00', likeCount: 31, videoUrl: '' },
  { id: 8, title: '编程学习笔记', createTime: '2026-06-14T13:00:00', likeCount: 6, videoUrl: '' },
  { id: 9, title: '校园风景航拍', createTime: '2026-06-14T17:25:00', likeCount: 14, videoUrl: '' },
  { id: 10, title: '篮球比赛集锦', createTime: '2026-06-15T19:40:00', likeCount: 21, videoUrl: '' },
  { id: 11, title: '读书分享会实录', createTime: '2026-06-16T10:05:00', likeCount: 4, videoUrl: '' },
  { id: 12, title: '手工 DIY 教程', createTime: '2026-06-16T15:50:00', likeCount: 11, videoUrl: '' },
  { id: 13, title: '深夜电台片段', createTime: '2026-06-17T00:30:00', likeCount: 7, videoUrl: '' },
  { id: 14, title: '产品功能演示', createTime: '2026-06-17T11:20:00', likeCount: 18, videoUrl: '' },
  { id: 15, title: '毕业设计展示', createTime: '2026-06-17T16:00:00', likeCount: 26, videoUrl: '' },
]

function formatTime(time) {
  if (!time) return '-'
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return time
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Manage() {
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

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
    fetchList(page)
  }, [page, fetchList])

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

  const columns = [
    {
      title: '#',
      width: 60,
      align: 'center',
      render: (_, __, index) => (page - 1) * PAGE_SIZE + index + 1,
    },
    {
      title: '视频封面',
      dataIndex: 'videoUrl',
      width: 140,
      render: (videoUrl) =>
        videoUrl ? (
          <video
            src={videoUrl}
            preload="metadata"
            muted
            style={{
              width: 120,
              height: 68,
              objectFit: 'cover',
              borderRadius: 4,
              background: '#000',
            }}
          />
        ) : (
          <div
            style={{
              width: 120,
              height: 68,
              borderRadius: 4,
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              fontSize: 12,
            }}
          >
            暂无封面
          </div>
        ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '发布时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (_, record) => formatTime(record.createdAt || record.createTime),
    },
    {
      title: '点赞数',
      dataIndex: 'likeCount',
      width: 90,
      align: 'center',
      render: (likeCount) => likeCount ?? 0,
    },
    {
      title: '操作',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Popconfirm
          title="确定删除该视频吗？"
          okText="确定"
          cancelText="取消"
          onConfirm={() => handleDelete(record.id)}
        >
          <Button type="link" danger>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>我的视频</h2>
        <Button type="primary" onClick={() => navigate('/publish')}>
          发布视频
        </Button>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={list}
          loading={loading}
          locale={{
            emptyText: <Empty description="暂无视频，去发布第一个吧" />,
          }}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total,
            showSizeChanger: false,
            showTotal: (count) => `共 ${count} 条`,
            onChange: (nextPage) => setPage(nextPage),
          }}
        />
      </Card>
    </>
  )
}
