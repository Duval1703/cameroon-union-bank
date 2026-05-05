# 📱 Ntfy.sh Push Notifications - Setup Guide

## 🎯 This is EXACTLY What You Wanted!

**Push notifications directly on your phone** - no browser, no links, no typing!

---

## ⏱️ Setup Time: 2 Minutes!

Yes, just 2 minutes! This is the simplest push notification system ever.

---

## 📋 Step-by-Step Setup

### **Step 1: Install Ntfy App on Your Phone (1 minute)**

**Android:**
1. Open Google Play Store
2. Search: "ntfy"
3. Install: "ntfy - Put these on your phone" by Binwiederhier
4. Open the app

**iOS:**
1. Open App Store
2. Search: "ntfy"
3. Install: "ntfy" by Binwiederhier  
4. Open the app

---

### **Step 2: Subscribe to Your Private Topic (30 seconds)**

In the ntfy app on your phone:

1. **Tap the "+" button** (bottom right corner)

2. **Enter a topic name:**
   - Example: `cub-consent-allan`
   - Or use your name: `cub-consent-yourname`
   - **Important:** Remember this name!

3. **Tap "Subscribe"**

4. **Done!** You're now listening for notifications on that topic.

---

### **Step 3: Test It Right Now! (30 seconds)**

On your computer, test that it works:

```bash
# Replace 'cub-consent-allan' with YOUR topic name
curl -d "Test from CUB server!" ntfy.sh/cub-consent-allan
```

**Check your phone!** You should see a notification pop up instantly! 🎉

If you got the notification, **IT WORKS!** Continue to Step 4.

---

### **Step 4: Configure CUB Agent (30 seconds)**

```bash
cd data_collection_agent

# Edit the config file
nano ntfy_config.json
```

Change it to:

```json
{
  "topic_name": "cub-consent-allan",
  "enabled": true
}
```

**Replace `cub-consent-allan` with YOUR topic name!**

Save the file (Ctrl+X, Y, Enter).

---

### **Step 5: Restart Servers (30 seconds)**

```bash
cd data_collection_agent

# Stop old servers
pkill -f "python.*mtn_orange"
pkill -f "python.*cub_data"

# Start with ntfy enabled
./start_servers.sh
```

You should see:
```
✅ Ntfy.sh notifications ENABLED (topic: cub-consent-allan)
```

---

### **Step 6: Test the Full Flow! (10 seconds)**

1. **Open the CUB dashboard:**
   ```
   http://localhost:8001
   ```

2. **Request data:**
   - Phone: +237670123456
   - Provider: MTN
   - Click "Request Data Collection"

3. **CHECK YOUR PHONE!** 📱

You should see:

```
┌─────────────────────────────────────┐
│ 🟡 CUB Data Consent Request         │
├─────────────────────────────────────┤
│                                     │
│ Provider: MTN Mobile Money          │
│ Phone: +237670123456                │
│ Time: 04:27:15                      │
│                                     │
│ CUB Platform wants to collect your  │
│ transaction data for the last 12    │
│ months to create your financial     │
│ identity.                           │
│                                     │
│ Tap a button below to respond:      │
│                                     │
│ ┌─────────────┐  ┌──────────────┐   │
│ │ ✅ Approve  │  │  ❌ Decline  │   │
│ └─────────────┘  └──────────────┘   │
└─────────────────────────────────────┘
```

4. **Tap "✅ Approve"**

5. **Data is collected automatically!**

6. **Check the dashboard** - 120 transactions appear!

✅ **DONE!** You now have real push notifications!

---

## 🎯 Complete Workflow

```
Computer: Request Data
    ↓
MTN/Orange Server: Creates request
    ↓
📲 NTFY SENDS PUSH NOTIFICATION TO YOUR PHONE!
    ↓
You: See notification popup
    "🟡 CUB Data Consent Request"
    ↓
You: Tap "✅ Approve" button
    ↓
Ntfy: Sends HTTP request to approve endpoint
    ↓
Server: Generates 120 transactions
    ↓
Server: Posts data to CUB dashboard
    ↓
Dashboard: Displays collected data
    ↓
✅ DONE! Total time: 5 seconds!
```

---

## ✨ Why Ntfy is Perfect

| Feature | Benefit |
|---------|---------|
| **NO ACCOUNT NEEDED** | Just install and subscribe |
| **FREE FOREVER** | 100% free, open source |
| **INSTANT** | Notifications arrive immediately |
| **SIMPLE** | 2-minute setup |
| **WORKS ANYWHERE** | WiFi, mobile data, any network |
| **ACTION BUTTONS** | Approve/Decline directly in notification |
| **PRIVACY** | No tracking, no ads |
| **RELIABLE** | Hosted on ntfy.sh infrastructure |

---

## 🔐 Privacy & Security

### **Is Your Topic Private?**

**Kind of.** Anyone who knows your topic name can:
- Send notifications to it
- Subscribe to it

**But:**
- They can't see your phone number
- They can't access your data
- They only see the topic name

### **Want More Privacy?**

