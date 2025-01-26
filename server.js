require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const xlsx = require('xlsx');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Configure nodemailer
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'mdfaiz75.mf@gmail.com',
        pass: 'kpgc acvz ecnx jlgs'
    }
});

app.post('/register', upload.single('paymentScreenshot'), (req, res) => {
    const { teamName, teamMembers, email, mobile, collegeName, pursuing, yearOfStudy, department } = req.body;
    const paymentScreenshot = req.file;

    const filePath = path.join(__dirname, 'registrations.xlsx');

    try {
        // Read or create the Excel file
        let workbook;
        let worksheet;

        if (fs.existsSync(filePath)) {
            workbook = xlsx.readFile(filePath);
            worksheet = workbook.Sheets['Registrations'];
        } else {
            workbook = xlsx.utils.book_new();
            worksheet = xlsx.utils.aoa_to_sheet([
                ['Team Name', 'Team Members', 'Email', 'Mobile', 'College Name', 'Pursuing', 'Year of Study', 'Department', 'Payment Screenshot']
            ]);
            xlsx.utils.book_append_sheet(workbook, worksheet, 'Registrations');
        }

        // Append new registration data
        const newRow = [
            teamName, teamMembers, email, mobile, collegeName, pursuing, yearOfStudy, department,
            paymentScreenshot ? paymentScreenshot.path : 'No Screenshot Uploaded'
        ];
        xlsx.utils.sheet_add_aoa(worksheet, [newRow], { origin: -1 });
        xlsx.writeFile(workbook, filePath);

        // Send confirmation email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Event Registration Confirmation',
            text: `Dear ${teamName},\n\nThank you for registering for our event. We have received your registration details.\n\nBest regards,\nEvent Team`,
            attachments: paymentScreenshot
                ? [{ filename: paymentScreenshot.originalname, path: paymentScreenshot.path }]
                : []
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error('Failed to send email:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send confirmation email. Please try again.',
                });
            }
            res.status(200).json({
                success: true,
                message: 'Registration successful! A confirmation email has been sent.',
            });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing the registration.',
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
