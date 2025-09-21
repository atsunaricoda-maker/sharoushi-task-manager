#!/usr/bin/env python3
import http.server
import socketserver
import sys
import os

PORT = 8080

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        sys.stdout.write(f"{self.log_date_time_string()} - {format%args}\n")
        sys.stdout.flush()

if __name__ == "__main__":
    os.chdir('/home/user/webapp')
    server = socketserver.TCPServer(('0.0.0.0', PORT), MyHandler)
    print(f"Server running on port {PORT}")
    sys.stdout.flush()
    server.serve_forever()