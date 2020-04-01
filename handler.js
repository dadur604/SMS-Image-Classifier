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
    
  const response = new MessagingResponse();
  const message = response.message();
  
  const MediaObjects = [];
  
  for (let i = 0; i < body.NumMedia; ++i) {
	  const MediaUrl = body["MediaUrl" + i];
	  
	  const image_binary = await axios({
		method: 'get',
		url: MediaUrl,
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
	  
	  if (objects.length >= 0) {
		const topObject = objects.sort((a, b) => {return a.score > b.score})[0];
	  
		MediaObjects.push({name: topObject.name, score: topObject.score});
	  }
  }
  
  if (MediaObjects.length === 0) {
	message.body(`Couldn't find anything! :(`);
  } else if (MediaObjects.length === 1) {
	message.body(`I spy a ${MediaObjects[0].name}!\n...at least i\'m ${(MediaObjects[0].score * 100).toFixed()}% sure...`);
  } else {
	let responseBody = "I spy a ";
	
	for (let i = 0; i < MediaObjects.length; ++i) {
	  responseBody += MediaObjects[i].name;
	  responseBody += ` (${(MediaObjects[i].score * 100).toFixed()}%)`;
	  if (i != (MediaObjects.length-1)) {
		responseBody += ', and a ';
	  } else {
		responseBody += '!';
	  }
	}
	
	message.body(responseBody);
  }
  
  return {
    statusCode: 200,
	headers: {
		'Content-Type': 'text/xml'
	},
    body: response.toString()
  };
};
