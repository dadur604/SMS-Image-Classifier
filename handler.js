'use strict';

const axios = require('axios');
const queryString = require('querystring');

// Twilio message response helper from sdk
const MessagingResponse = require('twilio').twiml.MessagingResponse;

// Set up Google Cloud Vision Client for detecting objects in images
const vision = require('@google-cloud/vision');
const visionClient = new vision.ImageAnnotatorClient();

module.exports.sms_webhook = async event => {
  // All Twilio webhook requests should be form-urlencoded content type
  if (event.headers['Content-Type'] != 'application/x-www-form-urlencoded') {
	  return {
		  statusCode: 400
	  };
  }
  
  const body = queryString.parse(event.body);
  
  console.log(body);
  
  const response = new MessagingResponse();
  const message = response.message();
  
  if (body.NumMedia > 0 ) {
	  
	  const image_binary = await axios({
		method: 'get',
		url: body.MediaUrl0,
		responseType: 'arraybuffer'
	  });
	  
	  const image_b64 = Buffer.from(image_binary.data, 'binary').toString('base64');
	  
	  const [result] = await visionClient.objectLocalization({image: {content: image_b64}});
	  const objects = result.localizedObjectAnnotations;
	  
	  // For debugging :)
	  for (const object of objects) {
		console.log(`Name: ${object.name}`);
		console.log(`Confidence: ${object.score}`);
	  }
	  
	  if (objects.length === 0) {
		  message.body('Couldn\'t find anything!');
	  } else {
		const topObject = objects.sort((a, b) => {return a.score > b.score})[0];
	  
		message.body(`I spy a ${topObject.name}!\n...at least i\'m ${(topObject.score * 100).toFixed()}% sure...`);
	  }
  }
  
  return {
    statusCode: 200,
	headers: {
		'Content-Type': 'text/xml'
	},
    body: response.toString()
  };
};
