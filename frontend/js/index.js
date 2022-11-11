const apigClient = apigClientFactory.newClient({
  apiKey: "NmXVxcYd0F5NZy41O41tk1AadpLIHTa64GXdirQz",
});
let audioCtx;

function textSearch() {
  let searchText = document.getElementById("search-query");
  console.log(searchText.value);
  if (!searchText.value) {
    alert("Enter valid text or voice input");
  } else {
    searchText = searchText.value.trim().toLowerCase();
    console.log("Calling search Photos API");
    searchphotos(searchText);
  }
}

function searchphotos(searchText) {
  console.log("The text to be searched is %s", searchText);
  document.getElementById("search-query").value = searchText;

  var queryParams = {
    q: searchText,
    "x-api-key": "NmXVxcYd0F5NZy41O41tk1AadpLIHTa64GXdirQz",
  };
  console.log("The apig client is %o", apigClient);
  apigClient
    .searchGet(queryParams, {}, {})
    .then(function (result) {
      console.log("The response from server is: ", result);
      imagesUrls = result["data"];
      console.log("The image urls are: ", imagesUrls);

      let photosSearchDiv = document.getElementById("photos-search-results");
      photosSearchDiv.innerHTML = "";
      photosSearchDiv.innerHTML =
        photosSearchDiv.innerHTML + "<h2> Searched Photos </h2>";
      for (let i = 0; i < imagesUrls.length; i++) {
        console.log("Adding image ", imagesUrls[i]);
        let imageUrlList = imagesUrls[i].split("/");
        let imageName = imageUrlList[imageUrlList.length - 1];
        console.log("Adding image name", imageName);

        photosSearchDiv.innerHTML =
          photosSearchDiv.innerHTML +
          '<figure><img src="' +
          imagesUrls[i] +
          '" style="width:25%"><figcaption>' +
          imageName +
          "</figcaption></figure>";
      }
    })
    .catch(function (result) {
      let photosDiv = document.getElementById("photos-search-results");
      photosDiv.innerHTML =
        "<h1>Image not found! Kindly try another search text</h1>";
      console.log(result);
    });
}

function uploadPhoto() {
  let filePath = document.getElementById("image-file").value.split("\\");
  let fileName = filePath[filePath.length - 1];
  console.log("The file path is", filePath, "and file name is ", fileName);

  let customLabel = document.getElementById("custom-labels").value;
  console.log("The custom label entered is ", customLabel.value);
  let reader = new FileReader();
  console.log(
    "The file object is:",
    document.getElementById("image-file").files[0]
  );
  let file = document.getElementById("image-file").files[0];
  console.log("The file is: ", file);
  document.getElementById("image-file").value = "";
  let params;
  if (customLabel == null) {
    params = {
      filename: file.name,
      key: file.name,
      bucket: "my-photos-bucket",
      "Content-Type": file.type,
      metadataMap: { "x-amz-meta-customLabels": "" },
      "x-amz-meta-customLabels": "",
      "x-api-key": "NmXVxcYd0F5NZy41O41tk1AadpLIHTa64GXdirQz",
    };
  } else {
    params = {
      filename: file.name,
      key: file.name,
      bucket: "my-photos-bucket",
      "Content-Type": file.type,
      metadataMap: { "x-amz-meta-customLabels": customLabel },
      "x-amz-meta-customLabels": customLabel,
      "x-api-key": "NmXVxcYd0F5NZy41O41tk1AadpLIHTa64GXdirQz",
    };
  }
  console.log("Adding headers");
  let additionalParams = {
    headers: {
      ...params,
      Accept: "image/*",
      "Content-Type": file.type,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "OPTIONS,PUT",
    },
  };

  console.log("The additional params is:", additionalParams);

  url =
    "https://h9eqw1xe31.execute-api.us-east-1.amazonaws.com/dev/upload/my-photos-bucket/" +
    file.name;
  axios.put(url, file, additionalParams).then((response) => {
    console.log(" New " + response.data);
    console.log("Success");
    document.getElementById("uploadText").innerHTML =
      "IMAGE UPLOADED SUCCESSFULLY!";
    document.getElementById("uploadText").style.display = "block";
    document.getElementById("uploadText").style.color = "white";
    document.getElementById("uploadText").style.fontWeight = "bold";
  });
}

