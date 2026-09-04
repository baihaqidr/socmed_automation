from flask import Flask, jsonify, request
import requests
import json
import sys
import os

app = Flask(__name__)

# Config
INSTAGRAM_ACCOUNT_ID = "17841466987503898"
ACCESS_TOKEN = "EAGHy3jJfJscBSYs6l3B6Bwly4yEsB3fSHfNPwF22Ftlvpsv3CZBLHqrvcrNU07FZAD1KM1WLvO4HrDAw257snRzMOVIZAMUegfj4h77P1N6HYdoWyZAmIrSxiG7YpoJ3MgljZAl7jA6pHNzTux0b7kQNSPfAdehS3EIhoPbnXqmChB90pH4mmifoWJOySkQ4s"
APP_ID = "27570108882691783"
APP_SECRET = "9426751dfaec5d047d1e568a20899d8a"
VERIFY_TOKEN = "sarangestate_webhook_secret_2026"

GRAPH_URL = "https://graph.facebook.com/v20.0"

DEFAULT_RULES = {
    "harga": "Halo kak! Info harga & pricelist lengkap bisa DM kami ya 😊",
    "lokasi": "Lokasinya sangat strategis di Ciracas kak, yuk survey minggu ini!",
    "spesifikasi": "Rumah mewah 2 lantai, LT 65m2 LB 65m2 siap huni kak!"
}


@app.route('/api/webhook', methods=['GET', 'POST'])
def webhook():
    # Meta Webhook Challenge Verification (GET)
    if request.method == 'GET':
        mode = request.args.get('hub.mode')
        token = request.args.get('hub.verify_token')
        challenge = request.args.get('hub.challenge')

        if mode == 'subscribe' and token == VERIFY_TOKEN:
            print("[WEBHOOK] Verification successful!")
            return challenge, 200
        else:
            return 'Forbidden', 403

    # Meta Real-time Event Push (POST)
    if request.method == 'POST':
        data = request.get_json() or {}
        print("[WEBHOOK EVENT RECEIVED]:", json.dumps(data, indent=2))

        try:
            entries = data.get('entry', [])
            for entry in entries:
                changes = entry.get('changes', [])
                for change in changes:
                    value = change.get('value', {})
                    comment_id = value.get('id')
                    text = value.get('text', '').lower()

                    if comment_id and text:
                        for kw, reply_msg in DEFAULT_RULES.items():
                            if kw in text:
                                # Reply to comment instantly
                                reply_url = f"{GRAPH_URL}/{comment_id}/replies"
                                requests.post(reply_url, data={
                                    "message": reply_msg,
                                    "access_token": ACCESS_TOKEN
                                })
                                print(f"[WEBHOOK AUTO-REPLIED] Comment ID {comment_id} with keyword '{kw}'")
        except Exception as e:
            print("[WEBHOOK ERROR]:", e)

        return jsonify({"status": "EVENT_RECEIVED"}), 200


@app.route('/api/health')
def health():
    return jsonify({"status": "healthy", "service": "SarangEstate Vercel Webhook API"})


# Export app for Vercel Serverless Function
handler = app
