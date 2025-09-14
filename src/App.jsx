import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Search, Loader, AlertTriangle, Lightbulb } from 'lucide-react';

// Main App Component
const App = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // API key will be injected by the environment
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: `Please analyze the following text:\n\n---\n\n${text}` }] }],
            tools: [{ "google_search": {} }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        let attempts = 0;
        const maxAttempts = 5;
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

                    if (groundingMetadata && groundingMetadata.groundingAttributions) {
                        sources = groundingMetadata.groundingAttributions
                            .map(attribution => ({
                                uri: attribution.web?.uri,
                                title: attribution.web?.title,
                            }))
                            .filter(source => source.uri && source.title);
                    }

                    setMessages(prev => [...prev, { text: generatedText, isUser: false, sources }]);
                    setIsLoading(false);
                    return; // Success, exit the loop
                } else {
                     throw new Error("Invalid response structure from API.");
                }

            } catch (err) {
                attempts++;
                if (attempts >= maxAttempts) {
                    console.error("Error calling Gemini API:", err);
                    setError("Sorry, I couldn't process your request after multiple attempts. Please try again later.");
                    setMessages(prev => [...prev, { text: "Sorry, I couldn't process your request. The server might be busy. Please try again later.", isUser: false, sources: [], isError: true }]);
                    setIsLoading(false);
                    return;
                }
                const delay = Math.pow(2, attempts) * 100;
                await new Promise(res => setTimeout(res, delay));
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
    
    // Simple markdown to HTML renderer
    const renderMarkdown = (text) => {
        // Bold: **text** -> <strong>text</strong>
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italics: *text* -> <em>text</em>
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
         // Headlines: ## text -> <h2>text</h2>
        text = text.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>');
        // Bullet points: * point -> <li>point</li>
        text = text.replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
        // Numbered lists: 1. point -> <li>point</li>
        text = text.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>');
        return { __html: text.replace(/\n/g, '<br />') };
    };


    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 font-sans">
            <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <AlertTriangle className="text-red-500 h-8 w-8" />
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">Misinformation Detector AI</h1>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-4 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                            {!msg.isUser && <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white"><Bot /></div>}
                            
                            <div className={`max-w-xl p-4 rounded-xl shadow-md ${msg.isUser ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200'}`}>
                                <div dangerouslySetInnerHTML={renderMarkdown(msg.text)} className="prose dark:prose-invert" />
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                                        <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                                            <Search size={16} />
                                            Referenced Sources:
                                        </h3>
                                        <ul className="space-y-1 text-xs">
                                            {msg.sources.map((source, i) => (
                                                <li key={i}>
                                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                                                        {source.title}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            
                            {msg.isUser && <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-white"><User /></div>}
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-4 justify-start">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white"><Bot /></div>
                            <div className="max-w-xl p-4 rounded-xl shadow-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                                <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                                    <Loader className="animate-spin" size={20} />
                                    <span>Analyzing...</span>
                                </div>
                            </div>
                        </div>
                    )}
                     {error && (
                         <div className="flex items-start gap-4 justify-start">
                             <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white"><AlertTriangle /></div>
                             <div className="max-w-xl p-4 rounded-xl shadow-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                                 <p>{error}</p>
                             </div>
                         </div>
                     )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            <footer className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border-t dark:border-gray-700 p-4">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="Paste text here to analyze..."
                            className="flex-1 bg-transparent dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none resize-none px-2"
                            rows="1"
                            style={{maxHeight: "100px"}}
                            disabled={isLoading}
                        />
                        <button type="submit" className="bg-blue-600 text-white rounded-md p-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={isLoading || !input.trim()}>
                            {isLoading ? <Loader className="animate-spin" /> : <Bot />}
                        </button>
                    </form>
                     <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                        This AI tool provides an analysis and is not a definitive arbiter of truth. Always use critical thinking.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default App;
