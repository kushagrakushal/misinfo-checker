import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Search, Loader, AlertTriangle, SendHorizontal } from 'lucide-react';
import useTypewriter from './useTypewriter'; // Import the new hook

// A helper component for animating the bot's response with the typewriter effect
const BotMessage = ({ message, renderMarkdown }) => {
    const animatedText = useTypewriter(message.text);
    const isAnimationComplete = animatedText.length === message.text.length;

    return (
        <div className="max-w-xl p-4 rounded-xl shadow-xl bg-surface text-text-main">
            <div dangerouslySetInnerHTML={renderMarkdown(animatedText)} className="prose prose-sm md:prose-base prose-invert prose-p:text-text-main prose-strong:text-white prose-headings:text-primary" />
            {/* Show sources only after the animation is complete */}
            {isAnimationComplete && message.sources && message.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-secondary">
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-2 text-text-secondary">
                        <Search size={16} /> Referenced Sources:
                    </h3>
                    <ul className="space-y-1 text-xs">
                        {message.sources.map((source, i) => (
                            <li key={i}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-primary/90 hover:underline break-all">{source.title}</a></li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// Component for the clickable suggestion cards on the welcome screen
const SuggestionCard = ({ title, text, onClick }) => (
  <button onClick={() => onClick(text)} className="bg-surface p-4 rounded-lg text-left w-full hover:bg-secondary/60 transform hover:-translate-y-1 transition-all duration-300 shadow-lg">
    <p className="font-semibold text-text-main">{title}</p>
    <p className="text-sm text-text-secondary mt-1">{text.substring(0, 100)}...</p>
  </button>
);

const App = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    // The rest of your App.jsx logic (like callGeminiAPI, handleSubmit, etc.) remains here...
    // I am pasting the full component for you to replace everything.

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => { scrollToBottom(); }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    useEffect(() => {
        setMessages([
            { text: "Hello! I'm an AI assistant designed to help you analyze content for potential misinformation...", isUser: false, sources: [] }
        ]);
    }, []);
    
    const callGeminiAPI = async (text) => {
        setIsLoading(true);
        setError(null);
        const systemPrompt = `You are an expert AI assistant specializing in misinformation detection...`; // Your excellent prompt here
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: `Please analyze the following text:\n\n---\n\n${text}` }] }],
            tools: [{ "google_search_retrieval": {} }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
        };

        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`HTTP error! status: ${response.status} - ${errorBody.error.message}`);
            }
            const result = await response.json();
            const candidate = result.candidates?.[0];
            if (candidate && candidate.content?.parts?.[0]?.text) {
                const generatedText = candidate.content.parts[0].text;
                let sources = [];
                const groundingMetadata = candidate.groundingMetadata;
                if (groundingMetadata && groundingMetadata.webSearchQueries) {
                    sources = groundingMetadata.webSearchQueries.map(q => ({ uri: `https://www.google.com/search?q=${encodeURIComponent(q)}`, title: q, }));
                }
                setMessages(prev => [...prev, { text: generatedText, isUser: false, sources }]);
            } else { throw new Error("Invalid response structure from API."); }
        } catch (err) {
            console.error("Error calling Gemini API:", err);
            setError(err.message || "Sorry, an unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        const newUserMessage = { text: input, isUser: true, sources: [] };
        setMessages(prev => [...prev, newUserMessage]);
        callGeminiAPI(input);
        setInput('');
    };
    
    const handleSuggestionClick = (text) => {
      const newUserMessage = { text, isUser: true, sources: [] };
      setMessages(prev => [...prev, newUserMessage]);
      callGeminiAPI(text);
    };

    const renderMarkdown = (text) => {
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        text = text.replace(/^\* (.*$)/gim, '<li>$1</li>');
        return { __html: text.replace(/\n/g, '<br />') };
    };

    return (
        <div className="flex flex-col h-screen bg-background font-sans text-text-main">
            <header className="bg-surface/80 backdrop-blur-sm shadow-md p-4 flex items-center justify-between border-b border-secondary sticky top-0 z-10">
                 <div className="flex items-center space-x-3">
                    <AlertTriangle className="text-primary h-8 w-8" />
                    <h1 className="text-xl font-bold">Misinformation Detector AI</h1>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col">
                {messages.length <= 1 ? (
                     <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in-up">
                        <h2 className="text-4xl font-bold text-text-main mb-3">AI Misinformation Detector</h2>
                        <p className="text-lg text-text-secondary mb-8 max-w-2xl">Paste a news snippet, an article, or any text you're unsure about. I'll analyze it for bias, emotional language, and logical fallacies.</p>
                        <div className="space-y-4 w-full max-w-2xl">
                            <SuggestionCard title="Analyze a Controversial Health Claim" text="A new study shows that drinking celery juice every morning can cure chronic diseases..." onClick={handleSuggestionClick} />
                            <SuggestionCard title="Check a Political News Snippet" text="Senator Smith's recent proposal is a disaster for the economy, according to experts..." onClick={handleSuggestionClick} />
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-6 w-full">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-4 ${msg.isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                                {!msg.isUser && (<div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center"><Bot className="text-primary" /></div>)}
                                {msg.isUser ? (
                                    <div className="max-w-xl p-4 rounded-xl shadow-lg bg-gradient-to-br from-primary to-primary-hover text-white font-semibold"><p>{msg.text}</p></div>
                                ) : (index === messages.length - 1 && !isLoading ? (
                                    <BotMessage message={msg} renderMarkdown={renderMarkdown} />
                                ) : (
                                    <div className="max-w-xl p-4 rounded-xl shadow-xl bg-surface text-text-main">
                                        <div dangerouslySetInnerHTML={renderMarkdown(msg.text)} className="prose prose-sm md:prose-base prose-invert prose-p:text-text-main prose-strong:text-white prose-headings:text-primary" />
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="mt-4 pt-3 border-t border-secondary"><h3 className="text-sm font-semibold flex items-center gap-2 mb-2 text-text-secondary"><Search size={16} />Referenced Sources:</h3><ul className="space-y-1 text-xs">{msg.sources.map((source, i) => (<li key={i}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-primary/90 hover:underline break-all">{source.title}</a></li>))}</ul></div>
                                        )}
                                    </div>
                                ))}
                                {msg.isUser && (<div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface flex items-center justify-center"><User /></div>)}
                            </div>
                        ))}
                        {isLoading && (<div className="flex items-start gap-4 justify-start animate-fade-in-up"><div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center"><Bot className="text-primary"/></div><div className="max-w-xl p-4 rounded-xl shadow-md bg-surface text-text-main"><div className="flex items-center space-x-2 text-text-secondary"><Loader className="animate-spin" size={20} /><span>Analyzing...</span></div></div></div>)}
                        {error && (<div className="flex items-start gap-4 justify-start animate-fade-in-up"><div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/50 flex items-center justify-center"><AlertTriangle className="text-red-300" /></div><div className="max-w-xl p-4 rounded-xl shadow-md bg-red-900/30 text-red-300"><p className="font-semibold">Analysis Failed</p><p className="text-sm">{error}</p></div></div>)}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </main>

            <footer className="bg-surface/80 backdrop-blur-sm border-t border-secondary p-4 sticky bottom-0">
                 <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="flex items-center bg-surface rounded-lg p-2 ring-1 ring-secondary focus-within:ring-2 focus-within:ring-primary transition-shadow">
                        <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }}} placeholder="Paste text here to analyze..." className="flex-1 bg-transparent text-text-main placeholder-text-secondary focus:outline-none resize-none px-2" rows="1" style={{maxHeight: "120px"}} disabled={isLoading}/>
                        <button type="submit" className="bg-primary text-background rounded-md p-2 ml-2 hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-secondary disabled:cursor-not-allowed transition-colors" disabled={isLoading || !input.trim()}>{isLoading ? <Loader className="animate-spin" size={20} /> : <SendHorizontal size={20} />}</button>
                    </form>
                    <p className="text-xs text-center text-text-secondary mt-2">This AI tool provides an analysis and is not a definitive arbiter of truth. Always use critical thinking.</p>
                </div>
            </footer>
        </div>
    );
};

export default App;

