import requests
import json
import time
import sys
import os

# Ensure UTF-8 output encoding for Windows terminal
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# ==========================================
# CONFIGURATION (PERMANENT 60-DAY TOKEN)
# ==========================================
INSTAGRAM_ACCOUNT_ID = "17841466987503898"

# 60-Day Long-Lived Access Token
ACCESS_TOKEN = "EAGHy3jJfJscBSYs6l3B6Bwly4yEsB3fSHfNPwF22Ftlvpsv3CZBLHqrvcrNU07FZAD1KM1WLvO4HrDAw257snRzMOVIZAMUegfj4h77P1N6HYdoWyZAmIrSxiG7YpoJ3MgljZAl7jA6pHNzTux0b7kQNSPfAdehS3EIhoPbnXqmChB90pH4mmifoWJOySkQ4s"

# Meta App Credentials
APP_ID = "27570108882691783"
APP_SECRET = "9426751dfaec5d047d1e568a20899d8a"

# Base Graph API URL
GRAPH_URL = "https://graph.facebook.com/v20.0"

# Memory for tracking replied comments (prevents double replies)
REPLIED_COMMENTS_FILE = "replied_comments.json"


def load_replied_comments():
    """Load list of already replied comment IDs."""
    if os.path.exists(REPLIED_COMMENTS_FILE):
        try:
            with open(REPLIED_COMMENTS_FILE, 'r') as f:
                return set(json.load(f))
        except Exception:
            return set()
    return set()


def save_replied_comments(replied_set):
    """Save list of replied comment IDs to disk."""
    try:
        with open(REPLIED_COMMENTS_FILE, 'w') as f:
            json.dump(list(replied_set), f)
    except Exception as e:
        print("[FAIL] Gagal menyimpan log komentar:", e)


def refresh_long_lived_token():
    """Automatically refresh the 60-day token so it never expires."""
    global ACCESS_TOKEN
    print("[TOKEN] Refreshing Long-Lived Access Token...")
    url = f"{GRAPH_URL}/oauth/access_token"
    params = {
        "grant_type": "fb_exchange_token",
        "client_id": APP_ID,
        "client_secret": APP_SECRET,
        "fb_exchange_token": ACCESS_TOKEN
    }
    res = requests.get(url, params=params).json()
    if "access_token" in res:
        ACCESS_TOKEN = res["access_token"]
        print("[OK] Token 60-Hari Berhasil diperbarui!")
        return ACCESS_TOKEN
    else:
        print("[FAIL] Gagal memperbarui token:", res)
        return None


def upload_local_file_to_cloud(file_path):
    """Upload a local image file to a free public HTTPS cloud host so Meta API can access it."""
    file_path = file_path.strip('"').strip("'").strip()
    if not os.path.exists(file_path):
        print(f"[FAIL] File tidak ditemukan di path: {file_path}")
        return None

    file_name = os.path.basename(file_path)
    print(f"[CLOUD] Mengunggah file lokal '{file_name}' ke Cloud Host...")

    # Primary Host: Uguu.se (Fast & Direct Image Stream for Meta Crawler)
    try:
        with open(file_path, 'rb') as f:
            res = requests.post(
                'https://uguu.se/upload',
                files={'files[]': (file_name, f)},
                timeout=15
            )
        data = res.json()
        if res.status_code == 200 and data.get('success') and data.get('files'):
            public_url = data['files'][0]['url']
            print(f"[OK] Foto berhasil di-host publik (Uguu): {public_url}")
            return public_url
    except Exception as e:
        print("[INFO] Primary host failed, trying fallback host...", e)

    # Fallback Host: Catbox
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        with open(file_path, 'rb') as f:
            res = requests.post(
                'https://catbox.moe/user/api.php',
                data={'reqtype': 'fileupload'},
                files={'fileToUpload': (file_name, f)},
                headers=headers,
                timeout=15
            )
        if res.status_code == 200 and res.text.strip().startswith('http'):
            public_url = res.text.strip()
            print(f"[OK] Foto berhasil di-host publik (Catbox): {public_url}")
            return public_url
    except Exception as e:
        print("[FAIL] Fallback host juga gagal:", e)

    print("[FAIL] Gagal mengunggah file ke cloud host.")
    return None


def get_account_info():
    """Fetch basic info of the Instagram account."""
    url = f"{GRAPH_URL}/{INSTAGRAM_ACCOUNT_ID}"
    params = {
        "fields": "id,username,name,media_count",
        "access_token": ACCESS_TOKEN
    }
    response = requests.get(url, params=params)
    return response.json()


