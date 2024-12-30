const path = require('path');
const express = require('express');
const app = express();
const OpenAI = require('openai')
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg'); // Import ffmpeg for audio processing
const bodyParser = require('body-parser');
var sql = require("mssql");

require('dotenv').config();
const openai = new OpenAI(api_key = process.env.OPENAI_API_KEY);
const rashi_openai = new OpenAI(api_key = process.env.OPENAI_API_KEY);
app.use(bodyParser.json());

const jsonDir = path.resolve(__dirname, './json_scripts')

const scriptPath = path.join(jsonDir, '/Text_Script_Audio.json');

// Preload data at the beginning
let scriptData;

const config = {
    user: 'VergAdmin',
    password: process.env.PASSWORD,
    server: process.env.SERVER,
    port: parseInt(process.env.DBPORT, 10), 
    database: process.env.DATABASE,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    },
    options: {
      encrypt: true, // for azure
      trustServerCertificate: true // change to true for local dev / self-signed certs
    }
}


app.use(express.static('public'));
app.set('view engine', 'ejs');

// index page
app.get('/', function(req, res) {
  res.render('interaction.ejs')
});


try {
    scriptData = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
    console.log("Successfully preloaded script metadata.");
} catch (err) {
    console.error("Error reading or parsing audio_metadata.json:", err);
    scriptData = []; // Fallback to empty data
}

// Route to generate audio for all dialogue nodes and save as JSON
app.get("/generate/prescripted", async (req, res) => {
    console.log("GENERATING PRESCRIPT")
  const audioMetadata = [];
  const inputFile = path.join(jsonDir, 'Text_Script.json');
  const outputFile = path.join(jsonDir, 'Text_Script_Audio.json');

  // Load the original JSON data
  let dialogueNodes;
  try {
      dialogueNodes = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
      console.log(`Number of items in dialogueNodes: ${dialogueNodes.length}`);
      console.log("Success loading in Text JSON")
  } catch (error) {
      console.error("Error reading input JSON file:", error);
      //return res.status(500).json({ error: 'Failed to read input JSON file.' });
  }

  // Process each node
  console.log("Processing each node ...")
  for (const node of dialogueNodes) {
      try {
        console.log("Processing node " + node.nodeId)
          let audioDataF = null;
          // let audioDataM = null;

          // Process nodes with dialogue
          if (node.dialogue && (node.response == null || node.response.alterDialogue === false)) {
            console.log("This node either has a pregenerated response, or will append a pregenerated script to ChatGPT generated response.")
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
      return res.status(500).json({ error: 'Failed to write updated JSON file.' });
  }

  res.json({ message: 'Audio generation complete', outputFile });
});

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

async function processSentence(sentence, nodeData, req, isFirstChunk) {
    const chunkType = isFirstChunk ? "NEW AUDIO" : "CHUNK";
    const createdFiles = [];
    const tempDir = '/tmp'; // Directory for temporary files
    const gender = req.session?.params?.gender;

    try {
        // Ensure /tmp directory exists
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
            console.log(`Created directory: ${tempDir}`);
        }
        const voice = gender === "male" ? 'echo' : 'shimmer';

        // Generate audio
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: voice,
            input: sentence,
            response_format: "wav",
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        const uniqueFilename = `speech_${uuidv4()}.wav`;
        const speechFile = path.join(tempDir, uniqueFilename);
        await fs.promises.writeFile(speechFile, buffer);
        createdFiles.push(speechFile);

        // Speed up audio
        const spedUpFilename = `spedup_${uniqueFilename}`;
        const spedUpFilePath = path.join(tempDir, spedUpFilename);
        await new Promise((resolve, reject) => {
            ffmpeg(speechFile)
                .audioFilters('atempo=1.1')
                .save(spedUpFilePath)
                .on('end', resolve)
                .on('error', reject);
        });
        createdFiles.push(spedUpFilePath);

        // Convert to Base64
        const spedUpBuffer = await fs.promises.readFile(spedUpFilePath);
        const audioBase64 = spedUpBuffer.toString('base64');

        // Transcription
        const transcriptionResponse = await openai.audio.transcriptions.create({
            file: fs.createReadStream(spedUpFilePath),
            model: "whisper-1",
            response_format: "verbose_json",
            timestamp_granularities: ["word", "segment"],
        });

        const sentenceAudio = transcriptionResponse?.words
            ? {
                audioBase64,
                words: transcriptionResponse.words.map(x => x.word),
                wtimes: transcriptionResponse.words.map(x => 1000 * x.start - 150),
                wdurations: transcriptionResponse.words.map(x => 1000 * (x.end - x.start)),
            }
            : { audioBase64 };

        return {
            userId: req.session?.params?.id || null,
            nodeId: nodeData.nodeId,
            dialogue: sentence,
            audio: sentenceAudio,
            input: nodeData.input || null,
            options: nodeData.options || [],
            url: nodeData.url || null,
            progressInterview: nodeData.progressInterview || null,
            type: chunkType,
            wholeDialogue: nodeData.wholeDialogue
        };
    } catch (error) {
        console.error("Error processing sentence:", error);
        return { error: `Failed to process sentence: ${sentence}` };
    } finally {
        // Cleanup: Delete all created audio files
        for (const filePath of createdFiles) {
            try {
                await fs.promises.unlink(filePath);
                // console.log(`Deleted file: ${filePath}`);
            } catch (cleanupError) {
                console.error(`Failed to delete file: ${filePath}`, cleanupError);
            }
        }
    }
}


function splitTextIntoSentences(text) {
    // Modern approach using Intl.Segmenter
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
        return Array.from(segmenter.segment(text), segment => segment.segment);
    }

    // Fallback for environments without Intl.Segmenter
    return text.match(/[^.!?]+[.!?]+/g) || [text];
}

