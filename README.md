🎨 Pixel Art Generator

A powerful Pixel Art Editor made with React + Vite + Tailwind + Canvas + TensorFlow.js, allowing artists to convert any image into pixel art with advanced selection, palettes, dithering, and AI stylization.

This version includes multi-shape selection, lasso masking, zoom & pan, sprite sheet export, and public ML models.

🚀 Features
🖼️ Image Processing

Pixelate any image with adjustable pixel size

Built-in palettes:

🎮 GameBoy (4-color)

🟥 NES (15-color)

🟪 SNES (11-color)

K-Means palette extraction (2–32 colors)

Floyd–Steinberg dithering

Apply effects only to selected areas

✂️ Selection Tools

Rectangle

Circle

Ellipse

Freehand (Lasso)

Add to selection

Remove from selection

Undo

Clear mask

Live selection preview overlay

🔍 Canvas Tools

Zoom in/out

Pan around the image

High-quality scaling

Transparent overlay system

🤖 AI Stylization (TensorFlow.js Models)

Works in browser with NO backend.

Included public models:

Model	Style
AnimeGAN2	Anime-style transformation
CartoonGAN	Cartoon-like smooth style
Fast Artistic Style Transfer	Painting-like artistic filters

ML stylization can be applied:

to full image

or selected region only

🎮 Sprite Sheet Export

Export your pixel art into classic tile maps:

8×8

16×16

32×32

Downloaded as PNG — perfect for games.

📸 Screenshots
🏠 Main UI

🎨 Controls Panel

✂️ Selection Tools

🧩 Editable Output (Before Apply)

🎉 Final Pixelated Output

🖼️ Logo

📂 Project Structure
pixel-art-generator/
│
├── public/
│   └── favicon.svg
│
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   │
│   ├── components/
│   │   ├── ImageUploader.jsx
│   │   ├── Controls.jsx
│   │   ├── SelectorCanvas.jsx
│   │   └── PixelCanvas.jsx
│   │
│   └── utils/
│       ├── quantize.js
│       ├── mask-utils.js
│       ├── mask.js
│       ├── ml-utils.js
│       ├── spritesheet.js
│       └── zoom-utils.js
│
├── package.json
├── vite.config.js
├── tailwind.config.cjs
├── postcss.config.cjs
└── README.md

🛠️ Installation & Running Locally
1️⃣ Clone the repo:
git clone https://github.com/VIHARI1106/pixel-art-generator.git
cd pixel-art-generator

2️⃣ Install dependencies:
npm install

3️⃣ Run development server:
npm run dev

4️⃣ Build for production:
npm run build
npm run preview

🤖 ML Model URLs (Fully Working, No CORS Issues)
Model	URL
AnimeGAN2 (Anime Style)	https://raw.githubusercontent.com/Mikubill/animegan2-js/main/animegan2/model.json
CartoonGAN (Cartoon Style)	https://raw.githubusercontent.com/lllyasviel/style2paint-mobilenet/master/cartoongan/model.json
Fast Style Transfer (Artistic Paint Style)	https://raw.githubusercontent.com/reiinakano/arbitrary-image-stylization-tfjs/master/models/style-transfer/model.json

Paste these inside the ML Model URL field in your UI.

🧪 Technologies Used

React 18 + Vite

Tailwind CSS

Canvas API

TensorFlow.js

K-Means Clustering

Advanced Mask Engine

Zoom/Pan Utilities

Sprite Sheet Generator

🗺️ Roadmap

Planned upgrades:

Save/load project state

Multiple layers

Custom palette editor

Pixel brush & eraser

Onion-skin animation preview

WebGL acceleration

NES/GB pixel-art ML CNN

🤝 Contributing

Pull requests are welcome!
For major changes, open an issue first.

📄 License

MIT License
You may use, modify, and distribute freely.

👤 Author

Created by Prabhugari Vihari 😎
