let worker = null;
let mediaStream = null;


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
    if (!video || !canvas || video.videoWidth === 0) return false;


    const vw = video.videoWidth;
    const vh = video.videoHeight;


    const displayW = video.clientWidth;
    const displayH = video.clientHeight;


    const cropW_disp = displayW * 0.8;
    const cropH_disp = 60;
    const cropX_disp = (displayW - cropW_disp) / 2;
    const cropY_disp = (displayH - cropH_disp) / 2;


    const scale = Math.max(vw / displayW, vh / displayH);

    const actualCropW = cropW_disp * scale;
    const actualCropH = cropH_disp * scale;
    const actualCropX = (vw - cropW_disp * scale) / 2;
    const actualCropY = (vh - cropH_disp * scale) / 2;


    canvas.width = actualCropW;
    canvas.height = actualCropH;

    const ctx = canvas.getContext('2d');

    ctx.drawImage(
        video,
        actualCropX, actualCropY, actualCropW, actualCropH,
        0, 0, actualCropW, actualCropH
    );

    return true;
}


async function scanCropCanvas() {
    try {
        const canvas = document.getElementById('ocrCanvas');
        const hasFrame = captureCroppedFrameToCanvas();
        if (!hasFrame) return "";

        await initOCR();
        const { data } = await worker.recognize(canvas);


        return data.text.replace(/[\r\n]+/g, " ").trim();
    } catch (err) {
        console.error("OCR recognition error:", err);
        throw err;
    }
}


async function closeOCR() {
    stopOcrCamera();
    if (worker) {
        await worker.terminate();
        worker = null;
    }
}