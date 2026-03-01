const imageUpload = document.getElementById('imageUpload');
const statusDiv = document.getElementById('status');
const imageContainer = document.getElementById('imageContainer');

const EMOTIONS_UKR = {
    angry: 'Злість',
    disgusted: 'Огида',
    fearful: 'Страх',
    happy: 'Радість',
    sad: 'Сум',
    surprised: 'Здивування',
    neutral: 'Нейтрально'
};

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('models'),
    faceapi.nets.faceExpressionNet.loadFromUri('models'),
    faceapi.nets.ageGenderNet.loadFromUri('models')
]).then(startApp).catch(err => {
    statusDiv.innerText = "Помилка завантаження моделей. Перевірте локальний сервер та папку /models.";
    console.error(err);
});

function startApp() {
    statusDiv.innerText = "Моделі завантажено! Завантажте фотографію.";
    statusDiv.style.backgroundColor = "#d1fae5";
    statusDiv.style.color = "#065f46";
    imageUpload.disabled = false;
}

imageUpload.addEventListener('change', async () => {
    imageContainer.innerHTML = '';
    const file = imageUpload.files[0];
    if (!file) return;

    statusDiv.innerText = "Аналізую зображення...";
    statusDiv.style.backgroundColor = "#fef3c7";
    statusDiv.style.color = "#92400e";

    const img = await faceapi.bufferToImage(file);
    imageContainer.append(img);

    const canvas = faceapi.createCanvasFromMedia(img);
    imageContainer.append(canvas);

    const displaySize = { width: img.width, height: img.height };
    faceapi.matchDimensions(canvas, displaySize);

    const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions()
        .withAgeAndGender();
    
    if (detections.length === 0) {
        statusDiv.innerText = "Обличчя не знайдено. Спробуйте інше фото.";
        statusDiv.style.backgroundColor = "#fee2e2";
        statusDiv.style.color = "#991b1b";
        return;
    }

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const ctx = canvas.getContext('2d');

    resizedDetections.forEach(detection => {
        const box = detection.detection.box;

        const expressions = detection.expressions;
        const dominantEmotion = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
        const emotionUkr = EMOTIONS_UKR[dominantEmotion] || dominantEmotion;

        const genderUkr = detection.gender === 'male' ? 'Чоловік' : 'Жінка';
        const age = Math.round(detection.age);

        const text = `${genderUkr}, ${age} років, ${emotionUkr}`;

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        ctx.font = '16px Arial';
        const textWidth = ctx.measureText(text).width;
        const textHeight = 20;

        ctx.fillStyle = '#00ff00';
        ctx.fillRect(box.x, box.y - textHeight, textWidth + 10, textHeight);

        ctx.fillStyle = '#000000';
        ctx.fillText(text, box.x + 5, box.y - 5);
    });

    statusDiv.innerText = `Знайдено облич: ${detections.length}.`;
    statusDiv.style.backgroundColor = "#d1fae5";
    statusDiv.style.color = "#065f46";

});
