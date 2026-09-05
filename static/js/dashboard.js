// ==========================================
// SOCMED AUTOMATION (SIMPLIFYER ENGINE) JS
// ==========================================

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
  if (tabId === 'postrules') loadPostRulesView();
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
      document.getElementById('stat-media-count').innerText = data.media_count || 14;
      document.getElementById('header-username').innerText = `@${data.username}`;
    }
    
    loadPostsFeed();
  } catch (err) {
    console.error('Error loading account data:', err);
  }
}

// Fetch Posts Feed for Dashboard Tab
async function loadPostsFeed() {
  const container = document.getElementById('dashboard-posts-container');
  if (!container) return;

  try {
    container.innerHTML = '<div style="color: var(--text-muted); font-size: 14px;">Memuat data postingan...</div>';
    const res = await fetch('/api/posts?limit=50');
    const data = await res.json();

    if (data.data && data.data.length > 0) {
      document.getElementById('post-count-badge').innerText = `${data.data.length} Posts`;
      
      container.innerHTML = data.data.map(post => `
        <div class="simplifyer-card post-card" style="padding: 16px;">
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px; font-family: monospace; display: flex; justify-content: space-between;">
            <span>ID: ${post.id}</span>
            <span style="color: #60A5FA; font-weight: 600;">${new Date(post.timestamp).toLocaleDateString('id-ID')}</span>
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

// Load Post Custom Rules & DM Links View
async function loadPostRulesView() {
  const container = document.getElementById('post-rules-cards-container');
  if (!container) return;

  container.innerHTML = '<div style="color: var(--text-muted); padding: 20px;">Memuat seluruh postingan dan konfigurasi...</div>';

  try {
    const [postsRes, rulesRes] = await Promise.all([
      fetch('/api/posts?limit=50'),
      fetch('/api/post-rules')
    ]);

    const postsData = await postsRes.json();
    const rulesData = await rulesRes.json();
    const posts = postsData.data || [];

    if (posts.length === 0) {
      container.innerHTML = '<div class="simplifyer-card" style="color: var(--text-muted);">Tidak ada postingan ditemukan.</div>';
      return;
    }

    container.innerHTML = posts.map(post => {
      const pId = String(post.id);
      const rule = rulesData[pId] || {};
      const ctaLink = rule.cta_link || '';
      const customReply = rule.custom_reply || '';
      const sendDm = rule.send_dm || false;
      const dmMessage = rule.dm_message || '';
      const captionText = post.caption || 'Tanpa Caption';

      return `
        <div class="simplifyer-card" style="display: grid; grid-template-columns: 260px 1fr; gap: 24px; border-left: 4px solid ${ctaLink ? '#10B981' : '#4F46E5'};">
          <!-- Post Summary -->
          <div>
            <div style="font-size: 11px; font-family: monospace; color: var(--text-muted); margin-bottom: 6px;">
              Post ID: ${pId}
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #E2E8F0; margin-bottom: 10px; line-height: 1.4; max-height: 110px; overflow-y: auto; padding: 10px; background: rgba(17, 26, 54, 0.6); border-radius: var(--radius-md);">
              ${captionText}
            </div>
            <div style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
              <span class="badge ${post.comments_count > 0 ? 'badge-blue' : 'badge-purple'}">
                <i class="ri-chat-1-line"></i> ${post.comments_count || 0} Komentar
              </span>
              <a href="${post.permalink || '#'}" target="_blank" style="font-size: 12px; color: var(--text-muted); text-decoration: none;">
                Buka Post <i class="ri-external-link-line"></i>
              </a>
            </div>
          </div>

          <!-- Configuration Form -->
          <div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <!-- Custom WhatsApp / Landing Page Link -->
              <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label" style="display: flex; align-items: center; gap: 6px;">
                  <i class="ri-whatsapp-line" style="color: #34D399;"></i> Custom Link (WhatsApp / URL Khusus Unit Ini)
                </label>
                <input type="text" id="cta-link-${pId}" class="form-input" value="${ctaLink}" placeholder="contoh: https://wa.me/62812xxx?text=Halo%20saya%20tertarik%20listing%20ini">
                <span style="font-size: 11px; color: var(--text-dim); margin-top: 3px; display: block;">Link ini otomatis disisipkan AI / Bot saat membalas komentar postingan ini.</span>
              </div>

              <!-- Custom Public Reply Template Override -->
              <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label">
                  <i class="ri-chat-voice-line" style="color: #60A5FA;"></i> Custom Comment Reply (Opsional)
                </label>
                <input type="text" id="custom-reply-${pId}" class="form-input" value="${customReply}" placeholder="Kosongkan jika ingin memakai AI Gemini otomatis">
                <span style="font-size: 11px; color: var(--text-dim); margin-top: 3px; display: block;">Jika diisi, bot akan memakai teks tetap ini. Jika kosong, AI yang menjawab.</span>
              </div>
            </div>

            <!-- Direct Message (DM) Automation Section -->
            <div style="padding: 12px 16px; background: rgba(17, 26, 54, 0.4); border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-top: 8px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                <label style="font-size: 13px; font-weight: 600; color: #FBBF24; display: flex; align-items: center; gap: 6px; cursor: pointer;">
                  <input type="checkbox" id="send-dm-${pId}" ${sendDm ? 'checked' : ''} style="accent-color: #F59E0B; cursor: pointer;">
                  Kirim DM Otomatis ke Inbox Komentator (Private Reply)
                </label>
                <span style="font-size: 11px; color: var(--text-dim);">Instagram Direct Message</span>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <input type="text" id="dm-message-${pId}" class="form-input" value="${dmMessage}" placeholder="Halo kak! Terima kasih sudah komentar. Ini pricelist & brosur lengkapnya ya kak...">
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 14px;">
              <button class="btn-primary" onclick="savePostRule('${pId}')" id="btn-save-${pId}">
                <i class="ri-save-line"></i> Simpan Pengaturan Post Ini
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = '<div style="color: var(--danger); padding: 20px;">Gagal memuat aturan post: ' + err.message + '</div>';
  }
}

// Save Single Post Rule
async function savePostRule(postId) {
  const btn = document.getElementById(`btn-save-${postId}`);
  const ctaLink = document.getElementById(`cta-link-${postId}`)?.value.trim() || '';
  const customReply = document.getElementById(`custom-reply-${postId}`)?.value.trim() || '';
  const sendDm = document.getElementById(`send-dm-${postId}`)?.checked || false;
  const dmMessage = document.getElementById(`dm-message-${postId}`)?.value.trim() || '';

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Menyimpan...';
  }

  try {
    const res = await fetch('/api/post-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: postId,
        cta_link: ctaLink,
        custom_reply: customReply,
        send_dm: sendDm,
        dm_message: dmMessage
      })
    });

    const data = await res.json();
    if (data.status === 'success') {
      showToast('Pengaturan postingan berhasil disimpan ke Supabase!', 'success');
    } else {
      showToast('Gagal menyimpan: ' + (data.error || 'Terjadi kesalahan'), 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan jaringan.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ri-save-line"></i> Simpan Pengaturan Post Ini';
    }
  }
}

