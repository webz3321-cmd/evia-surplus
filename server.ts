import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const app = express();
app.use(express.json());

// Load dynamic Firebase configurations to build local firebase client context
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// SMTP Mail dispatcher helper
async function sendMail(smtpConfig: any, to: string, code: string) {
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: parseInt(smtpConfig.port) || 465,
    secure: parseInt(smtpConfig.port) === 465,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });

  const mailOptions = {
    from: smtpConfig.from || '"EVIA Authentic Support" <noreply@gmail.com>',
    to: to,
    subject: `🔐 Your EVIA Secure Passcode: ${code}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="font-size: 28px; margin: 0; color: #1c1c1c; font-family: Georgia, serif; letter-spacing: 1px;">evia</h1>
          <p style="font-size: 10px; color: #9f3a38; letter-spacing: 2px; text-transform: uppercase; margin: 5px 0 0 0; font-weight: bold;">Curation & Authenticity</p>
        </div>
        <div style="border-top: 1px solid #f0f0f0; padding-top: 25px;">
          <p style="font-size: 14px; color: #555555; line-height: 1.6; margin-bottom: 20px;">Use the following security code to access your EVIA Collector account. This code is active for 5 minutes.</p>
          <div style="background-color: #faf8f5; border: 1px solid #e3dfd3; border-radius: 8px; padding: 18px; text-align: center; margin: 25px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #9f3a38;">${code}</span>
          </div>
          <p style="font-size: 11px; color: #888888; line-height: 1.5; margin-top: 25px; border-top: 1px solid #f0f0f0; padding-top: 15px;">If you did not request this OTP, please disregard this email. EVIA Vintage Surplus Co. will never prompt you for passcodes or credit card details outside our secure login gateways.</p>
        </div>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}

// Twilio REST API SMS dispatcher helper
async function sendSms(twilioConfig: any, to: string, code: string) {
  const { sid, token, from } = twilioConfig;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const authHeader = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');
  
  const params = new URLSearchParams();
  params.append('To', to);
  params.append('From', from);
  params.append('Body', `🔐 EVIA Secure Passcode: ${code}. Valid for 5 minutes. Please do not share this passcode.`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Twilio REST dispatch failed');
  }
  
  return await response.json();
}

// Real-time OTP trigger gateway router
app.post('/api/send-otp', async (req, res) => {
  const { type, target, code } = req.body;

  if (!target || !code) {
    return res.status(400).json({ error: 'Missing target email/phone or code parameter' });
  }

  try {
    const settingsRef = doc(db, 'settings', 'global');
    const settingsSnap = await getDoc(settingsRef);
    
    let smtpConfig = null;
    let twilioConfig = null;

    if (settingsSnap.exists()) {
      const data = settingsSnap.data();
      if (data.smtpHost && data.smtpUser && data.smtpPass) {
        smtpConfig = {
          host: data.smtpHost,
          port: data.smtpPort || 465,
          user: data.smtpUser,
          pass: data.smtpPass,
          from: data.smtpFrom
        };
      }
      if (data.twilioSid && data.twilioToken && data.twilioFrom) {
        twilioConfig = {
          sid: data.twilioSid,
          token: data.twilioToken,
          from: data.twilioFrom
        };
      }
    }

    if (type === 'email') {
      if (!smtpConfig) {
        console.warn('SMTP credentials not configured. Falling back to simulated verification code:', code);
        return res.json({ 
          success: true, 
          status: 'simulated', 
          message: 'SMTP credentials missing. Falling back to secure preview mode.',
          code: code
        });
      }

      await sendMail(smtpConfig, target, code);
      return res.json({ success: true, status: 'dispatched', message: 'Official verification code sent!' });
    } else {
      if (!twilioConfig) {
        console.warn('Twilio credentials not configured. Falling back to simulated verification code:', code);
        return res.json({ 
          success: true, 
          status: 'simulated', 
          message: 'Twilio credentials missing. Falling back to secure preview mode.',
          code: code
        });
      }

      await sendSms(twilioConfig, target, code);
      return res.json({ success: true, status: 'dispatched', message: 'Official SMS dispatched successfully.' });
    }
  } catch (err: any) {
    console.error('Error dispatching OTP gateway payload:', err);
    return res.status(500).json({ error: err.message || 'Failed to deliver OTP.' });
  }
});

// Start server and Vite middleware
async function startServer() {
  const PORT = 3000;
  const distPath = path.join(process.cwd(), 'dist');
  
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

