import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button, message } from 'antd'
import {
  HeartOutlined,
  HeartFilled,
  VideoCameraOutlined,
  PlayCircleOutlined,
  PlusCircleFilled,
} from '@ant-design/icons'
import request from '../utils/request'
import './Recommend.css'

const PAGE_SIZE = 10

export default function Recommend() {
  const navigate = useNavigate()
  const location = useLocation()
  const containerRef = useRef(null)
  const videoRefs = useRef({})

  const [videos, setVideos] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  // 获取视频列表
  const fetchVideos = useCallback(async (pageNum) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await request.get('/api/videos/recommend', {
        params: { page: pageNum, size: PAGE_SIZE },
      })
      const newVideos = res.data || []
      if (newVideos.length < PAGE_SIZE) {
        setHasMore(false)
      }
      if (pageNum === 1) {
        setVideos(newVideos)
      } else {
        setVideos((prev) => [...prev, ...newVideos])
      }
    } catch {
      // 错误由请求拦截器统一处理
    } finally {
      setLoading(false)
    }
  }, [loading])

  // 首次加载
  useEffect(() => {
    fetchVideos(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 预加载下一页
  useEffect(() => {
    if (page > 1) {
      fetchVideos(page)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // 监听滚动：检测当前视频索引 + 预加载
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const scrollTop = container.scrollTop
    const itemHeight = container.clientHeight
    const index = Math.round(scrollTop / itemHeight)

    if (index !== currentIndex) {
      setCurrentIndex(index)

      // 暂停所有视频，播放当前视频
      Object.values(videoRefs.current).forEach((video) => {
        if (video) video.pause()
      })
      const currentVideo = videoRefs.current[videos[index]?.id]
      if (currentVideo) {
        currentVideo.currentTime = 0
        currentVideo.play().catch(() => {})
      }
    }

    // 滚动到倒数第 3 个时加载更多
    if (index >= videos.length - 3 && hasMore && !loading) {
      setPage((prev) => prev + 1)
    }
  }, [currentIndex, videos, hasMore, loading])

  // 点赞 / 取消点赞
  const handleLike = async (videoId, e) => {
    e.stopPropagation()
    if (localStorage.getItem('token') === 'mock-token-for-debug') {
      message.info('请先登录后点赞')
      return
    }
    try {
      const res = await request.post(`/api/videos/like/${videoId}`)
      const { liked, currentLikeCount } = res.data
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId ? { ...v, isLiked: liked, likeCount: currentLikeCount } : v,
        ),
      )
    } catch {
      // 错误由请求拦截器统一处理
    }
  }

  // 模拟数据兜底（当后端无数据时，方便调试）
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token === 'mock-token-for-debug' && videos.length === 0 && !loading) {
      const mockVideos = [
        {
          id: 1,
          title: '第一次拍的视频',
          videoUrl: '',
          authorName: '调试用户',
          likeCount: 12,
          isLiked: false,
          createdAt: '2026-06-15T10:00:00',
        },
        {
          id: 2,
          title: '搞笑日常Vlog',
          videoUrl: '',
          authorName: '小明',
          likeCount: 88,
          isLiked: true,
          createdAt: '2026-06-16T14:30:00',
        },
        {
          id: 3,
          title: '美食探店',
          videoUrl: '',
          authorName: '小红',
          likeCount: 256,
          isLiked: false,
          createdAt: '2026-06-17T09:15:00',
        },
      ]
      setVideos(mockVideos)
      setHasMore(false)
    }
  }, [videos.length, loading])

  // 底部 TabBar 公共组件
  const tabBar = (
    <nav className="recommend-tabbar">
      <div
        className={`rec-tab-item ${location.pathname === '/recommend' || location.pathname === '/' ? 'active' : ''}`}
        onClick={() => navigate('/recommend')}
      >
        <PlayCircleOutlined className="rec-tab-icon" />
        <span className="rec-tab-label">推荐</span>
      </div>
      <div
        className="rec-tab-item rec-tab-publish"
        onClick={() => navigate('/publish')}
      >
        <PlusCircleFilled className="rec-tab-icon" />
        <span className="rec-tab-label">发布</span>
      </div>
      <div
        className="rec-tab-item"
        onClick={() => navigate('/manage')}
      >
        <VideoCameraOutlined className="rec-tab-icon" />
        <span className="rec-tab-label">我的</span>
      </div>
    </nav>
  )

  const renderContent = () => {
    if (videos.length === 0 && loading) {
      return (
        <div className="recommend-loading">
          <div className="loading-spinner" />
          <p>加载推荐视频中...</p>
        </div>
      )
    }

    if (videos.length === 0 && !loading) {
      return (
        <div className="recommend-empty">
          <p>暂无推荐视频</p>
          <Button type="primary" onClick={() => navigate('/publish')}>
            去发布第一个视频
          </Button>
        </div>
      )
    }

    return (
      <div
        className="snap-container"
        ref={containerRef}
        onScroll={handleScroll}
      >
        {videos.map((video, index) => (
          <div className="snap-item" key={video.id}>
            {/* 视频播放器 */}
            <div className="video-wrapper">
              {video.videoUrl ? (
                <video
                  ref={(el) => (videoRefs.current[video.id] = el)}
                  src={video.videoUrl}
                  className="video-player"
                  loop
                  muted={false}
                  playsInline
                  preload="metadata"
                  onCanPlay={() => {
                    if (index === currentIndex) {
                      videoRefs.current[video.id]?.play().catch(() => {})
                    }
                  }}
                />
              ) : (
                <div className="video-placeholder">
                  <span>🎬 视频加载中...</span>
                </div>
              )}
            </div>

            {/* 右侧操作栏 */}
            <div className="side-actions">
              {/* 点赞 */}
              <div
                className="action-btn"
                onClick={(e) => handleLike(video.id, e)}
              >
                {video.isLiked ? (
                  <HeartFilled className="icon liked" />
                ) : (
                  <HeartOutlined className="icon" />
                )}
                <span className="count">{video.likeCount ?? 0}</span>
              </div>
            </div>

            {/* 底部信息 */}
            <div className="video-info">
              <div className="author">@{video.authorName}</div>
              <div className="title">{video.title}</div>
            </div>

            {/* 滚动指示器 */}
            <div className="scroll-indicator">
              {videos.map((_, i) => (
                <div
                  key={i}
                  className={`dot ${i === currentIndex ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>
        ))}

        {/* 加载更多指示器 */}
        {loading && (
          <div className="snap-item loading-more">
            <div className="loading-spinner" />
            <p>加载更多视频...</p>
          </div>
        )}

        {!hasMore && videos.length > 0 && (
          <div className="snap-item no-more">
            <p>🎉 已看完所有视频</p>
            <Button type="primary" onClick={() => navigate('/publish')}>
              发布更多视频
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="recommend-page">
      <div className="recommend-topbar">
        <span className="topbar-brand" onClick={() => navigate('/recommend')}>
          MikMok
        </span>
      </div>

      {renderContent()}
      {tabBar}
    </div>
  )
}
