"""
Simple HTTP server for Validator Dashboard
Run this to access the dashboard at http://localhost:8080
"""
import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

PORT = 8082
DIRECTORY = Path(__file__).parent

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == '__main__':
    os.chdir(DIRECTORY)
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"""
╔════════════════════════════════════════════════════════════╗
║         CUB Validator Dashboard Server                     ║
╚════════════════════════════════════════════════════════════╝

✅ Server running at: http://localhost:{PORT}
✅ Opening validator dashboard...

📋 Validator Login:
   Email:    validator@cub.cm
   Password: validator123

🔧 Backend API: http://localhost:8003

Press Ctrl+C to stop the server
""")
        
        # Open browser
        webbrowser.open(f'http://localhost:{PORT}/validator_dashboard.html')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✅ Server stopped")