function removeSpecialFormat(text) {
    return text.replace(/【\d+:\d+†[^】]+】/g, '');
}


app.post('/interact/:nodeId', async (req, res, next) => {
  // console.log(req.session.params);
  const nodeId = parseInt(req.params.nodeId);
  var message = req.body.userMessage || {};
  console.log("GOT NODE", nodeId)
  console.log("REQUEST BODY", req.body)

  try {
      // Find node data in preloaded metadata
      const nodeData = scriptData.find(item => item.nodeId === nodeId);

      if (!nodeData) {
          console.error(`Node with ID ${nodeId} not found.`);
          return res.status(404).json({ error: `Node with ID ${nodeId} not found` });
      }

      if (nodeData.dialogue && nodeData.response == null) {
          console.log("Pre-recorded response detected.");
          const audio = nodeData.audioF;
          const responseData = {
              nodeId: nodeId,
              dialogue: nodeData.dialogue,
              audio: audio,
              input: nodeData.input || null,
              options: nodeData.options || [],
          };
          console.log("Sending pre-recorded response:", responseData.dialogue);
          res.setHeader('Content-Type', 'application/json; type=prerecorded'); // set type=precorded for front end otherwise no type
          return res.json(responseData);
      } else {
        console.log("USER FREE TEXT INPUT")
        const thread = await rashi_openai.beta.threads.create();
        console.log("CREATING THREAD, SENDING TO ASSISTANTS API")
        if (nodeData.response.alterDialogue === true) {
            message = "Adjust the following Response using any relevant information from userInfo:\n Response: " + nodeData.dialogue + "\n userInfo: " + req.body.userInfo
        } else {
            message = "Respond to the following Message using any relevant information from userInfo:\n Message: " + req.body.userMessage + "\n userInfo: " + req.body.userInfo
        }
        console.log("MESSAGE IS:", message)
        await rashi_openai.beta.threads.messages.create(thread.id, {
            role: 'user',
            content: message
          });
          const run = await rashi_openai.beta.threads.runs.create(thread.id, {
            assistant_id: 'asst_iPjLaF7ODxGVWInpqLB2GHB7'
          });
        let runStatus = await rashi_openai.beta.threads.runs.retrieve(thread.id, run.id);

        while (runStatus.status !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await rashi_openai.beta.threads.runs.retrieve(thread.id, run.id);
        }
        console.log("GOT RESPONSE")
        const messages = await rashi_openai.beta.threads.messages.list(thread.id);
        var generatedDialogue = messages.data[0].content[0].text.value;
        // var sources = messages.data[0].content[0].text.annotations;
        // console.log(sources)
        // const fileIds = sources.map(source => source.file_citation.file_id);
        // const sourceTexts = sources.map(source => source.text);

        // for (let i = 0; i < fileIds.length; i++) {
        //     console.log(fileIds[i]);
        //     const file = await openai.files.retrieve("file-abc123");
        // }
        
        generatedDialogue = removeSpecialFormat(generatedDialogue)

        console.log("ALTER DIALOGUE IS", nodeData.response.alterDialogue)
        let entireDialogue

        if (nodeData.response.alterDialogue === false) {
            console.log("ADDING ORIGINAL DIALOGUE TO GENERATED DIALOGUE")
            entireDialogue = generatedDialogue + nodeData.dialogue
        } else {
            entireDialogue = generatedDialogue
        }

        console.log(generatedDialogue)

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        
        var responseData = {
            nodeId: nodeId,
            dialogue: generatedDialogue,
            audio: null,
            input: nodeData.input || null,
            options: nodeData.options || [],
            wholeDialogue: entireDialogue,
            type: "NEW AUDIO",
        };

        // Audio Chunk Streaming
        const sentences = splitTextIntoSentences(generatedDialogue);
        // console.log("Split dialogue into sentences:", sentences);

        // Process first chunk immediately
        const firstChunk = await processSentence(sentences[0], responseData, req, true);
        res.write(JSON.stringify(firstChunk) + '\n');

        // Process remaining chunks concurrently
        const remainingChunksPromises = sentences.slice(1).map((sentence, index) =>
            processSentence(sentence, responseData, req, false)
        );
        try {
            const remainingChunks = await Promise.all(remainingChunksPromises);

            // Stream remaining chunks as they finish
            remainingChunks.forEach(chunk => {
                res.write(JSON.stringify(chunk) + '\n');
            });

            // Only execute this AFTER all remaining chunks are done
            if (nodeData.response != null) {
                // console.log("Sending pre-generated sentence:", nodeData.dialogue);
                const audio = nodeData.audioF;
                responseData.dialogue = nodeData.dialogue;
                responseData.audio = audio;
                responseData.type = "END CHUNK";
                res.write(JSON.stringify(responseData) + '\n');
            }

            console.log("Finished processing all sentences. Ending response stream.");
            res.end();
        } catch (err) {
            console.error('Error processing remaining chunks:', err);
            res.end();
        }
      } 
  } catch (err) {
      console.error('Error during request processing:', err);
      return res.status(500).json({ error: 'Failed to process request' });
  }
});

