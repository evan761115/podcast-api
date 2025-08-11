// 導入 Google Gemini AI 函式庫
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 確保您的 API Key 是從環境變數中取得，這是保護密碼的最佳做法
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 選擇要使用的 AI 模型
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

// 這是 Vercel Serverless Function 的入口點
module.exports = async (req, res) => {
  // 設定 CORS 標頭，允許您的前端網頁呼叫此 API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 檢查請求方法是否為 POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: '不支援的方法' });
    return;
  }

  try {
    // 從請求中取得使用者輸入的內容
    const { prompt } = req.body;

    // 定義傳送給 AI 的提示詞
    const fullPrompt = `請根據以下使用者輸入的內容，發想 3 個 podcast 主題，並為每個主題提供一個簡短的大綱。
    
    使用者輸入：
    "${prompt}"
    
    主題發想格式範例：
    1. 主題名稱： [主題]
       大綱： [簡要說明]
    2. 主題名稱： [主題]
       大綱： [簡要說明]
    3. 主題名稱： [主題]
       大綱： [簡要說明]
    `;

    // 呼叫 Gemini AI
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // 將 AI 回應的結果回傳給前端
    res.status(200).json({ result: text });

  } catch (error) {
    console.error('API 錯誤:', error);
    res.status(500).json({ error: '內部伺服器錯誤' });
  }
};