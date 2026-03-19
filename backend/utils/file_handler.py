import os
import uuid
import hashlib
import shutil
from werkzeug.utils import secure_filename
from config import Config

class FileHandler:
    @staticmethod
    def allowed_file(filename):
        """Check if file extension is allowed"""
        if '.' not in filename:
            return False
        
        extension = filename.rsplit('.', 1)[1].lower()
        return extension in Config.ALLOWED_EXTENSIONS
    
    @staticmethod
    def save_uploaded_file(file):
        """Save uploaded file with unique name"""
        if not FileHandler.allowed_file(file.filename):
            raise ValueError(f"File type not allowed. Allowed: {', '.join(Config.ALLOWED_EXTENSIONS)}")
        
        # Generate unique filename
        original_filename = secure_filename(file.filename)
        file_extension = os.path.splitext(original_filename)[1]
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        
        # Save file
        file_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
        file.save(file_path)
        
        # Calculate file hash
        file_hash = FileHandler.calculate_file_hash(file_path)
        
        # Get file info
        file_size = os.path.getsize(file_path)
        
        return {
            'success': True,
            'original_name': original_filename,
            'saved_name': unique_filename,
            'file_path': file_path,
            'file_hash': file_hash,
            'file_size': file_size,
            'file_extension': file_extension
        }
    
    @staticmethod
    def calculate_file_hash(file_path, algorithm='sha256'):
        """Calculate file hash"""
        hash_func = hashlib.new(algorithm)
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_func.update(chunk)
        return hash_func.hexdigest()
    
    @staticmethod
    def cleanup_file(file_path):
        """Remove file after analysis"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        except Exception as e:
            print(f"Error cleaning up file: {e}")
        return False
    
    @staticmethod
    def get_file_info(file_path):
        """Get file information"""
        if not os.path.exists(file_path):
            return None
        
        stat = os.stat(file_path)
        return {
        'original_name': os.path.basename(file_path),  # NOT 'name'
        'file_path': file_path,                         # NOT 'path'
        'file_size': stat.st_size,                      # NOT 'size'
        'file_hash': FileHandler.calculate_file_hash(file_path),  # NOT 'hash'
        'file_extension': os.path.splitext(file_path)[1],
        'created': stat.st_ctime,
        'modified': stat.st_mtime
    }