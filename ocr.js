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


function captureCroppedFrameToCanvas() {
    const video = document.getElementById('ocrVideo');
    const canvas = document.getElementById('ocrCanvas');
    const overlay = document.querySelector('.scanner-overlay');

    if (!video || !canvas || !overlay || !video.videoWidth) return false;

    // 1. Source video stream dimensions
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    // 2. Displayed <video> element dimensions
    const elemW = video.clientWidth;
    const elemH = video.clientHeight;

    // 3. Calculate scale factor taking object-fit: cover into account
    const scale = Math.max(elemW / vw, elemH / vh);

    // Visible area of video stream in original pixels
    const visibleW = elemW / scale;
    const visibleH = elemH / scale;

    // Cropping offsets due to object-fit: cover
    const offsetX = (vw - visibleW) / 2;
    const offsetY = (vh - visibleH) / 2;

    // 4. Bounding rect of overlay target frame relative to video element
    const overlayRect = overlay.getBoundingClientRect();
    const videoRect = video.getBoundingClientRect();

    const overlayX = overlayRect.left - videoRect.left;
    const overlayY = overlayRect.top - videoRect.top;

    // 5. Precise crop coordinates inside the source video stream
    const cropX = offsetX + (overlayX / scale);
    const cropY = offsetY + (overlayY / scale);
    const cropW = overlayRect.width / scale;
    const cropH = overlayRect.height / scale;

    canvas.width = cropW;
    canvas.height = cropH;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Draw only the exact frame region onto the canvas
    ctx.drawImage(
        video,
        cropX, cropY, cropW, cropH,
        0, 0, cropW, cropH
    );

    // Preprocessing: convert to high-contrast black & white for optimal OCR recognition
    const imgData = ctx.getImageData(0, 0, cropW, cropH);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
        const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
        const color = avg > 120 ? 255 : 0;
        d[i] = color;
        d[i + 1] = color;
        d[i + 2] = color;
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