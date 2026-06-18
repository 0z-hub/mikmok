import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { message } from 'antd'
import {
  HeartOutlined,
  HeartFilled,
  PlusCircleFilled,
} from '@ant-design/icons'
import request from '../utils/request'
import './Recommend.css'

const PAGE_SIZE = 10

function formatDuration(seconds) {
  if (!seconds || !Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function mergeStartVideo(startVideo, list) {
  if (!startVideo) return list
  return [startVideo, ...list.filter((v) => v.id !== startVideo.id)]
}

export default function Recommend() {
  const navigate = useNavigate()
  const location = useLocation()
  const containerRef = useRef(null)
  const videoRefs = useRef({})
  const progressBarRefs = useRef({})
  const pendingStartVideo = useRef(location.state?.startVideo ?? null)
  const pendingPlayId = useRef(null)

  const [videos, setVideos] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loadError, setLoadError] = useState(false)
  const [playbackTime, setPlaybackTime] = useState({ current: 0, duration: 0 })

  useEffect(() => {
    if (location.state?.startVideo) {
      navigate('.', { replace: true, state: null })
    }
  }, [location.state, navigate])

  // 获取视频列表
  const fetchVideos = useCallback(async (pageNum) => {
    if (loading) return
    setLoading(true)
    setLoadError(false)
    try {
      const res = await request.get('/api/videos/recommend', {
        params: { page: pageNum, size: PAGE_SIZE },
      })
      const newVideos = res.data || []
      if (newVideos.length < PAGE_SIZE) {
        setHasMore(false)
      }
      if (pageNum === 1) {
        const startVideo = pendingStartVideo.current
        const merged = mergeStartVideo(startVideo, newVideos)
        if (startVideo) {
          pendingStartVideo.current = null
          pendingPlayId.current = startVideo.id
        }
        setVideos(merged)
      } else {
        setVideos((prev) => [...prev, ...newVideos])
      }
    } catch (error) {
      if (pageNum === 1 && pendingStartVideo.current) {
        const startVideo = pendingStartVideo.current
        pendingStartVideo.current = null
        pendingPlayId.current = startVideo.id
        setVideos([startVideo])
        setHasMore(false)
      } else {
        setLoadError(true)
      }
      // 错误由请求拦截器统一处理
    } finally {
      setLoading(false)
    }
  }, [loading])

  // 首次加载
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVideos(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 预加载下一页
  useEffect(() => {
    if (page > 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchVideos(page)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const updateProgress = useCallback((videoId, currentTime, duration) => {
    const bar = progressBarRefs.current[videoId]
    if (!bar || !duration) return
    bar.style.width = `${(currentTime / duration) * 100}%`
  }, [])

  const resetProgress = useCallback((videoId) => {
    const bar = progressBarRefs.current[videoId]
    if (bar) bar.style.width = '0%'
  }, [])

  const handleSeek = useCallback((videoId, e) => {
    e.stopPropagation()
    const video = videoRefs.current[videoId]
    if (!video?.duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const newTime = ratio * video.duration
    video.currentTime = newTime
    updateProgress(videoId, newTime, video.duration)
    setPlaybackTime({ current: newTime, duration: video.duration })
  }, [updateProgress])

  // 监听滚动：检测当前视频索引 + 预加载
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const scrollTop = container.scrollTop
    const itemHeight = container.clientHeight
    const index = Math.round(scrollTop / itemHeight)

    if (index !== currentIndex) {
      resetProgress(videos[currentIndex]?.id)
      setPlaybackTime({ current: 0, duration: 0 })
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
  }, [currentIndex, videos, hasMore, loading, resetProgress])

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

  useEffect(() => {
    if (!pendingPlayId.current || videos.length === 0) return

    const playId = pendingPlayId.current
    pendingPlayId.current = null
    setCurrentIndex(0)
    setPlaybackTime({ current: 0, duration: 0 })

    const container = containerRef.current
    if (container) {
      container.scrollTop = 0
    }

    requestAnimationFrame(() => {
      const currentVideo = videoRefs.current[playId]
      if (currentVideo) {
        currentVideo.currentTime = 0
        currentVideo.play().catch(() => {})
      }
    })
  }, [videos])

  // 模拟数据兜底
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token === 'mock-token-for-debug' && videos.length === 0 && !loading) {
      const mockVideos = [
        {
          id: 1,
          title: '欢迎来到 MikMok！',
          description: '这是一个沉浸式的短视频平台重构演示。',
          videoUrl: '',
          authorName: 'MikMok_Official',
          likeCount: 1280,
          isLiked: false,
        },
        {
          id: 2,
          title: '深色模式体验',
          description: '深色模式让视频内容更加突出，享受极致的观影体验。',
          videoUrl: '',
          authorName: 'Design_Master',
          likeCount: 886,
          isLiked: true,
        },
      ]
      const startVideo = pendingStartVideo.current
      const merged = mergeStartVideo(startVideo, mockVideos)
      if (startVideo) {
        pendingStartVideo.current = null
        pendingPlayId.current = startVideo.id
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVideos(merged)
      setHasMore(false)
    }
  }, [videos.length, loading])

  const renderVideoItem = (video, index) => {
    const isActive = index === currentIndex

    return (
      <div className="snap-start h-full w-full relative bg-black flex items-center justify-center overflow-hidden" key={video.id}>
        {/* 视频播放器 */}
        <div className="w-full h-full flex items-center justify-center">
          {video.videoUrl ? (
            <video
              ref={(el) => (videoRefs.current[video.id] = el)}
              src={video.videoUrl}
              className="w-full h-full object-contain"
              loop
              playsInline
              preload="metadata"
              onLoadedMetadata={(e) => {
                if (!isActive) return
                const el = e.currentTarget
                setPlaybackTime({ current: el.currentTime, duration: el.duration })
              }}
              onCanPlay={() => {
                if (isActive) {
                  videoRefs.current[video.id]?.play().catch(() => {})
                }
              }}
              onTimeUpdate={(e) => {
                if (!isActive) return
                const el = e.currentTarget
                updateProgress(video.id, el.currentTime, el.duration)
                setPlaybackTime({ current: el.currentTime, duration: el.duration })
              }}
            />
          ) : (
            <div className="flex flex-col items-center text-white/20">
              <span className="text-6xl mb-4">🎬</span>
              <span className="text-sm tracking-widest">VIDEO LOADING</span>
            </div>
          )}
        </div>

        {/* 右侧操作栏 */}
        <div className="absolute right-4 bottom-48 flex flex-col items-center space-y-6 z-10">
          <div className="flex flex-col items-center group" onClick={(e) => handleLike(video.id, e)}>
            <div className={`w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center transition-all active:scale-75 ${video.isLiked ? 'text-primary' : 'text-white'}`}>
              {video.isLiked ? <HeartFilled className="text-2xl" /> : <HeartOutlined className="text-2xl" />}
            </div>
            <span className="text-xs mt-1 font-bold drop-shadow-md">{video.likeCount ?? 0}</span>
          </div>

        </div>

        {/* 底部信息区 */}
        <div className="absolute left-0 right-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          {isActive && video.videoUrl && (
            <div className="px-4 pt-3">
              <div className="flex items-center justify-between text-[10px] text-white/60 mb-1 font-mono tabular-nums select-none">
                <span>{formatDuration(playbackTime.current)}</span>
                <span>{formatDuration(playbackTime.duration)}</span>
              </div>
              <div
                role="slider"
                aria-label="播放进度"
                aria-valuemin={0}
                aria-valuemax={playbackTime.duration || 0}
                aria-valuenow={playbackTime.current}
                className="h-5 flex items-center cursor-pointer"
                onClick={(e) => handleSeek(video.id, e)}
              >
                <div className="h-[3px] w-full rounded-full bg-white/25 overflow-hidden group-hover:h-[4px] transition-all">
                  <div
                    ref={(el) => (progressBarRefs.current[video.id] = el)}
                    className="h-full bg-primary rounded-full pointer-events-none"
                    style={{ width: '0%' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="p-4 pb-5 pt-3 max-w-[80%]">
            <div className="font-bold text-lg mb-2 flex items-center">
              <span className="bg-primary w-1 h-4 rounded-full mr-2"></span>
              @{video.authorName}
            </div>
            <div className="text-sm text-white/90 leading-relaxed drop-shadow-sm">
              <div className="font-bold line-clamp-2">{video.title}</div>
              {video.description?.trim() && (
                <div className="mt-1 text-white/75 line-clamp-3">{video.description.trim()}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-black overflow-hidden relative">
      {loadError && videos.length === 0 ? (
        <div className="h-full w-full flex flex-col items-center justify-center bg-black p-6 text-center">
          <div className="text-6xl mb-6">📡</div>
          <h3 className="text-white text-lg font-bold mb-2">网络连接失败</h3>
          <p className="text-white/40 text-sm mb-8">请检查您的网络设置后重试</p>
          <button
            onClick={() => fetchVideos(1)}
            className="px-8 py-3 bg-primary text-white rounded-full font-bold active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            重新加载
          </button>
        </div>
      ) : (
        <div
          className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
          ref={containerRef}
          onScroll={handleScroll}
        >
          {videos.map((video, index) => renderVideoItem(video, index))}

          {loading && (
            <div className="h-full w-full flex items-center justify-center bg-black">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>
          )}

          {!hasMore && videos.length > 0 && (
            <div className="h-40 w-full flex items-center justify-center text-white/20 text-xs tracking-widest uppercase">
              - End of Feed -
            </div>
          )}
        </div>
      )}
    </div>
  )
}
