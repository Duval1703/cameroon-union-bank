# 📱 Testing SMS Collection on Your Phone

## 🎯 Complete Setup Guide for Real Device Testing

---

## 📋 Prerequisites

✅ You've already installed: `npm install react-native-get-sms-android`  
✅ Android phone with MTN/Orange Money SMS messages  
✅ Phone and computer on the same WiFi network  
✅ USB cable for connecting phone to computer  

---

## 🔧 Step-by-Step Setup

### **Step 1: Get Your Computer's IP Address**

**On Windows:**
```cmd
ipconfig

# Look for "IPv4 Address" under your WiFi adapter
# Example: 192.168.1.100
```

**On Linux/Mac:**
```bash
ifconfig

# or
ip addr show

# Look for your WiFi interface (usually wlan0 or en0)
# Example: 192.168.1.100
```

**On Mac (easier):**
```bash
ipconfig getifaddr en0
```

---

### **Step 2: Update API URL in Mobile App**

Open `cub_mobile_app/services/sms_reader.ts` and replace the IP address:

**Find this line (appears twice):**
```typescript
const API_URL = __DEV__ 
  ? 'http://192.168.1.100:8004'  // REPLACE WITH YOUR COMPUTER'S IP
  : 'http://localhost:8004';
```

**Replace `192.168.1.100` with YOUR actual IP address!**

Example if your IP is `192.168.0.50`:
```typescript
const API_URL = __DEV__ 
  ? 'http://192.168.0.50:8004'  // YOUR COMPUTER'S IP
  : 'http://localhost:8004';
```

---

### **Step 3: Start the SMS Collection Backend**

Open a terminal and run:

```bash
cd data_collection_agent

# Linux/Mac
./start_sms_agent.sh

# Windows
start_sms_agent.bat

# Or manually
python3 sms_collection_agent.py
```

**You should see:**
```
======================================================================
  🏦 CUB SMS Data Collection Agent
======================================================================

  📱 Mechanism 2: SMS-Based Data Collection
     Fallback when direct API access is unavailable

  🌐 Dashboard: http://localhost:8004
  🔌 API Docs: http://localhost:8004/docs

======================================================================

INFO:     Uvicorn running on http://0.0.0.0:8004 (Press CTRL+C to quit)
```

✅ **Leave this terminal running!**

---

### **Step 4: Test Backend is Accessible from Phone**

On your phone's browser, visit:
```
http://YOUR_IP:8004
```

Example:
```
http://192.168.1.100:8004
```

**You should see:** The SMS Collection Dashboard webpage

❌ **If you can't access it:**
- Check your firewall settings
- Make sure phone and computer are on same WiFi
- Verify the IP address is correct

---

### **Step 5: Build and Install the Mobile App**

**Option A: Development Build (Recommended for Testing)**

```bash
cd cub_mobile_app

# Install dependencies
npm install

# Start Expo
npx expo start
```

**Then on your phone:**
1. Install "Expo Go" app from Play Store
2. Scan the QR code from terminal
3. App will load on your phone

**Option B: Production APK Build**

```bash
cd cub_mobile_app

# Build for Android
npx expo build:android

# Or use EAS Build
eas build --platform android
```

---

### **Step 6: Create a Test Request**

**On your computer**, open the dashboard:
```
http://localhost:8004
```

1. Enter your phone number (e.g., `+237670123456`)
2. Click "📱 Send SMS Collection Request"
3. You should see: "✅ Request Created!"

---

### **Step 7: Test on Phone**

**On your phone app:**

1. Navigate to the SMS Consent screen
2. The screen should load the pending request
3. Tap "✓ Approve & Collect Data"
4. Grant SMS permission when prompted
5. Wait for collection to complete

**Expected flow:**
```
1. SMS permission dialog appears
   → Tap "Allow"

2. Collection starts
   → Progress: "Collecting SMS... 65%"

3. Messages found
   → "Found 45 messages from MTN: 28, Orange: 17"

4. Upload completes
   → "✅ Collection Complete!"

5. Summary displayed
   → Total Received, Total Sent, Balance
```

---

### **Step 8: Verify Results**

