"""Premade voice library: Kokoro and Pocket TTS preset voices plus OmniVoice designed voices.

Labels are best-effort descriptions of each open-source voice, for filtering and browsing.
"""

from .engines.tts import KOKORO_LANGS, POCKET_LANGS

# (kokoro id, display name, description, age, use_case)
KOKORO_VOICES = [
    ("af_heart", "Heart", "Warm, expressive and friendly. The flagship Kokoro voice.", "young", "narration"),
    ("af_bella", "Bella", "Bright, polished and upbeat.", "young", "advertisement"),
    ("af_nicole", "Nicole", "Soft, close-mic and calm.", "young", "asmr"),
    ("af_sarah", "Sarah", "Clear, mature and reassuring.", "middle-aged", "conversational"),
    ("af_sky", "Sky", "Light and airy.", "young", "social media"),
    ("af_alloy", "Alloy", "Neutral, balanced and modern.", "young", "conversational"),
    ("af_aoede", "Aoede", "Smooth and melodic.", "young", "narration"),
    ("af_jessica", "Jessica", "Casual and chatty.", "young", "conversational"),
    ("af_kore", "Kore", "Confident and articulate.", "young", "education"),
    ("af_nova", "Nova", "Crisp and energetic.", "young", "advertisement"),
    ("af_river", "River", "Relaxed and natural.", "young", "podcast"),
    ("am_michael", "Michael", "Steady, trustworthy narrator.", "middle-aged", "narration"),
    ("am_fenrir", "Fenrir", "Deep and dramatic.", "middle-aged", "characters"),
    ("am_puck", "Puck", "Playful and lively.", "young", "characters"),
    ("am_adam", "Adam", "Low, relaxed delivery.", "middle-aged", "narration"),
    ("am_echo", "Echo", "Even and clear.", "young", "conversational"),
    ("am_eric", "Eric", "Professional and direct.", "middle-aged", "news"),
    ("am_liam", "Liam", "Friendly and youthful.", "young", "social media"),
    ("am_onyx", "Onyx", "Rich and resonant.", "middle-aged", "audiobook"),
    ("am_santa", "Santa", "Jolly, festive character voice.", "old", "characters"),
    ("bf_emma", "Emma", "Refined British narrator.", "young", "audiobook"),
    ("bf_isabella", "Isabella", "Elegant and composed.", "young", "narration"),
    ("bf_alice", "Alice", "Gentle British storyteller.", "young", "audiobook"),
    ("bf_lily", "Lily", "Soft and sweet.", "young", "characters"),
    ("bm_george", "George", "Classic, distinguished British voice.", "middle-aged", "audiobook"),
    ("bm_fable", "Fable", "Warm storyteller.", "middle-aged", "audiobook"),
    ("bm_lewis", "Lewis", "Calm and deep.", "middle-aged", "narration"),
    ("bm_daniel", "Daniel", "Clear, newsreader style.", "middle-aged", "news"),
    ("ef_dora", "Dora", "Natural Spanish speaker.", "young", "conversational"),
    ("em_alex", "Alejandro", "Clear Spanish narrator.", "young", "narration"),
    ("em_santa", "Papá Noel", "Festive Spanish character.", "old", "characters"),
    ("ff_siwis", "Siwis", "Natural French speaker.", "young", "narration"),
    ("hf_alpha", "Aarohi", "Clear Hindi speaker.", "young", "conversational"),
    ("hf_beta", "Bhavna", "Warm Hindi narrator.", "young", "narration"),
    ("hm_omega", "Om", "Deep Hindi voice.", "middle-aged", "narration"),
    ("hm_psi", "Pranav", "Friendly Hindi speaker.", "young", "conversational"),
    ("if_sara", "Sara", "Natural Italian speaker.", "young", "conversational"),
    ("im_nicola", "Nicola", "Clear Italian narrator.", "young", "narration"),
    ("pf_dora", "Dóra", "Natural Brazilian Portuguese speaker.", "young", "conversational"),
    ("pm_alex", "Alex", "Clear Brazilian Portuguese narrator.", "young", "narration"),
    ("pm_santa", "Papai Noel", "Festive Brazilian character.", "old", "characters"),
    ("zf_xiaobei", "Xiaobei", "Natural Mandarin speaker.", "young", "conversational"),
    ("zf_xiaoni", "Xiaoni", "Gentle Mandarin voice.", "young", "narration"),
    ("zf_xiaoxiao", "Xiaoxiao", "Bright Mandarin voice.", "young", "advertisement"),
    ("zf_xiaoyi", "Xiaoyi", "Calm Mandarin narrator.", "young", "audiobook"),
    ("zm_yunjian", "Yunjian", "Deep Mandarin narrator.", "middle-aged", "narration"),
    ("zm_yunxi", "Yunxi", "Youthful Mandarin voice.", "young", "conversational"),
    ("zm_yunxia", "Yunxia", "Lively Mandarin voice.", "young", "characters"),
    ("zm_yunyang", "Yunyang", "Professional Mandarin newsreader.", "middle-aged", "news"),
]
_KOKORO_ACCENT = {"a": "american", "b": "british", "e": "spanish", "f": "french", "h": "indian",
                  "i": "italian", "p": "brazilian", "z": "mandarin"}

