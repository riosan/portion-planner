let worker = null;
let mediaStream = null;

// Initialize Tesseract
async function initOCR() {
    if (!worker) {
        worker = await Tesseract.createWorker('eng+nld');
    }
}

// Start the camera for OCR
async function startOcrCamera() {
    const video = document.getElementById('ocrVideo');
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        video.srcObject = mediaStream;
        await video.play();
    } catch (err) {
        console.error("Camera access error:", err);
        alert("Could not access camera.");
    }
}

// Stop the camera 
function stopOcrCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
}

// Cutting out the frame area and preprocessing
function captureCroppedFrameToCanvas() {
    const video = document.getElementById('ocrVideo');
    const canvas = document.getElementById('ocrCanvas');
    if (!video || !canvas || !video.videoWidth) return false;

    const vw = video.videoWidth;
    const vh = video.videoHeight;

    // Take 70% of the width and 25% of the height exactly from the center of the video stream
    const cropWidth = Math.floor(vw * 0.7);
    const cropHeight = Math.floor(vh * 0.25);
    const cropX = Math.floor((vw - cropWidth) / 2);
    const cropY = Math.floor((vh - cropHeight) / 2);

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    //  Drawing the cut-out piece 
    ctx.drawImage(
        video,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
    );

    // Binary thresholding (increase contrast for better recognition)
    const imgData = ctx.getImageData(0, 0, cropWidth, cropHeight);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
        const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
        const threshold = 130; // Contrast threshold
        const color = avg > threshold ? 255 : 0;
        d[i] = color;     // R
        d[i + 1] = color; // G
        d[i + 2] = color; // B
    }
    ctx.putImageData(imgData, 0, 0);

    return true;
}

// Run OCR
async function scanCropCanvas() {
    const canvas = document.getElementById('ocrCanvas');
    const isCaptured = captureCroppedFrameToCanvas();

    if (!isCaptured) {
        throw new Error("Video frame is not ready");
    }

    await initOCR();
    const { data } = await worker.recognize(canvas);

    // Clean text from special characters and noise
    return data.text.replace(/[^a-zA-Z0-9\s.-]/g, "").replace(/\s+/g, " ").trim();
}

// Close OCR
async function closeOCR() {
    stopOcrCamera();
    if (worker) {
        await worker.terminate();
        worker = null;
    }
}