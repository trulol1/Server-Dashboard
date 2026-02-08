// Message System for Admin Dashboard
// Determine if we're on the landing page or dashboard
const currentPage = window.location.pathname.includes('/landing') ? 'landing' : 'dashboard';

// Load and display messages
async function loadMessages() {
  if (!messagesContainer) return; // Exit if container doesn't exist
  
  try {
    const response = await fetch(`${API_BASE_URL}/messages`);
    const messages = await response.json();
    displayMessages(messages);
  } catch (error) {
    console.error('Failed to load messages:', error);
  }
}

function displayMessages(messages) {
  if (!messagesContainer) return; // Exit if container doesn't exist
  
  messagesContainer.innerHTML = '';
  
  // Filter messages based on current page
  const filteredMessages = messages.filter(msg => {
    if (currentPage === 'landing') {
      return msg.showOnLanding !== false; // Show if true or undefined (backwards compatibility)
    } else {
      return msg.showOnDashboard !== false; // Show if true or undefined (backwards compatibility)
    }
  });
  
  filteredMessages.forEach(msg => {
    const messageEl = document.createElement('div');
    messageEl.className = 'mb-4 p-4 rounded-lg shadow-lg animate-slideDown flex items-center justify-between';
    messageEl.style.backgroundColor = msg.color + '20';
    messageEl.style.borderLeft = `4px solid ${msg.color}`;
    
    const textEl = document.createElement('p');
    textEl.className = 'text-slate-100 flex-1';
    textEl.textContent = msg.text;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm transition';
    deleteBtn.textContent = '✕';
    deleteBtn.onclick = () => deleteMessage(msg.id);
    
    // Only show delete button if authenticated
    if (typeof authAPI !== 'undefined' && authAPI.isAuthenticated()) {
      messageEl.appendChild(textEl);
      messageEl.appendChild(deleteBtn);
    } else {
      messageEl.appendChild(textEl);
    }
    
    messagesContainer.appendChild(messageEl);
  });
}

async function postMessage() {
  const text = messageText.value.trim();
  const duration = parseInt(messageDuration.value) || 0;
  const showOnLanding = document.getElementById('showOnLanding').checked;
  const showOnDashboard = document.getElementById('showOnDashboard').checked;
  
  if (!text) {
    alert('Please enter a message');
    return;
  }
  
  if (!showOnLanding && !showOnDashboard) {
    alert('Please select at least one page to show the message on');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: authAPI.getAuthHeader(),
      body: JSON.stringify({
        text,
        color: selectedColor,
        duration,
        showOnLanding,
        showOnDashboard
      })
    });
    
    if (response.ok) {
      messageText.value = '';
      messageDuration.value = '0';
      document.getElementById('showOnLanding').checked = true;
      document.getElementById('showOnDashboard').checked = true;
      messageModal.classList.add('hidden');
      loadMessages();
    } else {
      alert('Failed to post message');
    }
  } catch (error) {
    console.error('Failed to post message:', error);
    alert('Failed to post message');
  }
}

async function deleteMessage(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
      method: 'DELETE',
      headers: authAPI.getAuthHeader()
    });
    
    if (response.ok) {
      loadMessages();
    }
  } catch (error) {
    console.error('Failed to delete message:', error);
  }
}

// Message modal event listeners
if (adminMessagesBtn) {
  adminMessagesBtn.addEventListener('click', () => {
    messageModal.classList.remove('hidden');
  });
}

if (closeMessageModalBtn) {
  closeMessageModalBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    messageModal.classList.add('hidden');
  });
}

if (postMessageBtn) {
  postMessageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    postMessage();
  });
}

// Close modal when clicking backdrop (but not modal content)
if (messageModal) {
  messageModal.addEventListener('click', (e) => {
    if (e.target === messageModal) {
      messageModal.classList.add('hidden');
    }
  });
  
  // Prevent clicks inside modal from closing it
  const modalContent = messageModal.querySelector('.bg-slate-800');
  if (modalContent) {
    modalContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
}

// Color selection
document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedColor = btn.dataset.color;
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('ring-2'));
    btn.classList.add('ring-2');
  });
});

// Load messages on dashboard load (only if container exists)
if (messagesContainer) {
  loadMessages();
  setInterval(loadMessages, 30000); // Refresh every 30 seconds
}

