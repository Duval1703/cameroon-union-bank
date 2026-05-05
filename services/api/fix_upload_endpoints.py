"""Move upload endpoints before main block"""
import re

with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the main block
main_match = re.search(r'# =+\n# MAIN\n# =+\n\nif __name__ == "__main__":', content)
if not main_match:
    print("ERROR: Could not find main block")
    exit(1)

main_start = main_match.start()

# Find file upload endpoints section  
upload_match = re.search(r'# =+\n# FILE UPLOAD ENDPOINTS\n# =+', content)
if not upload_match:
    print("ERROR: Could not find upload endpoints")
    exit(1)

upload_start = upload_match.start()

print(f"Main block at: {main_start}")
print(f"Upload endpoints at: {upload_start}")

if upload_start > main_start:
    print("Upload endpoints are AFTER main - moving them...")
    
    # Find end of upload section (before validator or end of file)
    validator_match = re.search(r'# =+\n# VALIDATOR ENDPOINTS\n# =+', content[upload_start:])
    if validator_match:
        upload_end = upload_start + validator_match.start()
    else:
        upload_end = len(content)
    
    # Extract sections
    before_main = content[:main_start]
    upload_section = content[upload_start:upload_end]
    
    # Find where validator section starts (should be before main)
    validator_in_before = re.search(r'# =+\n# VALIDATOR ENDPOINTS\n# =+', before_main)
    if validator_in_before:
        # Insert upload section before validator
        insert_pos = validator_in_before.start()
        new_before_main = before_main[:insert_pos] + upload_section + '\n\n' + before_main[insert_pos:]
    else:
        # Insert upload section at end of before_main
        new_before_main = before_main.rstrip() + '\n\n' + upload_section
    
    # Everything after uploads
    after_upload = content[upload_end:]
    
    # Reconstruct
    new_content = new_before_main.rstrip() + '\n\n' + after_upload.lstrip()
    
    with open('main.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("✅ Upload endpoints moved before main block!")
else:
    print("✅ Upload endpoints already before main block")
