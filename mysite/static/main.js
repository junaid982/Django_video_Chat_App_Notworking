

var mapPeers = {};

var labelUsername = document.querySelector('#label-username');
var usernameInput = document.querySelector('#username');
var btnJoin = document.querySelector('#btn-join');


// to store username value 
var username;
var webSocket;

const webSocketOnMessage = (event) =>{
    var parsedData =JSON.parse(event.data);
    var peerUsername = parsedData['peer']
    var action = parsedData['action']

    if (username == peerUsername){
        return ;
    }

    var receiver_channel_name = parsedData['message']['receiver_channel_name'];
    if(action == 'new-peer'){
        createofferer(peerUsername , receiver_channel_name);
        return ;
    }

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
        
        sendSignal('new-peer' , {});
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


const sendSignal = (action , message)=>{
    var jsonStr = JSON.stringify({
        'peer':username,
        'action':action,
        'message':message
    });

    webSocket.send(jsonStr);
}




// turn serever and strun servers  for multiple devices to connect 
const createofferer = (peerUsername , receiver_channel_name) =>{
    var peer = new RTCPeerConnection(null )

    addLocalTracks(peer);

    var dc = peer.createDataChannel('channel');
    dc.addEventListener('open' , () =>{
        console.log('connection opened !');
    });

    dc.addEventListener('message' , dcOnMessage)

    var remoteVideo = createVideo(peerUsername);
    setOnTrack(peer , localStream);

    mapPeers[peerUsername] = [peer , dc];

    peer.addEventListener('iceconnectionstatechange' , ()=>{
        var iceConnectionState = peer.iceConnectionState;
        if(iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed'){
            delete mapPeers[peerUsername];

            if(iceConnectionState != 'closed'){
                peer.close();
            }

            removeVideo(remoteVideo)
        }
    })



}


const addLocalTracks = (peer) =>{
    localStream.getTracks().forEach(track => {
         peer.addTrack(track , localStream)
    });
    return ;
}



var messageList = document.querySelector('#message-list');

const dcOnMessage =(event) =>{
    var message = event.data;

    var li = document.createElement('li');
    li.appendChild(document.createTextNode(message));
    messageList.appendChild(li); 
}




const createVideo = (peerUsername)=>{
    var videoContainer = document.querySelector('#video-container');

    var remoteVideo = document.createElement('video');

    remoteVideo.id = peerUsername + '-video';
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;


    var videoWrapper = document.createElement('div');
    videoWrapper.appendChild(remoteVideo);

    return remoteVideo;
}


const setOnTrack = (peer , remoteVideo) =>{
    var remoteStream = new MediaStream();

    remoteVideo.srcObject = remoteStream;

    peer.addEventListener('track' , async (event) =>{
        remoteStream.addTrack(event.track , remoteStream);
    })
}





const removeVideo = (video) =>{
    var videoWrapper = video.pare
}

 








