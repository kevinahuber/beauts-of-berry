(function () {
  "use strict";

  var API_URL = "https://api.berry.kevcreates.art";
  var galleryFeed = document.getElementById("gallery-feed");
  var galleryEmpty = document.getElementById("gallery-empty");

  // --- Gallery ---

  function renderGallery(photos) {
    if (!photos.length) {
      galleryEmpty.hidden = false;
      return;
    }
    galleryEmpty.hidden = true;

    var html = "";
    for (var i = 0; i < photos.length; i++) {
      var photo = photos[i];
      html +=
        '<article class="photo-card">' +
        '<img src="/images/' + encodeURIComponent(photo.filename) + '" ' +
        'alt="' + escapeHtml(photo.caption) + '" loading="lazy" decoding="async">' +
        '<div class="photo-card-body">' +
        '<p class="photo-card-caption">' + escapeHtml(photo.caption) + "</p>" +
        '<p class="photo-card-meta">by ' + escapeHtml(photo.name) + "</p>" +
        "</div>" +
        "</article>";
    }
    galleryFeed.innerHTML = html;
  }

  function loadGallery() {
    fetch("/photos.json")
      .then(function (res) {
        if (!res.ok) return [];
        return res.json();
      })
      .then(function (photos) {
        renderGallery(photos);
      })
      .catch(function () {
        renderGallery([]);
      });
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  loadGallery();

  // --- Upload form ---

  var dropzone = document.getElementById("dropzone");
  var fileInput = document.getElementById("file-input");
  var preview = document.getElementById("preview");
  var previewImg = document.getElementById("preview-img");
  var removeBtn = document.getElementById("remove-photo");
  var uploadForm = document.getElementById("upload-form");
  var submitBtn = document.getElementById("submit-btn");
  var formStatus = document.getElementById("form-status");
  var selectedFile = null;

  // Open file picker on click or Enter/Space
  dropzone.addEventListener("click", function () {
    fileInput.click();
  });
  dropzone.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  // Drag and drop
  dropzone.addEventListener("dragover", function (e) {
    e.preventDefault();
    dropzone.classList.add("drag-over");
  });
  dropzone.addEventListener("dragleave", function () {
    dropzone.classList.remove("drag-over");
  });
  dropzone.addEventListener("drop", function (e) {
    e.preventDefault();
    dropzone.classList.remove("drag-over");
    var files = e.dataTransfer.files;
    if (files.length) handleFile(files[0]);
  });

  // File input change
  fileInput.addEventListener("change", function () {
    if (fileInput.files.length) handleFile(fileInput.files[0]);
  });

  function handleFile(file) {
    var validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (validTypes.indexOf(file.type) === -1) {
      showStatus("Please choose a JPEG, PNG, or WebP image.", "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showStatus("Image must be under 10MB.", "error");
      return;
    }
    selectedFile = file;
    var reader = new FileReader();
    reader.onload = function (e) {
      previewImg.src = e.target.result;
      preview.hidden = false;
      dropzone.hidden = true;
    };
    reader.readAsDataURL(file);
    hideStatus();
  }

  // Remove photo
  removeBtn.addEventListener("click", function () {
    selectedFile = null;
    fileInput.value = "";
    preview.hidden = true;
    dropzone.hidden = false;
    previewImg.src = "";
  });

  // Submit
  uploadForm.addEventListener("submit", function (e) {
    e.preventDefault();

    var name = document.getElementById("name-input").value.trim();
    var caption = document.getElementById("caption-input").value.trim();

    if (!selectedFile) {
      showStatus("Please choose a photo.", "error");
      return;
    }
    if (!name) {
      showStatus("Please enter your name.", "error");
      return;
    }
    if (!caption) {
      showStatus("Please enter a caption.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading...";
    hideStatus();

    var formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("name", name);
    formData.append("caption", caption);

    fetch(API_URL + "/upload", {
      method: "POST",
      body: formData,
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok) {
          showStatus(result.data.message || "Thanks! Your photo of Berry will appear after review.", "success");
          uploadForm.reset();
          selectedFile = null;
          preview.hidden = true;
          dropzone.hidden = false;
          previewImg.src = "";
        } else {
          showStatus(result.data.message || "Something went wrong. Please try again.", "error");
        }
      })
      .catch(function () {
        showStatus("Could not connect to the server. Please try again.", "error");
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Share photo";
      });
  });

  function showStatus(message, type) {
    formStatus.textContent = message;
    formStatus.className = "form-status " + type;
    formStatus.hidden = false;
  }

  function hideStatus() {
    formStatus.hidden = true;
  }
})();
