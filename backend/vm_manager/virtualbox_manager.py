# vm_manager/virtualbox_manager.py
import subprocess
import time
import os
import sys
import logging
import re
from pathlib import Path
from config import Config
import base64

logger = logging.getLogger(__name__)

class VirtualBoxManager:
    def __init__(self):
        self.config = Config
        self.vm_name = self.config.VM_NAME
        
        # IMPORTANT: Use the exact path from config
        self.vboxmanage = self.config.VBOX_MANAGE_PATH
        logger.info(f"=" * 60)
        logger.info(f"VirtualBoxManager initialized")
        logger.info(f"VM Name: {self.vm_name}")
        logger.info(f"VBoxManage path: {self.vboxmanage}")
        logger.info(f"VBoxManage exists: {os.path.exists(self.vboxmanage)}")
        logger.info(f"=" * 60)
        
    def _run_command(self, command, timeout=60, check=True, shell=True):
        """Run shell command and return output with better error handling"""
        try:
            logger.debug(f"Running command: {command}")
            
            # On Windows, ensure we're using the correct shell
            if sys.platform == "win32":
                # Don't wrap with cmd.exe /c if we're already using the full path
                if not command.startswith('cmd.exe') and not command.startswith('cmd /c'):
                    # Keep the command as-is since we're using full path with quotes
                    pass
            
            result = subprocess.run(
                command,
                shell=shell,
                capture_output=True,
                text=True,
                timeout=timeout,
                env=os.environ.copy()
            )
            
            logger.debug(f"Return code: {result.returncode}")
            logger.debug(f"Stdout: {result.stdout[:200]}...")  # First 200 chars
            if result.stderr:
                logger.debug(f"Stderr: {result.stderr[:200]}...")
            
            if result.returncode != 0 and check:
                error_msg = result.stderr.strip() if result.stderr else "Unknown error"
                logger.error(f"Command failed with code {result.returncode}: {error_msg}")
                raise Exception(f"Command failed: {error_msg}")
            
            return result
        except subprocess.TimeoutExpired:
            logger.error(f"Command timed out after {timeout}s: {command}")
            raise Exception(f"Command timed out after {timeout}s")
        except Exception as e:
            logger.error(f"Error running command: {e}")
            raise
    
    def check_vm_exists(self):
        """Check if VM exists in VirtualBox"""
        try:
            # CRITICAL FIX: Use the full path with quotes
            vbox_cmd = f'"{self.vboxmanage}"'
            command = f'{vbox_cmd} list vms'
            
            logger.info(f"Checking if VM '{self.vm_name}' exists")
            logger.info(f"Command: {command}")
            
            # First, test if VBoxManage itself works
            version_cmd = f'{vbox_cmd} --version'
            logger.info(f"Testing VBoxManage with: {version_cmd}")
            
            version_result = self._run_command(version_cmd, timeout=10, check=False)
            if version_result.returncode == 0:
                logger.info(f"VBoxManage version: {version_result.stdout.strip()}")
            else:
                logger.error(f"VBoxManage not working: {version_result.stderr}")
                return False
            
            # Now list VMs
            result = self._run_command(command, timeout=30, check=False)
            
            if result.returncode != 0:
                logger.error(f"VBoxManage list vms failed with code {result.returncode}")
                logger.error(f"Stderr: {result.stderr}")
                return False
            
            # Parse VM list
            logger.info(f"Raw VBoxManage output: {result.stdout}")
            
            vms = []
            for line in result.stdout.split('\n'):
                line = line.strip()
                if line and '"' in line:
                    # Extract VM name from format: "VMName" {uuid}
                    try:
                        vm_name = line.split('"')[1]
                        vms.append(vm_name)
                        logger.info(f"Found VM: {vm_name}")
                    except:
                        pass
            
            logger.info(f"All found VMs: {vms}")
            
            if self.vm_name in vms:
                logger.info(f"✅ VM '{self.vm_name}' found successfully")
                return True
            else:
                logger.error(f"❌ VM '{self.vm_name}' NOT found in list: {vms}")
                return False
                
        except Exception as e:
            logger.error(f"Error checking VM existence: {e}", exc_info=True)
            return False
    
    def check_snapshot_exists(self, snapshot_name=None):
        """Check if snapshot exists"""
        snapshot = snapshot_name or self.config.VM_SNAPSHOT
        try:
            vbox_cmd = f'"{self.vboxmanage}"'
            command = f'{vbox_cmd} snapshot "{self.vm_name}" list'
            
            logger.info(f"Checking snapshot '{snapshot}' for VM '{self.vm_name}'")
            logger.info(f"Command: {command}")
            
            result = self._run_command(command, timeout=30, check=False)
            
            if result.returncode != 0:
                logger.error(f"Failed to list snapshots: {result.stderr}")
                return False
            
            logger.info(f"Snapshot list output: {result.stdout}")
            
            if snapshot in result.stdout:
                logger.info(f"✅ Snapshot '{snapshot}' found")
                return True
            else:
                logger.error(f"❌ Snapshot '{snapshot}' not found")
                return False
                
        except Exception as e:
            logger.error(f"Error checking snapshot: {e}")
            return False
    
    def restore_snapshot(self, snapshot_name=None):
        """Restore VM to clean state snapshot"""
        snapshot = snapshot_name or self.config.VM_SNAPSHOT
        
        # First check if VM exists
        if not self.check_vm_exists():
            raise Exception(f"VM '{self.vm_name}' not found. Please check VirtualBox configuration.")
        
        # Check if snapshot exists
        if not self.check_snapshot_exists(snapshot):
            raise Exception(f"Snapshot '{snapshot}' not found for VM '{self.vm_name}'")
        
        vbox_cmd = f'"{self.vboxmanage}"'
        command = f'{vbox_cmd} snapshot "{self.vm_name}" restore "{snapshot}"'
        
        logger.info(f"Restoring snapshot: {snapshot}")
        logger.info(f"Command: {command}")
        
        result = self._run_command(command, timeout=120)
        
        if "Restoring snapshot" in result.stdout or result.returncode == 0:
            logger.info("✅ Snapshot restored successfully")
            return True
        else:
            raise Exception(f"Failed to restore snapshot: {result.stderr}")
    
    def start_vm(self, headless=True):
        """Start the VM"""
        # Check if VM is already running
        state = self.get_vm_state()
        if state in ["running", "starting"]:
            logger.info(f"VM is already {state}")
            return True
        
        vbox_cmd = f'"{self.vboxmanage}"'
        vm_type = "--type headless" if headless else ""
        command = f'{vbox_cmd} startvm "{self.vm_name}" {vm_type}'
        
        logger.info(f"Starting VM: {self.vm_name}")
        logger.info(f"Command: {command}")
        
        result = self._run_command(command, timeout=self.config.VM_START_TIMEOUT, check=False)
        
        if result.returncode != 0:
            if "already locked" in result.stderr or "already started" in result.stderr:
                logger.info("VM is already running")
                return True
            else:
                raise Exception(f"Failed to start VM: {result.stderr}")
        
        # Wait for VM to begin booting
        time.sleep(10)
        logger.info("✅ VM started successfully")
        return True
    
    def wait_for_boot(self, timeout=300):
        """Wait for VM to fully boot"""
        logger.info("Waiting for VM to boot...")
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                vbox_cmd = f'"{self.vboxmanage}"'
                command = f'{vbox_cmd} guestcontrol "{self.vm_name}" run' \
                         f' --username {self.config.VM_USERNAME}' \
                         f' --password {self.config.VM_PASSWORD}' \
                         f' --exe "cmd.exe" -- /c "echo ready"'
                
                logger.debug(f"Checking VM boot status: {command}")
                
                result = self._run_command(command, timeout=30, check=False)
                if result.returncode == 0:
                    logger.info("✅ VM booted and ready")
                    return True
                else:
                    logger.debug(f"Guest not ready yet: {result.stderr}")
            except Exception as e:
                logger.debug(f"Error checking guest: {e}")
            
            time.sleep(5)
            logger.debug("Still waiting for VM to boot...")
        
        raise Exception("VM boot timeout exceeded")
    
    def copy_to_vm(self, local_path, vm_path=None):
        """Copy file to VM"""
        if vm_path is None:
            filename = os.path.basename(local_path)
            vm_path = f"{self.config.VM_SAMPLES_PATH}\\{filename}"
        
        # Ensure samples directory exists
        self._ensure_samples_directory()
        
        vbox_cmd = f'"{self.vboxmanage}"'
        command = f'{vbox_cmd} guestcontrol "{self.vm_name}" copyto' \
                 f' "{local_path}" "{vm_path}"' \
                 f' --username {self.config.VM_USERNAME}' \
                 f' --password {self.config.VM_PASSWORD}'
        
        logger.info(f"Copying {local_path} to VM at {vm_path}")
        logger.info(f"Command: {command}")
        
        self._run_command(command, timeout=60)
        logger.info("✅ File copied successfully")
        return vm_path
    
    def _ensure_samples_directory(self):
        """Ensure samples directory exists in VM"""
        vbox_cmd = f'"{self.vboxmanage}"'
        command = f'{vbox_cmd} guestcontrol "{self.vm_name}" run' \
                 f' --username {self.config.VM_USERNAME}' \
                 f' --password {self.config.VM_PASSWORD}' \
                 f' --exe "cmd.exe" -- /c "mkdir {self.config.VM_SAMPLES_PATH} 2>nul"'
        
        self._run_command(command, timeout=30, check=False)
    
    def execute_in_vm(self, executable_path, arguments="", wait=False):
        """Execute file in VM"""
        vbox_cmd = f'"{self.vboxmanage}"'
        if arguments:
            # With arguments
            command = f'{vbox_cmd} guestcontrol "{self.vm_name}" run' \
                    f' --username {self.config.VM_USERNAME}' \
                    f' --password {self.config.VM_PASSWORD}' \
                    f' --exe "cmd.exe"' \
                    f' -- /c start "" "{executable_path}" {arguments}'
        else:
            # Without arguments
            command = (
                    f'"{self.vboxmanage}" guestcontrol "{self.vm_name}" run '
                    f'--username {self.config.VM_USERNAME} '
                    f'--password {self.config.VM_PASSWORD} '
                    f'--exe "cmd.exe" -- '
                    f'/c start "" "{executable_path}"'
                    )
        
        logger.info(f"Executing in VM: {executable_path}")
        logger.info(f"Command: {command}")
        
        # Don't wait for completion if it's malware (might not exit)
        timeout = 120  #if wait else 10
        result = self._run_command(command, timeout=timeout, check=False)
        
        if result.returncode != 0:
            logger.warning(f"Execution returned non-zero: {result.stderr}")
        
        logger.info("✅ Execution command sent")
        return True
    
    def shutdown_vm(self, force=False):
        """Shutdown VM gracefully or forcefully"""
        vbox_cmd = f'"{self.vboxmanage}"'
        
        if force:
            command = f'{vbox_cmd} controlvm "{self.vm_name}" poweroff'
        else:
            command = f'{vbox_cmd} controlvm "{self.vm_name}" acpipowerbutton'
        
        logger.info(f"Shutting down VM (force={force})")
        logger.info(f"Command: {command}")
        
        self._run_command(command, timeout=60, check=False)
        
        # Wait for VM to actually shutdown
        time.sleep(10)
        logger.info("✅ VM shutdown completed")
        return True
    
    def get_vm_state(self):
        """Get current VM state"""
        try:
            vbox_cmd = f'"{self.vboxmanage}"'
            command = f'{vbox_cmd} showvminfo "{self.vm_name}" --machinereadable'
            
            result = self._run_command(command, timeout=30, check=False)
            
            if result.returncode == 0:
                match = re.search(r'VMState="([^"]+)"', result.stdout)
                if match:
                    state = match.group(1)
                    logger.info(f"VM state: {state}")
                    return state
            
            # Try alternative method
            command = f'{vbox_cmd} list runningvms'
            result = self._run_command(command, timeout=30, check=False)
            
            if self.vm_name in result.stdout:
                logger.info("VM is running (from runningvms list)")
                return "running"
            
            return "poweroff"
        except Exception as e:
            logger.error(f"Error getting VM state: {e}")
            return "unknown"
    
    def is_vm_running(self):
        """Check if VM is running"""
        state = self.get_vm_state()
        return state in ["running", "starting", "restoring"]
    # Add these methods to your existing VirtualBoxManager class

    def copy_log_collection_script(self):
        """Copy the log collection script to VM"""
        script_path = os.path.join(os.path.dirname(__file__), 'collect_logs.py')
        
        # If script doesn't exist locally, create it
        if not os.path.exists(script_path):
            self._create_log_collection_script(script_path)
        
        vm_script_path = f"{self.config.VM_SAMPLES_PATH}\\collect_logs.py"
        return self.copy_to_vm(script_path, vm_script_path)

    def _create_log_collection_script(self, local_path):
        """Create the log collection script if it doesn't exist"""
        script_content = """# PASTE THE ENTIRE COLLECT_LOGS.PY CODE HERE
        # (The complete script from Part 1 above)
        """
        with open(local_path, 'w') as f:
            f.write(script_content)
        logger.info(f"Created log collection script at {local_path}")
    

    def execute_log_collection(self, analysis_id, target_filename, analysis_start_time):
        vm_logs_path = r"C:\logs"
        vm_output_file = f"{vm_logs_path}\\sysmon_{analysis_id}.json"
        # Ensure we use single backslashes for the PowerShell string logic
        sample_path = f"C:\\samples\\{target_filename}"
        
        # Improved PS Script with directory check and error handling
        ps_script = f"""
        try {{
            if (!(Test-Path "{vm_logs_path}")) {{ 
                New-Item -ItemType Directory -Force -Path "{vm_logs_path}" | Out-Null 
            }}
            
            $xpath = "*[EventData[Data[@Name='Image']='{sample_path}']]"
            $events = Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' -FilterXPath $xpath -ErrorAction SilentlyContinue
            
            if ($events) {{
                $events | ConvertTo-Json -Depth 4 | Out-File -FilePath "{vm_output_file}" -Encoding utf8 -Force
                exit 0
            }} else {{
                "No events found for {target_filename}" | Out-File -FilePath "{vm_output_file}" -Encoding utf8
                exit 0 # We treat "no events" as a success in execution
            }}
        }} catch {{
            $_.Exception.Message | Out-File -FilePath "{vm_logs_path}\\error_log.txt" -Append
            exit 1
        }}
        """.strip()

        # Encode to Base64 (UTF-16LE is required by PowerShell -EncodedCommand)
        encoded_cmd = base64.b64encode(ps_script.encode('utf-16-le')).decode('utf-8')
        
        # The actual execution string
        # We call powershell.exe directly as the process to run
        command = [
            f'"{self.vboxmanage}"', "guestcontrol", f'"{self.vm_name}"', "run",
            "--username", self.config.VM_USERNAME,
            "--password", self.config.VM_PASSWORD,
            "--exe", "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
            "--", "powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded_cmd
        ]

        # Join the command list into a string for your _run_command helper
        full_command_str = " ".join(command)

        logger.info(f"🚀 Attempting Sysmon log export for: {target_filename}")
        result = self._run_command(full_command_str, timeout=60, check=False)

        if result.returncode == 0:
            logger.info(f"✅ Sysmon logs successfully handled.")
            return True
        else:
            logger.error(f"❌ Sysmon export failed with exit code {result.returncode}")
            if result.stderr:
                logger.error(f"Stderr: {result.stderr}")
            return False


    def _file_exists_in_vm(self, vm_path):
        """Check if file exists in VM"""
        vbox_cmd = f'"{self.vboxmanage}"'
        command = f'{vbox_cmd} guestcontrol "{self.vm_name}" run' \
                f' --username {self.config.VM_USERNAME}' \
                f' --password {self.config.VM_PASSWORD}' \
                f' --exe "cmd.exe" -- /c "if exist {vm_path} (echo exists)"'
        
        result = self._run_command(command, timeout=30, check=False)
        return "exists" in result.stdout

    def copy_logs_from_vm(self, analysis_id, vm_logs_dir="C:\\logs"):
        """Copy all log files from VM to host"""
        host_logs_dir = os.path.join(self.config.LOGS_FOLDER, analysis_id)
        
        # Create host logs directory
        os.makedirs(host_logs_dir, exist_ok=True)
        
        logger.info(f"Copying logs from VM to {host_logs_dir}")
        
        # List files in VM logs directory
        vbox_cmd = f'"{self.vboxmanage}"'
        list_cmd = f'{vbox_cmd} guestcontrol "{self.vm_name}" run' \
                f' --username {self.config.VM_USERNAME}' \
                f' --password {self.config.VM_PASSWORD}' \
                f' --exe "cmd.exe" -- /c "dir /b {vm_logs_dir}\\*{analysis_id}*"'
        
        result = self._run_command(list_cmd, timeout=30, check=False)
        
        if result.returncode != 0:
            logger.warning(f"No log files found for analysis {analysis_id}")
            return []
        
        # Parse file list
        files = [f.strip() for f in result.stdout.split('\n') if f.strip()]
        copied_files = []
        
        for filename in files:
            vm_file_path = f"{vm_logs_dir}\\{filename}"
            host_file_path = os.path.join(host_logs_dir, filename)
            
            # Copy file from VM to host
            copy_cmd = f'{vbox_cmd} guestcontrol "{self.vm_name}" copyfrom' \
                    f' "{vm_file_path}" "{host_file_path}"' \
                    f' --username {self.config.VM_USERNAME}' \
                    f' --password {self.config.VM_PASSWORD}'
            
            copy_result = self._run_command(copy_cmd, timeout=60, check=False)
            
            if copy_result.returncode == 0 and os.path.exists(host_file_path):
                file_size = os.path.getsize(host_file_path)
                logger.info(f"✅ Copied {filename} ({file_size} bytes)")
                copied_files.append({
                    'filename': filename,
                    'path': host_file_path,
                    'size': file_size
                })
            else:
                logger.error(f"❌ Failed to copy {filename}")
        
        logger.info(f"Copied {len(copied_files)} log files to host")
        return copied_files

    def cleanup_vm_logs(self, analysis_id, vm_logs_dir="C:\\logs"):
        """Clean up log files from VM (optional)"""
        vbox_cmd = f'"{self.vboxmanage}"'
        command = f'{vbox_cmd} guestcontrol "{self.vm_name}" run' \
                f' --username {self.config.VM_USERNAME}' \
                f' --password {self.config.VM_PASSWORD}' \
                f' --exe "cmd.exe" -- /c "del /q {vm_logs_dir}\\*{analysis_id}*"'
        
        self._run_command(command, timeout=30, check=False)
        logger.info(f"Cleaned up VM logs for analysis {analysis_id}")

    def get_sysmon_status(self):
        """Check if Sysmon is running in VM"""
        vbox_cmd = f'"{self.vboxmanage}"'
        command = f'{vbox_cmd} guestcontrol "{self.vm_name}" run' \
                f' --username {self.config.VM_USERNAME}' \
                f' --password {self.config.VM_PASSWORD}' \
                f' --exe "tasklist.exe" -- /fi "IMAGENAME eq sysmon.exe"'
        
        result = self._run_command(command, timeout=30, check=False)
        return "sysmon.exe" in result.stdout.lower()

    def get_fakenet_status(self):
        """Check if FakeNet is running in VM"""
        vbox_cmd = f'"{self.vboxmanage}"'
        command = f'{vbox_cmd} guestcontrol "{self.vm_name}" run' \
                f' --username {self.config.VM_USERNAME}' \
                f' --password {self.config.VM_PASSWORD}' \
                f' --exe "tasklist.exe" -- /fi "IMAGENAME eq fakenet.exe"'
        
        result = self._run_command(command, timeout=30, check=False)
        return "fakenet.exe" in result.stdout.lower()