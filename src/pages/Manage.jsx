import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Empty, Popconfirm, Table, message } from 'antd'
import request from '../utils/request'

const PAGE_SIZE = 10

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
      const res = await request.get('/api/video/my-list', {
        params: { page: currentPage, size: PAGE_SIZE },
      })
      setList(res.data?.list || [])
      setTotal(res.data?.total || 0)
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
      await request.delete(`/api/video/${videoId}`)
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
      dataIndex: 'createTime',
      width: 180,
      render: (createTime) => formatTime(createTime),
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
    <div
      style={{
        minHeight: '100vh',
        background: '#f0f2f5',
        padding: 24,
      }}
    >
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
    </div>
  )
}
