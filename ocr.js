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

// Main scan function (returns text string only)
async function scanCropCanvas() {
    const canvas = document.getElementById('ocrCanvas');
    const isCaptured = captureCroppedFrameToCanvas();

    if (!isCaptured) {
        throw new Error("Video frame is not ready.");
    }

    await initOCR();
    const result = await worker.recognize(canvas);

    if (!result || !result.data || !result.data.text) {
        return "";
    }

    return result.data.text
        .replace(/[\r\n]+/g, " ")
        .replace(/[^a-zA-Z0-9\s.-]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

// Close OCR worker and camera
async function closeOCR() {
    stopOcrCamera();
    if (worker) {
        await worker.terminate();
        worker = null;
    }
}