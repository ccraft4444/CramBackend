const router = require("express").Router();
const { asyncErrorHandler } = require("./utils");
const prisma = require("../prisma/prisma");
const fileUpload = require("express-fileupload");
const pdfParse = require("pdf-parse");

router.get(
  "/",
  asyncErrorHandler(async (req, res, next) => {
    const orders = await prisma.documents.findMany();
    res.send(orders);
  })
);

router.get(
  "/me",
  asyncErrorHandler(async (req, res, next) => {
    const myOrders = await prisma.documents.findMany({
      where: { userId: req.user.id },
    });

    res.send(myFiles);
  })
);

// router.post("/extract-text", (req, res) => {
//   if (!req.files || !req.files.pdfFile) {
//     res.status(400).send("No PDF file provided");
//     return;
//   }
//   console.log("in the post ");
//   pdfParse(req.files.pdfFile).then((result) => {
//     console.log("in the parse", result.text);
//     res.send(result.text);
//   });
// });

router.post("/extract-text", async (req, res) => {
  if (!req.files) {
    res.status(400).send("No files provided");
    return;
  }

  // Get an array of files
  const files = Object.values(req.files);

  // Check if there is at least one file
  if (files.length === 0) {
    res.status(400).send("No PDF files provided");
    return;
  }

  // Function to extract text from a single file
  const extractTextFromFile = async (file) => {
    const result = await pdfParse(file);
    return result.text;
  };

  try {
    // Extract text from each file and store it in an array
    const extractedTexts = await Promise.all(files.map(extractTextFromFile));

    // Concatenate the extracted texts with a newline separator
    const concatenatedText = extractedTexts.join("\n");

    // Send the concatenated text as a plain text response
    res.setHeader("Content-Type", "text/plain");
    res.send(concatenatedText);
  } catch (error) {
    console.error("Error extracting text from files:", error);
    res.status(500).send("Error extracting text from files");
  }
});

router.get(
  "/:documentId",
  asyncErrorHandler(async (req, res, next) => {
    const singleFile = await prisma.documents.findUnique({
      where: {
        id: +req.params.documentId,
      },
    });
    res.send(singleFile);
  })
);

router.post(
  "/",
  asyncErrorHandler(async (req, res, next) => {
    const { userId, name, content } = req.body;
    const createdFile = await prisma.documents.create({
      data: { userId: userId, name: name, content: content },
    });

    res.send(createdFile);
  })
);

module.exports = router;
