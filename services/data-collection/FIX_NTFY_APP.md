# 📱 Ntfy App Troubleshooting

## Issue: Notifications being sent but not received on phone

### ✅ What We Know:
- Notifications ARE being sent to ntfy.sh successfully
- Server confirms: "✅ Ntfy notification sent"
- ntfy.sh is receiving the messages (we see the response)

### ❌ Problem: Your phone isn't receiving them

---

## 🔧 FIXES TO TRY:

### Fix 1: Check Ntfy App is Running
1. Open the ntfy app on your phone
2. Make sure it's not showing "Disconnected"
3. Pull down to refresh

### Fix 2: Check You're Subscribed to the Correct Topic
1. In ntfy app, check subscribed topics
2. You should see: **cub-consent-allan**
3. If not, tap "+" and subscribe to: **cub-consent-allan**

### Fix 3: Check Notification Permissions
1. Phone Settings → Apps → ntfy
2. Notifications → **ALLOW ALL**
3. Make sure:
   - ✅ Show notifications
   - ✅ Sound
   - ✅ Pop on screen
   - ✅ Badge

### Fix 4: Check Battery Optimization
1. Phone Settings → Apps → ntfy
2. Battery → Battery optimization
3. Select "Not optimized" or "Don't optimize"
4. This prevents Android from killing ntfy in background

### Fix 5: Force Stop and Restart ntfy App
1. Phone Settings → Apps → ntfy
2. Force Stop
3. Clear Cache (optional)
4. Open ntfy app again
5. Check subscriptions are still there

### Fix 6: Unsubscribe and Re-subscribe
1. In ntfy app, tap on "cub-consent-allan"
2. Tap menu (3 dots) → Unsubscribe
3. Tap "+" → Enter "cub-consent-allan" → Subscribe
4. Test again

### Fix 7: Check Phone Internet Connection
1. Make sure phone has internet (WiFi or mobile data)
2. Try opening a website to verify
3. Ntfy needs internet to receive notifications

---

## 🧪 QUICK TEST:

After trying the fixes above, test with:

```bash
curl -d "Test after fixes $(date +%H:%M:%S)" ntfy.sh/cub-consent-allan
```

You should receive this on your phone!

---

## 🔄 ALTERNATIVE: Use Instant Polling

If notifications still don't work, ntfy app has a polling option:

1. In ntfy app → Settings
2. Connection protocol → Change to "WebSocket" or "HTTP Polling"
3. Try different options to see which works

---

## ✅ When It's Working:

You'll see notifications appear on your phone instantly when sent!