# (pocket name, display name, gender, accent, language, description, use_case)
POCKET_VOICES = [
    ("alba", "Alba", "female", "british", "english", "Casual, natural and warm.", "conversational"),
    ("cosette", "Cosette", "female", "american", "english", "Expressive and youthful.", "characters"),
    ("caro_davy", "Caro", "female", "british", "english", "Clear, measured narrator.", "narration"),
    ("anna", "Anna", "female", "british", "english", "Crisp and friendly.", "conversational"),
    ("vera", "Vera", "female", "british", "english", "Calm and composed.", "narration"),
    ("fantine", "Fantine", "female", "british", "english", "Soft-spoken.", "audiobook"),
    ("eponine", "Eponine", "female", "scottish", "english", "Bright Scottish voice.", "conversational"),
    ("azelma", "Azelma", "female", "canadian", "english", "Easygoing and clear.", "social media"),
    ("mary", "Mary", "female", "american", "english", "Warm and steady.", "narration"),
    ("jane", "Jane", "female", "american", "english", "Natural everyday voice.", "conversational"),
    ("eve", "Eve", "female", "american", "english", "Light and upbeat.", "advertisement"),
    ("marius", "Marius", "male", "american", "english", "Relaxed selfie-video style.", "social media"),
    ("javert", "Javert", "male", "american", "english", "Firm and serious.", "characters"),
    ("jean", "Jean", "male", "american", "english", "Thoughtful, freeform speaker.", "podcast"),
    ("charles", "Charles", "male", "british", "english", "Polished British voice.", "narration"),
    ("paul", "Paul", "male", "british", "english", "Plain and clear.", "education"),
    ("george", "Georg", "male", "american", "english", "Even, practical delivery.", "conversational"),
    ("michael", "Mikey", "male", "american", "english", "Friendly and casual.", "conversational"),
    ("bill_boerst", "Bill", "male", "american", "english", "Seasoned, gravelly narrator.", "audiobook"),
    ("peter_yearsley", "Peter", "male", "british", "english", "Mature, distinguished voice.", "audiobook"),
    ("stuart_bell", "Stuart", "male", "british", "english", "Warm, conversational voice.", "podcast"),
    ("estelle", "Estelle", "female", "french", "french", "Natural French speaker.", "conversational"),
    ("juergen", "Jürgen", "male", "german", "german", "Clear German speaker.", "narration"),
    ("lola", "Lola", "female", "spanish", "spanish", "Natural Spanish speaker.", "conversational"),
    ("giovanni", "Giovanni", "male", "italian", "italian", "Natural Italian speaker.", "conversational"),
    ("rafael", "Rafael", "male", "portuguese", "portuguese", "Natural Portuguese speaker.", "conversational"),
    ("daan", "Daan", "male", "dutch", "dutch", "Natural Dutch speaker.", "conversational"),
]