function voiceSearch() {
  alert(
    "Start talking to record and once you stop the recording will be saved"
  );
  window.SpeechRecognition =
    window.webkitSpeechRecognition || window.SpeechRecognition;
  if ("SpeechRecognition" in window) {
    console.log("SpeechRecognition is Working");
  } else {
    console.log("SpeechRecognition is Not Working");
  }
  let micButton = document.getElementById("mic-search");
  const recognition = new webkitSpeechRecognition() || new SpeechRecognition();
  //recognition.continuous = true;
  recognition.lang = "en-US";
  console.log("The recognition is:", recognition);
  console.log("The content is:", micButton.innerText.trim());

  if (micButton.innerText.trim() === "Record Voice") {
    console.log("Start Recording:", recognition);
    recognition.start();
  } else if (micButton.innerText.trim() == "mic_off") {
    recognition.stop();
  }

  recognition.addEventListener("start", function () {
    micButton.textContent = "Stop Recording";
    micButton.style.background = "red";
    console.log("Recording.....");
  });

  recognition.addEventListener("end", function () {
    console.log("Stopping recording.");
    micButton.style.background = "blue";
    micButton.textContent = "Record Voice";
  });

  recognition.addEventListener("result", resultOfSpeechRecognition);
  function resultOfSpeechRecognition(event) {
    const current = event.resultIndex;
    let data = [];
    transcript = event.results[current][0].transcript;
    console.log(event);
    data.push(event.data);
    const blob = new Blob(event.results[current]);
    let params = {
      filename: "audio1.webm",
      key: "audio1.webm",
      bucket: "my-photos-bucket",
      metadataMap: { "x-amz-meta-customLabels": "" },
      "x-amz-meta-customLabels": "",
      "x-api-key": "NmXVxcYd0F5NZy41O41tk1AadpLIHTa64GXdirQz",
    };
    let additionalParams = {
      headers: {
        ...params,
        Accept: "audio/webm",
        "Content-Type": "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "OPTIONS,PUT",
      },
    };
    url =
      "https://h9eqw1xe31.execute-api.us-east-1.amazonaws.com/dev/upload-audio/audio-files-bucket-photo-booth/" +
      "audio1.webm";
    axios.put(url, blob, additionalParams).then((response) => {
      console.log(" New " + response.data);
      console.log("Successfully uploaded audio");
    });
    const searchQuery = document.getElementById("search-query");
    searchQuery.value = transcript;
    console.log("transcript : ", transcript);
  }

  // alert("Bye");
  // if (navigator.mediaDevices.getUserMedia) {
  //   console.log("getUserMedia supported.");

  //   const constraints = { audio: true };
  //   let chunks = [];
  //   let micButton = document.getElementById("mic-search");
  //   let onSuccess = function (stream) {
  //     const mediaRecorder = new MediaRecorder(stream);
  //     visualize(stream);
  //     if (micButton.innerText.trim() === "Record Voice") {
  //       mediaRecorder.start();
  //       micButton.textContent = "Stop Recording";
  //       micButton.style.background = "red";
  //       console.log("Recording.....");
  //       console.log(mediaRecorder.state);
  //     }

  //     micButton.onclick = function () {
  //       if (micButton.innerText.trim() == "Stop Recording") {
  //         console.log(mediaRecorder.state);
  //         console.log("recorder stopped");
  //         console.log("Stopping recording.");
  //         micButton.style.background = "blue";
  //         micButton.textContent = "Record Voice";
  //         mediaRecorder.stop();
  //       }
  //     };

  //     mediaRecorder.onstop = function (e) {
  //       console.log("data available after MediaRecorder.stop() called.");

  //       const blob = new Blob(chunks, { type: "audio/webm;" });
  //       createAudioElement(URL.createObjectURL(blob));
  //       console.log("The blob is:", blob);
  //       const audioUrl = URL.createObjectURL(blob);
  //       console.log("The audiourl  is:", audioUrl);
  //       const audio = new Audio(audioUrl);
  //       audio.play();
  //       chunks = [];
  //       let d = new Date();
  //       let file = new File([blob], d.valueOf(), { type: "audio/webm" });

  //       // inputSearchQuery.value = transcript;
  //       uploadToS3(file);

  //       console.log("recorder stopped");
  //     };
  //     mediaRecorder.ondataavailable = function (e) {
  //       chunks.push(e.data);
  //     };
  //   };

  //   let onError = function (err) {
  //     console.log("The following error occured: " + err);
  //   };

  //   navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
  // } else {
  //   console.log("getUserMedia not supported on your browser!");
  // }
}

// function visualize(stream) {
//   if (!audioCtx) {
//     audioCtx = new AudioContext();
//   }

//   const source = audioCtx.createMediaStreamSource(stream);

//   const analyser = audioCtx.createAnalyser();
//   analyser.fftSize = 2048;
//   const bufferLength = analyser.frequencyBinCount;
//   const dataArray = new Uint8Array(bufferLength);

//   source.connect(analyser);
// }

