importScripts('https://www.gstatic.com/firebasejs/7.16.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.16.0/firebase-messaging.js');

firebase.initializeApp({    
  'apiKey': "AIzaSyAV3BejKaixjOOrDL5XNiErn2CuemWwYuw",
  'authDomain': "elohi-expresso.firebaseapp.com",
  'databaseURL': "https://elohi-expresso-default-rtdb.firebaseio.com",
  'projectId': "elohi-expresso",
  'storageBucket': "elohi-expresso.appspot.com",
  'messagingSenderId': "667386625250",
  'appId': "1:667386625250:web:214b9283eb9c864053b2bb",
  'measurementId': "G-QCXKCV4QHV"
});

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
  console.log('Received background message ', payload);
  // here you can override some options describing what's in the message; 
  // however, the actual content will come from the Webtask
  const notificationOptions = {
    icon: '/assets/imgs/logo.png'
  };
  return self.registration.showNotification(notificationTitle, notificationOptions);
});
