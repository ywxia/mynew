import dotenv from 'dotenv';
dotenv.config();

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const { password } = req.body;
  if (password === process.env.AUTH_PASSWORD) {
    // 简单返回 token（实际可用 JWT 或其它方式）
    res.status(200).json({ token: password });
  } else {
    res.status(401).json({ error: '密码错误' });
  }
};

export default handler;