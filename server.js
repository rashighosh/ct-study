const path = require('path');
const express = require('express');
const app = express();
const OpenAI = require('openai')
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg'); // Import ffmpeg for audio processing

require('dotenv').config();
const openai = new OpenAI(api_key = process.env.OPENAI_API_KEY);

const jsonDir = path.resolve(__dirname, './json_scripts')

const scriptPath = path.join(jsonDir, '/Text_Script_Audio.json');

// Preload data at the beginning
let scriptData;

try {
    scriptData = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
    console.log("Successfully preloaded script metadata.");
} catch (err) {
    console.error("Error reading or parsing audio_metadata.json:", err);
    scriptData = []; // Fallback to empty data
}

app.use(express.static('public'));
app.set('view engine', 'ejs');

// index page
app.get('/', function(req, res) {
  res.render('interaction.ejs')
});

// Route to generate audio for all dialogue nodes and save as JSON
async function generatePreScript() {
  const audioMetadata = [];
  const inputFile = path.join(jsonDir, 'Text_Script.json');
  const outputFile = path.join(jsonDir, 'Text_Script_Audio.json');

  // Load the original JSON data
  let dialogueNodes;
  try {
      dialogueNodes = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  } catch (error) {
      console.error("Error reading input JSON file:", error);
      //return res.status(500).json({ error: 'Failed to read input JSON file.' });
  }

  // Process each node
  for (const node of dialogueNodes) {
      try {
          let audioDataF = null;
          // let audioDataM = null;

          // Process nodes with dialogue
          if (node.dialogue && (node.response == null || node.response.alterDialogue === false)) {
              const textToConvert = node.dialogue;

              // Generate audio for Female voice
              audioDataF = await generateAudio(textToConvert, 'shimmer');

              // Generate audio for Male voice
              // audioDataM = await generateAudio(textToConvert, 'echo');
          }

          // Add audioM and audioF fields to the node
          const updatedNode = {
              ...node,
              // audioM: audioDataM,
              audioF: audioDataF,
          };

          audioMetadata.push(updatedNode);
      } catch (error) {
          console.error(`Error processing node ${node.nodeId}:`, error);
      }
  }

  // Save the updated JSON
  try {
      await fs.promises.writeFile(outputFile, JSON.stringify(audioMetadata, null, 2));
      console.log(`Updated JSON with audio metadata saved to ${outputFile}`);
  } catch (error) {
      console.error("Error writing updated JSON to file:", error);
      //return res.status(500).json({ error: 'Failed to write updated JSON file.' });
  }

  //res.json({ message: 'Audio generation complete', outputFile });
};

