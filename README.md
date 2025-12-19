# AI Symptom Analysis System

An AI-powered medical symptom analysis assistant that combines Machine Learning predictions with LLM-based diagnostic reasoning.

## 🏗️ Project Structure

```
├── ML/                          # Machine Learning Model
│   ├── model_100percent.pkl     # Trained disease prediction model
│   ├── mappings_100percent.pkl  # Symptom-to-index mappings
│   └── train_ensemble.py        # Model training scripts
│
├── LLM/                         # LLM Integration (Standalone)
│   ├── diagnosis_system.py      # Gemini-based diagnosis system
│   └── symptoms.json            # Symptom definitions
│
└── symptom-analysis-web/        # Full-Stack Web Application
    ├── backend/                 # FastAPI Backend
    │   ├── main.py              # API endpoints
    │   ├── ml_service.py        # ML model service
    │   ├── llm_service.py       # LLM service (Groq)
    │   └── supabase_service.py  # Auth & database
    │
    └── src/                     # Next.js Frontend
        ├── app/                 # App router pages
        ├── components/          # React components
        └── api/                 # API client
```

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd symptom-analysis-web/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install fastapi uvicorn httpx python-dotenv groq pydantic cryptography

# Create .env file with your keys
# See .env.example for required variables

# Run the server
python main.py
```

### Frontend Setup

```bash
cd symptom-analysis-web

# Install dependencies
npm install

# Run development server
npm run dev
```

### Environment Variables

Create a `.env` file in `symptom-analysis-web/backend/`:

```env
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
ENCRYPTION_KEY=your_32_byte_encryption_key
```

## 🔧 Features

- **ML-Powered Predictions**: Trained on 130+ diseases with 178 symptoms
- **LLM Diagnostic Reasoning**: Uses Groq's Llama 3.3 70B for intelligent follow-up questions
- **Interactive Body Map**: Click on body parts to select localized symptoms
- **Triage System**: Classifies urgency (Immediate/Delayed/Minimal)
- **Secure Auth**: Supabase authentication with encrypted medical data
- **Chat History**: Encrypted local storage of past consultations

## 📊 ML Model

The machine learning model is trained on a comprehensive disease-symptom dataset:
- **Input**: 178 binary symptom features
- **Output**: Probability distribution over 130+ diseases
- **Architecture**: Ensemble classifier with probability calibration

## ⚠️ Disclaimer

This AI tool is for **informational purposes only** and does not replace professional medical advice. Always consult a healthcare provider for medical decisions.

## 📄 License

This project is for educational purposes.
