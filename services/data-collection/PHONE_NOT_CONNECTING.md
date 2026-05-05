# 📱 Phone Not Connecting - Fix Guide

## 🔍 Current Situation

- ✅ **Servers are working** perfectly
- ✅ **Computer IP**: 192.168.206.23
- ❌ **Phone IP**: 192.168.100.186
- ❌ **Problem**: Different subnets = Cannot communicate

---

## ✅ EASIEST FIX: Use Mobile Hotspot (2 minutes)

This is the **fastest and most reliable** solution:

### **Step 1: Enable Hotspot on Your Phone**
1. Open phone Settings
2. Go to "Mobile Hotspot" or "Tethering"
3. Turn ON Mobile Hotspot
4. Note the WiFi name and password

### **Step 2: Connect Computer to Phone's Hotspot**
1. On your computer, disconnect from current WiFi
2. Connect to your phone's hotspot WiFi
3. Wait for connection to establish

### **Step 3: Find New IP Address**
```bash
cd data_collection_agent
python3 get_network_info.py
```

You should now see a new IP like `192.168.43.x` or similar.

### **Step 4: Access from Phone**
Use the new IP shown in Step 3:
```
http://NEW_IP_ADDRESS:8000/consent/pending
```

**Done!** Both devices are now on the same network.

---

## 🔄 Alternative: Connect Both to Same WiFi

If you prefer not to use mobile hotspot:

### **Check Current Networks**

**On your phone:**
1. Settings → WiFi
2. Check which network you're connected to
3. Note the network name

**On your computer:**
```bash
# Check current WiFi network
nmcli device status
nmcli connection show --active
```

### **Make Sure Both Connect to Same WiFi**
1. Choose ONE WiFi network
2. Connect BOTH devices to that exact network
3. Wait a minute for IPs to be assigned
4. Run on computer: `python3 get_network_info.py`
5. Your computer IP should now match your phone's subnet

---

## 🧪 Test Locally First (Verify System Works)

Before fixing the network, test that the system works:

**On your computer browser**, visit:
```
http://192.168.206.23:8000/consent/pending
```

You should see the beautiful consent interface. This proves:
- ✅ MTN/Orange server is working
- ✅ Mobile UI is working
- ✅ Only the network connection needs fixing

---

## 📊 Understanding Subnets

**What's happening:**

```
Phone:    192.168.100.186  (subnet: 192.168.100.x)
Computer: 192.168.206.23   (subnet: 192.168.206.x)
          ↑         ↑
          Different subnets = Can't talk to each other
```

**What we need:**

```
Phone:    192.168.100.186  (subnet: 192.168.100.x)
Computer: 192.168.100.45   (subnet: 192.168.100.x)
          ↑         ↑
          Same subnet = Can communicate!
```

---

## 🎯 Recommended Steps (Choose One)

### **FASTEST** → Use Mobile Hotspot
- Takes 2 minutes
- 100% guaranteed to work
- No router configuration needed

### **SIMPLEST** → Connect to same WiFi
- Takes 5 minutes
- Might require checking router settings
- More permanent solution

### **TESTING** → Use localhost first
- Proves system works
- Doesn't require network fix
- Can't test from phone

---

## 🚀 After Network is Fixed

Once both devices are on the same network:

1. Run on computer:
   ```bash
   python3 get_network_info.py
   ```

2. Find the IP that matches your phone's subnet

3. On your phone, open browser and go to:
   ```
   http://MATCHING_IP:8000/consent/pending
   ```

4. You should see the consent interface!

---

## 💡 Quick Test Commands

**Check if server is running:**
```bash
curl http://localhost:8000/health
```

**Check computer's IP:**
```bash
hostname -I
```

**Test from computer browser:**
```
http://192.168.206.23:8000/consent/pending
```

---

## 🎊 Once Working

After you fix the network and can access from phone:

1. Go to http://localhost:8001 on computer
2. Request data collection
3. Approve from your phone
4. Watch the transaction data appear!

---

**Need help?** Run: `./fix_network.sh` for automated diagnostics