// Load Auto-Reply Rules (Keyword List)
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
            <span style="font-size: 11px; color: var(--text-dim);">Trigger Match</span>
          </div>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5;">${reply}</p>
        </div>
        <button class="btn-secondary" onclick="deleteRule('${keyword}')" style="color: var(--danger); padding: 6px 10px; border-color: rgba(239, 68, 68, 0.3);">
          <i class="ri-delete-bin-line"></i>
        </button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<div style="color: var(--danger);">Gagal memuat aturan.</div>';
  }
}

// Add Keyword Rule
async function addRule() {
  const keyword = document.getElementById('new-keyword').value.trim();
  const reply = document.getElementById('new-reply').value.trim();

  if (!keyword || !reply) {
    showToast('Harap isi kata kunci dan template balasan.', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, reply })
    });

    const data = await res.json();
    if (data.status === 'success') {
      showToast(`Aturan untuk kata "${keyword}" berhasil disimpan ke Supabase!`, 'success');
      document.getElementById('new-keyword').value = '';
      document.getElementById('new-reply').value = '';
      loadRulesData();
    }
  } catch (err) {
    showToast('Gagal menambahkan aturan.', 'error');
  }
}

// Delete Keyword Rule
async function deleteRule(keyword) {
  if (!confirm(`Hapus aturan untuk kata kunci "${keyword}"?`)) return;

  try {
    const res = await fetch('/api/rules', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword })
    });

    const data = await res.json();
    if (data.status === 'success') {
      showToast(`Aturan "${keyword}" berhasil dihapus.`, 'success');
      loadRulesData();
    }
  } catch (err) {
    showToast('Gagal menghapus aturan.', 'error');
  }
}

// Test AI Reply
async function testAIReply() {
  const input = document.getElementById('ai-test-input');
  const output = document.getElementById('ai-test-output');
  if (!input || !output) return;

  const commentText = input.value.trim();
  if (!commentText) {
    showToast('Ketik contoh pertanyaan terlebih dahulu.', 'warning');
    return;
  }

  output.style.display = 'block';
  output.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Gemini 3.6 Flash sedang berpikir...';

  try {
    const res = await fetch('/api/ai-reply-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: commentText, username: 'calon_pembeli' })
    });

    const data = await res.json();
    if (data.status === 'success') {
      output.innerHTML = `
        <div style="font-size: 11px; color: #FBBF24; font-weight: 700; margin-bottom: 4px;">RESPONS GEMINI AI:</div>
        <div style="color: #F8FAFC;">"${data.ai_reply}"</div>
      `;
    } else {
      output.innerHTML = `<span style="color: var(--danger);">${data.ai_reply}</span>`;
    }
  } catch (err) {
    output.innerHTML = '<span style="color: var(--danger);">Gagal menghubungi endpoint AI.</span>';
  }
}

