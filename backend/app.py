#backend/app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
import sys
import logging
from datetime import datetime
import uuid

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import Config
from utils.file_handler import FileHandler
from malware_analyzer.analyzer import MalwareAnalyzer

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize SocketIO
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='eventlet',
    logger=True,
    engineio_logger=True
)

# Initialize analyzer
analyzer = MalwareAnalyzer(socketio=socketio)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Malware Analysis Sandbox',
        'timestamp': datetime.now().isoformat(),
        'vm_configured': analyzer.vm_manager.check_vm_exists(),
        'snapshot_configured': analyzer.vm_manager.check_snapshot_exists()
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle file upload"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save uploaded file
        file_info = FileHandler.save_uploaded_file(file)
        
        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'fileInfo': file_info
        })
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/analyze', methods=['POST'])
def start_analysis():
    """Start analysis of uploaded file"""
    try:
        data = request.json
        if not data or 'filePath' not in data:
            return jsonify({'error': 'No file specified'}), 400
        
        file_path = data['filePath']
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        # Get file info
        file_info = FileHandler.get_file_info(file_path)
        if not file_info:
            return jsonify({'error': 'Could not read file'}), 400
        
        # Start analysis in background
        analysis_id = analyzer.analyze_in_background(file_info)
        
        return jsonify({
            'success': True,
            'message': 'Analysis started',
            'analysisId': analysis_id,
            'fileInfo': {
                'original_name': file_info['original_name'],  # NOT 'name'
                'file_path': file_info['file_path'],          # NOT 'path'
                'file_size': file_info['file_size'],          # NOT 'size'
                'file_hash': file_info['file_hash'],          # NOT 'hash'
                'file_extension': file_info['file_extension']
            }
        })
    
    except Exception as e:
        logger.error(f"Analysis start error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/status/<analysis_id>', methods=['GET'])
def get_status(analysis_id):
    """Get analysis status"""
    status = analyzer.get_analysis_status(analysis_id)
    return jsonify(status)

@app.route('/api/results/<analysis_id>', methods=['GET'])
def get_results(analysis_id):
    """Get analysis results"""
    results = analyzer.get_analysis_result(analysis_id)
    return jsonify(results)

@app.route('/api/vm/status', methods=['GET'])
def get_vm_status():
    """Get VM status"""
    try:
        return jsonify({
            'vmName': Config.VM_NAME,
            'state': analyzer.vm_manager.get_vm_state(),
            'running': analyzer.vm_manager.is_vm_running(),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info(f"Client connected: {request.sid}")
    emit('connected', {
        'message': 'Connected to analysis server',
        'timestamp': datetime.now().isoformat()
    })

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {request.sid}")

@socketio.on('subscribe')
def handle_subscribe(data):
    """Subscribe to analysis updates"""
    analysis_id = data.get('analysisId')
    if analysis_id:
        room = f'analysis_{analysis_id}'
        join_room(room)
        emit('subscribed', {'analysisId': analysis_id, 'room': room})

if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("Malware Analysis Sandbox Backend")
    logger.info(f"Host: {Config.HOST}")
    logger.info(f"Port: {Config.PORT}")
    logger.info(f"Upload folder: {Config.UPLOAD_FOLDER}")
    logger.info(f"Logs folder: {Config.LOGS_FOLDER}")
    logger.info(f"VM: {Config.VM_NAME}")
    logger.info("=" * 60)
    
    socketio.run(app, host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)