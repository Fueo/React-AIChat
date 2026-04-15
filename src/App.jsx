import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  // --- STATE QUẢN LÝ TIN NHẮN VÀ LỊCH SỬ ---
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Fake data lịch sử chat (Sau này bạn có thể gọi API từ Go để lấy từ Redis lên)
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: 'Cách viết API bằng Golang' },
    { id: 2, title: 'Giải thích về Server-Sent Events' },
    { id: 3, title: 'Lỗi 429 Too Many Requests' }
  ]);
  const [activeChatId, setActiveChatId] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Hàm tạo đoạn chat mới
  const handleNewChat = () => {
    // Nếu khung chat hiện tại có tin nhắn, lưu nó vào lịch sử trước khi xóa
    if (messages.length > 0 && !activeChatId) {
      const newHistoryItem = {
        id: Date.now(),
        title: messages[0].content.substring(0, 30) + '...' // Lấy 30 chữ đầu làm tiêu đề
      };
      setChatHistory([newHistoryItem, ...chatHistory]);
    }
    
    setMessages([]);
    setActiveChatId(null);
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput('');
    setIsStreaming(true);

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage },
      { role: 'ai', content: '' }
    ]);

    // Gọi API Gateway
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
      eventSource.close();
      setIsStreaming(false);
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex].content += "\n[⚠️ Lỗi kết nối tới AI Microservice]";
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
      {/* KHUNG SIDEBAR - LỊCH SỬ CHAT BÊN TRÁI */}
      <aside className="sidebar">
        <button className="new-chat-btn" onClick={handleNewChat}>
          <span className="plus-icon">＋</span> Đoạn chat mới
        </button>

        <div className="history-list">
          <p className="history-title">Hôm qua</p>
          {chatHistory.map((chat) => (
            <button 
              key={chat.id} 
              className={`history-item ${activeChatId === chat.id ? 'active' : ''}`}
              onClick={() => setActiveChatId(chat.id)}
            >
              💬 {chat.title}
            </button>
          ))}
        </div>
        
        <div className="user-profile">
          <div className="avatar">👤</div>
          <span>Tài khoản của tôi</span>
        </div>
      </aside>

      {/* KHUNG CHAT CHÍNH BÊN PHẢI */}
      <main className="main-chat">
        <header className="chat-header">
          <h2>Mô hình đang chạy: Hệ thống Fallback Đa Lõi</h2>
        </header>

        <div className="messages-area">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="logo-huge">🤖</div>
              <h2>Tôi có thể giúp gì cho bạn hôm nay?</h2>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div key={index} className={`message-wrapper ${msg.role}`}>
              <div className="message-bubble">
                <div className={`avatar ${msg.role === 'user' ? 'user-avatar' : 'ai-avatar'}`}>
                  {msg.role === 'user' ? 'U' : 'AI'}
                </div>
                <pre className="message-text">{msg.content}</pre>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-container">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn cho AI... (Nhấn Enter để gửi)"
              disabled={isStreaming}
              rows={1}
            />
            <button 
              className="send-btn"
              onClick={handleSend} 
              disabled={!input.trim() || isStreaming}
            >
              {isStreaming ? '⬛' : '➤'}
            </button>
          </div>
          <p className="disclaimer">AI có thể mắc lỗi. Vui lòng kiểm tra lại các thông tin quan trọng.</p>
        </div>
      </main>
    </div>
  );
}

export default App;