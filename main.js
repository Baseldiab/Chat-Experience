import './style.css';

class ChatApp {
  constructor() {
    this.messages = [];
    this.selectedFile = null;
    this.theme = localStorage.getItem('chat-theme') || 'light';

    this.initializeElements();
    this.initializeEventListeners();
    this.initializeTheme();
    this.loadMessages();
  }

  initializeElements() {
    this.chatToggle = document.getElementById('chatToggle');
    this.chatContainer = document.getElementById('chatContainer');
    this.closeChat = document.getElementById('closeChat');
    this.chatMessages = document.getElementById('chatMessages');
    this.messageInput = document.getElementById('messageInput');
    this.sendButton = document.getElementById('sendButton');
    this.typingIndicator = document.getElementById('typingIndicator');
    this.themeToggle = document.getElementById('themeToggle');
    this.emojiButton = document.getElementById('emojiButton');
    this.emojiPicker = document.getElementById('emojiPicker');
    this.attachButton = document.getElementById('attachButton');
    this.fileInput = document.getElementById('fileInput');
    this.filePreview = document.getElementById('filePreview');

    this.initializeEmojiPicker();
  }

  initializeEventListeners() {
    this.chatToggle.addEventListener('click', () => this.openChat());
    this.closeChat.addEventListener('click', () => this.closeChat_handler());
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.messageInput.addEventListener('input', () => this.handleInput());

    this.themeToggle.addEventListener('click', () => this.toggleTheme());

    this.emojiButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleEmojiPicker();
    });

    document.addEventListener('click', (e) => {
      if (!this.emojiPicker.contains(e.target) && e.target !== this.emojiButton) {
        this.emojiPicker.classList.add('hidden');
      }
    });

    this.attachButton.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
  }

  initializeTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.theme);
    localStorage.setItem('chat-theme', this.theme);
  }

  initializeEmojiPicker() {
    const emojis = [
      '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
      '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
      '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪',
      '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒',
      '👍', '👎', '👏', '🙌', '👋', '🤝', '✌️', '🤞',
      '💪', '🙏', '✨', '🎉', '🎊', '🎈', '🎁', '🏆',
      '⭐', '🌟', '💯', '✅', '❌', '❤️', '🧡', '💛',
      '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️'
    ];

    const emojiList = this.emojiPicker.querySelector('.emoji-list');
    emojis.forEach(emoji => {
      const emojiItem = document.createElement('div');
      emojiItem.className = 'emoji-item';
      emojiItem.textContent = emoji;
      emojiItem.addEventListener('click', () => this.insertEmoji(emoji));
      emojiList.appendChild(emojiItem);
    });
  }

  toggleEmojiPicker() {
    this.emojiPicker.classList.toggle('hidden');
  }

  insertEmoji(emoji) {
    const cursorPos = this.messageInput.selectionStart;
    const textBefore = this.messageInput.value.substring(0, cursorPos);
    const textAfter = this.messageInput.value.substring(cursorPos);
    this.messageInput.value = textBefore + emoji + textAfter;
    this.messageInput.focus();
    this.messageInput.selectionStart = this.messageInput.selectionEnd = cursorPos + emoji.length;
    this.emojiPicker.classList.add('hidden');
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.showFilePreview(file);
    }
  }

  showFilePreview(file) {
    const fileSize = this.formatFileSize(file.size);
    this.filePreview.innerHTML = `
      <div class="file-icon">${this.getFileExtension(file.name).toUpperCase()}</div>
      <div class="file-preview-info">
        <div class="file-preview-name">${file.name}</div>
        <div class="file-preview-size">${fileSize}</div>
      </div>
      <button class="file-preview-remove" id="removeFile">×</button>
    `;
    this.filePreview.classList.remove('hidden');

    document.getElementById('removeFile').addEventListener('click', () => this.removeFile());
  }

  removeFile() {
    this.selectedFile = null;
    this.fileInput.value = '';
    this.filePreview.classList.add('hidden');
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getFileExtension(filename) {
    return filename.split('.').pop() || 'file';
  }

  openChat() {
    this.chatContainer.classList.add('open');
    this.chatToggle.classList.add('hidden');
    this.messageInput.focus();
  }

  closeChat_handler() {
    this.chatContainer.classList.remove('open');
    this.chatToggle.classList.remove('hidden');
  }

  handleInput() {
    const hasContent = this.messageInput.value.trim().length > 0;
    this.sendButton.disabled = !hasContent;
  }

  sendMessage() {
    const text = this.messageInput.value.trim();
    if (!text && !this.selectedFile) return;

    const message = {
      id: Date.now(),
      type: 'user',
      text: text,
      file: this.selectedFile ? {
        name: this.selectedFile.name,
        size: this.selectedFile.size,
        type: this.selectedFile.type
      } : null,
      timestamp: new Date(),
      status: 'sent'
    };

    this.addMessage(message);
    this.messages.push(message);
    this.saveMessages();

    this.messageInput.value = '';
    this.removeFile();
    this.sendButton.disabled = true;

    setTimeout(() => this.updateMessageStatus(message.id, 'delivered'), 1000);
    setTimeout(() => this.updateMessageStatus(message.id, 'read'), 2000);

    this.simulateAIResponse(text);
  }

  simulateAIResponse(userMessage) {
    this.showTypingIndicator();

    setTimeout(() => {
      this.hideTypingIndicator();

      const responses = [
        "I understand you're asking about documentation. Let me help you with that!",
        "That's a great question! Based on your documentation, here's what I found...",
        "I can help you navigate through the documentation. What specific information are you looking for?",
        "Let me search through the documentation for you. This might take a moment...",
        "I've found several relevant sections in your documentation. Would you like me to elaborate?",
        "Thanks for reaching out! I'm analyzing your query against the documentation database.",
        "That's covered in section 3 of your documentation. Would you like me to explain further?",
        "I can provide detailed information from your docs. Here's a summary..."
      ];

      const aiMessage = {
        id: Date.now(),
        type: 'ai',
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        status: 'delivered'
      };

      this.addMessage(aiMessage);
      this.messages.push(aiMessage);
      this.saveMessages();
    }, 1500 + Math.random() * 1000);
  }

  showTypingIndicator() {
    this.typingIndicator.classList.remove('hidden');
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    this.typingIndicator.classList.add('hidden');
  }

  addMessage(message) {
    if (this.messages.length === 0) {
      const welcome = this.chatMessages.querySelector('.welcome-message');
      if (welcome) welcome.remove();
    }

    const messageEl = document.createElement('div');
    messageEl.className = `message ${message.type}`;
    messageEl.dataset.id = message.id;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = message.type === 'user' ? 'U' : 'AI';

    const content = document.createElement('div');
    content.className = 'message-content';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    if (message.text) {
      const text = document.createElement('p');
      text.className = 'message-text';
      text.textContent = message.text;
      bubble.appendChild(text);
    }

    if (message.file) {
      const fileAttachment = this.createFileAttachment(message.file);
      bubble.appendChild(fileAttachment);
    }

    content.appendChild(bubble);

    const meta = document.createElement('div');
    meta.className = 'message-meta';

    const time = document.createElement('span');
    time.textContent = this.formatTime(message.timestamp);
    meta.appendChild(time);

    if (message.type === 'user') {
      const status = document.createElement('span');
      status.className = 'message-status';
      status.innerHTML = this.getStatusIcon(message.status);
      meta.appendChild(status);
    }

    content.appendChild(meta);

    messageEl.appendChild(avatar);
    messageEl.appendChild(content);

    this.chatMessages.appendChild(messageEl);
    this.scrollToBottom();
  }

  createFileAttachment(file) {
    const attachment = document.createElement('div');
    attachment.className = 'file-attachment';
    attachment.innerHTML = `
      <div class="file-icon">${this.getFileExtension(file.name).toUpperCase()}</div>
      <div class="file-info">
        <div class="file-name">${file.name}</div>
        <div class="file-size">${this.formatFileSize(file.size)}</div>
      </div>
    `;
    return attachment;
  }

  updateMessageStatus(messageId, status) {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.status = status;
      const messageEl = this.chatMessages.querySelector(`[data-id="${messageId}"]`);
      if (messageEl) {
        const statusEl = messageEl.querySelector('.message-status');
        if (statusEl) {
          statusEl.innerHTML = this.getStatusIcon(status);
        }
      }
      this.saveMessages();
    }
  }

  getStatusIcon(status) {
    const icons = {
      sent: '<svg class="status-icon sent" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      delivered: '<svg class="status-icon delivered" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline><polyline points="20 6 9 17 4 12" transform="translate(3, 0)"></polyline></svg>',
      read: '<svg class="status-icon read" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline><polyline points="20 6 9 17 4 12" transform="translate(3, 0)"></polyline></svg>'
    };
    return icons[status] || icons.sent;
  }

  formatTime(date) {
    const now = new Date();
    const messageDate = new Date(date);
    const diff = now - messageDate;

    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }, 100);
  }

  saveMessages() {
    try {
      const messagesToSave = this.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }));
      localStorage.setItem('chat-messages', JSON.stringify(messagesToSave));
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  }

  loadMessages() {
    try {
      const saved = localStorage.getItem('chat-messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.messages = parsed.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));

        if (this.messages.length > 0) {
          const welcome = this.chatMessages.querySelector('.welcome-message');
          if (welcome) welcome.remove();

          this.messages.forEach(message => this.addMessage(message));
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ChatApp();
});