app.post('/updateTranscript', (req, res) => {
    const { id, transcriptType, transcript } = req.body;
  
    sql.connect(config, function (err) {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  
      var request = new sql.Request();
      const queryString = `UPDATE CTStudy SET ${transcriptType} = @transcript WHERE id = @id`;
  
      request.input('id', sql.NVarChar, id);
      request.input('transcript', sql.NVarChar, transcript);
  
      request.query(queryString, function (err, recordset) {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
  
        res.status(200).json({ message: 'Transcript inserted successfully.' });
      });
    });
  });

  app.post('/logUser', (req, res) => {
    // Extracting data from the request body
    const { id, condition, startTime } = req.body;
  
    // BEGIN DATABASE STUFF: SENDING VERSION (R24 OR U01) AND ID TO DATABASE
    sql.connect(config, function (err) {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  
      // create Request object
      var request = new sql.Request();
  
      // Check if ID already exists
      let checkIfExistsQuery = `SELECT TOP 1 id FROM CTStudy WHERE id = @id`;
  
      // Bind parameterized value for ID
      request.input('id', sql.NVarChar, id);
  
      // Execute the query to check if the ID already exists
      request.query(checkIfExistsQuery, function (err, recordset) {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: 'Database: Internal Server Error' });
        }
  
        // If the recordset has rows, then the ID already exists
        if (recordset && recordset.recordset.length > 0) {
          return res.status(200).json({ message: 'Database: id already exists.' });
        } else {
          // Construct SQL query with parameterized values to insert the record
          let insertQuery = `INSERT INTO CTStudy (id, condition, startTime) VALUES (@id, @condition, @startTime)`;
        
          // Bind parameterized values
          request.input('condition', sql.Int, condition);
          request.input('startTime', sql.NVarChar, startTime);
  
          // Execute the query to insert the record
          request.query(insertQuery, function (err, recordset) {
            if (err) {
              console.log(err);
              return res.status(500).json({ error: 'Database: Internal Server Error' });
            }
            res.status(200).json({ message: 'Database: User inserted successfully.' });
          }); 
        }
      });
    });
  });

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
