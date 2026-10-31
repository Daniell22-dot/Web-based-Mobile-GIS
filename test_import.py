import sys
sys.path.insert(0, 'backend')
from app.main import app
print('Import OK:', app.title)