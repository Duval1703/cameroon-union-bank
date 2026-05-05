import asyncio
import json

# Load config
with open('ntfy_config.json') as f:
    ntfy_config = json.load(f)
    ntfy_enabled = ntfy_config.get('enabled', False)

print(f"Config loaded: enabled={ntfy_enabled}, topic={ntfy_config.get('topic_name')}")

async def test():
    if ntfy_enabled and ntfy_config.get('topic_name'):
        print("✓ Condition passed, importing NtfyNotifier...")
        try:
            from ntfy_notifier import NtfyNotifier
            print("✓ NtfyNotifier imported")
            
            notifier = NtfyNotifier(ntfy_config['topic_name'])
            print(f"✓ Notifier created with topic: {ntfy_config['topic_name']}")
            
            print("✓ Sending test notification...")
            result = await notifier.send_consent_request(
                request_id="test-123",
                user_phone="+237670123456",
                provider="MTN",
                callback_base_url="http://localhost:8000"
            )
            
            print(f"✓ Result: {result}")
            
            if result:
                print("🎉 SUCCESS! Notification sent!")
            else:
                print("❌ send_consent_request returned False")
                
        except Exception as e:
            print(f"❌ Exception: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("❌ Condition failed")
        print(f"   ntfy_enabled: {ntfy_enabled}")
        print(f"   topic: {ntfy_config.get('topic_name')}")

asyncio.run(test())
