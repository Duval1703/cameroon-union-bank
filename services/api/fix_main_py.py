"""Fix main.py by moving endpoints before the if __name__ == '__main__': block"""
import re

with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the main block
main_match = re.search(r'# =+\n# MAIN\n# =+\n\nif __name__ == "__main__":', content)
if not main_match:
    print("ERROR: Could not find main block")
    exit(1)

main_start = main_match.start()
print(f"Main block starts at position {main_start}")

# Find validator endpoints section
validator_match = re.search(r'# =+\n# VALIDATOR ENDPOINTS\n# =+', content)
if not validator_match:
    print("ERROR: Could not find validator endpoints")
    exit(1)

validator_start = validator_match.start()
print(f"Validator section starts at position {validator_start}")

# If validator section is after main, we need to move it
if validator_start > main_start:
    print("Validator endpoints are AFTER main block - moving them...")
    
    # Extract parts
    before_main = content[:main_start]
    main_block = content[main_start:validator_start]
    validator_block = content[validator_start:]
    
    # Reconstruct: before_main + validator_block + main_block
    new_content = before_main.rstrip() + '\n\n\n' + validator_block.rstrip() + '\n\n\n' + main_block.rstrip() + '\n'
    
    # Write back
    with open('main.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("✅ File fixed! Validator endpoints moved before main block.")
else:
    print("✅ Validator endpoints are already before main block.")
