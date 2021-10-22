let playBtn = document.getElementById("play_button_id");
let legal = `<div class="legal">
<div id="legal_top">
  <img id="icon_logo" src="source/logo.svg"/></div>
<div id="legal_bottom">
  <div class="legal_bottom_cl" id="legal_bottom_left">
    <p id="legal-item_id_1" class="legal-item clickable"><a href="https://www.squarespace.com/privacy" target="_blank">PRIVACY POLICY</a></p>
    <p id="legal-item_id_2" class="legal-item clickable"><a href="https://www.squarespace.com/terms-of-service" target="_blank">TERMS OF SERVICE</a></p>
  </div>
  <div class="legal_bottom_cl" id="legal_bottom_right">
    <img
      class="legal-item clickable"
      id="legal-item_id_sound"
      src="source/sound.svg"
      alt=""
    />
    <a href="https://www.squarespace.com/"><img
      class="legal-item clickable"
      id="legal-item_id_sqlogo"
      src="source/sq_logo.svg"
      alt=""
    /></a>
  </div>
</div>
</div>`;
appendHtml(document.body, legal);
function appendHtml(el, str) {
  let div = document.createElement("div"); //container to append to
  div.innerHTML = str;
  while (div.children.length > 0) {
    el.appendChild(div.children[0]);
  }
}
console.log("hello");

function info_open() {
  window.location.href = "info.html";
}
function info_close() {
  window.location.href = "main.html";
}
function music_open() {
  console.log("hey");
  window.location.href = "M1SpatialAudioPlayer.html";
}
let i = 0;
