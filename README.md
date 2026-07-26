# 🛡️ GHOSTSCAN – AI-Powered Deepfake Detection System

> **Detect. Verify. Trust.**

GHOSTSCAN is an AI-powered deepfake detection system that analyzes uploaded images to determine whether they are **Real** or **AI-generated (Deepfake)**. Instead of relying on a custom-trained CNN, GHOSTSCAN uses **Google Gemini 2.5 Pro** through an **AI Gateway/API** with a carefully engineered forensic prompt that instructs the model to inspect synthetic artifacts and visual inconsistencies commonly found in AI-generated images.

---

## ✨ Features

- 🔍 AI-powered Deepfake Detection
- 🖼️ Image Upload & Instant Analysis
- 📊 Confidence Score
- 📄 Detailed Forensic Report
- ⚡ Fast Cloud-Based Inference
- 📱 Responsive React Interface
- 🔒 Secure API Processing
- 🧠 Explainable Detection Reasoning

---

## 🚀 Tech Stack

**Frontend**
- React.js
- HTML5
- CSS3
- JavaScript

**Backend**
- Python
- Flask

**AI**
- Google Gemini 2.5 Pro
- AI Gateway/API
- Prompt Engineering

---

# 🏗️ System Architecture

```text
                         ┌─────────────────────┐
                         │       User          │
                         │ Uploads an Image    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │     React Frontend        │
                    │   Web User Interface      │
                    └──────────┬────────────────┘
                               │
                               ▼
                 ┌────────────────────────────────┐
                 │ Image Validation & Encoding    │
                 │ • Format Check                 │
                 │ • Size Validation              │
                 │ • Base64 Encoding              │
                 └──────────┬─────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────────────┐
              │         AI Gateway / API            │
              │ Authentication & Request Routing    │
              └──────────┬──────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────────────────┐
         │ Google Gemini 2.5 Pro (Vision Language Model) │
         │ Receives Image & Performs Forensic Analysis   │
         └──────────┬────────────────────────────────────┘
                    │
                    ▼
      ┌──────────────────────────────────────────────┐
      │ Prompt-Guided Deepfake Analysis              │
      │ • Facial Symmetry                            │
      │ • Eye Reflections                            │
      │ • Skin Texture                               │
      │ • Hair & Ear Consistency                     │
      │ • Hands & Fingers                            │
      │ • Lighting & Shadows                         │
      │ • Background Artifacts                       │
      │ • Diffusion & Compression Patterns           │
      └──────────┬───────────────────────────────────┘
                 │
                 ▼
       ┌────────────────────────────────────┐
       │ Structured JSON Response           │
       │ • Classification                   │
       │ • Confidence Score                 │
       │ • Evidence                         │
       │ • Explanation                      │
       └──────────┬─────────────────────────┘
                  │
                  ▼
      ┌────────────────────────────────────┐
      │ Results Dashboard                  │
      │ ✓ Real / Deepfake                  │
      │ ✓ Confidence Score                 │
      │ ✓ Forensic Report                  │
      └────────────────────────────────────┘
```

---

## 🔄 Workflow

```text
User Upload
      │
      ▼
Image Validation
      │
      ▼
Base64 Encoding
      │
      ▼
AI Gateway / API
      │
      ▼
Google Gemini 2.5 Pro
      │
      ▼
Prompt-Based Forensic Analysis
      │
      ▼
JSON Detection Result
      │
      ▼
Interactive Dashboard
```

---

## 📂 Project Structure

```text
GHOSTSCAN/
│
├── src/
├── public/
├── components/
├── pages/
├── services/
├── utils/
├── app.py
├── requirements.txt
└── README.md
```

---

## ⚙️ Installation

```bash
git clone https://github.com/yourusername/GHOSTSCAN.git

cd GHOSTSCAN

pip install -r requirements.txt

python app.py
```

Open:

```
http://localhost:5000
```

---

## 📋 Detection Output

The system returns:

- ✅ Real / Deepfake Classification
- 📊 Confidence Score
- 🔍 Forensic Evidence
- 📄 Detailed Explanation
- ⚠️ Risk Assessment

---

## 🔮 Future Enhancements

- 🎥 Video Deepfake Detection
- 🎙️ Audio Deepfake Detection
- 📱 Mobile Application
- 🌐 Browser Extension
- 🔗 Blockchain-based Authenticity Verification
- ⚡ Batch Image Analysis

---

## 👨‍💻 Author

**Eshaan Raj**

---

## ⭐ Motto

> **Seeing Beyond the Fake. Protecting the Truth.**
