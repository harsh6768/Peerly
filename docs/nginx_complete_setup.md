# EC2 to api.cirvo.in Complete Setup Guide

This guide documents the full production setup to expose your backend as `https://api.cirvo.in` using:

- EC2 (backend app)
- Nginx (reverse proxy)
- Netlify DNS (A record mapping)
- Let's Encrypt (free SSL)
- Netlify frontend env (`VITE_API_BASE_URL`)

It is written for your current project behavior:

- Backend listens on `PORT=4000`
- API routes are under `/api`
- Health endpoints are `/health` and `/health/ready`

---

## 1) Final architecture

```text
Browser (https://cirvo.in)
        -> https://api.cirvo.in/api/*
        -> Nginx on EC2 (:443)
        -> http://127.0.0.1:4000 (Nest backend)
```

Important: do not use `http://<ec2-public-ip>/api` from an HTTPS frontend, or the browser will block it as mixed content.

---

## 2) Prerequisites

- You own `cirvo.in` and can edit DNS in Netlify DNS.
- Backend is already running on EC2 at `127.0.0.1:4000`.
- Nginx is installed on EC2.
- You can SSH into EC2 with sudo access.

Optional checks on EC2:

```bash
sudo systemctl status nginx
ss -tulnp | rg 4000
curl -i http://127.0.0.1:4000/health
```

---

## 3) Add DNS record in Netlify DNS

In Netlify:

1. Open your domain DNS management for `cirvo.in`.
2. Add record:
   - Type: `A`
   - Name/Host: `api`
   - Value: `<EC2_PUBLIC_IP>`
   - TTL: default/auto
3. Save.

Expected result:

- `api.cirvo.in` resolves to your EC2 public IP.

Verify from your machine:

```bash
dig +short api.cirvo.in
```

If no value appears yet, wait a few minutes for DNS propagation and check again.

---

## 4) Open EC2 security group ports

In AWS EC2 security group inbound rules, allow:

- `80` (HTTP) from `0.0.0.0/0`
- `443` (HTTPS) from `0.0.0.0/0`
- `22` (SSH) from your IP only

Why this matters:

- Certbot uses HTTP challenge on port 80.
- Production traffic uses HTTPS on port 443.

---

## 5) Configure Nginx server block for api.cirvo.in

### Ubuntu/Debian path

Create:

```bash
sudo nano /etc/nginx/sites-available/api.cirvo.in
```

Paste:

```nginx
server {
    listen 80;
    server_name api.cirvo.in;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/api.cirvo.in /etc/nginx/sites-enabled/api.cirvo.in
sudo nginx -t
sudo systemctl reload nginx
```

If default site conflicts, remove it:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### Amazon Linux/RHEL path

Use `/etc/nginx/conf.d/api.cirvo.in.conf` with the same `server {}` block, then:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6) Issue HTTPS certificate (Let's Encrypt)

Install certbot:

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

Request cert for the API domain:

```bash
sudo certbot --nginx -d api.cirvo.in
```

Choose the redirect option when asked (HTTP -> HTTPS).

Verify renewal timer:

```bash
systemctl status certbot.timer
sudo certbot renew --dry-run
```

---

## 7) Backend production env alignment

On EC2 backend `.env` (or process manager env), set:

```env
PORT=4000
CORS_ORIGINS=https://cirvo.in,https://www.cirvo.in
TRUST_PROXY=1
```

Why:

- `CORS_ORIGINS` allows frontend requests.
- `TRUST_PROXY=1` ensures correct proxy-aware behavior behind Nginx.

Restart backend process after env updates (pm2/systemd/docker, whichever you use).

---

## 8) Update frontend API base URL in Netlify

In Netlify site environment variables:

```env
VITE_API_BASE_URL=https://api.cirvo.in/api
```

Then trigger:

- Deploys -> Trigger deploy -> Clear cache and deploy site

Note: Vite embeds `VITE_*` values at build time. Changing env without a rebuild does not update live JS bundles.

---

## 9) End-to-end validation checklist

Run these checks after deployment:

1. DNS resolves:

```bash
dig +short api.cirvo.in
```

2. HTTP redirects to HTTPS:

```bash
curl -I http://api.cirvo.in/health
```

3. HTTPS health is reachable:

```bash
curl -I https://api.cirvo.in/health
```

4. API route responds:

```bash
curl -I "https://api.cirvo.in/api/listings?status=PUBLISHED&limit=1"
```

5. Browser test on `https://cirvo.in`:

- No Mixed Content errors
- No CORS errors
- Network calls go to `https://api.cirvo.in/api/...`

---

## 10) Common failures and fixes

### A) Mixed content error

Symptom:

- `https://cirvo.in` tries to call `http://<ip>/api/...`

Fix:

- Set `VITE_API_BASE_URL` to HTTPS domain URL (`https://api.cirvo.in/api`)
- Redeploy frontend

### B) Certbot challenge failure

Possible causes:

- DNS not pointing to EC2 yet
- Port 80 blocked in security group
- Nginx `server_name` not matching `api.cirvo.in`

### C) Nginx 502

Possible causes:

- Backend not running
- Wrong upstream port

Fix:

```bash
curl -i http://127.0.0.1:4000/health
ss -tulnp | rg 4000
```

### D) CORS errors in browser

Fix:

- Ensure backend `CORS_ORIGINS` includes `https://cirvo.in` and `https://www.cirvo.in`
- Restart backend

---

## 11) Useful operational commands

```bash
sudo nginx -t
sudo nginx -T
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

If using pm2:

```bash
pm2 list
pm2 logs
```

---

## 12) Definition of done

- `api.cirvo.in` resolves to EC2 public IP.
- `https://api.cirvo.in/health` is reachable with valid TLS.
- Frontend uses `https://api.cirvo.in/api` (not `http://<ip>/api`).
- No mixed-content or CORS errors in browser.
