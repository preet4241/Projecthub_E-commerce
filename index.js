const express = require('express');
const path = require('path');
const app = express();
const PORT = 5000;

app.use(express.static('public'));
app.use(express.json());

// Sample projects data by subject and college
const projects = [
  // CSE Projects
  { id: 1, subject: 'CSE', college: 'IIT Delhi', topic: 'AI Chatbot', price: 499, file: 'ai-chatbot.zip', downloads: 145 },
  { id: 2, subject: 'CSE', college: 'DU', topic: 'E-Commerce Website', price: 399, file: 'ecommerce.zip', downloads: 203 },
  { id: 3, subject: 'CSE', college: 'BITS Pilani', topic: 'Weather App', price: 299, file: 'weather-app.zip', downloads: 87 },
  
  // ECE Projects
  { id: 4, subject: 'ECE', college: 'IIT Mumbai', topic: 'IoT Smart Home', price: 599, file: 'iot-smart-home.zip', downloads: 156 },
  { id: 5, subject: 'ECE', college: 'NIIT', topic: 'Traffic Control System', price: 449, file: 'traffic-control.zip', downloads: 92 },
  
  // Mechanical Projects
  { id: 6, subject: 'Mechanical', college: 'NIT Trichy', topic: 'CAD Design - Robot Arm', price: 349, file: 'robot-arm-cad.zip', downloads: 67 },
  { id: 7, subject: 'Mechanical', college: 'IIT Kanpur', topic: '3D Engine Model', price: 399, file: 'engine-3d.zip', downloads: 112 },
  
  // Civil Projects
  { id: 8, subject: 'Civil', college: 'DTU', topic: 'Bridge Design Report', price: 299, file: 'bridge-design.zip', downloads: 58 },
  { id: 9, subject: 'Civil', college: 'IIT Roorkee', topic: 'Building Analysis', price: 349, file: 'building-analysis.zip', downloads: 45 },
];

// API Routes
app.get('/api/projects', (req, res) => {
  res.json(projects);
});

app.get('/api/subjects', (req, res) => {
  const subjects = [...new Set(projects.map(p => p.subject))];
  res.json(subjects);
});

app.get('/api/colleges', (req, res) => {
  const colleges = [...new Set(projects.map(p => p.college))];
  res.json(colleges);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Project Marketplace running at http://0.0.0.0:${PORT}`);
});
