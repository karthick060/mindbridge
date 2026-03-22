"""
MindBridge NLP Moderation Engine
==================================
4-layer analysis pipeline:
  Layer 1 — Keyword-based crisis detection   (instant, always active)
  Layer 2 — Detoxify ML toxicity model       (optional, graceful fallback)
  Layer 3 — HuggingFace sentiment model      (optional, graceful fallback)
  Layer 4 — Weighted risk-scoring algorithm  (combines all signals)

Install heavy models with:
  pip install transformers torch detoxify
The app works fine without them using keyword fallback.
"""
import re
import logging

logger = logging.getLogger(__name__)

# ── Optional model handles (loaded lazily) ────────────────
_sentiment_pipe = None
_detox_model    = None
_models_loaded  = False

def _load_models():
    """Attempt to load ML models. Fails silently if unavailable."""
    global _sentiment_pipe, _detox_model, _models_loaded
    if _models_loaded:
        return
    _models_loaded = True  # set first to avoid retry loops

    try:
        from transformers import pipeline as hf_pipe
        _sentiment_pipe = hf_pipe(
            'text-classification',
            model='cardiffnlp/twitter-roberta-base-sentiment-latest',
            return_all_scores=True, truncation=True, max_length=128,
        )
        logger.info('✅ Sentiment model loaded (HuggingFace RoBERTa)')
    except Exception as e:
        logger.warning(f'⚠  Sentiment model unavailable: {e}. Using keyword fallback.')

    try:
        from detoxify import Detoxify
        _detox_model = Detoxify('original')
        logger.info('✅ Toxicity model loaded (Detoxify)')
    except Exception as e:
        logger.warning(f'⚠  Detoxify unavailable: {e}. Using keyword fallback.')


# ── Word lists ────────────────────────────────────────────
CRISIS_PHRASES = [
    'kill myself', 'want to die', 'end my life', 'suicide',
    "can't go on", 'no reason to live', 'self harm', 'hurt myself',
    'end it all', 'take my life', 'better off dead',
]

TOXIC_RE = [
    r'\bhate\s+you\b', r'\bworthless\b', r'\bstupid\s+idiot\b',
    r'\bkill\s+you\b', r'\byou\s+deserve\s+to\s+die\b',
]

SAD_WORDS  = ['sad','depressed','lonely','hopeless','crying','overwhelmed','anxious',
              'scared','panic','numb','empty','meaningless','exhausted']
RISK_WORDS = ['crisis','breakdown','panic attack','unbearable','give up',"can't cope"]
POS_WORDS  = ['happy','better','good','thank','hope','help','grateful','smile','love',
              'progress','improving']


class ModerationEngine:
    """Call .analyze(text) → dict with analysis results."""

    def __init__(self):
        _load_models()

    def analyze(self, text: str) -> dict:
        """
        Returns:
          blocked        bool
          block_reason   str | None
          sentiment      str    (happy / neutral / sad / angry / depressed)
          sentiment_score float
          toxicity_score  float
          risk_level     str    (low / medium / high / critical)
          risk_score     float
        """
        if not text or not text.strip():
            return self._default()

        lower = text.lower().strip()
        result = self._default()

        # ── Layer 1: Crisis keyword detection ──────────────
        for phrase in CRISIS_PHRASES:
            if phrase in lower:
                return {**result,
                    'blocked': True, 'block_reason': 'crisis_language',
                    'sentiment': 'depressed', 'sentiment_score': 0.96,
                    'risk_level': 'critical', 'risk_score': 1.0,
                }

        # ── Layer 2: Toxicity ───────────────────────────────
        if _detox_model:
            try:
                scores = _detox_model.predict(text)
                tox    = float(scores.get('toxicity', 0))
                result['toxicity_score'] = round(tox, 3)
                if tox > 0.82:
                    result['blocked']      = True
                    result['block_reason'] = 'toxic_content'
            except Exception as e:
                logger.debug(f'Detoxify error: {e}')
        else:
            # Regex keyword fallback
            if any(re.search(p, lower) for p in TOXIC_RE):
                result['toxicity_score'] = 0.92
                result['blocked']        = True
                result['block_reason']   = 'toxic_content'

        # ── Layer 3: Sentiment ──────────────────────────────
        if _sentiment_pipe:
            try:
                raw = _sentiment_pipe(text[:512])[0]
                top = max(raw, key=lambda x: x['score'])
                result['sentiment_score'] = round(float(top['score']), 3)
                lbl = top['label'].upper()
                if 'POSITIVE' in lbl or lbl == 'LABEL_2':
                    result['sentiment'] = 'happy'
                elif 'NEGATIVE' in lbl or lbl == 'LABEL_0':
                    result['sentiment'] = self._classify_negative(lower)
                else:
                    result['sentiment'] = 'neutral'
            except Exception as e:
                logger.debug(f'Sentiment error: {e}')
                result['sentiment'] = self._keyword_sentiment(lower)
        else:
            result['sentiment'] = self._keyword_sentiment(lower)

        # ── Layer 4: Risk scoring ───────────────────────────
        risk = 0.0
        risk += sum(0.11 for w in SAD_WORDS  if w in lower)
        risk += sum(0.22 for w in RISK_WORDS if w in lower)
        risk += result['toxicity_score'] * 0.35
        if   result['sentiment'] == 'depressed': risk += 0.28
        elif result['sentiment'] == 'sad':        risk += 0.12
        elif result['sentiment'] == 'angry':      risk += 0.08
        risk = min(round(risk, 3), 1.0)
        result['risk_score'] = risk
        result['risk_level'] = (
            'critical' if risk >= 0.90 else
            'high'     if risk >= 0.65 else
            'medium'   if risk >= 0.38 else
            'low'
        )
        return result

    # ── Helpers ───────────────────────────────────────────
    def _classify_negative(self, lower):
        if any(w in lower for w in ['depress','hopeless','worthless','empty','numb']):
            return 'depressed'
        if any(w in lower for w in ['angry','furious','rage','hate','mad']):
            return 'angry'
        return 'sad'

    def _keyword_sentiment(self, lower):
        if any(w in lower for w in ['depress','hopeless','empty','numb','meaningless']):
            return 'depressed'
        if any(w in lower for w in ['angry','furious','rage','hate','mad']):
            return 'angry'
        sc = sum(1 for w in SAD_WORDS if w in lower)
        if sc >= 2: return 'depressed'
        if sc >= 1: return 'sad'
        if any(w in lower for w in POS_WORDS): return 'happy'
        return 'neutral'

    @staticmethod
    def _default():
        return {'blocked':False,'block_reason':None,'sentiment':'neutral',
                'sentiment_score':0.5,'toxicity_score':0.0,'risk_level':'low','risk_score':0.0}


# Module-level singleton — import this everywhere
engine = ModerationEngine()
