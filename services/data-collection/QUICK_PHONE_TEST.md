# 🚀 Quick Phone Testing - 5 Minute Setup

## ⚡ Super Fast Setup Guide

---

## 1️⃣ Get Your Computer's IP (30 seconds)

**Windows (CMD or PowerShell):**
```cmd
ipconfig
```
Look for "IPv4 Address" - example: `192.168.1.100`

**Mac:**
```bash
ipconfig getifaddr en0
```

**Linux:**
```bash
hostname -I | awk '{print $1}'
```

**Write down your IP:** _________________

---

## 2️⃣ Update Mobile App Config (1 minute)

Open: `cub_mobile_app/services/sms_reader.ts`

**Find these TWO locations** (around line 288 and 331):
```typescript
const API_URL = __DEV__ 
  ? 'http://192.168.1.100:8004'  // REPLACE WITH YOUR COMPUTER'S IP
  : 'http://localhost:8004';
```

**Replace `192.168.1.100` with YOUR IP from step 1!**

---

## 3️⃣ Start Backend Server (30 seconds)

```bash
cd data_collection_agent
python3 sms_collection_agent.py
```

**Should see:**
```
🌐 Dashboard: http://localhost:8004
INFO: Uvicorn running on http://0.0.0.0:8004
```

✅ **Keep this terminal running!**

---

## 4️⃣ Test Backend from Phone (30 seconds)

On your phone's browser, visit:
```
http://YOUR_IP:8004
```

**Example:** `http://192.168.1.100:8004`

✅ **You should see the SMS Collection Dashboard!**

❌ **If not working:**
- Check both devices on same WiFi
- Verify IP address is correct
- Check firewall (Windows: allow port 8004)

---

## 5️⃣ Install Mobile App on Phone (2 minutes)

```bash
cd cub_mobile_app

# Install dependencies (if not done yet)
npm install

# Start Expo
npx expo start
```

**On your phone:**
1. Install "Expo Go" from Play Store
2. Scan QR code from terminal
3. App loads on phone ✅

---

## 6️⃣ Create Test Request (30 seconds)

**On computer:** Visit `http://localhost:8004`

1. Enter your phone number: `+237670123456`
2. Click "📱 Send SMS Collection Request"
3. See "✅ Request Created!"

---

## 7️⃣ Test SMS Collection on Phone (1 minute)

**On phone app:**

1. Navigate to: `/sms-consent` screen (or however you access it in your app)
2. Tap "✓ Approve & Collect Data"
3. Tap "Allow" when SMS permission dialog appears
4. Wait for collection (should be quick)
5. See "✅ Collection Complete!" with stats

---

## 8️⃣ Verify Results (30 seconds)

**On computer dashboard:** `http://localhost:8004`

You should see:
- ✅ Request status: "Completed"
- ✅ Parsed transactions list
- ✅ Summary: Total Received, Total Sent, Balance

---

## ✅ Done!

**Total time:** ~5 minutes

If everything worked, you have successfully tested SMS-based data collection!

---

## 🐛 Quick Fixes

### Can't access dashboard from phone
```bash
# Windows: Allow port in firewall
# Settings → Firewall → Allow an app → Add port 8004

# Linux
sudo ufw allow 8004

# Mac
# System Preferences → Security → Firewall → Options → Add 8004
```

### Permission denied
- Go to: Settings → Apps → CUB → Permissions
- Enable "SMS" manually

### No messages found
- Make sure you have MTN/Orange Money SMS on phone
- App will use mock data in development mode if needed

---

## 📞 Your IP Address

Write it here for easy reference:

**Computer IP:** `____________________`

**Test URL:** `http://____________________:8004`

---

**Happy Testing! 📱🚀**
