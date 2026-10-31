import sys
import os

# Get the script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))
print("Script dir:", script_dir)

# Insert backend path
backend_dir = os.path.join(script_dir, '..')
if not os.path.isdir(backend_dir):
    backend_dir = r'D:\AI Powered WEB based Mobile GIS\MOBILE GIS\backend'
    
sys.path.insert(0, backend_dir)

# Check if we can find the module
app_main_path = os.path.join(backend_dir, 'app', 'main.py')
print("app_main_path exists:", os.path.exists(app_main_path))

# Try direct file read
if os.path.exists(app_main_path):
    with open(app_main_path) as f:
        content = f.read()
    print("main.py has 'from app.core':", 'from app.core' in content)

# Try importing
try:
    from app.main import app
    print("SUCCESS: Import worked!")
    print("App title:", app.title)
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
EOF