Use a **unique, random topic name:**
```
cub-consent-a7f3b2c9e1d4
```

**Even better - Use Password Protection:**

In ntfy app:
1. Tap on your topic
2. Settings → "Require password"
3. Set a password

Then update `ntfy_config.json`:
```json
{
  "topic_name": "cub-consent-allan",
  "enabled": true,
  "username": "allan",
  "password": "your_password"
}
```

---

## 🧪 Testing Commands

### **Send Test Notification:**
```bash
curl -d "Hello from CUB!" ntfy.sh/cub-consent-allan
```

### **Send with Title:**
```bash
curl -H "Title: Test Notification" \
     -d "This is a test" \
     ntfy.sh/cub-consent-allan
```

### **Send with Priority:**
```bash
curl -H "Priority: high" \
     -d "Important message!" \
     ntfy.sh/cub-consent-allan
```

### **Test with Python:**
```bash
cd data_collection_agent
python3 ntfy_notifier.py
```

---

## 🐛 Troubleshooting

### **Problem: No notification received**

**Solutions:**
1. Check topic name matches in app and config
2. Make sure app is open in background
3. Check phone's internet connection
4. Try sending test: `curl -d "Test" ntfy.sh/YOUR_TOPIC`
5. Check phone's notification settings (allow ntfy notifications)

### **Problem: "Topic name not configured"**

**Solution:**
```bash
cd data_collection_agent
nano ntfy_config.json
```
Set your topic name and `"enabled": true`

### **Problem: Notification received but buttons don't work**

**Possible causes:**
1. Server is not accessible (firewall blocking)
2. Callback URL is wrong
3. Server is not running

**Solution:**
- Make sure servers are running: `./start_servers.sh`
- Check server logs for errors

### **Problem: Multiple notifications received**

**Cause:** Multiple people subscribed to same topic

**Solution:** Use a more unique topic name

---

## 📱 What the Notification Looks Like

### **On Android:**
```
┌─────────────────────────────────────┐
│ ntfy                           4:27 │
├─────────────────────────────────────┤
│ 🟡 CUB Data Consent Request         │
│                                     │
│ Provider: MTN Mobile Money          │
│ Phone: +237670123456                │
│ Time: 04:27:15                      │
│                                     │
│ CUB Platform wants to collect...    │
│                                     │
│ ✅ Approve     ❌ Decline            │
└─────────────────────────────────────┘
```

### **On iOS:**
```
┌─────────────────────────────────────┐
│ 🟡 CUB Data Consent Request         │
│ ntfy · now                          │
├─────────────────────────────────────┤
│ Provider: MTN Mobile Money          │
│ Phone: +237670123456                │
│                                     │
│ CUB Platform wants to collect your  │
│ transaction data...                 │
│                                     │
│        ✅ Approve   ❌ Decline       │
└─────────────────────────────────────┘
```

---

## 🎓 Advanced Features

### **Custom ntfy Server**

You can even host your own ntfy server for 100% privacy:
```bash
docker run -p 80:80 binwiederhier/ntfy serve
```

Then update config:
```json
{
  "topic_name": "cub-consent",
  "enabled": true,
  "server_url": "http://your-server.com"
}
```

### **Multiple Topics**

Support different users with different topics:
```json
{
  "topics": {
    "user1": "cub-consent-user1",
    "user2": "cub-consent-user2"
  },
  "enabled": true
}
```

---

## 📊 Comparison with Other Methods

| Method | Setup Time | Account Needed | Works Anywhere | Action Buttons |
|--------|------------|----------------|----------------|----------------|
| **Ntfy** | 2 min | ❌ No | ✅ Yes | ✅ Yes |
| **Telegram** | 5 min | ✅ Yes | ✅ Yes | ✅ Yes |
| **QR Code** | 0 min | ❌ No | ⚠️ Same network | ❌ No |
| **Manual Link** | 0 min | ❌ No | ⚠️ Same network | ❌ No |

**Ntfy is the winner for simplicity!** ⭐

---

## 🎉 Summary

**Before:**
```
Request → Open browser → Type URL → Find page → Click approve
(Frustrating, network issues, many steps)
```

**Now with Ntfy:**
```
Request → 📲 Phone buzzes → Tap "Approve" → Done!
(2 seconds, works everywhere, super easy!)
```

---

## 📞 Quick Reference

**Install App:** Play Store/App Store → "ntfy"  
**Subscribe:** Tap "+" → Enter topic → Subscribe  
**Test:** `curl -d "Test" ntfy.sh/YOUR_TOPIC`  
**Configure:** Edit `ntfy_config.json` → Set topic & enable  
**Restart:** `./start_servers.sh`  

---

## ✅ Checklist

- [ ] Ntfy app installed on phone
- [ ] Subscribed to a topic in the app
- [ ] Test notification received
- [ ] Topic name set in `ntfy_config.json`
- [ ] `"enabled": true` in config
- [ ] Servers restarted
- [ ] Full flow tested and working

---

**Enjoy your push notifications! 🎊**

This is EXACTLY what you wanted - notifications popping up directly on your phone!
