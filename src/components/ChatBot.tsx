// src/renderer/components/ChatBot.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    FiMessageSquare,
    FiSend,
    FiUser,
    FiBox,
    FiZap,
    FiAlertCircle,
    FiX,
    FiChevronDown
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';

// Chat Message Interface
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isTyping?: boolean;
    displayContent?: string;
}

interface ChatBotProps {
    analysisResults: any;
    isAnalyzing: boolean;
    onClose?: () => void;
    className?: string;
}

// Typing animation component
const TypingAnimation: React.FC<{ text: string; onComplete: () => void; speed?: number }> = ({ 
    text, 
    onComplete, 
    speed = 20 
}) => {
    const [displayText, setDisplayText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timer = setTimeout(() => {
                setDisplayText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, speed);
            return () => clearTimeout(timer);
        } else {
            onComplete();
        }
    }, [currentIndex, text, speed, onComplete]);

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
        >
            {displayText || text}
        </ReactMarkdown>
    );
};

// Define markdown components outside to avoid re-creation
const markdownComponents: Components = {
    code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        const isInline = inline || false;
        
        if (!isInline && match) {
            return (
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            );
        }
        
        return (
            <code className={`${className} bg-gray-800 px-1 py-0.5 rounded text-green-main text-sm font-mono`} {...props}>
                {children}
            </code>
        );
    },
    h1: ({ children, ...props }: any) => (
        <h1 className="text-2xl font-bold text-green-main mt-4 mb-2 border-b border-gray-700 pb-1" {...props}>
            {children}
        </h1>
    ),
    h2: ({ children, ...props }: any) => (
        <h2 className="text-xl font-bold text-green-main mt-3 mb-2 border-b border-gray-700 pb-1" {...props}>
            {children}
        </h2>
    ),
    h3: ({ children, ...props }: any) => (
        <h3 className="text-lg font-semibold text-green-main mt-3 mb-1" {...props}>
            {children}
        </h3>
    ),
    h4: ({ children, ...props }: any) => (
        <h4 className="text-md font-semibold text-green-main mt-2 mb-1" {...props}>
            {children}
        </h4>
    ),
    p: ({ children, ...props }: any) => (
        <p className="text-gray-300 mb-2 leading-relaxed" {...props}>
            {children}
        </p>
    ),
    ul: ({ children, ...props }: any) => (
        <ul className="list-disc list-inside mb-2 space-y-1" {...props}>
            {children}
        </ul>
    ),
    ol: ({ children, ...props }: any) => (
        <ol className="list-decimal list-inside mb-2 space-y-1" {...props}>
            {children}
        </ol>
    ),
    li: ({ children, ...props }: any) => (
        <li className="text-gray-300 ml-2" {...props}>
            {children}
        </li>
    ),
    strong: ({ children, ...props }: any) => (
        <strong className="font-bold text-green-main" {...props}>
            {children}
        </strong>
    ),
    em: ({ children, ...props }: any) => (
        <em className="italic text-yellow-500" {...props}>
            {children}
        </em>
    ),
    blockquote: ({ children, ...props }: any) => (
        <blockquote className="border-l-4 border-green-main pl-4 my-2 text-gray-400 italic" {...props}>
            {children}
        </blockquote>
    ),
    hr: (props: any) => (
        <hr className="my-4 border-gray-700" {...props} />
    ),
    a: ({ children, href, ...props }: any) => (
        <a 
            href={href} 
            className="text-green-main hover:underline" 
            target="_blank" 
            rel="noopener noreferrer" 
            {...props}
        >
            {children}
        </a>
    ),
    table: ({ children, ...props }: any) => (
        <div className="overflow-x-auto my-2">
            <table className="min-w-full border border-gray-700" {...props}>
                {children}
            </table>
        </div>
    ),
    th: ({ children, ...props }: any) => (
        <th className="border border-gray-700 px-3 py-2 bg-gray-800 text-green-main font-semibold" {...props}>
            {children}
        </th>
    ),
    td: ({ children, ...props }: any) => (
        <td className="border border-gray-700 px-3 py-2 text-gray-300" {...props}>
            {children}
        </td>
    ),
};

