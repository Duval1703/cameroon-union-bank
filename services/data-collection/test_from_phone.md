# 🧪 Test Network Connectivity from Phone

## Step 1: Open Windows Firewall

**Run this command AS ADMINISTRATOR in PowerShell:**

```powershell
netsh advfirewall firewall add rule name="CUB MTN Server" dir=in action=allow protocol=TCP localport=8000
netsh advfirewall firewall add rule name="CUB Agent" dir=in action=allow protocol=TCP localport=8001
```

OR double-click: `open_firewall.bat` (right-click → Run as Administrator)

---

## Step 2: Test from Phone Browser

**On your phone, open browser and visit:**

```
http://192.168.137.1:8000/health
```

**Expected result:**
```json
{"status":"healthy","timestamp":"2026-04-08T06:01:23.456789"}
```

**If you see this ✅** = Network is working!

**If timeout/can't connect ❌** = Firewall issue or wrong IP

---

## Step 3: Test Consent Page

**On your phone browser:**

```
http://192.168.137.1:8000/consent/pending
```

**If this loads ✅** = Everything works! The ntfy approve button will work too!

---

## Step 4: Restart Servers

After opening firewall:

```bash
cd data_collection_agent
pkill -f python
python3 mtn_orange_server.py &
sleep 3
python3 cub_data_agent.py &
```

---

## Step 5: Request Data & Approve

```bash
curl -X POST http://localhost:8000/api/v1/data-request \
  -H 'Content-Type: application/json' \
  -d '{"user_phone": "+237656303153", "provider": "MTN", "callback_url": "http://192.168.137.1:8001/webhook/data-received"}'
```

Then on phone:
1. Refresh ntfy app
2. Tap "✅ Approve"
3. Should work instantly!

---

## Quick Check Commands

```bash
# Check if server is listening on all interfaces
netstat -an | grep :8000

# Check if phone can ping the PC
# (On phone, use terminal app)
ping 192.168.137.1

# Test from PC first
curl http://192.168.137.1:8000/health
```
