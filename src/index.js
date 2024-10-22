const express = require('express');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const nodemailer = require('nodemailer');
const port = process.env.PORT || 5000;
const admin = require('firebase-admin');
//const serviceAccount = require('../src/crimereportingandprevent-22511-firebase-adminsdk-kekxg-56c23d086b.json');
require('dotenv').config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://crimereportingandprevent-22511-default-rtdb.firebaseio.com"
});
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

app.get('/getFirebaseConfig', (req, res) => {
  res.json({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
  });
});
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: process.env.E_M,      
      pass: process.env.P_M,      
  }
});

app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/scripts', express.static(path.join(__dirname, '../public/scripts')));

const db = admin.database();
app.get('/reports/overpriced-items', async (req, res) => {
  try {
    const reportsRef = db.ref('reports');
    const snapshot = await reportsRef.once('value');
    const reports = snapshot.val();

    if (reports) {
      const overpricedReports = Object.keys(reports).map(reportId => {
        const report = reports[reportId];
        if (report.type === 'OverPriced Items') {
          const feedback = report.feedback ? report.feedback : 1;
     return {
            email: report.email,
            id:   reportId,
            cnic: report['Cnic No'],
            mobileNo: report['mobile No'],
            description: report.descr,
            location: report.location,
            latitude: report.latitude,
            longitude: report.longitude,
            date: report.date,
            time: report.time,
            evidence: report.evidences || [],
            feedback: feedback,
          };
        }
        return null;
      }).filter(report => report !== null);

      res.status(200).json({
        success: true,
        data: overpricedReports,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No reports found.',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message,
    });
  }
});
app.get('/reports/electric-theft', async (req, res) => {
  try {
    const reportsRef = db.ref('reports');
    const snapshot = await reportsRef.once('value');
    const reports = snapshot.val();
    if (reports) {
      const electricTheftReports = Object.keys(reports).map(reportId => {
        const report = reports[reportId];

        if (report.type === 'Electric Theft') {
          const feedback = report.feedback ? report.feedback : 1;
        return {
            email: report.email,
            id:   reportId,
            cnic: report['Cnic No'],
            mobileNo: report['mobile No'],
            description: report.descr,
            location: report.location,
            latitude: report.latitude,
            longitude: report.longitude,
            date: report.date,
            time: report.time,
            evidence: report.evidences || [],
            feedback: feedback,
          };
         }
        return null;
      }).filter(report => report !== null);
      res.status(200).json({
        
        success: true,
        data: electricTheftReports,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No reports found.',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message,
    });
  }
});
app.post('/reports/update-feedback/:reportId', async (req, res) => {
  const { reportId } = req.params;  
  const { feedback,desc,email } = req.body;    
  if (!feedback || !['1', '2', '3'].includes(feedback)) {
      return res.status(400).json({ message: 'Invalid feedback value' });
  }

  try {
      const reportRef = db.ref(`reports/${reportId}`);
      const snapshot = await reportRef.once('value');
      const report = snapshot.val();

      if (!report) {
          return res.status(404).json({ message: 'Report not found' });
      }

      await reportRef.update({ feedback });
      var tt;
      var hl;
      if(feedback==='2'){
        tt= ' has been inprogress and we are reviewing your report';
        hl= ' has been inprogress and we are reviewing your report </p>';
    }
    else if(feedback==='3'){
        tt= 'has been completed and we took necessary actions againt your report';
        hl= 'has been completed and we took necessary actions againt your report </p>'; 
    }else{
        tt= 'we received your report';
       hl= 'we received your report </p';
    
      }
      const mailOptions = {
        from: process.env.E_M,
        to: email,                     
        subject: 'Report Status Update',             
        text: `Hello, the status on your report (${desc}) <br>${tt}>`,
        html: `<p>Hello,</p><p>The status on your report (${desc}) <br>${tt}</p>` 
      }
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.error('Error sending email:', error);
      } 
    });
    
      res.status(200).json({ message: 'Feedback updated successfully' });
  } catch (error) {
      console.error('Error updating feedback:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, 
    maxAge: 30*24 * 60 * 60 * 1000 
    }
}));

app.post('/login', async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const userRecord = await admin.auth().getUser(uid);
  
    if (!userRecord.customClaims || !userRecord.customClaims.selectedRole) {
      return res.status(403).json({ success: false, message: 'User does not have the required role' });
    }

    const userRole = userRecord.customClaims.selectedRole;
    req.session.user = {
      uid,
      role: userRole
    };
    
    res.cookie('uid', uid, { httpOnly: true, secure: false }); 
    res.cookie('role', userRole, { httpOnly: true, secure: false });

    let redirectUrl;
    switch (userRole) {
      case 'et':
        redirectUrl = '/et'; 
        break;
      case 'op':
        redirectUrl = '/op';
        break;
      default:
        redirectUrl = '/index.html'; 
    }
    res.json({ success: true, redirectUrl });

  } catch (error) {
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
});
app.use((req, res, next) => {
  if (req.session && req.session.user) {
    req.uid = req.session.user.uid;
  }
  next();
});

app.post('/logout', async (req, res) => {
  const uid = req.session.user && req.session.user.uid;

  if (!uid) {
    return res.status(400).json({ success: false, message: 'User is not logged in' });
  }

  try {
    await admin.auth().revokeRefreshTokens(uid);
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Failed to destroy session' });
      }

      res.clearCookie('connect.sid');
      res.json({ success: true, message: 'User logged out successfully' });
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/register.html'));
});
const checkAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect('/index.html');
  }
};
const redirectToRoleMainPage = (req, res) => {
  if (req.session && req.session.user) {
    const userRole = req.session.user.role;
    switch (userRole) {
      case 'et':
        return res.redirect('/et');
      case 'op':
        return res.redirect('/op');
      default:
        return res.redirect('/index.html');
    }
  } else {
    return res.redirect('/index.html');
  }
};

app.use((req, res, next) => {
  if (req.path === '' || req.path === '/' || req.path === '/index.html' || req.path === '/index') {
    if (req.session && req.session.user) {
      return redirectToRoleMainPage(req, res);
    } else {
      return next();
    }
  }

  if (req.session && req.session.user) {
    return next();
  } else {
    return res.redirect('/index.html');
  }
});

app.get('/et', checkAuth, (req, res) => {
  if (req.session.user.role === 'et') {
    res.sendFile(path.join(__dirname, '../public/et.html'));
  } else {
    redirectToRoleMainPage(req, res);
  }
});

app.get('/op', checkAuth, (req, res) => {
  if (req.session.user.role === 'op') {
    res.sendFile(path.join(__dirname, '../public/op.html'));
  } else {
    redirectToRoleMainPage(req, res);
  }
});

app.get('/getSessionInfo', (req, res) => {
  if (req.session && req.session.user) {
    const uid = req.session.user.uid;
    res.json({ success: true, user: req.session.user });
  } else {
    res.json({ success: false, message: 'No active session' });
  }
});

app.use(express.static(path.join(__dirname, '../public'), {
  index: false,
  redirect: false
}));
app.use((req, res) => {
  if (req.session && req.session.user) {
    redirectToRoleMainPage(req, res);
  } else {
    res.redirect('/index.html');
  }
});
app.listen(port, () => {

 });  
