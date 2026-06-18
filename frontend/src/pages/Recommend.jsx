import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import {
  HeartOutlined,
  HeartFilled,
  PlusCircleFilled,
} from '@ant-design/icons'
import request from '../utils/request'
import './Recommend.css'

const PAGE_SIZE = 10

export default function Recommend() {
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const videoRefs = useRef({})

  const [videos, setVideos] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loadError, setLoadError] = useState(false)

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
        setVideos(newVideos)
      } else {
        setVideos((prev) => [...prev, ...newVideos])
      }
    } catch (error) {
      setLoadError(true)
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVideos(mockVideos)
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
              onCanPlay={() => {
                if (isActive) {
                  videoRefs.current[video.id]?.play().catch(() => {})
                }
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
        <div className="absolute left-0 right-0 bottom-0 p-4 pt-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10">
          <div className="max-w-[80%]">
            <div className="font-bold text-lg mb-2 flex items-center">
              <span className="bg-primary w-1 h-4 rounded-full mr-2"></span>
              @{video.authorName}
            </div>
            <div className="text-sm text-white/90 leading-relaxed line-clamp-3 drop-shadow-sm">
              <span className="font-bold mr-2">{video.title}</span>
              {video.description}
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
