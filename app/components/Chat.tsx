"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useChatStore } from "../store/chatStore";

interface DropdownOption {
  label: string;
  disabled?: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function Chat() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const {
    sessionId,
    messages,
    generateNewSession,
    clearSession,
    addMessage,
    clearMessages,
    updateMessage,
  } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!sessionId) {
      generateNewSession();
    }
  }, [sessionId, generateNewSession]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen && !(event.target as Element).closest(".relative")) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading || !sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput("");
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    addMessage(assistantMessage);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: sessionId,
          conversationHistory: messages.slice(-20),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start streaming");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response stream available");
      }

      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.text) {
                accumulatedText += data.text;
                updateMessage(assistantMessageId, accumulatedText);
              } else if (data.done) {
                break;
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.warn("Skipping malformed SSE data:", line);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: `Üzgünüm, bir hata oluştu: ${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`,
        timestamp: new Date(),
      };
      updateMessage(assistantMessageId, errorMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-gray-900" style={{ height: "100dvh" }}>
      <div className="bg-gray-800 shadow-sm border-b border-gray-700 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              ExamGPT
            </h1>
          </div>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <span className="text-sm font-medium">VET-EKON</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg border border-gray-600 z-10">
                <div className="py-1">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600 cursor-not-allowed opacity-50"
                    disabled
                    onClick={() => setDropdownOpen(false)}
                  >
                    Yakında Gelecek
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 w-full max-w-7xl mx-auto">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              ExamGPT'ye Hoş Geldiniz!
            </h3>
            <p className="text-sm">
              Her türlü konuda size yardımcı olabilirim. Ders çalışması,
              ödevler, sınav hazırlığı ve sorularınız için buradayım.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-2xl px-4 py-2 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-100 border border-gray-600"
              }`}
            >
              {message.role === "assistant" ? (
                message.content ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-300">
                    <div className="animate-pulse w-2 h-4 bg-gray-400 rounded"></div>
                    <span className="text-sm">Yazıyor...</span>
                  </div>
                )
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
              {message.content && (
                <p
                  className={`text-xs mt-2 ${
                    message.role === "user" ? "text-blue-200" : "text-gray-400"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div className="bg-gray-800 border-t border-gray-700 px-4 py-3 sm:px-6 sm:py-4">
        <div className="max-w-7xl mx-auto">
          <form
            onSubmit={sendMessage}
            className="flex items-end space-x-2 xs:space-x-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ders, ödev veya herhangi bir konuda soru sorun..."
              className="flex-1 px-3 py-2 xs:px-4 xs:py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              style={{
                fontSize: "clamp(0.875rem, 2.5vw, 1rem)", // Responsive font size
                padding:
                  "clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1rem)", // Responsive padding
              }}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 xs:px-6 xs:py-3 bg-linear-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center space-x-2 text-sm xs:text-base"
              style={{
                padding: "clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)", // Responsive button padding
              }}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <span>Gönder</span>
              )}
            </button>
          </form>

          <div className="mt-2 text-xs text-gray-500 flex items-center justify-between"></div>
        </div>
      </div>

      <div className="bg-gray-800 border-t border-gray-700 px-4 py-3 sm:px-6 sm:py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <span>© {new Date().getFullYear()} Ege Ayan</span>
            </div>
            <a
              href="https://github.com/ege-ayan/exam-gpt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 hover:text-white transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>Kaynak Kod</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
