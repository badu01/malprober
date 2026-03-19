# config.py
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.absolute()

class Config:
    # Server settings
    HOST = '127.0.0.1'
    PORT = 5000
    DEBUG = True
    
    # File storage
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    LOGS_FOLDER = os.path.join(BASE_DIR, 'logs')
    MAX_CONTENT_LENGTH = 1024 * 1024 * 1024  # 50MB
    
    # Create directories
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(LOGS_FOLDER, exist_ok=True)
    
    # VirtualBox Configuration - USE THE EXACT PATH FROM YOUR TEST
    VM_NAME = "WinSandbox"
    VM_SNAPSHOT = "CLEAN_STATE_v8.2"
    VM_USERNAME = "malprober"
    VM_PASSWORD = "mal123"
    VM_SAMPLES_PATH = "C:\\samples"
    VM_START_TIMEOUT = 120
    VM_BOOT_WAIT = 60
    ANALYSIS_TIME = 60 * 1  # 5 minutes
    
    # CRITICAL FIX: Use the exact path from your test
    VBOX_MANAGE_PATH = r"C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"
    
    # Allowed file extensions
    ALLOWED_EXTENSIONS = {
        'exe', 'dll', 'msi', 'bat', 'cmd', 'ps1', 'vbs', 'js',
        'pdf', 'doc', 'docx', 'xls', 'xlsx',
        'zip', 'rar', '7z', 'tar', 'gz', 'py', 'sh'
    }