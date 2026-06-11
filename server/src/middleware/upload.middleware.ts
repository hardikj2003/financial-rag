import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDir = path.resolve(process.cwd(), "uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/[^\w.-]/g, "_")}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF uploads are supported"));
      return;
    }

    cb(null, true);
  },
});

export default upload;
