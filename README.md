# 1. 克隆/复制上述文件
cd jina-reader-app

# 2. 安装依赖
npm install

# 3. 把你的 API Key 和身份认证密码写入 .env
echo "JINA_API_KEY=your_key_here" > .env
echo "AUTH_PASSWORD=你的自定义密码" >> .env

# 4. 运行
 npm start    # 或 npm run dev

---

## 常见问题

### 启动时报错：Error: listen EADDRINUSE: address already in use :::3000

说明 3000 端口已被占用。解决方法：

- **方法一：关闭已占用端口的进程**
  - Windows：在命令行运行 `netstat -ano | findstr 3000` 找到占用端口的 PID，然后 `taskkill /PID 进程号 /F` 强制结束。
  - Mac/Linux：运行 `lsof -i:3000` 查找进程，然后 `kill -9 进程号` 结束。

- **方法二：修改 .env 或 server.js 里的 PORT 变量，换一个未被占用的端口，如 3001。**

- **方法三：重启电脑或关闭相关软件后重试。**