# OmniVoice designed voices: (name, instruct, description, labels). These speak any language.
OMNI_VOICES = [
    ("Aria", "female, young adult, moderate pitch, american accent", "Bright, friendly and conversational.",
     {"gender": "female", "age": "young", "accent": "american", "use_case": "conversational"}),
    ("Marcus", "male, middle-aged, low pitch, american accent", "Deep, confident narrator.",
     {"gender": "male", "age": "middle-aged", "accent": "american", "use_case": "narration"}),
    ("Eleanor", "female, middle-aged, low pitch, british accent", "Calm, refined British storyteller.",
     {"gender": "female", "age": "middle-aged", "accent": "british", "use_case": "audiobook"}),
    ("Oliver", "male, young adult, moderate pitch, british accent", "Upbeat British presenter.",
     {"gender": "male", "age": "young", "accent": "british", "use_case": "social media"}),
    ("Mia", "female, teenager, high pitch, american accent", "Energetic and youthful.",
     {"gender": "female", "age": "teen", "accent": "american", "use_case": "characters"}),
    ("Walter", "male, elderly, low pitch, american accent", "Warm, wise grandfather.",
     {"gender": "male", "age": "old", "accent": "american", "use_case": "audiobook"}),
    ("Chloe", "female, young adult, moderate pitch, australian accent", "Relaxed Australian voice.",
     {"gender": "female", "age": "young", "accent": "australian", "use_case": "advertisement"}),
    ("Raj", "male, young adult, moderate pitch, indian accent", "Clear and professional.",
     {"gender": "male", "age": "young", "accent": "indian", "use_case": "education"}),
    ("Luna", "female, young adult, low pitch, whisper", "Soft ASMR whisper.",
     {"gender": "female", "age": "young", "accent": "neutral", "use_case": "asmr"}),
    ("Kenji", "male, young adult, moderate pitch, japanese accent", "Calm voice with a Japanese accent.",
     {"gender": "male", "age": "young", "accent": "japanese", "use_case": "conversational"}),
    ("Mei", "female, young adult, high pitch, chinese accent", "Bright voice with a Chinese accent.",
     {"gender": "female", "age": "young", "accent": "chinese", "use_case": "conversational"}),
    ("Dmitri", "male, middle-aged, very low pitch, russian accent", "Deep, dramatic Russian-accented voice.",
     {"gender": "male", "age": "middle-aged", "accent": "russian", "use_case": "characters"}),
    ("Grace", "female, elderly, moderate pitch, canadian accent", "Kind, gentle grandmother.",
     {"gender": "female", "age": "old", "accent": "canadian", "use_case": "audiobook"}),
    ("Pip", "child, high pitch, american accent", "Cheerful child voice.",
     {"gender": "neutral", "age": "child", "accent": "american", "use_case": "characters"}),
]
OMNI_SAMPLE_TEXT = ("Hi there! I'm happy to read anything you like, from bedtime stories "
                    "to product demos, in a clear and natural voice.")


def omni_voice_id(name: str) -> str:
    return f"premade_{name.lower()}"


def catalog_voices(created_at: str) -> list[dict]:
    """Kokoro + Pocket preset voices (previews render on demand)."""
    voices = []
    for kid, name, desc, age, use in KOKORO_VOICES:
        lang = kid[0]
        voices.append({
            "voice_id": f"kokoro_{kid}", "name": name, "category": "premade", "model_id": "kokoro",
            "engine_voice": kid, "language": KOKORO_LANGS[lang][0], "accent": _KOKORO_ACCENT[lang],
            "description": desc,
            "labels": {"gender": "female" if kid[1] == "f" else "male", "age": age,
                       "accent": _KOKORO_ACCENT[lang], "use_case": use},
            "preview_url": f"/v1/voices/kokoro_{kid}/preview", "created_at": created_at,
        })
    for pid, name, gender, accent, language, desc, use in POCKET_VOICES:
        voices.append({
            "voice_id": f"pocket_{pid}", "name": name, "category": "premade", "model_id": "pocket",
            "engine_voice": pid, "engine_language": language, "language": POCKET_LANGS[language][0],
            "accent": accent, "description": desc,
            "labels": {"gender": gender, "age": "adult", "accent": accent, "use_case": use},
            "preview_url": f"/v1/voices/pocket_{pid}/preview", "created_at": created_at,
        })
    return voices


PREVIEW_TEXT = {
    "en": "Hi! This is how I sound. I can narrate stories, read articles, or bring your characters to life.",
    "es": "¡Hola! Así suena mi voz. Puedo narrar historias, leer artículos o dar vida a tus personajes.",
    "fr": "Bonjour ! Voici ma voix. Je peux raconter des histoires, lire des articles ou donner vie à vos personnages.",
    "de": "Hallo! So klingt meine Stimme. Ich kann Geschichten erzählen, Artikel vorlesen oder Figuren lebendig machen.",
    "it": "Ciao! Questa è la mia voce. Posso narrare storie, leggere articoli o dare vita ai tuoi personaggi.",
    "pt": "Olá! Esta é a minha voz. Posso narrar histórias, ler artigos ou dar vida aos seus personagens.",
    "nl": "Hallo! Zo klinkt mijn stem. Ik kan verhalen vertellen, artikelen voorlezen of je personages tot leven brengen.",
    "hi": "नमस्ते! यह मेरी आवाज़ है। कहानियाँ, लेख और आपके किरदार, सब कुछ इसी आवाज़ में।",
    "zh": "你好！这就是我的声音。我可以讲故事、朗读文章，或者让你的角色活起来。",
}
