import os
import tempfile

# Redirect HuggingFace/Transformers cache dynamically to D drive if available on Windows,
# otherwise fall back to the system's temporary directory (essential for Linux cloud hosting)
if os.name == "nt" and os.path.exists("D:\\"):
    _hf_cache = "D:/hf_cache"
    os.environ["HF_HOME"] = _hf_cache
    os.environ["HF_HUB_CACHE"] = f"{_hf_cache}/hub"
    os.environ["HF_DATASETS_CACHE"] = f"{_hf_cache}/datasets"
    os.makedirs(f"{_hf_cache}/tmp", exist_ok=True)
    tempfile.tempdir = f"{_hf_cache}/tmp"
else:
    _hf_cache = os.path.join(tempfile.gettempdir(), "hf_cache")
    os.makedirs(_hf_cache, exist_ok=True)

from transformers import pipeline

class NLPService:
    def __init__(self):
        self.classifier = None
        
    def load_model(self):
        print(f"Loading RoBERTa model -> cache: {_hf_cache}")
        self.classifier = pipeline("text-classification", model="roberta-base-openai-detector", top_k=None)
        print("Model loaded successfully.")

    def analyze_text(self, text: str):
        if not self.classifier:
            raise Exception("Model not loaded yet.")
            
        # Ensure we don't exceed max token length
        truncated_text = text[:512]
        results = self.classifier(truncated_text)
        
        # Results come back as [{'label': 'Real', 'score': 0.9}, {'label': 'Fake', 'score': 0.1}]
        primary = max(results[0], key=lambda x: x['score'])
        
        return {
            "prediction": primary["label"],
            "confidence": primary["score"],
            "raw_scores": results[0]
        }

nlp_service = NLPService()
