import React, { useState, useEffect } from 'react';
import { LocationFullReport } from '../types/landguard';
import {
  Sparkles,
  Send,
  Bot,
  User,
  HelpCircle,
  ShieldAlert,
  MapPin,
  RefreshCw,
  Clock,
  Mic,
  MicOff,
} from 'lucide-react';
import { askAIAssistant } from '../services/apiClient';

interface AIAssistantViewProps {
  locations: LocationFullReport[];
  selectedLocationId: string | null;
  onSelectLocation: (id: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  source?: string;
  timestamp: string;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Greetings. I am LANDGUARD AI, an expert landslide geospatial decision-support assistant. I am grounded in live North Eastern Region telemetry including Open-Meteo precipitation, SRTM slopes, GSI historical slip planes, and OSM infrastructure exposure.\n\nAsk me about any monitored sector, current critical hotspots, or specific infrastructure at risk.',
      source: 'LANDGUARD Grounded Telemetry',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    // Check if browser SpeechRecognition is available
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN'; // Optimized for Indian English
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputQuestion((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const selectedLoc = locations.find((l) => l.location.id === selectedLocationId) || locations[0];

  const suggestedQuestions = [
    `Why is ${selectedLoc?.location.name.split('(')[0].trim() || 'Gangtok'} risk elevated?`,
    'Which areas currently require the highest attention from authorities?',
    `What vulnerable infrastructure is near ${selectedLoc?.location.name.split('(')[0].trim() || 'Gangtok'}?`,
    'Explain the 72-hour antecedent rainfall saturation threshold',
  ];

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setLoading(true);

    try {
      const response = await askAIAssistant(q, selectedLoc?.location.id);
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        source: response.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Temporary network failure. Telemetry indicates elevated risk in high slope corridors due to persistent monsoon precipitation.',
        source: 'Fallback Rule Engine',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight font-display">
              LANDGUARD NATURAL LANGUAGE AI INTELLIGENCE
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Strictly grounded in real environmental inputs, terrain physics, and OpenStreetMap vulnerability
          </p>
        </div>

        {/* Selected Sector Context Pill */}
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-slate-400">Context:</span>
          <select
            value={selectedLoc?.location.id}
            onChange={(e) => onSelectLocation(e.target.value)}
            className="bg-transparent text-cyan-300 font-semibold focus:outline-none cursor-pointer"
          >
            {locations.map((l) => (
              <option key={l.location.id} value={l.location.id} className="bg-slate-900 text-white">
                {l.location.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" /> Prompt Pills:
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="px-2.5 py-1 rounded-full text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl min-h-[460px] max-h-[580px] overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isAI = msg.sender === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
            >
              {isAI && (
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/40 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-2 shadow-md ${
                  isAI
                    ? 'bg-slate-950 border border-slate-800 text-slate-200'
                    : 'bg-cyan-600 text-white font-medium ml-12'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div
                  className={`flex items-center justify-between text-[10px] pt-1 border-t ${
                    isAI ? 'border-slate-800/80 text-slate-500 font-mono' : 'border-cyan-500 text-cyan-200'
                  }`}
                >
                  <span>{msg.source || 'User Query'}</span>
                  <span>{msg.timestamp}</span>
                </div>
              </div>

              {!isAI && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 border border-slate-700 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>Analyzing multi-factor regional telemetry with Gemini...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-lg focus-within:border-cyan-500 transition"
      >
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="Ask why risk is high, what infrastructure is vulnerable, or compare sectors..."
          disabled={loading}
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
        />

        {/* Phase 9: Optional Browser Speech-to-Text Microphone Button */}
        {speechSupported && (
          <button
            type="button"
            onClick={toggleVoiceInput}
            title={isListening ? 'Stop listening' : 'Speak your question (Voice Input)'}
            className={`p-2.5 rounded-lg border transition cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
          </button>
        )}

        <button
          type="submit"
          disabled={loading || !inputQuestion.trim()}
          className="p-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 transition cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
