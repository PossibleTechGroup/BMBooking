import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('77.42.25.202', username='root', password='3JKtjAutvXNC', timeout=15)

def run(cmd, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    print(f">>> {cmd}") 
    if out.strip():
        print(out.strip())
    if err.strip():
        print(f"STDERR: {err.strip()}")
    return out

nginx_conf = """# ============================================
# Landing Page - bmbooking.possibletechplc.com
# ============================================
server {
    listen 80;
    server_name bmbooking.possibletechplc.com;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name bmbooking.possibletechplc.com;
    ssl_certificate /etc/nginx/ssl/bmbooking.crt;
    ssl_certificate_key /etc/nginx/ssl/bmbooking.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    client_max_body_size 50M;

    location /api/ {
        proxy_pass http://127.0.0.1:52400/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /uploads/ {
        proxy_pass http://127.0.0.1:52400/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location / {
        proxy_pass http://127.0.0.1:53404;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# ============================================
# Main Web App - bmbookingweb.possibletechplc.com
# ============================================
server {
    listen 80;
    server_name bmbookingweb.possibletechplc.com;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name bmbookingweb.possibletechplc.com;
    ssl_certificate /etc/nginx/ssl/bmbooking.crt;
    ssl_certificate_key /etc/nginx/ssl/bmbooking.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    client_max_body_size 50M;

    location /api/ {
        proxy_pass http://127.0.0.1:52400/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /uploads/ {
        proxy_pass http://127.0.0.1:52400/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /socket.io/ {
        proxy_pass http://127.0.0.1:52400/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    location / {
        proxy_pass http://127.0.0.1:53411;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# ============================================
# Admin Dashboard - admin.possibletechplc.com
# ============================================
server {
    listen 80;
    server_name admin.possibletechplc.com;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name admin.possibletechplc.com;
    ssl_certificate /etc/nginx/ssl/bmbooking.crt;
    ssl_certificate_key /etc/nginx/ssl/bmbooking.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    client_max_body_size 50M;

    location /api/ {
        proxy_pass http://127.0.0.1:52400/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /uploads/ {
        proxy_pass http://127.0.0.1:52400/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location / {
        proxy_pass http://127.0.0.1:53400;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# ============================================
# Reception - reception.possibletechplc.com
# ============================================
server {
    listen 80;
    server_name reception.possibletechplc.com;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name reception.possibletechplc.com;
    ssl_certificate /etc/nginx/ssl/bmbooking.crt;
    ssl_certificate_key /etc/nginx/ssl/bmbooking.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    client_max_body_size 50M;

    location /api/ {
        proxy_pass http://127.0.0.1:52400/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /uploads/ {
        proxy_pass http://127.0.0.1:52400/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location / {
        proxy_pass http://127.0.0.1:53401;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
"""

run(f"""cat > /etc/nginx/sites-available/bmbooking << 'NGINXEOF'
{nginx_conf}NGINXEOF""")

print("\n=== Testing nginx ===")
run("nginx -t 2>&1")

print("\n=== Restarting nginx ===")
run("systemctl restart nginx")

import time
time.sleep(2)

print("\n=== Testing bmbooking (landing) locally port 80 ===")
run("curl -s -o /dev/null -w '%{http_code}' -H 'Host: bmbooking.possibletechplc.com' http://127.0.0.1/")

print("\n=== Testing bmbookingweb locally port 80 ===")
run("curl -s -o /dev/null -w '%{http_code}' -H 'Host: bmbookingweb.possibletechplc.com' http://127.0.0.1/")

print("\n=== Testing admin locally port 80 ===")
run("curl -s -o /dev/null -w '%{http_code}' -H 'Host: admin.possibletechplc.com' http://127.0.0.1/")

print("\n=== Testing reception locally port 80 ===")
run("curl -s -o /dev/null -w '%{http_code}' -H 'Host: reception.possibletechplc.com' http://127.0.0.1/")

print("\n=== Testing admin API through nginx ===")
run("curl -s -o /dev/null -w '%{http_code}' -H 'Host: admin.possibletechplc.com' http://127.0.0.1/api/health")

print("\n=== Testing bmbookingweb through Cloudflare ===")
run("curl -s -o /dev/null -w '%{http_code}' --max-time 10 https://bmbookingweb.possibletechplc.com/")

print("\n=== Testing admin through Cloudflare ===")
run("curl -s -o /dev/null -w '%{http_code}' --max-time 10 https://admin.possibletechplc.com/")

ssh.close()
