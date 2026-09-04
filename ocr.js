let worker = null;
let mediaStream = null;

// Initialize Tesseract worker (compatible with Tesseract.js v4 & v5+)
async function initOCR() {
    if (!worker) {
        // Create worker without arguments for v5 compatibility
        worker = await Tesseract.createWorker();
        // Load language explicitly
        await worker.loadLanguage('eng+nld');
        await worker.initialize('eng+nld');
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

    if (cropW <= 0 || cropH <= 0) return false;

    canvas.width = cropW;
    canvas.height = cropH;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Draw region to canvas
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

    try {
        await initOCR();

        // Recognize text from canvas
        const result = await worker.recognize(canvas);

        if (!result || !result.data || !result.data.text) {
            return "";
        }

        // Clean output string
        return result.data.text
            .replace(/[\r\n]+/g, " ")
            .replace(/[^a-zA-Z0-9\s.-]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    } catch (ocrError) {
        console.error("Tesseract recognition error:", ocrError);
        // Force worker reset on failure to prevent stuck state
        if (worker) {
            await worker.terminate();
            worker = null;
        }
        throw ocrError;
    }
}

// Terminate Tesseract worker and stop camera stream
async function closeOCR() {
    stopOcrCamera();
    if (worker) {
        await worker.terminate();
        worker = null;
    }
}