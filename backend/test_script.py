# test_vbox.py
# Run this in your virtual environment to test VirtualBox access

import subprocess
import sys
import os

def test_vbox():
    print("=" * 60)
    print("Testing VirtualBox access from Python")
    print("=" * 60)
    
    # Test 1: Check Python environment
    print(f"\n1. Python executable: {sys.executable}")
    print(f"   Virtual env: {sys.prefix != sys.base_prefix}")
    
    # Test 2: Check PATH
    print(f"\n2. PATH environment variable:")
    path = os.environ.get('PATH', '')
    paths = path.split(';')
    vbox_paths = [p for p in paths if 'virtualbox' in p.lower()]
    if vbox_paths:
        for p in vbox_paths:
            print(f"   Found VirtualBox in PATH: {p}")
    else:
        print("   No VirtualBox path found in PATH")
    
    # Test 3: Try common VBoxManage locations
    print(f"\n3. Checking common VBoxManage locations:")
    common_paths = [
        r"C:\Program Files\Oracle\VirtualBox\VBoxManage.exe",
        r"C:\Program Files (x86)\Oracle\VirtualBox\VBoxManage.exe",
    ]
    
    for path in common_paths:
        if os.path.exists(path):
            print(f"   ✅ Found: {path}")
        else:
            print(f"   ❌ Not found: {path}")
    
    # Test 4: Try using 'where' command
    print(f"\n4. Using 'where' command:")
    try:
        result = subprocess.run(
            "where VBoxManage",
            shell=True,
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print(f"   ✅ Found: {result.stdout.strip()}")
        else:
            print(f"   ❌ Not found in PATH")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 5: Try running VBoxManage directly
    print(f"\n5. Testing VBoxManage directly:")
    
    # Try absolute path first
    vbox_path = r"C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"
    if os.path.exists(vbox_path):
        try:
            result = subprocess.run(
                [vbox_path, "--version"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                print(f"   ✅ VBoxManage version: {result.stdout.strip()}")
            else:
                print(f"   ❌ Error: {result.stderr}")
        except Exception as e:
            print(f"   ❌ Exception: {e}")
    else:
        print("   ❌ VBoxManage.exe not found at default location")
    
    # Test 6: List VMs
    print(f"\n6. Listing VMs:")
    vbox_path = r"C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"
    if os.path.exists(vbox_path):
        try:
            result = subprocess.run(
                [vbox_path, "list", "vms"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                print(f"   VMs found:")
                for line in result.stdout.split('\n'):
                    if line.strip():
                        print(f"     {line}")
            else:
                print(f"   ❌ Error: {result.stderr}")
        except Exception as e:
            print(f"   ❌ Exception: {e}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    test_vbox()