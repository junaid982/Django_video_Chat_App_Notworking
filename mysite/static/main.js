

var mapPeers = {};

var labelUsername = document.querySelector('#label-username');
var usernameInput = document.querySelector('#username');
var btnJoin = document.querySelector('#btn-join');


// to store username value 
var username;
var webSocket;

const webSocketOnMessage = (event) => {
    var parsedData = JSON.parse(event.data);
    var peerUsername = parsedData['peer']
    var action = parsedData['action']

    if (username == peerUsername) {
        return;
    }

    var receiver_channel_name = parsedData['message']['receiver_channel_name'];
    if (action == 'new-peer') {
        createofferer(peerUsername, receiver_channel_name);
        return;
    }

    if (action == 'new-offer') {
        var offer = parsedData['message']['sdp'];

        createAnswerer(offer, peerUsername, receiver_channel_name);

        return;
    }

    if (action == 'new-answer'){
        var answer = parsedData['message']['sdp'];
        var peer = mapPeers[peerUsername][0];
        peer.setRemoteDescription(answer);
        return 
    }


}



// #==========================================================================================
// 1st method start from here  
// #==========================================================================================

btnJoin.addEventListener('click', () => {
    username = usernameInput.value;

    // console.log('username :',username)

    if (username == '') {
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

    if (loc.protocol == 'https:') {
        wsStart = 'wss://'
    }

    var endPoint = wsStart + loc.host + loc.pathname;
    // console.log('endPoint :' , endPoint)


    // Socket connection 

    webSocket = new WebSocket(endPoint);

    webSocket.addEventListener('open', (e) => {
        console.log('Connection Open .');

        sendSignal('new-peer', {});  //caling sendSignal Method
    });

    webSocket.addEventListener('message', webSocketOnMessage);

    webSocket.addEventListener('close', (e) => {
        console.log('Connection closed .')
    });

    webSocket.addEventListener('error', (e) => {
        console.log('Error Occurred .')
    });

})











// setup media stream get audio and video from the local machin 

var localStream = new MediaStream();

const constraints = {
    'video': true,
    'audio': true
}

// access webcam 


const localVideo = document.querySelector('#local-video');

const btnToggleAudio = document.querySelector('#btn-toggle-audio');
const btnTogglevideo = document.querySelector('#btn-toggle-video');



var userMedia = navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = localStream;
        localVideo.muted = true;

        var audioTracks = stream.getAudioTracks()
        var videoTracks = stream.getVideoTracks()

        audioTracks[0].enabled = true;
        videoTracks[0].enabled = true;


        // audio mute button 
        btnToggleAudio.addEventListener('click' , () =>{
            audioTracks[0].enabled = !audioTracks[0].enabled;

            if(audioTracks[0].enabled){
                btnToggleAudio.innerHTML = 'Audio Mute';
                return 
            }
            btnToggleAudio.innerHTML = 'Audio Unmute';
        })

        // video mute button 
        
        btnTogglevideo.addEventListener('click' , () =>{
            videoTracks[0].enabled = !videoTracks[0].enabled;

            if(videoTracks[0].enabled){
                btnTogglevideo.innerHTML = 'Video Off';
                return 
            }
            btnTogglevideo.innerHTML = 'Video On';
        })



    })
    .catch(error => {
        console.log('Erro to accessing media Devices ..', error)
    })




// #==========================================================================================
// 2st method start from here  
// #==========================================================================================

// 2nd method  
const sendSignal = (action, message) => {
    var jsonStr = JSON.stringify({
        'peer': username,
        'action': action,
        'message': message
    });

    webSocket.send(jsonStr);
}




// turn serever and strun servers  for multiple devices to connect 
const createofferer = (peerUsername, receiver_channel_name) => {
    var peer = new RTCPeerConnection(null)

    addLocalTracks(peer);

    var dc = peer.createDataChannel('channel');
    dc.addEventListener('open', () => {
        console.log('connection opened !');
    });

    dc.addEventListener('message', dcOnMessage)

    var remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, localStream);

    mapPeers[peerUsername] = [peer, dc];

    peer.addEventListener('iceconnectionstatechange', () => {
        var iceConnectionState = peer.iceConnectionState;
        if (iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed') {
            delete mapPeers[peerUsername];

            if (iceConnectionState != 'closed') {
                peer.close();
            }

            removeVideo(remoteVideo);
        }
    });

    peer.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
            console.log('New ice candidate: ', JSON.stringify(peer.localDescription));

            return;
        }

        sendSignal('new-offer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name
        });
    });

    peer.createOffer()
        .then(o => peer.setLocalDescription(o))
        .then(() => {
            console.log('Local Description set successfully')
        })
}








const createAnswerer = (offer, peerUsername, receiver_channel_name) => {
    var peer = new RTCPeerConnection(null)

    addLocalTracks(peer);


    var remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, localStream);

    peer.addEventListener('datachannel', e => {
        peer.dc = e.channel;
        peer.dc.addEventListener('open', () => {
            console.log('connection opened !');

        });

        peer.dc.addEventListener('message', dcOnMessage)

        mapPeers[peerUsername] = [peer, peer.dc];
    })


    peer.addEventListener('iceconnectionstatechange', () => {
        var iceConnectionState = peer.iceConnectionState;
        if (iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed') {
            delete mapPeers[peerUsername];

            if (iceConnectionState != 'closed') {
                peer.close();
            }

            removeVideo(remoteVideo);

        }
    });

    peer.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
            console.log('New ice candidate: ', JSON.stringify(peer.localDescription));

            return;
        }

        sendSignal('new-answer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name
        });
    });

    peer.setRemoteDescription(offer)
        .then(() => {
            console.log(`Remote description set successfully for ${peerUsername}`)
            return peer.createAnswer();
        })
        .then( a => {
            console.log('answer created ')
            peer.setLocalDescription(a)
        })

}









const addLocalTracks = (peer) => {
    localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream)
    });
    return;
}



var messageList = document.querySelector('#message-list');

const dcOnMessage = (event) => {
    var message = event.data;

    var li = document.createElement('li');
    li.appendChild(document.createTextNode(message));
    messageList.appendChild(li);
}




const createVideo = (peerUsername) => {
    var videoContainer = document.querySelector('#video-container');

    var remoteVideo = document.createElement('video');

    remoteVideo.id = peerUsername + '-video';
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;


    var videoWrapper = document.createElement('div');
    videoWrapper.appendChild(remoteVideo);

    return remoteVideo;
}


const setOnTrack = (peer, remoteVideo) => {
    var remoteStream = new MediaStream();

    remoteVideo.srcObject = remoteStream;

    peer.addEventListener('track', async (event) => {
        remoteStream.addTrack(event.track, remoteStream);
    })
}





const removeVideo = (video) => {
    var videoWrapper = video.parentNode;

    videoWrapper.parentNode.removeChild(videoWrapper);

}










