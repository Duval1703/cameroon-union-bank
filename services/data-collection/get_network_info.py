#!/usr/bin/env python3
"""
Network Information Tool - Find the correct IP address for mobile access
"""

import socket
import subprocess
import platform

def get_all_ip_addresses():
    """Get all IP addresses on this machine"""
    ip_addresses = []
    
    try:
        # Get hostname
        hostname = socket.gethostname()
        
        # Method 1: Using socket
        try:
            ip = socket.gethostbyname(hostname)
            if ip and ip != '127.0.0.1':
                ip_addresses.append(ip)
        except:
            pass
        
        # Method 2: Using getaddrinfo
        try:
            addrs = socket.getaddrinfo(hostname, None)
            for addr in addrs:
                ip = addr[4][0]
                if ip and ip != '127.0.0.1' and ':' not in ip:  # IPv4 only
                    if ip not in ip_addresses:
                        ip_addresses.append(ip)
        except:
            pass
        
        # Method 3: Platform specific
        system = platform.system()
        
        if system == "Linux" or system == "Darwin":
            try:
                result = subprocess.run(['hostname', '-I'], capture_output=True, text=True)
                ips = result.stdout.strip().split()
                for ip in ips:
                    if ip and ip != '127.0.0.1' and ip not in ip_addresses:
                        ip_addresses.append(ip)
            except:
                pass
            
            # Also try ip addr
            try:
                result = subprocess.run(['ip', 'addr', 'show'], capture_output=True, text=True)
                import re
                matches = re.findall(r'inet (\d+\.\d+\.\d+\.\d+)', result.stdout)
                for ip in matches:
                    if ip and ip != '127.0.0.1' and ip not in ip_addresses:
                        ip_addresses.append(ip)
            except:
                pass
        
        elif system == "Windows":
            try:
                result = subprocess.run(['ipconfig'], capture_output=True, text=True)
                import re
                matches = re.findall(r'IPv4 Address[.\s]*: (\d+\.\d+\.\d+\.\d+)', result.stdout)
                for ip in matches:
                    if ip and ip != '127.0.0.1' and ip not in ip_addresses:
                        ip_addresses.append(ip)
            except:
                pass
    
    except Exception as e:
        print(f"Error getting IP addresses: {e}")
    
    return ip_addresses


def print_network_info():
    """Print network information and mobile access URLs"""
    
    print("╔═══════════════════════════════════════════════════════════════════╗")
    print("║                                                                   ║")
    print("║          📱 MOBILE ACCESS - NETWORK INFORMATION                   ║")
    print("║                                                                   ║")
    print("╚═══════════════════════════════════════════════════════════════════╝")
    print()
    
    # Get all IP addresses
    ip_addresses = get_all_ip_addresses()
    
    if not ip_addresses:
        print("❌ No network interfaces found!")
        print("   Please check your network connection.")
        return
    
    print(f"🖥️  Computer Hostname: {socket.gethostname()}")
    print(f"📡 Found {len(ip_addresses)} network interface(s):")
    print()
    
    for i, ip in enumerate(ip_addresses, 1):
        subnet = '.'.join(ip.split('.')[:3])
        print(f"   {i}. IP Address: {ip}")
        print(f"      Subnet:     {subnet}.x")
        print(f"      Type:       {'WiFi/Ethernet' if ip.startswith('192.168') else 'Other'}")
        print()
    
    print("═══════════════════════════════════════════════════════════════════")
    print("📱 MOBILE ACCESS URLS FOR EACH NETWORK:")
    print("═══════════════════════════════════════════════════════════════════")
    print()
    
    for i, ip in enumerate(ip_addresses, 1):
        print(f"Network {i} ({ip}):")
        print(f"   CUB Dashboard:    http://{ip}:8001")
        print(f"   Consent UI:       http://{ip}:8000/consent/pending")
        print()
    
    print("═══════════════════════════════════════════════════════════════════")
    print("🔍 WHICH IP SHOULD YOU USE ON YOUR PHONE?")
    print("═══════════════════════════════════════════════════════════════════")
    print()
    print("1. On your phone, go to WiFi settings")
    print("2. Check your phone's IP address (e.g., 192.168.100.186)")
    print("3. Find the computer IP with the SAME first 3 numbers")
    print()
    print("Example:")
    print("   Phone IP:     192.168.100.186")
    print("   Computer IP:  192.168.100.XXX  ← Use this one!")
    print()
    
    # Check if phone subnet matches any computer IP
    phone_subnet_example = "192.168.100"
    matching_ips = [ip for ip in ip_addresses if ip.startswith(phone_subnet_example)]
    
    if matching_ips:
        print(f"✅ GOOD NEWS! Found matching IP for subnet {phone_subnet_example}.x:")
        for ip in matching_ips:
            print(f"   👉 Use: http://{ip}:8000/consent/pending")
        print()
    else:
        print(f"⚠️  Your phone subnet ({phone_subnet_example}.x) doesn't match any computer IP.")
        print(f"   Please check:")
        print(f"   1. Both devices are on the SAME WiFi network")
        print(f"   2. Your phone's actual IP address in WiFi settings")
        print()
    
    print("═══════════════════════════════════════════════════════════════════")
    print("🧪 TESTING NETWORK CONNECTIVITY")
    print("═══════════════════════════════════════════════════════════════════")
    print()
    print("To test from your phone:")
    print("1. Make sure both servers are running")
    print("2. Try each URL above in your phone's browser")
    print("3. If none work, check firewall settings")
    print()
    print("To test from this computer:")
    for ip in ip_addresses:
        print(f"   curl http://{ip}:8000/health")
    print()
    
    print("═══════════════════════════════════════════════════════════════════")
    print("🔥 FIREWALL CHECK")
    print("═══════════════════════════════════════════════════════════════════")
    print()
    print("If URLs don't work, you may need to allow ports 8000 and 8001:")
    print()
    
    system = platform.system()
    if system == "Linux":
        print("Linux (ufw):")
        print("   sudo ufw allow 8000")
        print("   sudo ufw allow 8001")
        print()
        print("Linux (firewalld):")
        print("   sudo firewall-cmd --add-port=8000/tcp --permanent")
        print("   sudo firewall-cmd --add-port=8001/tcp --permanent")
        print("   sudo firewall-cmd --reload")
    elif system == "Darwin":
        print("macOS:")
        print("   System Preferences → Security & Privacy → Firewall")
        print("   → Firewall Options → Add Python")
    elif system == "Windows":
        print("Windows:")
        print("   Control Panel → Windows Defender Firewall")
        print("   → Advanced Settings → Inbound Rules")
        print("   → New Rule → Port → TCP 8000, 8001")
    print()


if __name__ == "__main__":
    print_network_info()
    
    print("═══════════════════════════════════════════════════════════════════")
    print("💡 TIP: Run this script anytime to check your network info!")
    print("═══════════════════════════════════════════════════════════════════")
