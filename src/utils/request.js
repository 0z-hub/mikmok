import axios from 'axios'
import { message } from 'antd'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
})

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => {
    const { data } = response
    const code = data?.code
    const isSuccess = code === undefined || code === 0 || code === 200 || code === 201
    if (!isSuccess) {
      message.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return data
  },
  (error) => {
    const errMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      '网络错误'
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
    }
    message.error(errMsg)
    return Promise.reject(error)
  }
)

export default request
