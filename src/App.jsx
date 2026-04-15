import { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar'; // Import component mới
import './Input.css';
import './Chat.css';


function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  // State quản lý việc mở/đóng Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [chatHistory] = useState([
    { id: 1, title: 'Giải thích gRPC Streaming' },
    { id: 2, title: 'Cách sửa lỗi CORS trong Go' },
    { id: 3, title: 'So sánh SSE và WebSocket' },
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput('');
    setIsStreaming(true);

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage },
      { role: 'ai', content: '', isError: false } 
    ]);

    const url = `http://localhost:8080/api/chat/stream?prompt=${encodeURIComponent(userMessage)}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        eventSource.close();
        setIsStreaming(false);
        return;
      }

      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          content: newMessages[lastIndex].content + event.data
        };
        return newMessages;
      });
    };

    eventSource.onerror = (err) => {
      console.error("Lỗi SSE:", err);
      eventSource.close();
      setIsStreaming(false);
      
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex].isError = true;
        
        if (newMessages[lastIndex].content === '') {
          newMessages[lastIndex].content = "⚠️ Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại backend.";
        } else {
          newMessages[lastIndex].content += "\n\n[⚠️ Đã mất kết nối tới máy chủ]";
        }
        
        return newMessages;
      });
    };
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app-layout">
      {/* 1. COMPONENT SIDEBAR */}
      <Sidebar isOpen={isSidebarOpen} chatHistory={chatHistory} />

      {/* 2. KHUNG CHAT CHÍNH BÊN PHẢI */}
      <main className="main-chat">
        {/* Nút Toggle Sidebar ở góc trên cùng bên trái */}
        <button 
          className="toggle-sidebar-btn"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Thu gọn (Hide)" : "Mở rộng (Show)"}
        >
          {isSidebarOpen ? '◀' : '☰'}
        </button>

        {messages.length === 0 ? (
          <div className="welcome-screen">
            <div className="ai-logo-large">🤖</div>
            <h1>Tôi có thể giúp gì cho bạn?</h1>
            <p>Hãy nhập câu hỏi của bạn để bắt đầu luồng gRPC Streaming.</p>
          </div>
        ) : (
          <div className="messages-area">
            {messages.map((msg, index) => (
              <div key={index} className={`message-row ${msg.role}`}>
                {msg.role === 'ai' && (
                  <div className="avatar ai-avatar">AI</div>
                )}
                
                <div className={`message-bubble ${msg.isError ? 'error-bubble' : ''}`}>
                  {msg.role === 'ai' && isStreaming && msg.content === '' ? (
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  ) : (
                    <pre className="message-text">{msg.content}</pre>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="avatar user-avatar">U</div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* 3. KHUNG NHẬP LIỆU */}
        <footer className="input-area">
          <div className="input-container">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              disabled={isStreaming}
              rows={1}
            />
            <button 
              className="send-btn"
              onClick={handleSend} 
              disabled={!input.trim() || isStreaming}
            >
              {isStreaming ? (
                <span className="loading-icon">⏳</span>
              ) : (
                <span className="send-icon">➤</span>
              )}
            </button>
          </div>
          <p className="disclaimer">AI có thể mắc lỗi. Hãy kiểm tra các thông tin quan trọng.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;