let worker = null;
let mediaStream = null;

// Initialize Tesseract worker
async function initOCR() {
    if (!worker) {
        worker = await Tesseract.createWorker();
        await worker.loadLanguage('eng+nld');
        await worker.initialize('eng+nld');
    }
}

// Start camera stream
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

// Stop camera stream
function stopOcrCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
}

// Capture frame inside target overlay
function captureCroppedFrameToCanvas() {
    const video = document.getElementById('ocrVideo');
    const canvas = document.getElementById('ocrCanvas');
    const overlay = document.querySelector('.scanner-overlay');

    if (!video || !canvas || !overlay || !video.videoWidth) return false;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const elemW = video.clientWidth;
    const elemH = video.clientHeight;

    const scale = Math.max(elemW / vw, elemH / vh);
    const visibleW = elemW / scale;
    const visibleH = elemH / scale;

    const offsetX = (vw - visibleW) / 2;
    const offsetY = (vh - visibleH) / 2;

    const overlayRect = overlay.getBoundingClientRect();
    const videoRect = video.getBoundingClientRect();

    const overlayX = overlayRect.left - videoRect.left;
    const overlayY = overlayRect.top - videoRect.top;

    const cropX = Math.max(0, offsetX + (overlayX / scale));
    const cropY = Math.max(0, offsetY + (overlayY / scale));
    const cropW = Math.min(vw - cropX, overlayRect.width / scale);
    const cropH = Math.min(vh - cropY, overlayRect.height / scale);

    if (cropW <= 0 || cropH <= 0) return false;

    canvas.width = cropW;
    canvas.height = cropH;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    return true;
}

// OCR processing with safe worker lifecycle management
async function scanCropCanvas() {
    const video = document.getElementById('ocrVideo');
    const canvas = document.getElementById('ocrCanvas');

    if (!video || !canvas) {
        throw new Error("Video or Canvas elements not found.");
    }

    if (video.readyState < 2 || !video.videoWidth) {
        throw new Error("Camera stream is not ready yet.");
    }

    const isCaptured = captureCroppedFrameToCanvas();
    if (!isCaptured) {
        throw new Error("Failed to capture video frame.");
    }

    try {
        // Re-initialize worker safely if needed
        await initOCR();

        // Recognize text from cropped canvas
        const result = await worker.recognize(canvas);
        const text = result && result.data ? result.data.text : "";

        // Clean up recognized string
        const cleanedText = text
            .replace(/[\r\n]+/g, " ")
            .replace(/[^a-zA-Z0-9\s.-]/g, "")
            .replace(/\s+/g, " ")
            .trim();

        return cleanedText;
    } catch (err) {
        // Suppress non-critical worker termination errors if text was parsed
        console.warn("OCR Worker warning/error:", err);
        throw err;
    }
}

// Close OCR worker and camera
async function closeOCR() {
    stopOcrCamera();
    if (worker) {
        await worker.terminate();
        worker = null;
    }
}