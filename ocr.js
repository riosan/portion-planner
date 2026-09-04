let worker = null;
let mediaStream = null;

//Initialize Tesseract on demand
async function initOCR() {
    if (!worker) {
        worker = await Tesseract.createWorker('eng+nld');
    }
}

//Start camera
async function startOcrCamera() {
    const video = document.getElementById('ocrVideo');
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' } // Back camera on smartphones
        });
        video.srcObject = mediaStream;
        await video.play();
    } catch (err) {
        console.error("Error accessing the camera:", err);
        alert("Failed to access the camera.");
    }
}

// Stop camera
function stopOcrCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
}

// Capture the current video frame to canvas
function captureFrameToCanvas() {
    const video = document.getElementById('ocrVideo');
    const canvas = document.getElementById('ocrCanvas');
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
}

// Scan the captured frame
async function scanCropCanvas(canvasElement) {
    await initOCR();
    const { data } = await worker.recognize(canvasElement);
    return data.text.trim();
}

// Close OCR and free resources
async function closeOCR() {
    stopOcrCamera();
    if (worker) {
        await worker.terminate();
        worker = null;
    }
}