// Function to generate audio and transcriptions
async function generateAudio(text, voice) {
  try {
      // Generate speech
      const mp3 = await openai.audio.speech.create({
          model: "tts-1",
          voice: voice,
          input: text,
          response_format: "wav",
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      const uniqueFilename = `speech_${uuidv4()}.wav`;
      const speechFile = path.resolve(jsonDir, `./audio/${uniqueFilename}`);

      await fs.promises.writeFile(speechFile, buffer);

      // Adjust audio speed
      const spedUpFilename = `spedup_${uniqueFilename}`;
      const spedUpFilePath = path.resolve(jsonDir, `./audio/${spedUpFilename}`);

      await new Promise((resolve, reject) => {
          ffmpeg(speechFile)
              .audioFilters('atempo=1.1') // Speed up the audio
              .save(spedUpFilePath)
              .on('end', resolve)
              .on('error', reject);
      });

      // Convert to Base64
      const spedUpBuffer = await fs.promises.readFile(spedUpFilePath);
      const audioBase64 = spedUpBuffer.toString('base64');

      // Transcribe audio
      const transcriptionResponse = await openai.audio.transcriptions.create({
          file: fs.createReadStream(spedUpFilePath),
          model: "whisper-1",
          response_format: "verbose_json",
          timestamp_granularities: ["word", "segment"],
      });

      if (transcriptionResponse && transcriptionResponse.words) {
          return {
              audioBase64: audioBase64,
              words: transcriptionResponse.words.map(x => x.word),
              wtimes: transcriptionResponse.words.map(x => 1000 * x.start - 150),
              wdurations: transcriptionResponse.words.map(x => 1000 * (x.end - x.start)),
          };
      }

      return null;
  } catch (error) {
      console.error("Error generating audio:", error);
      return null;
  }
}

// generatePreScript()

app.post('/:nodeId', async (req, res, next) => {
  // console.log(req.session.params);
  const nodeId = parseInt(req.params.nodeId);
  const additionalData = req.body || {};

  try {
      // Find node data in preloaded metadata
      const nodeData = scriptData.find(item => item.nodeId === nodeId);

      if (!nodeData) {
          console.error(`Node with ID ${nodeId} not found.`);
          return res.status(404).json({ error: `Node with ID ${nodeId} not found` });
      }

      if (nodeData.dialogue && nodeData.response == null) {
          // console.log("Pre-recorded response detected.");
          const audio = nodeData.audioF;
          const responseData = {
              nodeId: nodeId,
              dialogue: nodeData.dialogue,
              audio: audio,
              input: nodeData.input || null,
              options: nodeData.options || [],
          };
          // console.log("Sending pre-recorded response:", responseData.dialogue);
          res.setHeader('Content-Type', 'application/json; type=prerecorded'); // set type=precorded for front end otherwise no type
          return res.json(responseData);
      } 
      //  else {
      //     // console.log("Non-pre-recorded response. Generating dialogue and audio...");
      //     res.setHeader('Content-Type', 'application/json; charset=utf-8');

      //     // 67% chance to send a placeholder
      //     if (placeholdersData.length > 0) { // 40% probability
      //         const randomIndex = Math.floor(Math.random() * placeholdersData.length);
      //         const selectedPlaceholder = placeholdersData[randomIndex];
      //         const audio = gender == "male" ? selectedPlaceholder.audioM : selectedPlaceholder.audioF;

      //         const placeholderResponse = {
      //             userId: req.session?.params?.id || null,
      //             nodeId: nodeId,
      //             dialogue: selectedPlaceholder.dialogue,
      //             audio: audio,
      //             type: "PLACEHOLDER",
      //             input: null,
      //             options: [],
      //             url: null,
      //             progressInterview: null
      //         };
      //         // console.log("Sending placeholder response:", placeholderResponse.dialogue);
      //         res.write(JSON.stringify(placeholderResponse) + '\n');
      //     } else {
      //         // console.log("Skipping placeholder.");
      //     }

      //     // Generate dialogue
      //     // Create the initial message with the system role and prompt
      //     var constructedPrompt = "";
      //     if (additionalData) {
      //         constructedPrompt += "USER SAID: " + additionalData.userInput;
      //     }
      //     if (nodeData.response && nodeData.response.prompt) {
      //         constructedPrompt += "\n" + nodeData.response.prompt;
      //     }
      //     if (nodeData.response && nodeData.response.alterDialogue) {
      //         constructedPrompt += "\n The next question to ask the user is as follows, please only provide only minor modifications (as needed) and ask these question(s): " + nodeData.dialogue;
      //     }

      //     if (nodeData.response && nodeData.response.randomizedLength) {
      //         var numWords = getRandomMaxWords();
      //         constructedPrompt += "\nKeep your response to a maximum of " + numWords + " words.";
      //     }
      //     if (nodeData.response && nodeData.response.fixedLength) {
      //         constructedPrompt += "\nKeep your response to a strict maximum of " + nodeData.fixedLength;
      //     }

      //     var userObject = {
      //         role: "user",
      //         content: constructedPrompt + includePersona
      //     }

      //     req.session.params.messages.push(userObject);
      //     const generatedDialogue = await respondWithChatGPT(req.session.params.messages);
      //     var responseData = {
      //         userId: req.session?.params?.id || null,
      //         nodeId: nodeId,
      //         dialogue: generatedDialogue,
      //         audio: null,
      //         input: nodeData.input || null,
      //         options: nodeData.options || [],
      //         url: nodeData.url || null,
      //         progressInterview: nodeData.progressInterview || null,
      //         type: "NEW AUDIO",
      //         wholeDialogue: generatedDialogue
      //     };

      //     var wholeDialogue = generatedDialogue;

      //     if (nodeData.response != null && nodeData.response.alterDialogue === false) {
      //         responseData.wholeDialogue = responseData.wholeDialogue + " " + nodeData.dialogue;
      //         wholeDialogue = responseData.wholeDialogue;
      //     }

      //     var alexObject = {
      //         role: "assistant",
      //         content: responseData.wholeDialogue
      //     }
      //     req.session.params.messages.push(alexObject);


      //     // Audio Chunk Streaming
      //     const sentences = splitTextIntoSentences(generatedDialogue);
      //     // console.log("Split dialogue into sentences:", sentences);

      //     // Process first chunk immediately
      //     const firstChunk = await processSentence(sentences[0], responseData, req, true);
      //     // console.log("Sending first sentence:", firstChunk.dialogue);
      //     res.write(JSON.stringify(firstChunk) + '\n');

      //     // Process remaining chunks concurrently
      //     const remainingChunksPromises = sentences.slice(1).map((sentence, index) =>
      //         processSentence(sentence, responseData, req, false)
      //     );
      //     try {
      //         const remainingChunks = await Promise.all(remainingChunksPromises);

      //         // Stream remaining chunks as they finish
      //         remainingChunks.forEach(chunk => {
      //             // console.log("Sending remaining sentence:", chunk.dialogue);
      //             res.write(JSON.stringify(chunk) + '\n');
      //         });

      //         // Only execute this AFTER all remaining chunks are done
      //         if (nodeData.response != null && nodeData.response.alterDialogue === false) {
      //             // console.log("Sending pre-generated sentence:", nodeData.dialogue);
      //             const audio = gender == "male" ? nodeData.audioM : nodeData.audioF;
      //             responseData.dialogue = nodeData.dialogue;
      //             responseData.audio = audio;
      //             responseData.type = "END CHUNK";
      //             res.write(JSON.stringify(responseData) + '\n');
      //         }

      //         // console.log("Finished processing all sentences. Ending response stream.");
      //         res.end();
      //     } catch (err) {
      //         console.error('Error processing remaining chunks:', err);
      //         res.end();
      //     }
      // }
  } catch (err) {
      console.error('Error during request processing:', err);
      return res.status(500).json({ error: 'Failed to process request' });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
