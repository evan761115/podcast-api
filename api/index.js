const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { SpeechClient } = require('@google-cloud/speech');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// 修正 CORS 問題：允許所有來源，這在開發階段是可接受的
app.use(cors());

app.use(express.json());

// Google Gemini AI 設定
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

// Google Speech-to-Text 設定
const speechClient = new SpeechClient();

// 處理 Podcast 主題發想請求
app.post('/api', async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const fullPrompt = `請根據以下使用者輸入的內容，發想 3 個 Podcast 主題，並為每個主題提供一個簡短的簡介，請以 JSON 格式回傳，格式如下：
    [
      {
        "主題名稱": "[主題]",
        "大綱": "[簡短說明]"
      },
      {
        "主題名稱": "[主題]",
        "大綱": "[簡短說明]"
      }
    ]
    使用者輸入: ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json(JSON.parse(text));
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: '發想失敗，請檢查您的 API 金鑰或網路設定' });
  }
});

// 處理語音轉文字請求
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '沒有上傳音檔' });
    }

    const audioBytes = req.file.buffer.toString('base64');
    const audio = { content: audioBytes };
    
    // 設定音檔格式，此處以 m4a 為例進行轉碼
    const config = {
      encoding: 'LINEAR16', // 轉為 LINEAR16 格式
      sampleRateHertz: 44100,
      languageCode: 'zh-TW',
    };
    const request = {
      audio: audio,
      config: config,
    };

    const [response] = await speechClient.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    res.status(200).json({ result: transcription });
  } catch (error) {
    console.error("Speech-to-Text API error:", error);
    res.status(500).json({ error: `語音轉文字失敗，錯誤訊息: ${error.message}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// 部署至 Vercel 的處理
module.exports = app;