def get_recent_posts(limit=10):
    """Fetch recent posts from the Instagram account."""
    url = f"{GRAPH_URL}/{INSTAGRAM_ACCOUNT_ID}/media"
    params = {
        "fields": "id,caption,media_type,media_url,permalink,timestamp,comments_count",
        "limit": limit,
        "access_token": ACCESS_TOKEN
    }
    response = requests.get(url, params=params)
    return response.json()


def get_post_comments(media_id):
    """Fetch comments on a specific post."""
    url = f"{GRAPH_URL}/{media_id}/comments"
    params = {
        "fields": "id,text,username,timestamp,replies",
        "access_token": ACCESS_TOKEN
    }
    response = requests.get(url, params=params)
    return response.json()


def reply_to_comment(comment_id, message):
    """Reply to a specific comment."""
    url = f"{GRAPH_URL}/{comment_id}/replies"
    data = {
        "message": message,
        "access_token": ACCESS_TOKEN
    }
    response = requests.post(url, data=data)
    return response.json()


def post_comment_on_media(media_id, message):
    """Post a new top-level comment on a post."""
    url = f"{GRAPH_URL}/{media_id}/comments"
    data = {
        "message": message,
        "access_token": ACCESS_TOKEN
    }
    response = requests.post(url, data=data)
    return response.json()


def create_and_publish_image_post(image_input, caption):
    """
    Publish an image post to Instagram (2-step process).
    Accepts either a direct HTTP/HTTPS URL or a local file path.
    """
    image_input = image_input.strip('"').strip("'").strip()
    
    # Check if input is a local file path or URL
    if not image_input.startswith("http://") and not image_input.startswith("https://"):
        public_url = upload_local_file_to_cloud(image_input)
        if not public_url:
            print("[FAIL] Proses posting dibatalkan karena gagal mendapatkan URL gambar.")
            return None
        image_url = public_url
    else:
        image_url = image_input

    print(f"[IG API] Mengirim container media ke Instagram...")
    container_url = f"{GRAPH_URL}/{INSTAGRAM_ACCOUNT_ID}/media"
    container_data = {
        "image_url": image_url,
        "caption": caption,
        "access_token": ACCESS_TOKEN
    }
    container_res = requests.post(container_url, data=container_data).json()
    
    if "id" not in container_res:
        print("[FAIL] Gagal membuat media container:", container_res)
        return container_res
        
    creation_id = container_res["id"]
    print(f"[OK] Container berhasil dibuat! Container ID: {creation_id}")
    print("[WAIT] Menunggu 5 detik untuk pemrosesan gambar oleh server Meta...")
    time.sleep(5)
    
    # Step 2: Publish container
    print("[IG API] Mempublikasikan ke Feed Instagram...")
    publish_url = f"{GRAPH_URL}/{INSTAGRAM_ACCOUNT_ID}/media_publish"
    publish_data = {
        "creation_id": creation_id,
        "access_token": ACCESS_TOKEN
    }
    publish_res = requests.post(publish_url, data=publish_data).json()
    return publish_res


def auto_reply_bot(trigger_rules, continuous=False, interval_seconds=30):
    """
    Automated comment replying loop.
    `trigger_rules` is a dict of {keyword: reply_message}
    If `continuous` is True, runs forever every `interval_seconds`.
    """
    replied_ids = load_replied_comments()
    print(f"\n[BOT] Instagram Auto-Reply Bot Started (Mode Continuous: {continuous})...")
    
    while True:
        posts_data = get_recent_posts(limit=10)
        
        if "data" not in posts_data:
            print("[FAIL] Gagal mengambil postingan:", posts_data)
            if not continuous:
                break
            time.sleep(interval_seconds)
            continue

        total_checked = 0
        total_replied = 0

        for post in posts_data["data"]:
            media_id = post["id"]
            caption = post.get("caption", "No Caption")[:30].replace("\n", " ")
            comments_count = post.get("comments_count", 0)
            
            if comments_count == 0:
                continue

            comments_data = get_post_comments(media_id)
            if "data" not in comments_data or not comments_data["data"]:
                continue
                
            for comment in comments_data["data"]:
                total_checked += 1
                comment_id = comment["id"]
                username = comment.get("username", "user")
                text = comment.get("text", "")
                
                # Skip if already replied
                if comment_id in replied_ids:
                    continue

                print(f"\n  [COMMENT] @{username}: '{text}' (Post: {caption}...)")
                
                # Check keywords
                for keyword, reply_msg in trigger_rules.items():
                    if keyword.lower() in text.lower():
                        print(f"  [MATCH] Kata kunci '{keyword}' cocok! Membalas...")
                        res = reply_to_comment(comment_id, reply_msg)
                        if "id" in res:
                            print(f"  [OK] Berhasil membalas komentar @{username}! Reply ID: {res['id']}")
                            replied_ids.add(comment_id)
                            save_replied_comments(replied_ids)
                            total_replied += 1
                        else:
                            print(f"  [FAIL] Gagal membalas:", res)

        if not continuous:
            print(f"\n[SUMMARY] Selesai memeriksa komentar. Total dibalas baru: {total_replied}")
            break
            
        # If continuous mode, sleep and repeat
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] Memantau komentar baru... (Pemeriksaan berikutnya dalam {interval_seconds} detik. Tekan Ctrl+C untuk berhenti)")
        time.sleep(interval_seconds)


