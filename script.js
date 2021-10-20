var legal = `<div class="legal">
<div id="legal_top">
  <img id="icon_logo" src="source/logo.svg" alt="" />
</div>
<div id="legal_bottom">
  <div class="legal_bottom_cl" id="legal_bottom_left">
    <p class="legal-item clickable" id="legal-item_id_1">PRIVACY POLICY</p>
    <p class="legal-item clickable" id="legal-item_id_2">TERMS OF SERVICE</p>
  </div>
  <div class="legal_bottom_cl" id="legal_bottom_right">
    <img
      class="legal-item clickable"
      id="legal-item_id_sound"
      src="source/sound.svg"
      alt=""
    />
    <img
      class="legal-item clickable"
      id="legal-item_id_sqlogo"
      src="source/sq_logo.svg"
      alt=""
    />
  </div>
</div>
</div>`;
appendHtml(document.body, legal);
function appendHtml(el, str) {
  var div = document.createElement("div"); //container to append to
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
