const express = require('express');
const dotenv = require('dotenv');
//const cors = require('cors');
const path = require('path');

dotenv.config();
const app = express();
app.use(express.json());


//
app.use((req, res, next) => {
  console.log("REQ:", req.method, req.url, "Origin:", req.headers.origin);
  res.on("finish", () => console.log("RES:", req.method, req.url, "->", res.statusCode));
  next();
});


// CORS - reuse your allowed origins pattern
/*
const allowedOrigins = ['http://192.168.1.100', 'http://123.45.67.89'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) callback(null, true);
        else callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
*/


// serve uploaded files
app.use('/files', express.static(path.join(__dirname, 'uploads/files')));
app.use('/facial', express.static(path.join(__dirname, 'uploads/facial')));

// routes
const systemAuthRoutes = require("./routes/system_auth");
const authRoutes = require('./routes/user');
const humanRoutes = require('./routes/human');
const facialRoutes = require('./routes/facial_recognition');
const certificateRoutes = require('./routes/certificate');
const skillRoutes = require('./routes/skill');
const specialityRoutes = require('./routes/speciality');
const cardRoutes = require('./routes/card');
const spaceTimeRoutes = require('./routes/space_time');
const relationshipsRoutes = require('./routes/relationships');

app.use("/api/auth", systemAuthRoutes); //No JWT required
app.use('/api/auth', authRoutes); 
app.use('/api/human', humanRoutes);
app.use('/api/facial_recognition', facialRoutes);
app.use('/api/certificate', certificateRoutes);
app.use('/api/skill', skillRoutes);
app.use('/api/speciality', specialityRoutes);
app.use('/api/card', cardRoutes);
app.use('/api/space_time', spaceTimeRoutes);
app.use('/api/relationships', relationshipsRoutes);

// health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

