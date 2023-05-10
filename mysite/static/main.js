

var labelUsername = document.querySelector('#label-username');
var usernameInput = document.querySelector('#username');
var btnJoin = document.querySelector('#btn-join');


// to store username value 
var username;
var webSocket;

const webSocketOnMessage = (event) =>{
    var parsedData =JSON.parse(event.data);
    var message = parsedData['message']

    console.log('Message :' , message)
}




btnJoin.addEventListener('click' , ()=>{
    username = usernameInput.value;

    // console.log('username :',username)

    if (username == '' ){
        return;
    }

    usernameInput.value = '';
    usernameInput.disabled = true;
    usernameInput.style.visibility = 'hidden';

    btnJoin.disabled = true;
    btnJoin.style.visibility = 'hidden';

    labelUsername.innerHTML = username;

    var loc = window.location;
    var wsStart = 'ws://';

    if (loc.protocol == 'https:'){
        wsStart = 'wss://'
    }

    var endPoint = wsStart + loc.host + loc.pathname;
    // console.log('endPoint :' , endPoint)


    // Socket connection 

    webSocket = new WebSocket(endPoint);

    webSocket.addEventListener('open',(e)=>{
        console.log('Connection Open .');
        var jsonStr = JSON.stringify({
            'message':'This is a message',
        })
        // webSocket.send(jsonStr);
        webSocket.send(jsonStr)
    });

    webSocket.addEventListener('message', webSocketOnMessage);
    
    webSocket.addEventListener('close',(e)=>{
        console.log('Connection closed .')
    });
    
    webSocket.addEventListener('error',(e)=>{
        console.log('Error Occurred .')
    });

})



// setup media stream get audio and video from the local machin 

var localStream = new MediaStream();

const constraints = {
    'video':true,
    'audio':true
}

// access webcam 

const localVideo = document.querySelector('#local-video');

var userMedia =  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream =>{
        localStream = stream;
        localVideo.srcObject = localStream;
        localVideo.muted = true;
    })
    .catch(error =>{
        console.log('Erro to accessing media Devices ..',error)
    })