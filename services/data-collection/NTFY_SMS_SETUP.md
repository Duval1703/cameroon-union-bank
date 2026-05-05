# 📱 Ntfy Push Notifications for SMS Collection (Mechanism 2)

## 🎯 Setup Complete!

Your SMS data collection agent now sends push notifications via ntfy.sh!

---

## ✅ What's Configured

- **Topic Name:** `cub_consent`
- **Server:** `https://ntfy.sh`
- **Config File:** `sms_ntfy_config.json`
- **Notifier:** `sms_ntfy_notifier.py`

---

## 📱 Subscribe on Your Phone

### **Step 1: Install Ntfy App**
- Open Google Play Store
- Search for "ntfy"
- Install the official ntfy app

### **Step 2: Subscribe to Topic**
1. Open ntfy app
2. Tap the "+" button
3. Enter topic: `cub_consent`
4. Tap "Subscribe"

✅ **Done!** You'll now receive push notifications!

---

## 🔔 Notification Flow

### **When Request Created:**

You'll receive a notification like this:

```
┌─────────────────────────────────────────┐
│ 📱 CUB SMS Data Collection Request      │
├─────────────────────────────────────────┤
│                                         │
│ CUB wants to collect your MTN/Orange   │
│ Money transaction SMS messages to build│
│ your financial identity.                │
│                                         │
│ Phone: +237670123456                    │
│ Request ID: abc12345...                 │
│                                         │
│ Tap 'Approve' to open the consent      │
│ screen in your CUB app.                 │
│                                         │
│ [ ✓ Approve ]  [ View Dashboard ]      │
└─────────────────────────────────────────┘
```

**Action Buttons:**
- **✓ Approve** - Opens `http://192.168.192.1:8004` (dashboard)
- **View Dashboard** - Same link (keeps notification)

### **When Collection Complete:**

```
┌─────────────────────────────────────────┐
│ ✅ SMS Collection Complete!             │
├─────────────────────────────────────────┤
│                                         │
│ Successfully collected and parsed your │
│ transaction data.                       │
│                                         │
│ Phone: +237670123456                    │
│ Transactions: 42                        │
│ Total Received: 850,000 FCFA            │
│ Total Sent: 420,000 FCFA                │
│                                         │
│ Your financial identity is ready for   │
│ credit scoring!                         │
└─────────────────────────────────────────┘
```

---

## 🧪 Testing Notifications

### **Test 1: Send Test Notification**

```bash
cd data_collection_agent
python sms_ntfy_notifier.py
```

**Expected:**
```
🧪 Testing SMS Ntfy Notifier
Configuration:
  Topic: cub_consent
  Server: https://ntfy.sh
  Enabled: True

Sending test notification...
✅ Test notification sent!
📱 Check your ntfy app for topic: cub_consent
```

**On Your Phone:**
You should receive: "🧪 CUB SMS Collection - Test"

---

### **Test 2: Create Real Request**

1. **Make sure backend is running:**
   ```bash
   cd data_collection_agent
   python sms_collection_agent.py
   ```

2. **Open dashboard:**
   ```
   http://localhost:8004
   ```

3. **Create request:**
   - Enter your phone number
   - Click "Send SMS Collection Request"

4. **Check your phone:**
   - Ntfy app should show notification
   - Tap "✓ Approve" to open dashboard
   - Or manually open CUB app

---

## 🔧 Configuration

### **Config File: `sms_ntfy_config.json`**

```json
{
  "topic_name": "cub_consent",
  "ntfy_server": "https://ntfy.sh",
  "enabled": true
}
```

**To customize:**
- Change `topic_name` to your preferred topic
- Keep `ntfy_server` as `https://ntfy.sh` (or use self-hosted)
- Set `enabled: false` to disable notifications

---

## 🎯 How It Works

```
1. User creates request on dashboard
   ↓
2. Backend creates request in database
   ↓
3. Backend calls ntfy_notifier.send_sms_collection_request()
   ↓
4. Notifier sends POST to https://ntfy.sh/cub_consent
   ↓
5. Ntfy.sh delivers to all subscribers of "cub_consent"
   ↓
6. Your phone receives push notification
   ↓
7. User taps "Approve" button
   ↓
8. Opens dashboard or CUB app
   ↓
9. User completes consent flow
   ↓
10. Backend sends completion notification
```

---

## 📊 Notification Types

### **1. Collection Request**
- **Priority:** High
- **Tags:** ✓, 💸, 📱
- **Actions:** Approve, View Dashboard
- **Sent when:** Request created

### **2. Collection Complete**
- **Priority:** Default
- **Tags:** ✓, 📈
- **Actions:** None
- **Sent when:** SMS data uploaded and parsed

### **3. Test Notification**
- **Priority:** Default
- **Tags:** 🧪, ✓
- **Actions:** None
- **Sent when:** Running test script

---

## 🔍 Verification

### **Check if enabled:**

When you start the backend, you should see:
```
✅ Ntfy notifications enabled for topic: cub_consent
```

### **Check notification sent:**

When creating a request, response includes:
```json
{
  "success": true,
  "request_id": "abc-123-def",
  "message": "Push notification sent to your phone!",
  "notification_sent": true,
  "ntfy_topic": "cub_consent"
}
```

---

## 🐛 Troubleshooting

### **Not receiving notifications?**

1. **Check ntfy app subscription:**
   - Open ntfy app
   - Verify "cub_consent" topic is subscribed
   - Make sure notifications are enabled for ntfy app

2. **Test with standalone script:**
   ```bash
   python sms_ntfy_notifier.py
   ```
   - Should receive test notification
   - If not, check internet connection

3. **Check backend logs:**
   - Should show: "✅ Ntfy notification sent successfully"
   - If error, check ntfy_config.json

4. **Verify topic name:**
   - Must match exactly: `cub_consent`
   - Case-sensitive!

### **Notification sent but no action buttons?**

- Action buttons require ntfy app (not browser)
- Update ntfy app to latest version
- Some phones may not support actions

### **Backend says "Warning: SMS Ntfy notifier not available"**

- Make sure `sms_ntfy_notifier.py` exists
- Check `sms_ntfy_config.json` exists
- Verify `requests` library installed: `pip install requests`

---

## 📱 Difference from Mechanism 1

| Feature | Mechanism 1 | Mechanism 2 |
|---------|-------------|-------------|
| **Topic** | Custom (your choice) | `cub_consent` |
| **Action** | Opens consent URL | Opens dashboard |
| **Flow** | Browser consent | App-based consent |
| **Config** | `ntfy_config.json` | `sms_ntfy_config.json` |
| **Module** | `ntfy_notifier.py` | `sms_ntfy_notifier.py` |

Both mechanisms work independently with their own topics!

---

## ✅ Quick Start Checklist

- [✓] Topic created: `cub_consent`
- [✓] Config file created
- [✓] Notifier module created
- [✓] Backend integrated
- [ ] Ntfy app installed on phone
- [ ] Subscribed to `cub_consent` topic
- [ ] Test notification received
- [ ] Real request tested

---

## 🚀 Ready to Test!

Everything is set up. Now:

1. **Subscribe to topic in ntfy app:** `cub_consent`
2. **Run test:** `python sms_ntfy_notifier.py`
3. **Verify notification received**
4. **Create real request from dashboard**
5. **Tap notification to proceed!**

---

**Enjoy your push notifications! 📱🔔**
