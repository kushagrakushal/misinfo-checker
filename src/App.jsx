import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Search, Loader, AlertTriangle, SendHorizontal } from 'lucide-react';

// A new helper component for the welcome screen suggestions
const SuggestionCard = ({ title, text, onClick }) => (
  <button onClick={() => onClick(text)} className="bg-surface p-4 rounded-lg text-left w-full hover:bg-secondary transition-colors duration-200">
    <p className="font-semibold text-text-main">{title}</p>
    <p className="text-sm text-text-secondary mt-1">{text.substring(0, 100)}...</p>
  </button>
);

// Main App Component
const App = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Automatically adjust textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    useEffect(() => {
        setMessages([
            {
                text: "Hello! I'm an AI assistant designed to help you analyze content for potential misinformation. Paste a news snippet, an article, or any text you're unsure about, and I'll provide an analysis.",
                isUser: false,
                sources: []
            }
        ]);
    }, []);

    const callGeminiAPI = async (text) => {
        setIsLoading(true);
        setError(null);

        const systemPrompt = `
You are an expert AI assistant specializing in misinformation detection and media literacy. Your primary function is to analyze user-submitted text for signs of bias, logical fallacies, emotional manipulation, and lack of credible evidence. You must provide a clear, balanced, and educational assessment.

Your analysis process MUST follow these steps:
1.  **Initial Assessment:** Briefly state the main claim or topic of the text.
2.  **Fact-Checking & Sourcing:** Use the integrated Google Search tool to verify key claims. Identify if the text cites credible, primary sources. Note any unsubstantiated claims.
3.  **Language and Tone Analysis:** Analyze the text for:
    * **Emotional Language:** Is the language sensationalized, inflammatory, or designed to evoke a strong emotional response (e.g., fear, anger)?
    * **Bias and Loaded Words:** Does the text use biased language or present opinions as facts? Is the framing one-sided?
    * **Logical Fallacies:** Identify any common logical fallacies (e.g., ad hominem attacks, false dichotomies, strawman arguments).
4.  **Conclusion & Rating:** Provide a concise conclusion about the text's reliability. Give it a rating: Low Risk, Medium Risk, or High Risk of being misinformation.
5.  **Educational Takeaway:** Conclude with a "Media Literacy Tip" section, offering actionable advice based on the specific weaknesses found in the analyzed text. This should educate the user on how to spot similar issues in the future.

Structure your response clearly using Markdown for formatting. Be objective and avoid taking a political stance. Your goal is to empower the user with tools to think critically about information.
        `;

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: `Please analyze the following text:\n\n---\n\n${text}` }] }],
            tools: [{ "google_search": {} }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        let attempts = 0;
        const maxAttempts = 3;
        while (attempts < maxAttempts) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                const candidate = result.candidates?.[0];

                if (candidate && candidate.content?.parts?.[0]?.text) {
                    const generatedText = candidate.content.parts[0].text;
                    let sources = [];
                    const groundingMetadata = candidate.groundingMetadata;

                    if (groundingMetadata && groundingMetadata.webSearchQueries) {
                        sources = groundingMetadata.webSearchQueries.map(q => ({
                            uri: `https://www.google.com/search?q=${encodeURIComponent(q)}`,
                            title: q,
                        }));
                    }

                    setMessages(prev => [...prev, { text: generatedText, isUser: false, sources }]);
                    setIsLoading(false);
                    return;
                } else {
                     throw new Error("Invalid response structure from API.");
                }

            } catch (err) {
                attempts++;
                if (attempts >= maxAttempts) {
                    console.error("Error calling Gemini API:", err);
                    setError("Sorry, I couldn't process your request after multiple attempts. Please try again later.");
                    setIsLoading(false);
                    return;
                }
                await new Promise(res => setTimeout(res, 1000 * attempts));
            }
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
    
    // New handler for suggestion clicks
    const handleSuggestionClick = (text) => {
      const newUserMessage = { text, isUser: true, sources: [] };
      setMessages(prev => [...prev, newUserMessage]);
      callGeminiAPI(text);
    };

    // Simple markdown to HTML renderer
    const renderMarkdown = (text) => {
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        text = text.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>');
        text = text.replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
        text = text.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>');
        return { __html: text.replace(/\n/g, '<br />') };
    };

    return (
        <div className="flex flex-col h-screen bg-background font-sans text-text-main">
            {/* ENHANCED HEADER */}
            <header className="bg-surface shadow-md p-4 flex items-center justify-between border-b border-secondary">
                <div className="flex items-center space-x-3">
                    <AlertTriangle className="text-primary h-8 w-8" />
                    <h1 className="text-xl font-bold">Misinformation Detector</h1>
                </div>
            </header>

            {/* MAIN AREA WITH CONDITIONAL WELCOME SCREEN */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                {messages.length <= 1 ? (
                    <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
                        <h2 className="text-3xl font-bold text-text-main mb-2">Start Your Analysis</h2>
                        <p className="text-text-secondary mb-8">Paste text into the input below, or try one of these examples.</p>
                        <div className="space-y-4">
                            <SuggestionCard
                                title="Analyze a Controversial Health Claim"
                                text="A new study shows that drinking celery juice every morning can cure chronic diseases by detoxifying the liver. This miracle cure is being suppressed by big pharma."
                                onClick={handleSuggestionClick}
                            />
                            <SuggestionCard
                                title="Check a Political News Snippet"
                                text="Senator Smith's recent proposal is a disaster for the economy, according to experts. The bill, which he claims will create jobs, will actually lead to massive inflation and hurt working-class families."
                                onClick={handleSuggestionClick}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-4 ${msg.isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                                {!msg.isUser && (
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                                        <Bot className="text-primary" />
                                    </div>
                                )}
                                
                                <div className={`max-w-xl p-4 rounded-xl shadow-md ${msg.isUser ? 'bg-primary text-background font-semibold' : 'bg-surface text-text-main'}`}>
                                    <div dangerouslySetInnerHTML={renderMarkdown(msg.text)} className="prose prose-sm md:prose-base prose-invert prose-p:text-text-main prose-strong:text-white prose-h2:text-primary" />
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-secondary">
                                            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2 text-text-secondary">
                                                <Search size={16} />
                                                Referenced Sources:
                                            </h3>
                                            <ul className="space-y-1 text-xs">
                                                {msg.sources.map((source, i) => (
                                                    <li key={i}>
                                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-primary/90 hover:underline break-all">
                                                            {source.title}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                
                                {msg.isUser && (
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                                        <User />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                             <div className="flex items-start gap-4 justify-start animate-fade-in-up">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                                    <Bot className="text-primary"/>
                                </div>
                                <div className="max-w-xl p-4 rounded-xl shadow-md bg-surface text-text-main">
                                    <div className="flex items-center space-x-2 text-text-secondary">
                                        <Loader className="animate-spin" size={20} />
                                        <span>Analyzing...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                         {error && (
                             <div className="flex items-start gap-4 justify-start animate-fade-in-up">
                                 <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/50 flex items-center justify-center">
                                     <AlertTriangle className="text-red-300" />
                                 </div>
                                 <div className="max-w-xl p-4 rounded-xl shadow-md bg-red-900/30 text-red-300">
                                     <p className="font-semibold">Analysis Failed</p>
                                     <p className="text-sm">{error}</p>
                                 </div>
                             </div>
                         )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </main>

            {/* ENHANCED FOOTER */}
            <footer className="bg-surface/50 backdrop-blur-sm border-t border-secondary p-4">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="flex items-center bg-surface rounded-lg p-2 ring-1 ring-secondary focus-within:ring-2 focus-within:ring-primary transition-shadow">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="Paste text here to analyze..."
                            className="flex-1 bg-transparent text-text-main placeholder-text-secondary focus:outline-none resize-none px-2"
                            rows="1"
                            style={{maxHeight: "120px"}}
                            disabled={isLoading}
                        />
                        <button type="submit" className="bg-primary text-background rounded-md p-2 ml-2 hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-secondary disabled:cursor-not-allowed transition-colors" disabled={isLoading || !input.trim()}>
                            {isLoading ? <Loader className="animate-spin" size={20} /> : <SendHorizontal size={20} />}
                        </button>
                    </form>
                     <p className="text-xs text-center text-text-secondary mt-2">
                        This AI tool provides an analysis and is not a definitive arbiter of truth. Always use critical thinking.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default App;