// appends an audio element to playback and download recording
// function createAudioElement(blobUrl) {
//   let uuid = create_UUID();
//   let fileName = uuid + ".webm";
//   console.log("The url is: ", blobUrl);
//   const downloadEl = document.createElement("a");
//   downloadEl.style = "display: block";
//   downloadEl.innerHTML = "download";
//   downloadEl.download = fileName;
//   downloadEl.href = blobUrl;
//   const audioEl = document.createElement("audio");
//   audioEl.controls = true;
//   const sourceEl = document.createElement("source");
//   sourceEl.src = blobUrl;
//   sourceEl.type = "audio/webm";

//   audioEl.appendChild(sourceEl);
//   document.body.appendChild(audioEl);
//   document.body.appendChild(downloadEl);
//   downloadEl.click();

//   readFile(fileName);
// }

// function readFile(fileName) {
//   fileName = "/Users/milindbasavaraja/Downloads/" + fileName;
//   var rawFile = new XMLHttpRequest();
//   rawFile.open("GET", fileName, false);
//   console.log(rawFile);
//   rawFile.onreadystatechange = function () {
//     if (rawFile.readyState === 4) {
//       if (rawFile.status === 200 || rawFile.status == 0) {
//         var allText = rawFile.responseText;
//         alert(allText);
//       }
//     }
//   };
//   let input = document.createElement("INPUT");
//   input.setAttribute("type", "file");
//   input.setAttribute("id", "audio-file");
//   input.setAttribute("value", fileName);
//   console.log("Input is: ", input);
//   let file = document.getElementById("audio-file");
//   console.log("File: ", file);
//   let params = {
//     filename: fileName,
//     key: fileName,
//     bucket: "audio-files-bucket-photo-booth",
//     "x-api-key": "NmXVxcYd0F5NZy41O41tk1AadpLIHTa64GXdirQz",
//   };
//   let additionalParams = {
//     headers: {
//       ...params,
//       Accept: "audio/webm",
//       "Content-Type": "audio/webm",
//       "Access-Control-Allow-Origin": "*",
//       "Access-Control-Allow-Headers": "*",
//       "Access-Control-Allow-Methods": "OPTIONS,PUT",
//     },
//   };

//   url =
//     "https://h9eqw1xe31.execute-api.us-east-1.amazonaws.com/dev/upload-audio/audio-files-bucket-photo-booth/" +
//     fileName;
//   axios.put(url, file, additionalParams).then((response) => {
//     console.log(" New " + response.data);
//     console.log("Successfully uploaded audio");
//   });
// }

// function uploadToS3(ev) {
//   let file = ev;
//   let fileName = ev.name;
//   let fileType = ev.type;
//   console.log(ev);

//   // axios
//   //   .put(
//   //     "https://h9eqw1xe31.execute-api.us-east-1.amazonaws.com/dev/upload-audio/audio-files-bucket-photo-booth/",
//   //     {
//   //       fileName: fileName, //parameter 1
//   //       fileType: fileType, //parameter 2
//   //     }
//   //   )
//   //   .then((response) => {
//   //     var returnData = response.data.data.returnData;
//   //     var signedRequest = returnData.signedRequest;
//   //     var url = returnData.url;
//   //     var options = {
//   //       headers: {
//   //         "Content-Type": fileType,
//   //       },
//   //     };
//   //     axios
//   //       .put(signedRequest, file, options)
//   //       .then((result) => {
//   //         this.setState({ audio: url }, () => console.log(this.state.audio));
//   //         alert("audio uploaded");
//   //       })
//   //       .catch((error) => {
//   //         alert("ERROR " + JSON.stringify(error));
//   //       });
//   //   })
//   //   .catch((error) => {
//   //     alert(JSON.stringify(error));
//   //   });
// }

// // console.log("e : ", e);

// // url =
// //   "https://h9eqw1xe31.execute-api.us-east-1.amazonaws.com/dev/upload-audio/audio-files-bucket-photo-booth/" +
// //   file.name;
// // axios.put(url, file, additionalParams).then((response) => {
// //   console.log(" New " + response.data);
// //   console.log("Successfully uploaded audio");
// // });
// function create_UUID() {
//   var dt = new Date().getTime();
//   var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
//     /[xy]/g,
//     function (c) {
//       var r = (dt + Math.random() * 16) % 16 | 0;
//       dt = Math.floor(dt / 16);
//       return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
//     }
//   );
//   return uuid;
// }

//index.js:69 The file object is: File {name: 'lion1.jpeg', lastModified: 1668137926031, lastModifiedDate: Thu Nov 10 2022 22:38:46 GMT-0500 (Eastern Standard Time), webkitRelativePath: '', size: 51854, …}
