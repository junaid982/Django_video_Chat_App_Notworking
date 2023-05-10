

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