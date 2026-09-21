curl -s -o /dev/null -w '%{http_code} %{content_type}\n' http://127.0.0.1:53411/api/hospitals
curl -s http://127.0.0.1:53411/api/hospitals 2>&1 | head -c 300
echo
echo "---"
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' http://127.0.0.1:53411/api/doctors/profile
curl -s http://127.0.0.1:53411/api/doctors/profile 2>&1 | head -c 300
