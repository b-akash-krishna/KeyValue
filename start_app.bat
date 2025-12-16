@echo off
echo Starting Digital PG Management System...

start "Digital PG Backend" cmd /k "cd server && npm start"
start "Digital PG Frontend" cmd /k "cd client && npm run dev"

echo System started! 
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
