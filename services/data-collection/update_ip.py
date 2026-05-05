import re

# Update mtn_orange_server.py
with open('mtn_orange_server.py', 'r') as f:
    content = f.read()

# Replace the callback_base_url
content = re.sub(
    r'callback_base_url="http://192\.168\.\d+\.\d+:8000"',
    'callback_base_url="http://192.168.137.1:8000"',
    content
)

with open('mtn_orange_server.py', 'w') as f:
    f.write(content)

print("✓ Updated mtn_orange_server.py to use 192.168.137.1")

# Also update the default in ntfy_notifier.py
with open('ntfy_notifier.py', 'r') as f:
    content = f.read()

content = re.sub(
    r'callback_base_url="http://192\.168\.\d+\.\d+:8000"',
    'callback_base_url="http://192.168.137.1:8000"',
    content
)

with open('ntfy_notifier.py', 'w') as f:
    f.write(content)

print("✓ Updated ntfy_notifier.py to use 192.168.137.1")
print()
print("New callback URL: http://192.168.137.1:8000")
