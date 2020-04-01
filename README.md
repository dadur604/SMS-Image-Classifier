# SMS-Image-Classifier
SMS Webhook that identifies images using Google Cloud Vision

## Use

Firstly, create a Google Cloud Service Account, and obtain a credentials .json file  
(Follow instructions [here](https://cloud.google.com/docs/authentication/production))  
  
Copy said .json file as ./gc/keys.json  
  
Deploy function using `sls deploy`  
(May have to set-up AWS credentials through Serverless CLI)  
  
Attach endpoint (should have echo'd in cli output) to Twilio SMS webhook  
Using Twilio CLI, after logging in, run  
`twilio phone-numbers:update "{PHONE_NUM}" --sms-url="{FUNCTION_ENDPOINT_URL}"`
  
  
App should now respond to incoming messages containing images, with their classification!
