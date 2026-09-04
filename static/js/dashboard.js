// Switch Tab Navigation
function switchTab(tabId) {
  document.querySelectorAll('.tab-view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item button').forEach(el => el.classList.remove('active'));
  
  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) {
    targetTab.classList.add('active');
  }

  // Set active nav button
  const buttons = document.querySelectorAll('.nav-item button');
  buttons.forEach(btn => {
    if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabId)) {
      btn.classList.add('active');
    }
  });

  if (tabId === 'dashboard') loadDashboardData();
  if (tabId === 'autoreply') loadRulesData();
  if (tabId === 'inbox') loadInboxComments();
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
  setupLivePreview();
});

// Fetch Dashboard Overview
async function loadDashboardData() {
  try {
    const res = await fetch('/api/account');
    const data = await res.json();
    
    if (data.id) {
      document.getElementById('stat-username').innerText = `@${data.username}`;
      document.getElementById('stat-media-count').innerText = data.media_count || 13;
      document.getElementById('header-username').innerText = `@${data.username}`;
    }
    
    loadPostsFeed();
  } catch (err) {
    console.error('Error loading account data:', err);
  }
}

// Fetch Posts Feed
async function loadPostsFeed() {
  const container = document.getElementById('dashboard-posts-container');
  if (!container) return;

  try {
    container.innerHTML = '<div style="color: var(--text-muted); font-size: 14px;">Memuat data postingan...</div>';
    const res = await fetch('/api/posts');
    const data = await res.json();

    if (data.data && data.data.length > 0) {
      document.getElementById('post-count-badge').innerText = `${data.data.length} Posts`;
      
      container.innerHTML = data.data.map(post => `
        <div class="simplifyer-card post-card" style="padding: 16px;">
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px; font-family: monospace;">
            ID: ${post.id}
          </div>
          <div class="post-caption">
            ${post.caption ? post.caption : 'No Caption'}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border-color);">
            <span style="font-size: 12px; color: #93C5FD; font-weight: 600;">
              <i class="ri-chat-1-line"></i> ${post.comments_count || 0} Komentar
            </span>
            <a href="${post.permalink || '#'}" target="_blank" style="font-size: 12px; color: var(--text-muted); text-decoration: none;">
              Lihat di IG <i class="ri-external-link-line"></i>
            </a>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<div style="color: var(--text-muted); font-size: 14px;">Belum ada postingan.</div>';
    }
  } catch (err) {
    container.innerHTML = '<div style="color: var(--danger); font-size: 14px;">Gagal memuat postingan.</div>';
  }
}

// Load Auto-Reply Rules
async function loadRulesData() {
  const container = document.getElementById('rules-container');
  if (!container) return;

  try {
    const res = await fetch('/api/rules');
    const rules = await res.json();

    container.innerHTML = Object.entries(rules).map(([keyword, reply]) => `
      <div style="padding: 14px; background: rgba(17, 26, 54, 0.6); border: 1px solid var(--border-color); border-radius: var(--radius-md); display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span class="badge badge-purple">${keyword}</span>
          </div>
          <div style="font-size: 13px; color: var(--text-main); line-height: 1.4;">${reply}</div>
        </div>
        <button class="btn-secondary" onclick="deleteRule('${keyword}')" style="padding: 6px 10px; font-size: 12px; color: var(--danger); border-color: rgba(239, 68, 68, 0.3);">
          <i class="ri-delete-bin-line"></i>
        </button>
      </div>
    `).join('');
  } catch (err) {
    console.error('Gagal memuat aturan:', err);
  }
}

// Save New Rule
async function saveRule() {
  const keyword = document.getElementById('rule-keyword').value.trim();
  const reply = document.getElementById('rule-reply').value.trim();

  if (!keyword || !reply) {
    alert('Harap isi kata kunci dan pesan balasan!');
    return;
  }

  try {
    const res = await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, reply })
    });
    
    if (res.ok) {
      document.getElementById('rule-keyword').value = '';
      document.getElementById('rule-reply').value = '';
      loadRulesData();
      alert('Aturan berhasil disimpan!');
    }
  } catch (err) {
    alert('Gagal menyimpan aturan: ' + err);
  }
}

// Delete Rule
async function deleteRule(keyword) {
  if (!confirm(`Hapus aturan untuk kata kunci '${keyword}'?`)) return;

  try {
    const res = await fetch('/api/rules', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword })
    });
    if (res.ok) loadRulesData();
  } catch (err) {
    alert('Gagal menghapus aturan.');
  }
}

// Setup Live Preview for Content Publisher
function setupLivePreview() {
  const imgInput = document.getElementById('post-image-input');
  const captionInput = document.getElementById('post-caption-input');
  
  if (imgInput) {
    imgInput.addEventListener('input', () => {
      const val = imgInput.value.trim();
      const placeholder = document.getElementById('preview-img-placeholder');
      const imgElem = document.getElementById('preview-img-element');
      
      if (val.startsWith('http://') || val.startsWith('https://')) {
        imgElem.src = val;
        imgElem.style.display = 'block';
        placeholder.style.display = 'none';
      } else if (val) {
        placeholder.innerText = `File Lokal Detected:\n${val}`;
        placeholder.style.display = 'block';
        imgElem.style.display = 'none';
      } else {
        placeholder.innerText = 'Preview Foto Akan Muncul Di Sini';
        placeholder.style.display = 'block';
        imgElem.style.display = 'none';
      }
    });
  }

  if (captionInput) {
    captionInput.addEventListener('input', () => {
      const val = captionInput.value;
      const box = document.getElementById('preview-caption-box');
      box.innerText = val ? val : 'Preview caption akan tampil di sini...';
    });
  }
}

// Publish Post
async function publishPost() {
  const image_input = document.getElementById('post-image-input').value.trim();
  const caption = document.getElementById('post-caption-input').value.trim();
  const btn = document.getElementById('publish-btn');

  if (!image_input) {
    alert('Harap masukkan lokasi file foto atau URL!');
    return;
  }

  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Memproses Upload ke Instagram...';

    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_input, caption })
    });

    const data = await res.json();

    if (data.id) {
      alert('🎉 BERHASIL POSTING KE INSTAGRAM! Media ID: ' + data.id);
      document.getElementById('post-image-input').value = '';
      document.getElementById('post-caption-input').value = '';
      switchTab('dashboard');
    } else {
      alert('❌ Gagal posting: ' + JSON.stringify(data));
    }
  } catch (err) {
    alert('Terjadi kesalahan saat posting: ' + err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ri-send-plane-fill"></i> Publish to Feed Instagram';
  }
}

// Single scan for auto-reply
async function triggerScanOnce() {
  try {
    alert('Sedang memindai komentar terbaru...');
    const res = await fetch('/api/auto-reply-scan', { method: 'POST' });
    const data = await res.json();
    alert(`Pindaian Selesai! Total Komentar Dibalas Baru: ${data.total_replied || 0}`);
  } catch (err) {
    alert('Gagal memindai komentar.');
  }
}

// Load Inbox Comments
async function loadInboxComments() {
  const container = document.getElementById('inbox-comments-container');
  if (!container) return;

  try {
    container.innerHTML = '<div style="color: var(--text-muted); font-size: 14px;">Memuat komentar...</div>';
    const res = await fetch('/api/inbox-comments');
    const data = await res.json();

    if (data.comments && data.comments.length > 0) {
      container.innerHTML = data.comments.map(c => `
        <div class="comment-item">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div class="comment-user">@${c.username}</div>
            <span style="font-size: 11px; color: var(--text-dim);">${new Date(c.timestamp).toLocaleString()}</span>
          </div>
          <div class="comment-text">${c.text}</div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<div style="color: var(--text-muted); font-size: 14px;">Belum ada komentar di postingan terbaru.</div>';
    }
  } catch (err) {
    container.innerHTML = '<div style="color: var(--danger); font-size: 14px;">Gagal memuat inbox komentar.</div>';
  }
}

// Auto-Refresh Token
async function refreshToken() {
  try {
    const res = await fetch('/api/refresh-token', { method: 'POST' });
    const data = await res.json();
    if (data.access_token) {
      alert('✅ Token 60 Hari Berhasil Diperbarui!');
    } else {
      alert('Gagal memperbarui token: ' + JSON.stringify(data));
    }
  } catch (err) {
    alert('Error refresh token: ' + err);
  }
}

// Manual Refresh Data
function refreshData() {
  loadDashboardData();
}
