const apigClient = apigClientFactory.newClient({
  apiKey: "",
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
    "x-api-key": "",
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
      "x-api-key": "",
    };
  } else {
    params = {
      filename: file.name,
      key: file.name,
      bucket: "my-photos-bucket",
      "Content-Type": file.type,
      metadataMap: { "x-amz-meta-customLabels": customLabel },
      "x-amz-meta-customLabels": customLabel,
      "x-api-key": "",
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

  url = "" + file.name;
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
      "x-api-key": "",
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
    url = "" + "audio1.webm";
    axios.put(url, blob, additionalParams).then((response) => {
      console.log(" New " + response.data);
      console.log("Successfully uploaded audio");
    });
    const searchQuery = document.getElementById("search-query");
    searchQuery.value = transcript;
    console.log("transcript : ", transcript);
  }
}
