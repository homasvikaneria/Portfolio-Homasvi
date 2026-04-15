const bootText = [
  "LOADING SENDSTORES..."
];

const bootSequence = document.getElementById("boot-sequence");
const progressBar = document.querySelector(".progress-bar");

let currentLine = 0;
let charIndex = 0;

function typeLine() {
  if (currentLine < bootText.length) {
    if (charIndex < bootText[currentLine].length) {
      bootSequence.innerHTML += bootText[currentLine][charIndex];
      charIndex++;
      setTimeout(typeLine, 30);
    } else {
      bootSequence.innerHTML += "<br/>";
      currentLine++;
      charIndex = 0;
    }
  }
}

typeLine();

// Wait 1 second AFTER progress animation completes
progressBar.addEventListener("animationend", () => {
  setTimeout(() => {
    window.location.href = "http://13-204-92-56.sslip.io:3000/";
  }, 1000);
});