**On your computer dashboard** (http://localhost:8004):

You should see:
- ✅ Request status changed to "Completed"
- ✅ Parsed transactions displayed
- ✅ Summary statistics (Total Received, Sent, Balance)
- ✅ Recent transactions list

---

## 🧪 Testing Checklist

Use this checklist to verify everything works:

### Backend Setup
- [ ] Backend server running on port 8004
- [ ] Dashboard accessible on computer
- [ ] Dashboard accessible from phone browser
- [ ] Request created successfully

### Mobile App
- [ ] App installed on phone
- [ ] Can navigate to SMS consent screen
- [ ] Pending request loads correctly
- [ ] Privacy information displays

### SMS Permission
- [ ] Permission dialog appears
- [ ] "Allow" button works
- [ ] App has READ_SMS permission

### SMS Collection
- [ ] App reads SMS messages
- [ ] Filters MTN/Orange messages
- [ ] Shows count of messages found
- [ ] Progress indicator works

### Data Upload
- [ ] Messages uploaded to backend
- [ ] Backend parses messages successfully
- [ ] Summary statistics calculated
- [ ] Dashboard updates with data

### Results
- [ ] Transaction list displays on phone
- [ ] Transaction list displays on dashboard
- [ ] Summary statistics correct
- [ ] All transaction types parsed

---

## 🐛 Troubleshooting

### **Problem: Can't access dashboard from phone**

**Solutions:**
1. Check firewall on computer:
   ```bash
   # Windows
   # Allow port 8004 in Windows Firewall
   
   # Linux
   sudo ufw allow 8004
   
   # Mac
   # System Preferences → Security & Privacy → Firewall → Options
   # Allow port 8004
   ```

2. Verify both devices on same WiFi
3. Try pinging from phone to computer
4. Use computer's actual IP, not 127.0.0.1 or localhost

---

### **Problem: SMS permission denied**

**Solutions:**
1. Go to Android Settings → Apps → CUB → Permissions
2. Enable "SMS" permission manually
3. Restart the app
4. Try approval flow again

---

### **Problem: No SMS messages found**

**Solutions:**
1. Check if you have MTN/Orange Money messages on phone
2. Messages should be in inbox (not archived)
3. Check sender names: "MTN MOMO", "MTN", "Orange Money", "Orange"
4. Verify messages contain transaction information

---

### **Problem: Upload fails**

**Solutions:**
1. Check backend server is still running
2. Verify IP address is correct in `sms_reader.ts`
3. Check phone has internet connection
4. Look at backend terminal for error messages
5. Check backend logs: phone should appear in request list

---

### **Problem: Parsing fails**

**Solutions:**
1. Check SMS message format in console logs
2. SMS might be in different format than expected
3. Check `test_sms_parser.py` for supported formats
4. May need to add new regex pattern to `sms_parser.py`

---

## 📊 Expected Results

### **Sample Transaction Output:**

```json
{
  "type": "RECEIVED",
  "amount": 15000.0,
  "balance_after": 45000.0,
  "counterparty_name": "JEAN PAUL",
  "counterparty_phone": "+237654123456",
  "reference": "MT240424.1234.A5678",
  "provider": "MTN",
  "timestamp": "2026-04-24T14:32:00"
}
```

### **Sample Summary:**

```json
{
  "total_transactions": 42,
  "total_received": 850000,
  "total_sent": 420000,
  "net_balance": 430000,
  "current_balance": 65000,
  "providers": ["MTN", "ORANGE"]
}
```

---

## 🎯 Quick Test Script

Use this to quickly verify everything:

```bash
# 1. Get your IP
ipconfig  # Windows
ifconfig  # Linux/Mac

# 2. Update sms_reader.ts with your IP

# 3. Start backend
cd data_collection_agent
python3 sms_collection_agent.py

# 4. In new terminal, start app
cd cub_mobile_app
npx expo start

# 5. Open phone app (Expo Go)

# 6. Create request from computer dashboard
# http://localhost:8004

# 7. Test on phone
# Navigate to SMS consent screen
# Approve → Grant permission → Wait

# 8. Check results on dashboard
# http://localhost:8004
```

---

## 📱 Test Data

If you don't have real MTN/Orange SMS yet, the app will use mock data in development mode. This allows you to test the full flow:

**Mock data includes:**
- 8 MTN MOMO transactions
- 2 Orange Money transactions
- Various transaction types (received, sent, withdrawal, airtime)

---

## ✅ Success Criteria

You've successfully tested Mechanism 2 when:

1. ✅ Backend accessible from phone
2. ✅ Request created on dashboard
3. ✅ Pending request loads on phone
4. ✅ SMS permission granted
5. ✅ SMS messages read from device
6. ✅ MTN/Orange messages filtered
7. ✅ Data uploaded to backend
8. ✅ Messages parsed correctly
9. ✅ Summary statistics calculated
10. ✅ Results displayed on dashboard

---

## 🎉 Next Steps After Successful Testing

Once everything works:

1. **Integrate with Credit Scoring:**
   - Feed collected SMS data to ML model
   - Generate credit scores
   - Display scores in app

2. **Production Deployment:**
   - Build production APK
   - Set up HTTPS for backend
   - Configure production API URLs
   - Deploy to app store

3. **Data Management:**
   - Add database persistence
   - Implement data export
   - Add analytics dashboard

---

## 📞 Need Help?

If you encounter issues:

1. Check backend terminal for errors
2. Check phone app console logs (in Expo)
3. Verify all checklist items above
4. Review troubleshooting section
5. Check SMS message format matches expected patterns

---

**Good luck with testing! 🚀**

Your SMS-based data collection is ready to go live!
