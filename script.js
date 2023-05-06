const video = document.getElementById("video")
let button = document.getElementById('capture');
let txt= document.getElementById('text');
let whole_container = document.querySelector(".whole_container");
let first = true

button.addEventListener('click', async () => {
    video.style.display = "block";
    whole_container.innerHTML='1'
    try {
      let model;
        if (first) {
        model = await tf.loadLayersModel('http://localhost:3000/model.json');
        whole_container.innerHTML='2'

        first = false;
        }
        Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),]).then(capture(model));
    
      } catch (error) {
        console.log({ error });
    
      }
    whole_container.innerHTML='clicked'

})

function capture(model){
    chrome.tabCapture.capture({audio: false, video: true},(stream)=>{
        video.srcObject = stream;
        whole_container.innerHTML='captured'
        video.addEventListener('play', () => {
            
            const canvas = faceapi.createCanvasFromMedia(video)
            document.body.append(canvas)
            const displaySize = { width: video.width, height: video.height }
            faceapi.matchDimensions(canvas, displaySize)
            interval = setInterval(async () => {
             
                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())

                
                extractFaceFromBox(video, detections[0]._box,model)
                // console.log('extracted')
                whole_container.innerHTML='extracted'
                const resizedDetections = faceapi.resizeResults(detections, displaySize)
                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
                faceapi.draw.drawDetections(canvas, resizedDetections)
                whole_container.innerHTML='drawn'
            }, 300)
          })
    })
}

async function extractFaceFromBox(inputImage, box,model) {
  const regionsToExtract = [
    new faceapi.Rect(box.x, box.y, box.width, box.height)
  ]

  let faceImages = await faceapi.extractFaces(inputImage, regionsToExtract)
 
  if (faceImages.length == 0) {
    whole_container.innerHTML='Face not found'
  }
  else {
    faceImages.forEach((cnv, key) => {
      let pixelImage = tf.browser.fromPixels(cnv);
      let resized = tf.image.resizeBilinear(pixelImage, [256, 256], false, false);
      
      let detect = tf.expandDims(tf.reshape(greyImage, [256, 256, 3]), 0)
      let prediction = model.predict(detect).dataSync();
      let pred = prediction.map(val => Math.round((val * 100)));
      const [angry, fear, happy, neutral, sad, surprised] = pred;
      let Emotion = pred.indexOf(Math.max(...pred));
      const emotionList = ["angry", "fear", "happy", "neutral", "sad", "surprise"];
      var item = document.createElement("div");
      item.innerHTML = face_analysis_item({ key: key, image_source: cnv.toDataURL(), pred:pred,emotionList:emotionList,Emotion: emotionList[Emotion], angry: angry, fear: fear, happy: happy, neutral: neutral, sad: sad, surprised: surprised})
      whole_container.appendChild(item);
      $(".progress .progress-bar").css("width", function () {
       return $(this).attr("aria-valuenow") + "%";
      });
    })
  }
}

function face_analysis_item({ key, image_source,pred,emotionList, Emotion, angry, fear, happy, neutral, surprised, sad }) {
  return `    
  <div class="face_analysis_element">
  <img class="outputImage" src="${image_source}"/>
  <div class="element" id="element${key}">
  <div class="container">

    <h2>${Emotion}</h2>
    <div class="row">
      <span class="emotionItem">Angry</span>
     
        <div class="progress-bar progress-bar-primary" role="progressbar" aria-valuenow="${angry}" aria-valuemin="0" aria-valuemax="100" >
        
        <p class='pourcent'>${pred[emotionList.indexOf('angry')]+'%'}</p>
        
        </div>
      
    </div>

    <div class="row">
      <span class="emotionItem">Fear</span>
      
        <div class="progress-bar progress-bar-primary" role="progressbar" aria-valuenow="${fear}" aria-valuemin="0" aria-valuemax="100">
        <p class='pourcent'>${pred[emotionList.indexOf('fear')]+'%'}</p>
        
        </div>  
      
      
    </div>
    <div class="row">
    <span class="emotionItem">Happy</span>
     
     
        <div class="progress-bar progress-bar-primary" role="progressbar" aria-valuenow="${happy}" aria-valuemin="0" aria-valuemax="100" >
        <p class='pourcent'>${pred[emotionList.indexOf('happy')]+'%'}</p>
        </div>
      
    </div>
    <div class="row">
      <span class="emotionItem">Neutral</span>
      
        <div class="progress-bar progress-bar-primary" role="progressbar" aria-valuenow="${neutral}" aria-valuemin="0" aria-valuemax="100">
        <p class='pourcent'>${pred[emotionList.indexOf('neutral')]+'%'}</p>
        </div>
      
    </div>
    <div class="row">
      <span class="emotionItem">Sad</span>
      
        <div class="progress-bar progress-bar-primary" role="progressbar" aria-valuenow="${sad}" aria-valuemin="0" aria-valuemax="100">
        <p class='pourcent'>${pred[emotionList.indexOf('sad')]+'%'}</p>
        </div>
     
    </div>
    <div class="row">
      <span class="emotionItem">Surprise</span>
      
        <div class="progress-bar progress-bar-primary" role="progressbar" aria-valuenow="${surprised}" aria-valuemin="0" aria-valuemax="100">
        <p class='pourcent'>${pred[emotionList.indexOf('surprise')]+'%'}</p>

      </div>
    </div>
  </div>
 </div>
 `
}