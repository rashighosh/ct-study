// Importing the TalkingHead module
import { TalkingHead } from 'talkinghead';
var head; // TalkingHead instance

const character = "/character-models/rashi.glb"

var first=true;

// Load and show the avatar
document.addEventListener('DOMContentLoaded', async function (e) {
  const nodeAvatar = document.getElementById('virtualcharacter');
  head = new TalkingHead(nodeAvatar, {
    ttsEndpoint: "blah",
    lipsyncModules: ["en"], // language
    cameraView: "upper", // full, mid, upper, head
    cameraDistance: -.5, // negative is zoom in from base, postitive zoom out (in meters)
    // interactions w 3d scene, usually disable
    cameraRotateEnable: false,
    cameraPanEnable: false,
    cameraZoomEnable: false,
  });

  // Load and show the avatar
  const nodeLoading = document.getElementById('loading');
  try {
    // renders avatar on screen
    await head.showAvatar({
      url: character,
      body: 'F', // either M or F, specified in charaterType
      avatarMood: 'happy', // neutral, happy, (most used, rest are there): angry, sad, fear, disgust, love, sleep
      lipsyncLang: 'en',
    }, (ev) => { // loading animation for fun while character is loading
    //   if (ev.lengthComputable) {
    //     let val = Math.min(100, Math.round(ev.loaded / ev.total * 100));
    //     nodeLoading.textContent = "Loading " + val + "%";
    //   }
    });
    // display start once loading is done
    // nodeLoading.style.display = 'none';
    // startBtn.style.display = 'block';

  } catch (error) {
    console.log(error);
    // nodeLoading.textContent = error.toString();
  }

});

// start audio for first agent audio (interrupts/disrupts any current audio)
export async function characterAudio(audio, emoji) {
  try {
    // if first audio turn, wave
    // chris: hand gestures are good, face gestures weird   
    if (first) {
      head.playGesture('👋');
      first = false;
    }
    else if (emoji) {
      head.playGesture(emoji);
    }
    head.replaceAndSpeakNewAudio(audio);

  } catch (error) {
    console.error('Error during speech processing:', error);
  }
}

// for streaming audio, waits for current audio to finish
export async function characterAudioQueue(audio, emoji) {
  // try {
  //   // console.log("Checking speaking: ", head.isSpeaking, head.speechQueue);      
  //   if (emoji) {
  //     head.playGesture(emoji);
  //   }

  //   // can have subtitles! and other stuff. hve to look more into if u want it
  //   head.speakAudio(audio, null, null);

  // } catch (error) {
  //   console.error('Error during speech processing:', error);
  // }
}
