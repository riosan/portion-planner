let worker = null;
let mediaStream = null;

// Initialize Tesseract worker with english and dutch models
async function initOCR() {
    if (!worker) {
        worker = await Tesseract.createWorker('eng+nld');
    }
}

// Start video stream from rear camera
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

// Stop video stream and release tracks
function stopOcrCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
}

// Crop precise frame using overlay target coordinates
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

    // 3. Scale factor calculation (object-fit: cover)
    const scale = Math.max(elemW / vw, elemH / vh);

    // Visible area inside video element
    const visibleW = elemW / scale;
    const visibleH = elemH / scale;

    // Offsets for object-fit clipping
    const offsetX = (vw - visibleW) / 2;
    const offsetY = (vh - visibleH) / 2;

    // 4. Overlay target position relative to video container
    const overlayRect = overlay.getBoundingClientRect();
    const videoRect = video.getBoundingClientRect();

    const overlayX = overlayRect.left - videoRect.left;
    const overlayY = overlayRect.top - videoRect.top;

    // 5. Crop coordinates inside original video resolution
    const cropX = Math.max(0, offsetX + (overlayX / scale));
    const cropY = Math.max(0, offsetY + (overlayY / scale));
    const cropW = Math.min(vw - cropX, overlayRect.width / scale);
    const cropH = Math.min(vh - cropY, overlayRect.height / scale);

    // Prevent invalid 0-size canvas execution
    if (cropW <= 0 || cropH <= 0) return false;

    canvas.width = cropW;
    canvas.height = cropH;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Draw pure image directly from video without lossy thresholding
    ctx.drawImage(
        video,
        cropX, cropY, cropW, cropH,
        0, 0, cropW, cropH
    );

    return true;
}

// Process image recognition safely
async function scanCropCanvas() {
    const canvas = document.getElementById('ocrCanvas');
    const isCaptured = captureCroppedFrameToCanvas();

    if (!isCaptured) {
        throw new Error("Video frame is not ready or crop size is invalid.");
    }

    await initOCR();

    // Recognize text directly from raw cropped canvas
    const result = await worker.recognize(canvas);

    if (!result || !result.data) {
        return "";
    }

    // Clean output string from unexpected artifacts and multiple line breaks
    return result.data.text
        .replace(/[\r\n]+/g, " ")
        .replace(/[^a-zA-Z0-9\s.-]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

// Terminate Tesseract worker and stop camera stream
async function closeOCR() {
    stopOcrCamera();
    if (worker) {
        await worker.terminate();
        worker = null;
    }
}