const ChatBot: React.FC<ChatBotProps> = ({
    analysisResults,
    isAnalyzing,
    onClose,
    className = ''
}) => {
    const [chatEnabled, setChatEnabled] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatSessionId, setChatSessionId] = useState<string | null>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const inputContainerRef = useRef<HTMLDivElement>(null);

    // Check if user is at bottom of chat
    const isAtBottom = () => {
        if (!chatContainerRef.current) return true;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        return scrollHeight - scrollTop - clientHeight < 50;
    };

    // Scroll to bottom
    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    // Handle scroll to show/hide scroll button
    const handleScroll = () => {
        if (chatContainerRef.current) {
            setShowScrollButton(!isAtBottom());
        }
    };

    // Add message with typing animation
    const addMessageWithTyping = (message: ChatMessage) => {
        const messageId = message.id;
        setTypingMessageId(messageId);
        
        // Add message with isTyping flag
        setChatMessages(prev => [...prev, { ...message, isTyping: true, displayContent: '' }]);
        
        // Scroll to show typing indicator
        setTimeout(scrollToBottom, 100);
    };

    // Complete typing animation
    const completeTyping = (messageId: string) => {
        setChatMessages(prev => 
            prev.map(msg => 
                msg.id === messageId 
                    ? { ...msg, isTyping: false }
                    : msg
            )
        );
        setTypingMessageId(null);
    };

    // Initialize chat with analysis results
    const initializeChatWithResults = async () => {
        if (!analysisResults) return;

        try {
            setIsChatLoading(true);

            // Generate session ID
            const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            setChatSessionId(sessionId);

            // Updated system prompt to request markdown formatting
            const systemPrompt = `You are a malware analysis expert. You have just completed analyzing a file. 
Here are the analysis results:
${JSON.stringify(analysisResults, null, 2)}

Please provide a comprehensive analysis report using **markdown formatting** with the following structure:
- Use # for main title (e.g., # Malware Analysis Report)
- Use ## for major sections (e.g., ## 1. File Information)
- Use ### for subsections (e.g., ### 2.1. Execution & Initial Activity)
- Use **bold** for emphasis on important terms
- Use *italic* for secondary emphasis
- Use bullet points (- or *) for lists
- Use numbered lists for sequential information
- Use > for important notes or warnings
- Use \`code\` for file paths, registry keys, and technical details
- Use \`\`\` for code blocks when showing multiple lines of technical data
- Use tables for structured data when appropriate

Focus on highlighting key threats, behaviors, and recommendations. Keep concise and not lengthy and make it professional and informative.`;

            // Call IPC
            const data = await window.chatAPI.initializeChat(
                sessionId,
                systemPrompt,
                analysisResults
            );

            if (!data?.success) {
                throw new Error('Failed to initialize chat');
            }

            // Add assistant message with typing animation
            const initialMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: data.message || "Analysis complete! I've reviewed the results. What would you like to know about this malware analysis?",
                timestamp: new Date(),
                isTyping: true
            };

            addMessageWithTyping(initialMessage);
            setChatEnabled(true);

        } catch (error) {
            console.error('Failed to initialize chat:', error);
            toast.error('Failed to initialize AI assistant');

            // fallback message with typing
            const fallbackMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Analysis complete! I'm ready to answer your questions about the results. What would you like to know?",
                timestamp: new Date(),
                isTyping: true
            };
            addMessageWithTyping(fallbackMessage);
            setChatEnabled(true);

        } finally {
            setIsChatLoading(false);
        }
    };

    // Send chat message
    const sendChatMessage = async () => {
        if (!chatInput.trim() || isChatLoading || !chatSessionId) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: chatInput,
            timestamp: new Date()
        };

        setChatMessages(prev => [...prev, userMessage]);
        setChatInput('');
        setIsChatLoading(true);
        
        // Scroll to bottom after user message
        setTimeout(scrollToBottom, 100);

        try {
            // Prepare history
            const conversationHistory = chatMessages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // Updated prompt for follow-up questions to also use markdown
            const enhancedMessage = `${chatInput}\n\nPlease format your response using markdown for better readability.`;

            // Call IPC
            const data = await window.chatAPI.sendMessage(
                chatSessionId,
                enhancedMessage,
                conversationHistory,
                analysisResults
            );

            if (!data?.success) {
                throw new Error('Failed to get response');
            }

            // Add assistant message with typing animation
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.message,
                timestamp: new Date(),
                isTyping: true
            };

            addMessageWithTyping(assistantMessage);

        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to get response from AI');

            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm sorry, I encountered an error. Please try again.",
                timestamp: new Date(),
                isTyping: true
            };

            addMessageWithTyping(errorMessage);

        } finally {
            setIsChatLoading(false);
        }
    };

    // Auto-scroll chat to bottom when new messages arrive
    useEffect(() => {
        if (chatContainerRef.current && isAtBottom()) {
            scrollToBottom();
        }
    }, [chatMessages]);

    // Handle Enter key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    };

    return (
        <div className={`flex flex-col h-full ${className}`} style={{ height: '600px', maxHeight: '600px' }}>
            {/* Chat Header */}
            <div className="border-b border-gray-700 pb-4 mb-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <FiMessageSquare className="w-5 h-5 text-green-main" />
                        <h3 className="text-lg font-semibold">AI Analysis Assistant</h3>
                    </div>
                    {chatEnabled && (
                        <div className="flex items-center space-x-1 text-xs text-green-main">
                            <FiZap className="w-3 h-3" />
                            <span>Active</span>
                        </div>
                    )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                    {isAnalyzing
                        ? "Analysis in progress. Chat will be available after completion."
                        : !analysisResults
                            ? "Analysis results will appear here after scan completes"
                            : "Ask questions about the malware analysis results"}
                </p>
            </div>

            {/* Chat Messages Area - Fixed height with scroll */}
            <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-0"
                style={{ scrollBehavior: 'smooth' }}
            >
                {!chatEnabled && analysisResults && !isAnalyzing && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-center space-y-4">
                            <FiMessageSquare className="w-16 h-16 text-green-main mx-auto opacity-50" />
                            <p className="text-gray-400">
                                Ready to analyze the malware results?
                            </p>
                            <p className="text-sm text-gray-500">
                                Click the button below to start a conversation with AI
                            </p>
                        </div>
                    </div>
                )}

                {!analysisResults && !isAnalyzing && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <FiAlertCircle className="w-12 h-12 text-gray-600 mb-3" />
                        <p className="text-gray-400 text-sm">
                            No analysis results yet.<br />
                            Upload and scan a file to begin.
                        </p>
                    </div>
                )}

                {isAnalyzing && !analysisResults && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-12 h-12 border-4 border-green-main border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-gray-400 text-sm">
                            Analysis in progress...<br />
                            Chat will be available when complete.
                        </p>
                    </div>
                )}

                {chatMessages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex items-start space-x-3 animate-fadeIn ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        {message.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full  bg-opacity-20 flex items-center justify-center shrink-0 mt-1">
                                {/* <FiBox className="w-4 h-4 text-green-main" /> */}
                                <img src="/logo_m.svg" alt="logo" />
                            </div>
                        )}
                        <div
                            className={`max-w-[85%] rounded-lg px-2 py-1 ${
                                message.role === 'user'
                                    ? 'bg-green-main text-black-primary'
                                    : 'text-gray-200'
                            }`}
                            style={message.role === 'assistant' ? { backgroundColor: 'transparent' } : {}}
                        >
                            {message.role === 'user' ? (
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            ) : (
                                <div className="markdown-content">
                                    {message.isTyping && message.id === typingMessageId ? (
                                        <TypingAnimation
                                            text={message.content}
                                            onComplete={() => completeTyping(message.id)}
                                            speed={15}
                                        />
                                    ) : (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={markdownComponents}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
                                    )}
                                </div>
                            )}
                            <span className={`text-xs opacity-70 mt-2 block ${
                                message.role === 'user' ? 'text-black-primary' : 'text-gray-500'
                            }`}>
                                {message.timestamp.toLocaleTimeString()}
                            </span>
                        </div>
                        {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 mt-1">
                                <FiUser className="w-4 h-4 text-gray-400" />
                            </div>
                        )}
                    </div>
                ))}

                {isChatLoading && !typingMessageId && (
                    <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-green-main bg-opacity-20 flex items-center justify-center">
                            <FiBox className="w-4 h-4 text-green-main" />
                        </div>
                        <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'transparent' }}>
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-green-main rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-green-main rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-green-main rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Scroll to bottom button */}
            {showScrollButton && chatEnabled && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-20 right-4 bg-green-main text-black-primary rounded-full p-2 shadow-lg hover:bg-opacity-90 transition-all duration-300 z-10"
                >
                    <FiChevronDown className="w-5 h-5" />
                </button>
            )}

            {/* Chat Input Area */}
            <div ref={inputContainerRef} className="border-t border-gray-700 pt-4 shrink-0">
                {!chatEnabled && analysisResults && !isAnalyzing ? (
                    // Start button at bottom when chat not started
                    <div className="space-y-3">
                        <button
                            onClick={initializeChatWithResults}
                            disabled={isChatLoading}
                            className="w-full bg-green-main text-black-primary px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all duration-300 flex items-center justify-center space-x-2"
                        >
                            {isChatLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-black-primary border-t-transparent rounded-full animate-spin"></div>
                                    <span>Initializing...</span>
                                </>
                            ) : (
                                <>
                                    <FiMessageSquare className="w-5 h-5" />
                                    <span>Start AI Conversation</span>
                                </>
                            )}
                        </button>
                        <p className="text-xs text-gray-500 text-center">
                            Click to begin analyzing the malware results with AI assistance
                        </p>
                    </div>
                ) : chatEnabled && analysisResults && (
                    // Regular input field when chat is active
                    <div>
                        <div className="flex space-x-2">
                            <textarea
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about the analysis results..."
                                disabled={isChatLoading}
                                rows={2}
                                className="flex-1 bg-black-primary text-gray-200 rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-main transition-all duration-300"
                            />
                            <button
                                onClick={sendChatMessage}
                                disabled={!chatInput.trim() || isChatLoading}
                                className="bg-green-main text-black-primary px-4 rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FiSend className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Ask about threats, behaviors, recommendations, or specific details from the analysis
                        </p>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                
                /* Custom scrollbar */
                .overflow-y-auto::-webkit-scrollbar {
                    width: 6px;
                }
                
                .overflow-y-auto::-webkit-scrollbar-track {
                    background: #1f1f1f;
                    border-radius: 3px;
                }
                
                .overflow-y-auto::-webkit-scrollbar-thumb {
                    background: #a5f54a;
                    border-radius: 3px;
                }
                
                .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                    background: #8cbf3b;
                }
                
                /* Markdown content styles */
                .markdown-content {
                    line-height: 1.6;
                }
                
                .markdown-content pre {
                    margin: 0.75rem 0;
                }
                
                .markdown-content code {
                    font-family: 'Fira Code', monospace;
                    font-size: 0.875rem;
                }
            `}</style>
        </div>
    );
};

export default ChatBot;