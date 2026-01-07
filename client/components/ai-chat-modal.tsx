"use client";

import { useState, useRef, useEffect, useCallback, useMemo, ComponentProps } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Square } from "lucide-react";
import { useChat } from "./chat-context";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";


interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
export const AIChatModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { messages, addMessage } = useChat();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const responseBufferRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, [messages, currentResponse]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  // 응답 중단 처리
  const handleStopResponse = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      // 현재까지 생성된 응답을 메시지로 저장
      if (responseBufferRef.current) {
        addMessage({ role: "assistant", content: responseBufferRef.current });
      }
      setCurrentResponse("");
      responseBufferRef.current = "";
    }
  }, [addMessage]);

  // 스트리밍 응답 처리 최적화
  const processStream = useCallback(async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const decoder = new TextDecoder();
    let accumulated = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        responseBufferRef.current = accumulated;

        // 50ms마다 상태 업데이트
        if (!responseBufferRef.current) {
          setCurrentResponse(accumulated);
        }
      }

      // 최종 응답 업데이트
      setCurrentResponse(accumulated);
      addMessage({ role: "assistant", content: accumulated });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('사용자에 의해 요청이 중단되었습니다.');
          return;
        }
        console.error("스트림 처리 중 오류 발생:", error.message);
      } else {
        console.error("알 수 없는 오류 발생:", error);
      }
      throw error;
    }
  }, [addMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    addMessage({ role: "user", content: userMessage });
    setInput("");
    setIsLoading(true);
    setCurrentResponse("");
    responseBufferRef.current = "";

    // 새로운 AbortController 생성
    abortControllerRef.current = new AbortController();

    try {
      // 최근 15턴의 메시지만 포함
      const recentMessages = messages.slice(-30); // 15턴 = 30개 메시지 (사용자 + AI)

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          previousMessages: recentMessages
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Failed to fetch response");
      if (!response.body) throw new Error("No response body");

      await processStream(response.body.getReader());
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('사용자에 의해 요청이 취소되었습니다.');
          return;
        }
        console.error("오류 발생:", error.message);
      }
      addMessage({
        role: "assistant",
        content: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.",
      });
    } finally {
      setIsLoading(false);
      setCurrentResponse("");
      abortControllerRef.current = null;
    }
  };

  // 주기적으로 버퍼의 내용을 상태에 반영
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        if (responseBufferRef.current) {
          setCurrentResponse(responseBufferRef.current);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  // 메시지 렌더링 최적화
  const renderMessage = useCallback((content: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children }: ComponentProps<"code">) {
          const match = /language-(\w+)/.exec(className || "");
          const isInline = !match;
          return !isInline ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code className={className}>
              {children}
            </code>
          );
        },
        p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
        li: ({ children }) => <li className="mb-2">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-blue-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  ), []);

  // 메시지 목록 메모이제이션
  const messageList = useMemo(() => (
    <div className="space-y-4 pb-4">
      {messages.map((msg: ChatMessage, idx: number) => (
        <div
          key={idx}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
            }`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-3 ${msg.role === "user"
              ? "bg-blue-50 text-gray-900"
              : "bg-gray-50 text-gray-900"
              }`}
          >
            {renderMessage(msg.content)}
          </div>
        </div>
      ))}

      {isLoading && currentResponse && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-lg p-3 bg-gray-50 text-gray-900">
            {renderMessage(currentResponse)}
          </div>
        </div>
      )}

      {isLoading && !currentResponse && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-lg p-3 bg-gray-50 text-gray-900 animate-pulse">
            생각중...
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  ), [messages, isLoading, currentResponse, renderMessage]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>AI Assistant</DialogTitle>
        </DialogHeader>

        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto pr-4"
          style={{ maxHeight: "calc(80vh - 180px)" }}
        >
          {messageList}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t">
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder="메시지를 입력하세요..."
            className="flex-1"
          />
          {isLoading ? (
            <Button
              type="button"
              onClick={handleStopResponse}
              className="bg-black hover:bg-gray-800"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}; 