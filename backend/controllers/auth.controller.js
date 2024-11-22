import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

import { User } from '../models/user.model.js';
import { generateTokenAndSetCookie } from '../utils/generateTokenAndSetCookie.js';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordRestEmail, sendResetSuccessEmail } from '../mailtrap/emails.js';

//Signup function
export const signup = async (req, res) => {
    const { email, password, name } = req.body;

    try {
      if (!email || !password || !name) {
         throw new Error ("All fields are required");
      }

      const userAlreadyExists = await User.findOne({ email });
      console.log("userAlreadyExists", userAlreadyExists);

      if(userAlreadyExists) {
         return res.status(400).json({ success: false, message: "User already exists" });
      }

      const hashedPassword = await bcryptjs.hash(password, 10);//Hash our password
      const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();//To create email verification token
      
      const user = new User({
         email,
         password: hashedPassword,
         name,
         verificationToken,
         verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, //Verification token to expire in 24hrs
      });

      await user.save(); //To save the user to our database

      generateTokenAndSetCookie(res, user._id);//To create session token using jsonwebtoken

      await sendVerificationEmail(user.email, verificationToken);

      res.status(201).json({
         success: true,
         message: "User created successfully",
         user: {
            ...user._doc,
            password: undefined,
         },
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
 };

 //Email Verification function
 export const verifyEmail = async (req, res) => {
   const {code} = req.body;
   try {
      const user = await User.findOne({
         verificationToken: code,
         verificationTokenExpiresAt: { $gt: Date.now() }
      })

      if(!user) {
         return res.status(400).json({success: false, message: "Invalid or expired verification code"})

      }

      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpiresAt = undefined;
      await user.save();
      
      await sendWelcomeEmail(user.email, user.name);

      res.status(200).json({
         success: true,
         message: "Email verified successfully",
         user: {
            ...user._doc,
            password: undefined,
         },
      })
   } catch (error) {
      console.log("error in verifyEmail", error);
      res.status(500).json({success:false, message: "server error"});

   }
 }

 //Login function
 export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
         return res.status(400).json({ success: false, message: "Invalid credentials"});
      }
      const isPasswordValid = await bcryptjs.compare(password, user.password);
      if(!isPasswordValid) {
         return res.status(400).json({ success: false, message: "Invalid credentials" });

      }
      generateTokenAndSetCookie(res, user._id);

      user.lastLogin = new Date();
      await user.save();

      res.status(200).json({
         sucess: true,
         message: "Logged in successfully",
         user: {
            ...user._doc,
            password: undefined,
         },
      });
    } catch (error) {
      console.log("Error in login", error);
      res.status(400).json({ success: false, message: error.message });

    }
 };

 //Logout function
 export const logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ success: true, message: "Logged out successfully"});
 };

 //Forgot Password function
 export const forgotPassword = async (req, res) => {
   const { email } = req.body;
   try {
      const user = await User.findOne({ email });

      if(!user) {
         return res.status(400).json({ success: false, message: "User not found"});
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(20).toString("hex");
      const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // Token expire after one hour

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpiresAt = resetTokenExpiresAt;

      await user.save();
      
      //Send Reset Password Email

      await sendPasswordRestEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);

      res.status(200).json({ success: true, message: "Reset password email sent successfully" });

   } catch (error) {
      console.log("Error in forgotPassword", error);
      res.status(400).json({ success: false, message: error.message });
   }
 };

 //Reset Password function
 export const resetPassword = async (req, res) => {
   try {
      const { token } = req.params;
      const { password } = req.body;

      const user = await User.findOne({
         resetPasswordToken: token,
         resetPasswordExpiresAt: { $gt: Date.now() },
      });

      if (!user) {
         return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
      }

      //update password
      const hashedPassword = await bcryptjs.hash(password, 10);

      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiresAt = undefined;
      await user.save();

      await sendResetSuccessEmail(user.email);

      res.status(200).json({success: true, message: "Password reset successful"});
   } catch (error) {
      console.log("Error in resetPassword", error);
      res.status(400).json({success: false, message: error.message});
   }
 };

 //Authentication check function
 export const checkAuth = async (req, res) => {
   try {
      const user = await User.findById(req.userId).select("-password");
      if(!user) {
         return res.status(400).json({ success: false, message: "User not found"});
      }
      res.status(200).json({ success: true, user});
   } catch (error) {
      console.log("Error in checkAuth ", error);
      res.status(400).json({ success: false, message: error.message});
   }
 };