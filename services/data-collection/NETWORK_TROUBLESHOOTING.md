# 📱 Network Troubleshooting Guide

## ❌ Problem Detected

Your phone IP: `192.168.100.186`  
Your computer IP: `192.168.206.23`

**These are on DIFFERENT subnets!** They cannot communicate directly.

---

## ✅ Solutions (Try in Order)

### **Solution 1: Connect to Same WiFi Network**

**The Problem:** You might be connected to different WiFi networks.

**How to Fix:**
1. On your phone, go to **WiFi Settings**
2. Check which network you're connected to
3. On your computer, check which WiFi network it's connected to
4. **Make sure BOTH are on the EXACT SAME WiFi network name**
5. After connecting to the same network, run: `python3 get_network_info.py`

---

### **Solution 2: Use Mobile Hotspot (Easiest)**

**Make your phone the WiFi hotspot:**

1. On your phone:
   - Go to Settings → Mobile Hotspot
   - Turn ON hotspot
   - Note the network name and password

2. On your computer:
   - Connect to your phone's hotspot WiFi
   - Wait for connection

3. Find new IP:
   ```bash
   cd data_collection_agent
   python3 get_network_info.py
   ```

4. Your computer will now have an IP like `192.168.x.x` that matches your phone
5. Use that IP to access from your phone

---

### **Solution 3: Use Computer as Hotspot**

**Make your computer the WiFi hotspot:**

**On Linux:**
```bash
# Create hotspot
nmcli dev wifi hotspot ssid CUB_Test password cubtest123

# Check IP
python3 get_network_info.py
```

**On Windows:**
1. Settings → Network & Internet → Mobile hotspot
2. Turn ON
3. Connect your phone to this hotspot
4. Run: `python3 get_network_info.py`

---

### **Solution 4: Disable Network Isolation (Advanced)**

Some routers have "AP Isolation" or "Client Isolation" enabled, which prevents devices from talking to each other.

1. Access your router settings (usually http://192.168.1.1 or http://192.168.0.1)
2. Login with admin credentials
3. Look for:
   - **AP Isolation** → Turn OFF
   - **Client Isolation** → Turn OFF
   - **Guest Network Isolation** → Turn OFF
4. Save and restart router
5. Reconnect both devices

---

### **Solution 5: Test on Same Computer (Temporary)**

For testing purposes only, you can access the consent page on the same computer:

```
http://localhost:8000/consent/pending
```

This proves the system works, but you need to fix the network to test from your phone.

---

## 🧪 How to Test After Fixing

1. Make sure both servers are running
2. Run the network info script:
   ```bash
   python3 get_network_info.py
   ```
3. Verify phone and computer have matching subnets (first 3 numbers match)
4. Try accessing from phone browser

---

## 🔍 Quick Network Check

**On your phone:**
1. Go to WiFi settings
2. Tap the connected network name
3. Check IP address - should be like `192.168.X.XXX`

**On your computer:**
```bash
python3 get_network_info.py
```

**They should have the SAME first 3 numbers!**

Example of CORRECT setup:
- Phone: 192.168.100.186
- Computer: 192.168.100.45 ✅

Example of WRONG setup (your current situation):
- Phone: 192.168.100.186
- Computer: 192.168.206.23 ❌

---

## 🚀 Recommended: Use Mobile Hotspot

**This is the EASIEST and FASTEST solution:**

1. Turn on Mobile Hotspot on your phone
2. Connect your computer to your phone's hotspot
3. Run `python3 get_network_info.py`
4. Use the new IP address shown
5. Both devices will be on the same network guaranteed!

---

## 📞 Still Not Working?

Check firewall:
```bash
# Allow ports through firewall
sudo ufw allow 8000
sudo ufw allow 8001
```

Or try testing from computer browser first:
```bash
# Test if servers are accessible
curl http://192.168.206.23:8000/health
curl http://localhost:8000/health
```
