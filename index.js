const express = require('express');
const venom = require('venom-bot');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid'); // Import uuid module
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const port = 8002;

app.use(express.json()); // Middleware untuk menguraikan JSON

app.use(express.static(path.join(__dirname, "public")));


let clientInstance;

app.get('/create-session', (req, res) => {
  const sessionName = uuidv4(); // Generate a unique session name using UUID
  console.log('Generated session name:', sessionName); // Debugging: Log the generated session name
  // console.log(req.body);

  // venom
  //   .create({
  //     session: sessionName,
  //   })
  //   .then((client) => {
  //     clientInstance = client;
  //     start(client);
  //     res.status(200).send({ message: 'Session created successfully', session: sessionName });
  //   })
  //   .catch((erro) => {
  //     console.log(erro);
  //     res.status(500).send({ message: 'Error creating session', error: erro });
  //   });

    venom
    .create({
	    session: sessionName, // name of session
	    catchQR: (base64Qrimg, asciiQR) => {
	    	// console.log('Terminal QR Code:', asciiQR);
	    	// console.log('Base64 image string QR Code:', base64Qrimg);

	      // Define the path to the Downloads directory
	    	const uploadsDir = path.join(__dirname, 'public', 'uploads', 'qr_wa');
      		const filePath = path.join(uploadsDir, 'qr_code_image.png');

	      // Save the base64 image string to a file in the Downloads directory
	    	const base64Data = base64Qrimg.replace(/^data:image\/png;base64,/, "");
	    	// console.log("base64Data");
	    	// console.log(base64Data);
	    	fs.writeFile(filePath, base64Data, 'base64', (err) => {
	    		if (err) {
	    			console.log('Error saving QR code image:', err);
	    		} else {
	    			console.log(`QR code image saved to ${filePath}`);
	    		}
	    	});
	    }
	})
    .then((client) => {
    	clientInstance = client;
    	start(client);
    	res.status(200).send({ message: 'Session created successfully', session: sessionName });
    })
    .catch((erro) => {
    	console.log(erro);
      	res.status(500).send({ message: 'Error creating session', error: erro });
    });

});

function start(client) {
  client.onMessage(async (message) => {
    // console.log("message");
    // console.log(message.from);
    const number = message.from;
    const whatsapp_number = number.split('@')[0];

    if (message.type == 'chat' && message.isGroupMsg == false) {
      try {
        const response = await axios.post('http://localhost:8001/api/v1/conversation/create', { whatsapp_number: whatsapp_number, message_text: message.body });
        console.log('Response');
        console.log(response.data);
        // console.log('Response sistem');
        // console.log(response.data.data.response_system);
        client
          .sendText(message.from, response.data.data.response_system)
          .then((result) => {
            console.log('Result: ', result); //return object success
          })
          .catch((erro) => {
            console.error('Error when sending: ', erro); //return object error
          });
      } catch (error) {
        console.error('Error:', error);
      }
    } else {
      client
        .sendText(message.from, 'Mohon maaf hanya dapat menerima pesan dalam bentuk text')
        .then((result) => {
          console.log('Result: ', result); //return object success
        })
        .catch((erro) => {
          console.error('Error when sending: ', erro); //return object error
        });
    }
  });
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
