import fs from 'fs';
import axios from 'axios';
import { fromBuffer } from 'file-type';
import qs from 'qs';
import multer from 'multer';
import path from 'path';

// Pastikan folder uploads ada
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const upload = multer({
  dest: uploadsDir,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/; // Tipe file yang diizinkan
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: File type not supported!');
    }
  }
});

const tool = ['removebg', 'enhance', 'upscale', 'restore', 'colorize'];

const pxpic = {
  upload: async (filePath) => {
    try {
      const buffer = await fs.promises.readFile(filePath); // Menggunakan readFile secara asinkron
      const { ext, mime } = (await fromBuffer(buffer)) || {};
      const fileName = Date.now() + "." + ext;

      const folder = "uploads";
      const responsej = await axios.post("https://pxpic.com/getSignedUrl", { folder, fileName }, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const { presignedUrl } = responsej.data;

      await axios.put(presignedUrl, buffer, {
        headers: {
          "Content-Type": mime,
        },
      });

      const cdnDomain = "https://files.fotoenhancer.com/uploads/";
      const sourceFileUrl = cdnDomain + fileName;

      return sourceFileUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('File upload failed');
    }
  },
  create: async (filePath, tools) => {
    if (!tool.includes(tools)) {
      return `Pilih salah satu dari tools ini: ${tool.join(', ')}`;
    }
    const url = await pxpic.upload(filePath);
    let data = qs.stringify({
      'imageUrl': url,
      'targetFormat': 'png',
      'needCompress': 'no',
      'imageQuality': '100',
      'compressLevel': '6',
      'fileOriginalExtension': 'png',
      'aiFunction': tools,
      'upscalingLevel': ''
    });

    let config = {
      method: 'POST',
      url: 'https://pxpic.com/callAiFunction',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
        'Content-Type': 'application/x-www-form-urlencoded',
        'accept-language': 'id-ID'
      },
      data: data
    };

    try {
      const api = await axios.request(config);
      return api.data;
    } catch (error) {
      console.error('Error calling AI function:', error);
      throw new Error('AI function call failed');
    }
  }
};

export default async (req, res) => {
  if (req.method === 'POST') {
    upload.single('image')(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: 'File upload failed' });
      }

      const { tool } = req.body;

      if (!req.file || !tool) {
        return res.status(400).json({ error: 'filePath dan tool harus disediakan' });
      }

      try {
        const result = await pxpic.create(req.file.path, tool);
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ error: error.message || 'Error processing image' });
      }
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};