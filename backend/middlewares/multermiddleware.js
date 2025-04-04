import multer from "multer";
import fs from "fs"

const tempDir = "./temp";

if(!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, {
        recursive: true
    });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './temp')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix)
    }
  })
  
export const upload = multer({ 
    storage,
})