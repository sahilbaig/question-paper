const express = require("express");
const cors = require("cors");
const pdfParse = require("pdf-parse");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------
// Helper functions
// ---------------------

/**
 * Extracts questions with 4 options each, using a running counter
 */
function extractQuestionsWithOptions(text) {
    // Normalize newlines and spaces
    const normalized = text.replace(/\r\n/g, "\n").replace(/\n+/g, "\n").trim();

    // Match pattern: question starting with number-dot
    // Then options: four groups of number-dot text
    const questionRegex = /(\d+)\.\s+([^\n]+)\s+1\.\s+(.*?)\s+2\.\s+(.*?)\s+3\.\s+(.*?)\s+4\.\s+(.*?)(?=\n\d+\.|$)/gs;

    const questions = [];
    let counter = 1;
    let match;

    while ((match = questionRegex.exec(normalized)) !== null) {
        questions.push({
            number: counter++,
            question: match[2].trim(),
            options: [
                match[3].trim(),
                match[4].trim(),
                match[5].trim(),
                match[6].trim()
            ]
        });
    }

    return questions;
}

// ---------------------
// Hardcoded PDF URL
// ---------------------
const PDF_URL = "https://aqyqpzubfxakabcwoypo.supabase.co/storage/v1/object/public/pdfs/20cfb098-06ed-4f51-bf65-a8b3dfc56ea1/CAT_1990_Question_Paper_dcf7b63b16e1c9bd05e952f3ea427a41.pdf";

// ---------------------
// Routes
// ---------------------

// Get all questions sequentially
app.get("/all-questions", async (req, res) => {
    try {
        const response = await axios.get(PDF_URL, { responseType: "arraybuffer" });
        const pdfData = await pdfParse(Buffer.from(response.data));

        const questions = extractQuestionsWithOptions(pdfData.text);

        res.json({
            total_questions: questions.length,
            questions
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Debug endpoint to see raw text
app.get("/debug-text", async (req, res) => {
    try {
        const response = await axios.get(PDF_URL, { responseType: "arraybuffer" });
        const pdfData = await pdfParse(Buffer.from(response.data));

        res.json({
            text: pdfData.text.slice(0, 2000) // First 2000 characters
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ---------------------
// Start server
// ---------------------
const PORT = 4000;
app.listen(PORT, () => console.log(`PDF backend running on port ${PORT}`));