def main_menu():
    while True:
        print("\n=======================================")
        print("   INSTAGRAM AUTOMATION BOT (@sarangestate)")
        print("=======================================")
        print("Pilih menu yang ingin kamu jalankan:")
        print("[1] Cek Info Akun & Daftar Postingan Terbaru")
        print("[2] Jalankan Bot Pembalas Komen (1x Periksa)")
        print("[3] Jalankan Bot Pembalas Komen (24/7 Monitoring Real-time)")
        print("[4] Upload Foto Baru ke Feed (File Lokal / URL)")
        print("[5] Auto-Refresh Long-Lived Token (Perpanjang 60 Hari)")
        print("[6] Keluar")
        
        choice = input("\nMasukkan pilihan angka (1/2/3/4/5/6): ").strip()
        
        rules = {
            "harga": "Halo kak! Info harga & pricelist lengkap bisa DM kami ya 😊",
            "lokasi": "Lokasinya sangat strategis di Ciracas kak, yuk survey minggu ini!",
            "spesifikasi": "Rumah mewah 2 lantai, LT 65m2 LB 65m2 siap huni kak!"
        }

        if choice == "1":
            info = get_account_info()
            print("\n[INFO] Data Akun:", json.dumps(info, indent=2))
            posts = get_recent_posts(limit=10)
            print(f"\n[INFO] Menemukan {len(posts.get('data', []))} postingan terbaru:")
            for p in posts.get("data", []):
                print(f"  - Post ID: {p['id']} | Komen: {p.get('comments_count', 0)} | Caption: {p.get('caption', '')[:30]}...")
                
        elif choice == "2":
            print("\n--- PEMBALAS KOMEN (1x Periksa) ---")
            auto_reply_bot(rules, continuous=False)
            
        elif choice == "3":
            print("\n--- PEMBALAS KOMEN (24/7 Monitoring Real-Time) ---")
            print("Bot akan terus berjalan mengecek komentar baru setiap 30 detik.")
            try:
                auto_reply_bot(rules, continuous=True, interval_seconds=30)
            except KeyboardInterrupt:
                print("\n[BOT] Pemantauan dihentikan oleh pengguna.")
            
        elif choice == "4":
            print("\n--- UPLOAD POSTINGAN FOTO PROPERTI BARU ---")
            print("Tips: Kamu bisa memasukkan URL foto (https://...) atau Lokasi File di Komputer kamu (misal: C:\\Users\\Baihaqi\\Desktop\\Rumah Ciracas.jpg)")
            
            image_input = input("\nMasukkan Lokasi File Foto / URL: ").strip()
            if not image_input:
                image_input = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
                
            caption = input("Masukkan Caption Postingan: ").strip()
            if not caption:
                caption = "Dijual Rumah Mewah Minimalis di Ciracas!\n\nHarga: Rp 800JT-an\nLT: 65 m2 | LB: 65 m2\n\nSiap huni & lokasi strategis! Hubungi @sarangestate untuk info survey lokasi."
                
            print("\nMemproses postingan foto ke Instagram...")
            res = create_and_publish_image_post(image_input, caption)
            if res and "id" in res:
                print("\n🎉 BERHASIL POSTING KE INSTAGRAM! ID Post:", res["id"])
            else:
                print("\n❌ Gagal posting:", json.dumps(res, indent=2))
                
        elif choice == "5":
            refresh_long_lived_token()
            
        elif choice == "6":
            print("\nTerima kasih! Keluar dari bot...")
            break
        else:
            print("\nPilihan tidak valid. Silakan pilih 1-6.")


if __name__ == "__main__":
    main_menu()
