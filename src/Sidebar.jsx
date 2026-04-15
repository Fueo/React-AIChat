import React from 'react';
import './Sidebar.css'
function Sidebar({ isOpen, chatHistory }) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* .sidebar-inner giúp duy trì độ rộng cố định 260px. 
        Khi .sidebar thu về 0px, nội dung bên trong sẽ bị che đi (overflow: hidden) 
        chứ không bị bóp méo hay rớt dòng.
      */}
      <div className="sidebar-inner">
        <div className="sidebar-header">
          <button className="new-chat-btn">
            <span className="icon">＋</span>
            New Chat
          </button>
        </div>
        
        <div className="history-section">
          <h4 className="section-title">Yesterday</h4>
          {chatHistory.map(chat => (
            <a href="#" key={chat.id} className="history-item">
              <span className="icon">💬</span>
              <span className="title">{chat.title}</span>
            </a>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar user-avatar-small">U</div>
            <span>User Account</span>
          </div>
          <button className="settings-btn">⚙️</button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;