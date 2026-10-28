import { Route, Routes, Link } from 'react-router-dom';
import { Layout } from './components/Layout';
import HomePage from './pages/Home';
import TextToSpeechPage from './pages/TextToSpeech';
import VoicesPage from './pages/Voices';
import VoiceChangerPage from './pages/VoiceChanger';
import SoundEffectsPage from './pages/SoundEffects';
import MusicPage from './pages/Music';
import SpeechToTextPage from './pages/SpeechToText';
import VoiceIsolatorPage from './pages/VoiceIsolator';
import HistoryPage from './pages/History';
import ApiPage from './pages/Api';

function NotFound() {
  return (
    <div className="px-4 sm:px-8 py-16 text-center">
      <p className="text-2xl font-semibold">Page not found</p>
      <p className="text-sm text-sub mt-1">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-5">
        Go home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="text-to-speech" element={<TextToSpeechPage />} />
        <Route path="voice-changer" element={<VoiceChangerPage />} />
        <Route path="sound-effects" element={<SoundEffectsPage />} />
        <Route path="music" element={<MusicPage />} />
        <Route path="speech-to-text" element={<SpeechToTextPage />} />
        <Route path="voice-isolator" element={<VoiceIsolatorPage />} />
        <Route path="voices" element={<VoicesPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="api" element={<ApiPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
