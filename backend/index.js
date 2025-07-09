const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const User = require('./models/User.js');
const Place = require('./models/Place.js');
const Booking = require('./models/Booking.js');
const cookieParser = require('cookie-parser');
const imageDownloader = require('image-downloader');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config()
const app = express();
const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = process.env.JWT_SECRET;


app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname+'/uploads'));

const allowedOrigins = [
  'http://localhost:5173', 
  'https://wander-lust-peach.vercel.app',
  'https://wander-lust-cli.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// const allowedOrigins = [
//   'http://localhost:5173', 
//   'https://wander-lust-peach.vercel.app',
//   'https://wander-lust-cli.vercel.app'  // Add this line
// ];

// app.use(cors({
//   origin: function (origin, callback) {
//     if (allowedOrigins.includes(origin) || !origin) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true
// }));

// console.log(process.env.MONGO_URL)
mongoose.connect(process.env.MONGO_URL);

// function getUserDataFromReq(req) {
//   return new Promise((resolve,reject) => {
//     jwt.verify(req.cookies.token, jwtSecret, {}, async (err,userData) => {
//       if(err) throw err;
//       resolve(userData);
//     });
//   });
// }

function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies.token;
    if (!token) {
      return reject(new Error('No token provided'));
    }
    
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) {
        return reject(err); // Use reject, not throw
      }
      resolve(userData);
    });
  });
}

app.get('/test', (req,res) => {
  res.json('test ok');
});

app.post('/api/register', async (req,res) => {
  const {name,email,password} = req.body;
     try {
      const userDoc = await User.create({
        name,
        email,
        password:bcrypt.hashSync(password, bcryptSalt),
      });
      res.json(userDoc);
    } catch (e) {
      res.status(422).json(e);
    }
});

app.post('/api/login',  async (req,res) => {
  const {email,password} = req.body;
  const userDoc = await User.findOne({email});
 if(userDoc) {
  const passOk = bcrypt.compareSync(password,userDoc.password);
  if (passOk) {
    jwt.sign({
      email:userDoc.email, 
      id:userDoc._id
    }, jwtSecret, {}, (err,token) =>{
      if (err) throw err;
      res.cookie('token', token).json(userDoc);
    })
  } else {
    res.status(422).json('pass not ok');
  }
 } else {
  res.json('not found');
 }
});

app.get('/api/profile', (req,res) => {
  const {token} = req.cookies;
  if(token) {
    jwt.verify(token, jwtSecret, {}, async (err,userData) => {
      if(err) throw err;  
       const {name,email,_id} = await User.findById(userData.id);
       res.json({name,email,_id});
    }); 
  } else {
    res.json(null);
  }
})


app.post('/api/logout', (req,res) =>{
  res.cookie('token', '').json(true);
});

console.log("All Set");
// console.log({__dirname});
app.post('/api/upload-by-link', async (req,res) =>{
  const {link} = req.body;
  const newName = 'photo' + Date.now() + '.jpg';
  await imageDownloader.image({
    url: link,
    dest: __dirname + '/uploads/' + newName,
  });
  res.json(newName);
});


const photosMiddleware = multer({dest:'uploads/'});
app.post('/api/upload', photosMiddleware.array('photos', 100), (req,res) => {
  const uploadedFiles =[];
  for(let i=0; i<req.files.length; i++) {
    const {path,originalname} = req.files[i];
     const parts = originalname.split('.');
     const ext = parts[parts.length - 1];
    const newPath = path + '.' + ext;
    fs.renameSync(path, newPath);
    uploadedFiles.push(newPath.replace('uploads\\',''));
  }
  res.json(uploadedFiles);
});

app.post('/api/places', (req, res) => {
  const {token} = req.cookies;
  const {
    title,address,addedPhotos,description,price,
    perks,extraInfo,checkIn,checkOut,maxGuests,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err,userData) => {
    if(err) throw err;  
     const placeDoc = await Place.create({
      owner: userData.id,price,
      title,address,photos:addedPhotos,description,
    perks,extraInfo,checkIn,checkOut,maxGuests,
    });
    res.json(placeDoc);
  });
});


app.get('/api/user-places', (req,res) =>{
  const {token} = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err,userData) => {
    const {id} = userData;
    res.json( await Place.find({owner:id}));
  });
});

app.get('/api/places/:id',async (req, res) =>{
  const {id} = (req.params);
  res.json(await Place.findById(id));
});

app.put('/api/places', async (req,res) => {
  const {token} = req.cookies;
  const {
    id,title,address,addedPhotos,description,
    perks,extraInfo,checkIn,checkOut,maxGuests,price
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err,userData) => {
    if (err) throw err;
    const placeDoc = await Place.findById(id);
    if(userData.id === placeDoc.owner.toString()) {
      placeDoc.set({
          title,address,photos:addedPhotos,description,
        perks,extraInfo,checkIn,checkOut,maxGuests,price,
      });
       await placeDoc.save();
      res.json('ok');
    }
  });  
});

app.get('/places', async (req,res) =>{
  res.json(await Place.find());
});

app.post('/api/bookings', async (req, res) => {
  const userData = await getUserDataFromReq(req);
  const {
    place,checkIn,checkOut,numberOfGuests,name,phone,price,
  } = req.body;
  Booking.create({
    place,checkIn,checkOut,numberOfGuests,name,phone,price,
    user:userData.id,
  }).then((doc) => {
    res.json(doc);
  }).catch(() => {
    throw err;
  });
});


// app.get('/api/bookings',  async (req,res) => {
//  const userData = await getUserDataFromReq(req);
//  res.json( await Booking.find({user:userData.id}).populate('place'));
// });

app.get('/api/bookings', async (req, res) => {
  try {
    const userData = await getUserDataFromReq(req);
    const bookings = await Booking.find({user: userData.id}).populate('place');
    res.json(bookings);
  } catch (error) {
    res.status(401).json({error: 'Authentication required'});
  }
});

const PORT = process.env.PORT || 5000; // Default to 5000 if PORT is not set

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// if there is any problem use this
// const multer = require('multer');
// const fs = require('fs');
// const path = require('path');

// const photosMiddleware = multer({ dest: 'uploads/' });

// app.post('/api/upload', photosMiddleware.array('photos', 100), (req, res) => {
//   const uploadedFiles = [];

//   for (let i = 0; i < req.files.length; i++) {
//     const { path: tempPath, originalname } = req.files[i];
//     const ext = originalname.split('.').pop(); // Extracts file extension
//     const newPath = `${tempPath}.${ext}`; // Renames file with extension

//     fs.renameSync(tempPath, newPath); // Rename file
//     uploadedFiles.push(path.basename(newPath)); // Get filename only (No 'uploads/')
//   }

//   res.json(uploadedFiles);
// });