// Publish Post
async function publishPost() {
  const imageInput = document.getElementById('publish-image-input').value.trim();
  const caption = document.getElementById('publish-caption-input').value.trim();
  const btn = document.getElementById('btn-publish');

  if (!imageInput) {
    showToast('Harap masukkan URL gambar atau path file lokal.', 'warning');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Sedang Memproses & Mengunggah...';

  try {
    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_input: imageInput, caption: caption })
    });

    const data = await res.json();

    if (data.id) {
      showToast(`Sukses publish ke Instagram! Media ID: ${data.id}`, 'success');
      document.getElementById('publish-image-input').value = '';
      document.getElementById('publish-caption-input').value = '';
      loadDashboardData();
    } else {
      showToast(`Gagal: ${JSON.stringify(data.error || data)}`, 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan saat mempublish.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ri-send-plane-fill"></i> Publish ke Feed Instagram Sekarang';
  }
}

// Run Auto-Reply Scan Across All Posts
async function runAutoReplyScan() {
  const btn = document.getElementById('btn-scan');
  btn.disabled = true;
  btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Memindai Seluruh Postingan...';

  try {
    const res = await fetch('/api/auto-reply-scan', { method: 'POST' });
    const data = await res.json();

    if (data.status === 'success') {
      const msg = `Scan Selesai! ${data.total_scanned_posts} postingan dipindai, ${data.total_new_replies} balasan terkirim.`;
      showToast(msg, 'success');
      loadInboxComments();
    } else {
      showToast('Gagal memindai komentar.', 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan saat scan.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ri-scan-2-line"></i> Scan All Posts Now';
  }
}

// Load Inbox Comments
async function loadInboxComments() {
  const container = document.getElementById('inbox-comments-container');
  if (!container) return;

  container.innerHTML = '<div style="color: var(--text-muted); font-size: 14px;">Memuat komentar terbaru...</div>';

  try {
    const res = await fetch('/api/inbox-comments');
    const data = await res.json();

    if (data.data && data.data.length > 0) {
      container.innerHTML = data.data.map(comment => `
        <div style="padding: 16px; background: rgba(17, 26, 54, 0.6); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 700; color: #93C5FD; font-size: 14px;">@${comment.username || 'user'}</span>
              <span style="font-size: 11px; color: var(--text-dim);">${new Date(comment.timestamp).toLocaleString('id-ID')}</span>
            </div>
            <span class="badge ${comment.is_replied ? 'badge-success' : 'badge-purple'}">
              ${comment.is_replied ? '<i class="ri-check-line"></i> Sudah Dibalas' : '<i class="ri-time-line"></i> Belum Dibalas'}
            </span>
          </div>

          <p style="font-size: 13px; color: #E2E8F0; margin-bottom: 12px; line-height: 1.5;">${comment.text}</p>

          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 10px;">
            <a href="${comment.post_permalink || '#'}" target="_blank" style="font-size: 12px; color: var(--text-muted); text-decoration: none;">
              Buka Postingan Terkait <i class="ri-external-link-line"></i>
            </a>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<div style="color: var(--text-muted); font-size: 14px;">Belum ada komentar masuk.</div>';
    }
  } catch (err) {
    container.innerHTML = '<div style="color: var(--danger); font-size: 14px;">Gagal memuat inbox komentar.</div>';
  }
}

// Live Preview Setup
function setupLivePreview() {
  const imgInput = document.getElementById('publish-image-input');
  const capInput = document.getElementById('publish-caption-input');
  const imgBox = document.getElementById('preview-image-box');
  const capBox = document.getElementById('preview-caption-box');

  if (imgInput && imgBox) {
    imgInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val.startsWith('http://') || val.startsWith('https://')) {
        imgBox.innerHTML = `<img src="${val}" style="width: 100%; height: 100%; object-fit: cover;">`;
      } else if (val) {
        imgBox.innerHTML = `<div style="text-align: center; padding: 20px;"><i class="ri-file-image-line" style="font-size: 32px; color: #818CF8;"></i><div style="font-size: 11px; margin-top: 6px; color: #94A3B8;">File Lokal: ${val.split('\\').pop()}</div></div>`;
      } else {
        imgBox.innerHTML = '<i class="ri-image-line" style="font-size: 32px;"></i>';
      }
    });
  }

  if (capInput && capBox) {
    capInput.addEventListener('input', (e) => {
      capBox.innerText = e.target.value || 'Preview caption akan tampil di sini...';
    });
  }
}

// Toast Notifications
function showToast(message, type = 'info') {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      z-index: 9999;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    document.body.appendChild(toast);
  }

  if (type === 'success') {
    toast.style.background = '#10B981';
    toast.innerHTML = `<i class="ri-checkbox-circle-fill"></i> ${message}`;
  } else if (type === 'error') {
    toast.style.background = '#EF4444';
    toast.innerHTML = `<i class="ri-error-warning-fill"></i> ${message}`;
  } else if (type === 'warning') {
    toast.style.background = '#F59E0B';
    toast.innerHTML = `<i class="ri-alert-fill"></i> ${message}`;
  } else {
    toast.style.background = '#4F46E5';
    toast.innerHTML = `<i class="ri-information-fill"></i> ${message}`;
  }

  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 4000);
}
