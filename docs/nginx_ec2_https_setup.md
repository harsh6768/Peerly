# 🚀 Nginx + EC2 + Domain + HTTPS Setup (Cirvo API)

## 📌 Overview
This document explains how we configured:
- Nginx reverse proxy
- Domain mapping (`api.cirvo.in`)
- Backend connection (Node.js on port 3000)
- Fixed 502/404 errors
- Enabled HTTPS using Let's Encrypt (Certbot)

---

## 🧠 Architecture

```
Client (Browser)
      ↓
https://api.cirvo.in
      ↓
Nginx (Port 80/443)
      ↓
127.0.0.1:3000 (Node.js Backend)
```

---

## ⚙️ Step 1: Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 🌐 Step 2: Configure Domain

Add A record in DNS:

```
Type: A
Name: api
Value: <EC2_PUBLIC_IP>
```

---

## ⚙️ Step 3: Configure Nginx

Create config:

```bash
sudo nano /etc/nginx/sites-available/api.cirvo.in
```

Add:

```nginx
server {
    listen 80;
    server_name api.cirvo.in;

    location / {
        proxy_pass http://127.0.0.1:3000;

        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable config:

```bash
sudo ln -s /etc/nginx/sites-available/api.cirvo.in /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

---

## 🧪 Step 4: Test & Reload

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔍 Debugging Issues

### ❌ 502 Bad Gateway
Cause:
- Backend not reachable

Fix:
- Ensure backend is running
- Use `127.0.0.1` instead of `localhost`

```bash
curl http://127.0.0.1:3000
```

---

### ❌ 404 Not Found
Cause:
- No `/` route in backend

Fix:
- Use correct API route (`/api`)
- OR add root route:

```js
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});
```

---

### 🔍 Useful Debug Commands

```bash
sudo nginx -T
sudo tail -f /var/log/nginx/error.log
pm2 list
ss -tulnp | grep 3000
```

---

## 🔐 Step 5: Enable HTTPS

Install Certbot:

```bash
sudo apt install certbot python3-certbot-nginx -y
```

Run:

```bash
sudo certbot --nginx -d api.cirvo.in
```

Choose:
```
Redirect HTTP to HTTPS
```

---

## 🔁 Verify SSL

```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

---

## ⚠️ Security Group (AWS)

Allow:
- Port 80 (HTTP)
- Port 443 (HTTPS)

---

## 🧠 Key Learnings

- Nginx uses `sites-enabled` configs
- `127.0.0.1` works better than `localhost`
- 502 = backend issue
- 404 = route issue
- HTTPS requires domain (not IP)

---

## 🎯 Final Result

- ✅ Domain working
- ✅ Reverse proxy working
- ✅ Backend connected
- ✅ HTTPS enabled

---

## 🚀 Next Steps

- Setup frontend domain (`cirvo.in`)
- Configure CORS
- Add authentication
- Add monitoring/logging
