let worker = null;
let mediaStream = null;

t
async function initOCR() {
    if (!worker) {
        worker = await Tesseract.createWorker('eng+nld');
    }
}


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


function stopOcrCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
}


function captureCroppedFrameToCanvas() {
    const video = document.getElementById('ocrVideo');
    const canvas = document.getElementById('ocrCanvas');
    if (!video || !canvas || !video.videoWidth) return false;

    const vw = video.videoWidth;
    const vh = video.videoHeight;

    // Берём 70% ширины и 20% высоты ровно из центра видеопотока
    const cropWidth = Math.floor(vw * 0.7);
    const cropHeight = Math.floor(vh * 0.25);
    const cropX = Math.floor((vw - cropWidth) / 2);
    const cropY = Math.floor((vh - cropHeight) / 2);

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });


    ctx.drawImage(
        video,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
    );


    const imgData = ctx.getImageData(0, 0, cropWidth, cropHeight);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
        const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
        const threshold = 130; // Порог контраста
        const color = avg > threshold ? 255 : 0;
        d[i] = color;     // R
        d[i + 1] = color; // G
        d[i + 2] = color; // B
    }
    ctx.putImageData(imgData, 0, 0);

    return true;
}


async function scanCropCanvas() {
    const canvas = document.getElementById('ocrCanvas');
    const isCaptured = captureCroppedFrameToCanvas();

    if (!isCaptured) {
        throw new Error("Video frame is not ready");
    }

    await initOCR();
    const { data } = await worker.recognize(canvas);


    return data.text.replace(/[^a-zA-Z0-9\s.-]/g, "").replace(/\s+/g, " ").trim();
}


async function closeOCR() {
    stopOcrCamera();
    if (worker) {
        await worker.terminate();
        worker = null;
    }
}