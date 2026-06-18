import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Input,
  Button,
  Tabs,
  Card,
  Statistic,
  Row,
  Col,
  message,
  Pagination,
  Spin,
  Empty,
  Tag,
  Table,
  Segmented,
} from 'antd'
import {
  ReloadOutlined,
  DashboardOutlined,
  UnorderedListOutlined,
  DownOutlined,
  UpOutlined,
  AppstoreOutlined,
  TableOutlined,
} from '@ant-design/icons'
import request from '../utils/request'

function formatTime(time) {
  if (!time) return '-'
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return time
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function LogCard({ log, expanded, onToggle }) {
  const slow = log.durationMs > 500
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Tag color="blue" className="!m-0">{log.method}</Tag>
          <span className={`text-sm font-bold ${slow ? 'text-primary' : 'text-white'}`}>
            {log.durationMs} ms
          </span>
          <span className="text-white/40 text-xs">#{log.id}</span>
        </div>
        <span className="text-white/40 text-xs shrink-0">{formatTime(log.createdAt)}</span>
      </div>
      <div className="text-white/90 text-sm break-all mb-2">{log.path}</div>
      <div className="text-white/50 text-xs mb-2">
        用户 ID：{log.userId ?? '未登录'}
      </div>
      <button
        type="button"
        className="text-primary text-xs flex items-center gap-1"
        onClick={onToggle}
      >
        {expanded ? <UpOutlined /> : <DownOutlined />}
        {expanded ? '收起详情' : '查看入参/出参'}
      </button>
      {expanded && (
        <div className="mt-3 space-y-2">
          <div>
            <div className="text-white/40 text-xs mb-1">输入参数</div>
            <pre className="text-white/70 text-xs bg-black/40 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
              {log.inputParams || '-'}
            </pre>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">输出结果</div>
            <pre className="text-white/70 text-xs bg-black/40 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
              {log.outputData || '-'}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

const LOG_TABLE_COLUMNS = [
  { title: 'ID', dataIndex: 'id', width: 56, fixed: 'left' },
  {
    title: '路径',
    dataIndex: 'path',
    width: 200,
    ellipsis: true,
  },
  {
    title: '方法',
    dataIndex: 'method',
    width: 64,
    render: (method) => <Tag color="blue" className="!m-0">{method}</Tag>,
  },
  {
    title: '用户ID',
    dataIndex: 'userId',
    width: 72,
    render: (v) => v ?? '-',
  },
  {
    title: '耗时(ms)',
    dataIndex: 'durationMs',
    width: 80,
    render: (v) => (
      <span className={v > 500 ? 'text-primary font-bold' : ''}>{v}</span>
    ),
  },
  {
    title: '时间',
    dataIndex: 'createdAt',
    width: 140,
    render: formatTime,
  },
]

export default function Admin() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role')

  const [logs, setLogs] = useState([])
  const [logTotal, setLogTotal] = useState(0)
  const [logPage, setLogPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filterUserId, setFilterUserId] = useState('')
  const [logsLoading, setLogsLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [viewMode, setViewMode] = useState('card')

  const [stats, setStats] = useState([])
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    if (role !== 'ADMIN') {
      message.error('无权访问后台监控')
      navigate('/recommend', { replace: true })
    }
  }, [role, navigate])

  const fetchLogs = useCallback(async (page, size, userId) => {
    setLogsLoading(true)
    try {
      const params = { page, size }
      if (userId) params.userId = Number(userId)
      const res = await request.get('/api/admin/logs', { params })
      setLogs(res.data?.list || [])
      setLogTotal(Number(res.data?.total) || 0)
      setExpandedId(null)
    } catch {
      // 错误由拦截器处理
    } finally {
      setLogsLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await request.get('/api/admin/stats/duration')
      setStats(res.data || [])
    } catch {
      // 错误由拦截器处理
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (role === 'ADMIN') {
      fetchLogs(logPage, pageSize, filterUserId)
    }
  }, [role, logPage, pageSize, filterUserId, fetchLogs])

  useEffect(() => {
    if (role === 'ADMIN') {
      fetchStats()
    }
  }, [role, fetchStats])

  const handleSearch = () => {
    setLogPage(1)
    fetchLogs(1, pageSize, filterUserId)
  }

  const handlePageChange = (page, size) => {
    if (size !== pageSize) {
      setPageSize(size)
      setLogPage(1)
    } else {
      setLogPage(page)
    }
  }

  const avgAll = stats.length
    ? (stats.reduce((sum, s) => sum + s.avgDuration, 0) / stats.length).toFixed(1)
    : 0
  const maxAll = stats.length ? Math.max(...stats.map((s) => s.maxDuration)) : 0
  const totalCalls = stats.reduce((sum, s) => sum + s.callCount, 0)

  const tabItems = [
    {
      key: 'logs',
      label: (
        <span>
          <UnorderedListOutlined /> 请求日志
        </span>
      ),
      children: (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            <Input
              placeholder="按用户 ID 筛选"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value.replace(/\D/g, ''))}
              className="!flex-1 !min-w-[120px] !bg-white/5 !border-white/10 !text-white"
              allowClear
            />
            <Button type="primary" onClick={handleSearch}>
              查询
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchLogs(logPage, pageSize, filterUserId)}
            >
              刷新
            </Button>
          </div>

          <div className="mb-4 flex justify-end">
            <Segmented
              value={viewMode}
              onChange={setViewMode}
              options={[
                { label: '卡片', value: 'card', icon: <AppstoreOutlined /> },
                { label: '表格', value: 'table', icon: <TableOutlined /> },
              ]}
              className="admin-view-toggle"
            />
          </div>

          <Spin spinning={logsLoading}>
            {logs.length === 0 && !logsLoading ? (
              <Empty description="暂无日志" className="admin-empty" />
            ) : viewMode === 'card' ? (
              logs.map((log) => (
                <LogCard
                  key={log.id}
                  log={log}
                  expanded={expandedId === log.id}
                  onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
                />
              ))
            ) : (
              <>
                <p className="text-white/30 text-xs mb-2 text-center">左右滑动查看完整表格</p>
                <div className="admin-table-scroll">
                  <Table
                    rowKey="id"
                    columns={LOG_TABLE_COLUMNS}
                    dataSource={logs}
                    pagination={false}
                    size="small"
                    scroll={{ x: 612 }}
                  />
                </div>
              </>
            )}
          </Spin>

          {logTotal > 0 && (
            <div className="admin-pagination mt-4">
              <div className="text-white/40 text-xs text-center mb-3">
                共 {logTotal} 条，第 {logPage} / {Math.ceil(logTotal / pageSize)} 页
              </div>
              <Pagination
                current={logPage}
                pageSize={pageSize}
                total={logTotal}
                onChange={handlePageChange}
                showSizeChanger
                pageSizeOptions={[5, 10, 20, 50]}
                size="small"
                align="center"
              />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'stats',
      label: (
        <span>
          <DashboardOutlined /> 耗时统计
        </span>
      ),
      children: (
        <div>
          <Row gutter={[12, 12]} className="mb-4">
            <Col span={8}>
              <Card className="!bg-white/5 !border-white/10" size="small">
                <Statistic title="接口数" value={stats.length} suffix="个" />
              </Card>
            </Col>
            <Col span={8}>
              <Card className="!bg-white/5 !border-white/10" size="small">
                <Statistic title="总调用" value={totalCalls} />
              </Card>
            </Col>
            <Col span={8}>
              <Card className="!bg-white/5 !border-white/10" size="small">
                <Statistic title="最大耗时" value={maxAll} suffix="ms" />
              </Card>
            </Col>
          </Row>
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <Button icon={<ReloadOutlined />} onClick={fetchStats} loading={statsLoading} size="small">
              刷新
            </Button>
            <span className="text-white/40 text-xs">平均耗时均值: {avgAll} ms</span>
          </div>
          <Spin spinning={statsLoading}>
            {stats.length === 0 && !statsLoading ? (
              <Empty description="暂无统计数据" className="admin-empty" />
            ) : (
              stats.map((item) => (
                <div
                  key={item.path}
                  className="bg-white/5 border border-white/10 rounded-xl p-3 mb-3"
                >
                  <div className="text-white/90 text-sm break-all mb-2">{item.path}</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-white/40 text-xs">平均</div>
                      <div className="text-white text-sm font-bold">{item.avgDuration?.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-xs">最大</div>
                      <div className="text-primary text-sm font-bold">{item.maxDuration}</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-xs">次数</div>
                      <div className="text-white text-sm font-bold">{item.callCount}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </Spin>
        </div>
      ),
    },
  ]

  if (role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-full bg-black p-4 pb-24">
      <div className="w-full mx-auto">
        <div className="mb-4 mt-2">
          <h2 className="text-xl font-bold text-white flex items-center">
            <span className="w-2 h-5 bg-primary rounded-full mr-2"></span>
            系统监控面板
          </h2>
          <p className="text-white/40 text-xs mt-1">全量接口请求日志与耗时分布</p>
        </div>
        <Tabs items={tabItems} className="admin-tabs" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-tabs .ant-tabs-nav::before { border-bottom: 1px solid rgba(255,255,255,0.1) !important; }
        .admin-tabs .ant-tabs-tab { color: rgba(255,255,255,0.5) !important; padding: 8px 12px !important; }
        .admin-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #fff !important; font-weight: bold !important; }
        .admin-tabs .ant-tabs-ink-bar { background: #FE2C55 !important; }
        .admin-tabs .ant-statistic-title { color: rgba(255,255,255,0.5) !important; font-size: 11px !important; }
        .admin-tabs .ant-statistic-content { color: #fff !important; font-size: 16px !important; }
        .admin-empty .ant-empty-description { color: rgba(255,255,255,0.4) !important; }
        .admin-pagination .ant-pagination {
          display: flex !important;
          flex-wrap: wrap !important;
          justify-content: center !important;
          gap: 6px !important;
          row-gap: 10px !important;
        }
        .admin-pagination .ant-pagination-item,
        .admin-pagination .ant-pagination-prev,
        .admin-pagination .ant-pagination-next,
        .admin-pagination .ant-pagination-jump-prev,
        .admin-pagination .ant-pagination-jump-next {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.15) !important;
          min-width: 32px !important;
          height: 32px !important;
          line-height: 30px !important;
        }
        .admin-pagination .ant-pagination-item a,
        .admin-pagination .ant-pagination-item-link {
          color: rgba(255,255,255,0.85) !important;
        }
        .admin-pagination .ant-pagination-item-active {
          background: #FE2C55 !important;
          border-color: #FE2C55 !important;
        }
        .admin-pagination .ant-pagination-item-active a {
          color: #fff !important;
        }
        .admin-pagination .ant-pagination-disabled .ant-pagination-item-link {
          color: rgba(255,255,255,0.25) !important;
        }
        .admin-pagination .ant-pagination-options {
          margin-left: 0 !important;
        }
        .admin-pagination .ant-select-selector {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.15) !important;
          color: #fff !important;
          height: 32px !important;
        }
        .admin-pagination .ant-select-selection-item {
          color: rgba(255,255,255,0.85) !important;
          line-height: 30px !important;
        }
        .admin-pagination .ant-select-arrow {
          color: rgba(255,255,255,0.5) !important;
        }
        .admin-view-toggle {
          background: rgba(255,255,255,0.08) !important;
          padding: 2px !important;
        }
        .admin-view-toggle .ant-segmented-item-label {
          color: rgba(255,255,255,0.6) !important;
          padding: 0 10px !important;
          min-height: 28px !important;
          line-height: 28px !important;
          font-size: 12px !important;
        }
        .admin-view-toggle .ant-segmented-item-selected .ant-segmented-item-label {
          color: #fff !important;
        }
        .admin-view-toggle .ant-segmented-item-selected {
          background: rgba(254,44,85,0.85) !important;
        }
        .admin-table-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          margin: 0 -4px;
          padding-bottom: 4px;
        }
        .admin-table-scroll .ant-table {
          background: transparent !important;
          min-width: 612px;
        }
        .admin-table-scroll .ant-table-thead > tr > th {
          background: rgba(255,255,255,0.05) !important;
          color: rgba(255,255,255,0.7) !important;
          border-bottom: 1px solid rgba(255,255,255,0.1) !important;
          white-space: nowrap;
        }
        .admin-table-scroll .ant-table-tbody > tr > td {
          border-bottom: 1px solid rgba(255,255,255,0.05) !important;
          color: rgba(255,255,255,0.85) !important;
          background: transparent !important;
        }
        .admin-table-scroll .ant-table-tbody > tr:hover > td {
          background: rgba(255,255,255,0.03) !important;
        }
        .admin-table-scroll .ant-table-cell-fix-left {
          background: #111 !important;
        }
        .admin-table-scroll .ant-table-tbody > tr:hover > .ant-table-cell-fix-left {
          background: #1a1a1a !important;
        }
      `}} />
    </div>
  )
}
