# 1. 克隆/复制上述文件
cd jina-reader-app

# 2. 安装依赖
npm install

# 3. 把你的 API Key 和身份认证密码写入 .env
echo "JINA_API_KEY=your_key_here" > .env
echo "AUTH_PASSWORD=你的自定义密码" >> .env

# 4. 运行
 npm start    # 或 npm run dev

