# MikMok 视频平台 API 接口设计文档

## 0. 通用说明
*   **基础路径**: `/api`
*   **认证方式**: 请求头携带 `Authorization: Bearer {JWT_TOKEN}`
*   **数据格式**: `application/json` (除文件上传外)
*   **通用错误码**:
    *   `200/201`: 成功
    *   `400`: 参数错误
    *   `401`: 未登录或 Token 失效
    *   `403`: 权限不足
    *   `404`: 资源不存在
    *   `500`: 服务器内部错误

---

## 1. 用户认证模块 (Auth)

### 1.1 用户注册
*   **URL**: `/api/auth/register`
*   **Method**: `POST`
*   **请求参数**:
    | 字段 | 类型 | 必填 | 说明 |
    | :--- | :--- | :--- | :--- |
    | username | String | 是 | 用户名，4-20位字符 |
    | password | String | 是 | 密码，6-20位字符 |
*   **响应结果 (200 OK)**:
    ```json
    {
      "code": 200,
      "message": "注册成功",
      "data": null
    }
    ```

### 1.2 用户登录
*   **URL**: `/api/auth/login`
*   **Method**: `POST`
*   **请求参数**:
    | 字段 | 类型 | 必填 | 说明 |
    | :--- | :--- | :--- | :--- |
    | username | String | 是 | 用户名 |
    | password | String | 是 | 密码 |
*   **响应结果 (200 OK)**:
    ```json
    {
      "code": 200,
      "message": "登录成功",
      "data": {
        "token": "eyJhbGciOiJIUzI1Ni...",
        "username": "testuser",
        "role": "USER"
      }
    }
    ```

### 1.3 退出登录
*   **URL**: `/api/auth/logout`
*   **Method**: `POST`
*   **Header**: `Authorization: Bearer {token}`
*   **响应结果 (200 OK)**:
    ```json
    {
      "code": 200,
      "message": "退出成功"
    }
    ```

---

## 2. 视频浏览与推荐模块 (Videos)

### 2.1 获取推荐视频流
*   **URL**: `/api/videos/recommend`
*   **Method**: `GET`
*   **Header**: `Authorization: Bearer {token}` (可选，登录后可去重)
*   **查询参数**:
    | 参数 | 类型 | 必填 | 默认值 | 说明 |
    | :--- | :--- | :--- | :--- | :--- |
    | page | Integer | 否 | 1 | 页码 |
    | size | Integer | 否 | 10 | 每页条数 |
*   **响应结果 (200 OK)**:
    ```json
    {
      "code": 200,
      "data": [
        {
          "id": 101,
          "title": "我的第一个视频",
          "videoUrl": "http://minio:9000/videos/uuid.mp4",
          "authorName": "张三",
          "likeCount": 120,
          "isLiked": false,
          "createdAt": "2026-06-17T10:00:00"
        }
      ]
    }
    ```

### 2.2 视频点赞/取消点赞
*   **URL**: `/api/videos/like/{id}`
*   **Method**: `POST`
*   **Header**: `Authorization: Bearer {token}`
*   **路径参数**: `id` (视频ID)
*   **响应结果 (200 OK)**:
    ```json
    {
      "code": 200,
      "message": "操作成功",
      "data": {
        "liked": true,
        "currentLikeCount": 121
      }
    }
    ```

---

## 3. 个人视频管理模块 (My Videos)

### 3.1 发布视频
*   **URL**: `/api/my/videos`
*   **Method**: `POST`
*   **Header**: `Authorization: Bearer {token}`
*   **Content-Type**: `multipart/form-data`
*   **请求参数**:
    | 字段 | 类型 | 必填 | 说明 |
    | :--- | :--- | :--- | :--- |
    | file | File | 是 | 视频文件 (mp4/mov, max 50MB) |
    | title | String | 是 | 视频标题 (max 100字) |
*   **响应结果 (201 Created)**:
    ```json
    {
      "code": 201,
      "message": "发布成功",
      "data": { "id": 102 }
    }
    ```

### 3.2 获取我的视频列表
*   **URL**: `/api/my/videos`
*   **Method**: `GET`
*   **Header**: `Authorization: Bearer {token}`
*   **查询参数**: `page`, `size`
*   **响应结果 (200 OK)**:
    ```json
    {
      "code": 200,
      "data": {
        "total": 5,
        "list": [
          {
            "id": 102,
            "title": "我的视频",
            "videoUrl": "...",
            "likeCount": 10,
            "createdAt": "2026-06-17T12:00:00"
          }
        ]
      }
    }
    ```

### 3.3 删除我的视频
*   **URL**: `/api/my/videos/{id}`
*   **Method**: `DELETE`
*   **Header**: `Authorization: Bearer {token}`
*   **路径参数**: `id` (视频ID)
*   **响应结果 (200 OK)**:
    ```json
    {
      "code": 200,
      "message": "删除成功"
    }
    ```
*   **错误响应 (403 Forbidden)**: 当删除不属于自己的视频时返回。

---

## 4. 管理员监控模块 (Admin)

### 4.1 获取系统监控日志
*   **URL**: `/api/admin/logs`
*   **Method**: `GET`
*   **Header**: `Authorization: Bearer {token}` (需 ADMIN 角色)
*   **查询参数**: `page`, `size`, `userId` (可选)
*   **响应结果 (200 OK)**:
    ```json
    {
      "code": 200,
      "data": {
        "total": 500,
        "list": [
          {
            "id": 1,
            "path": "/api/videos/recommend",
            "method": "GET",
            "userId": 10,
            "inputParams": "{\"page\":1, \"size\":10}",
            "outputData": "{\"code\":200, ...}",
            "durationMs": 32,
            "createdAt": "2026-06-17T14:30:00"
          }
        ]
      }
    }
    ```

### 4.2 获取接口耗时统计
*   **URL**: `/api/admin/stats/duration`
*   **Method**: `GET`
*   **Header**: `Authorization: Bearer {token}` (需 ADMIN 角色)
*   **响应结果 (200 OK)**:
    ```json
    {
      "code": 200,
      "data": [
        {
          "path": "/api/videos/recommend",
          "avgDuration": 45.2,
          "maxDuration": 120,
          "callCount": 1500
        },
        {
          "path": "/api/my/videos (POST)",
          "avgDuration": 850.5,
          "maxDuration": 3500,
          "callCount": 50
        }
      ]
    }
    ```
