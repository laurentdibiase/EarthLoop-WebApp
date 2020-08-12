/*This is the part of code give here:
https://github.com/muaz-khan/RTCMultiConnection/blob/master/docs/getting-started.md
for 
"Getting Started from Scratch"

and from this exemple with room ID and chat box:
https://jsfiddle.net/zd9Lsdfk/50/
*/   


const timeDisplay = document.querySelector("p");
const startButton = document.getElementById("open-room");
const stopButton = document.getElementById("leave-room");
//const sendButton = document.getElementById("send-message");

let localAudio = document.querySelector("#localAudio");
let localContainer = document.getElementById("localContainer");
let remoteContainer = document.getElementById("remoteContainer");
let roomID = document.getElementById("room-id");

let socket;

let connection = new RTCMultiConnection();


// ......................................................
// .......................UI Code........................
// ......................................................

startButton.addEventListener('click', function() {
    disableInputButtons();
    connection.openOrJoin(roomID.value, function(isRoomExist, roomid, socket) {

        if (isRoomExist === false && connection.isInitiator === true) {
            // if room doesn't exist, it means that current user will create the room
            showRoomURL(roomid);
        }

        if(isRoomExist) {
          connection.sdpConstraints.mandatory = {
              OfferToReceiveAudio: true,
              OfferToReceiveVideo: false
          };
        }

        showRoomURL(connection.sessionid);


        connection.socket.emit('clickedSend', roomID);

        connection.socket.on('broadcast-stopped', function(broadcastId) {
            // alert('Broadcast has been stopped.');
            // location.reload();
            console.error('broadcast-stopped', broadcastId);
            alert('This broadcast has been stopped.');
        });
  
        // this event is emitted when a broadcast is absent.
        connection.socket.on('start-broadcasting', function(typeOfStreams) {
            console.log('start-broadcasting', typeOfStreams);

            // host i.e. sender should always use this!
            connection.sdpConstraints.mandatory = {
                OfferToReceiveVideo: false,
                OfferToReceiveAudio: false
            };
            connection.session = typeOfStreams;

            // "open" method here will capture media-stream
            // we can skip this function always; it is totally optional here.
            // we can use "connection.getUserMediaHandler" instead
            connection.open(connection.userid);
        });
    });
});



stopButton.addEventListener('click',function() {
    startButton.disabled = false;
    connection.getAllParticipants().forEach(function(participantId) {
        connection.disconnectWith(participantId);
    });
    // close the URL display
    document.getElementById('room-urls').style.display = "none";
    // close socket.io connection
    connection.closeSocket();
});


    

// ......................................................
// .....................Socket.io........................
// ......................................................



/*

/// connection.socket:

ex 1:
connection.open('roomid', function() {
    connection.socket.emit('clicked', roomID);

});

ex 2:

connection.onstream = function(event) {
    if(event.type === 'remote') {
        connection.socket.emit('get-remote-user-extra-data', event.userid, function(extra) {
             alert( extra.joinTime );
        });
    }
}:
///

///This method allows you set custom socket listener before starting or joining a room.

connection.socketCustomEvent = 'abcdef';
connection.openOrJoin('roomid', function() {
    connection.socket.on(connection.socketCustomEvent, function(message) {
        alert(message);
    });

    connection.socket.emit(connection.socketCustomEvent, 'My userid is: ' + connection.userid);
});


//Pour récupérer le nom de chaque participant
//This method allows you set custom socket listeners anytime, during a live session.

connection.setCustomSocketEvent('abcdef');
connection.socket.on('abcdef', function(message) {
    alert(message);
});

connection.socket.emit('abcdef', 'My userid is: ' + connection.userid);

/////////////////RTCMutliconnection.js/////////////

    //Connexion automatique à l'ouverture de la page
 connection.socket.on('connect', function() {
        if (connection.enableLogs) {
        console.info('socket.io connection is opened.');
    }
        //fait quelques choses
 });
        // A l'ouverture de la session envoie des infos
        function openRoom(callback) {
            if (connection.enableLogs) {
                console.log('Sending open-room signal to socket.io');
            }

            connection.waitingForLocalMedia = false;
            connection.socket.emit('open-room', {
                sessionid: connection.sessionid,
                session: connection.session,
                mediaConstraints: connection.mediaConstraints,
                sdpConstraints: connection.sdpConstraints,
                streams: getStreamInfoForAdmin(),
                extra: connection.extra,
                identifier: connection.publicRoomIdentifier,
                password: typeof connection.password !== 'undefined' && typeof connection.password !== 'object' ? connection.password : ''
            }, function(isRoomOpened, error) {
                if (isRoomOpened === true) {
                    if (connection.enableLogs) {
                        console.log('isRoomOpened: ', isRoomOpened, ' roomid: ', connection.sessionid);
                    }
                    callback(isRoomOpened, connection.sessionid);
                }

                if (isRoomOpened === false) {
                    if (connection.enableLogs) {
                        console.warn('isRoomOpened: ', error, ' roomid: ', connection.sessionid);
                    }

                    callback(isRoomOpened, connection.sessionid, error);
                }
            });
        }
*/


// ......................................................
// ..................RTCMultiConnection Code.............
// ......................................................


//WebRTC Supported Detection
if (connection.DetectRTC.isWebRTCSupported === false) {
    alert('Please try a WebRTC compatible web browser e.g. Chrome, Firefox or Opera.');
}


connection.enableFileSharing = true; // by default, it is "false".

// keep room opened even if owner leaves
connection.autoCloseEntireSession = true;

// this line is VERY_important
connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';


connection.onEntireSessionClosed = function(event) {
    console.info('Entire session is closed: ', event.sessionid, event.extra);
};

connection.userid = 'unique-userid' || "User" + Math.ceil(Math.random() * 100);

// all below lines are optional; however recommended.
connection.session = {
    audio: true,
    video: false,
    data: true
};

// allow 6 users
connection.maxParticipantsAllowed = 7;

connection.onRoomFull = function(roomid) {
  alert('Room is full.');
};

connection.mediaConstraints = {
    audio: {
        sampleRate: 48000,
        channelCount: 2,
        volume: 1.0,
        echoCancellation:false, 
        autoGainControl:false,
        noiseSuppression:false,
        highPassFilter:false
    },
    video: false
};

connection.sdpConstraints.mandatory = {
    OfferToReceiveAudio: {
        sampleRate: 48000,
        channelCount: 2,
        volume: 1.0,
        echoCancellation:false, 
        autoGainControl:false,
        noiseSuppression:false,
        highPassFilter:false
    },
    OfferToReceiveVideo: false
};

// https://www.rtcmulticonnection.org/docs/iceServers/
// use your own TURN-server here!
connection.iceServers = [{
    'urls': [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun.l.google.com:19302?transport=udp',
    ]
}];

connection.onmessage = appendDIV;
connection.filesContainer = document.getElementById('file-container');


connection.onopen = function() {
    document.getElementById('input-text-chat').disabled = false;
    document.getElementById('share-file').disabled = false;
    
};

connection.onclose = connection.onleave = function(event) {
    alert(event.userid + ' leave the session');
};

function disableInputButtons() {
        roomID.onkeyup();
        startButton.disabled = true;
        stopButton.disabled = false;
        roomID.disabled = true;
}


connection.onstream = function(event) {
    var audioElement = event.mediaElement;
    //Create each element type into a particuliar container
    if (event.type === 'local') { 
        localContainer.appendChild(audioElement);      
    }
    if (event.type === 'remote') {
        remoteContainer.appendChild(audioElement);
        alert(event.userid + ' join the session');
    }
};

connection.onstreamended = function(event) {
    var mediaElement = document.getElementById(event.streamid);
    if (mediaElement) {
        mediaElement.parentNode.removeChild(mediaElement);
    }
};  

// ......................................................
// .................Select Input Part....................
// ......................................................
/*
connection.onMediaError = function(e) {
    if (e.message === 'Concurrent mic process limit.') {
        if (DetectRTC.audioInputDevices.length <= 1) {
            alert('Please select external microphone. Check github issue number 483.');
            return;
        }

        var secondaryMic = DetectRTC.audioInputDevices[1].deviceId;
        connection.mediaConstraints.audio = {
            deviceId: secondaryMic
        };

        connection.join(connection.sessionid);
    }
};
*/
// ......................................................
// .............Scalable Broadcast Part..................
// ......................................................

/*
//document.getElementById('broadcast-id').value = connection.userid;

// user need to connect server, so that others can reach him.
connection.socket.on(function(socket) {

    socket.on('broadcast-stopped', function(broadcastId) {
        // alert('Broadcast has been stopped.');
        // location.reload();
        console.error('broadcast-stopped', broadcastId);
        alert('This broadcast has been stopped.');
    });

    // this event is emitted when a broadcast is absent.
    socket.on('start-broadcasting', function(typeOfStreams) {
        console.log('start-broadcasting', typeOfStreams);

        // host i.e. sender should always use this!
        connection.sdpConstraints.mandatory = {
            OfferToReceiveVideo: false,
            OfferToReceiveAudio: false
        };
        connection.session = typeOfStreams;

        // "open" method here will capture media-stream
        // we can skip this function always; it is totally optional here.
        // we can use "connection.getUserMediaHandler" instead
        connection.open(connection.userid);
    });
});

window.onbeforeunload = function() {
    // Firefox is ugly.
    startButton.disabled = false;
};

/*document.getElementById('share-session').onclick = function(){
    this.disabled = true;
    var allUserStreams = connection.getRemoteStreams();
    connection.dontCaptureUserMedia = false;
    connection.mediaConstraints.audio = true;
    connection.attachStreams = [allUserStreams];
    connection.addStream({
        audio: true,
        oneway: true,
        allUserStreams: true
    });
};
*/

// ......................................................
// .................MultiStreamsMixer....................
// ......................................................

//// all remote users
//var allUserStreams = connection.getRemoteStreams();


//connection.addStream(audioMixer.getMixedStream());

// ......................................................
// ................FileSharing/TextChat Code.............
// ......................................................


document.getElementById('share-file').onclick = function() {
    var fileSelector = new FileSelector();
    fileSelector.selectSingleFile(function(file) {
        connection.send(file);
    });
};

document.getElementById('input-text-chat').onkeyup = function send(e) {
    if(e.keyCode != 13) return;
    
    // removing trailing/leading whitespace
    this.value = this.value.replace(/^\s+|\s+$/g, '');

    if (!this.value.length) return;
    
    connection.send(this.value);
    appendDIV(this.value);
    this.value =  '';
};

var chatContainer = document.querySelector('#conversation-panel');
function appendDIV(event) {
    var div = document.createElement('div');
    div.innerHTML = event.data || event ;
    chatContainer.insertBefore(div, chatContainer.firstChild);
    div.tabIndex = 0; 
    div.focus();
    
    document.getElementById('input-text-chat').focus();
}



// ......................................................
// ......................Handling Room-ID................
// ......................................................

function showRoomURL(roomid) {
    var roomHashURL = '#' + roomid;

    var html = '<h4>Session Open</h4>';

    html += 'Share URL: <a href="' + roomHashURL + '" target="_blank">' + roomHashURL + '</a>';

    var roomURLsDiv = document.getElementById('room-urls');
    roomURLsDiv.innerHTML = html;

    roomURLsDiv.style.display = 'block';
}

(function() {
    var params = {},
        r = /([^&=]+)=?([^&]*)/g;

    function d(s) {
        return decodeURIComponent(s.replace(/\+/g, ' '));
    }
    var match, search = window.location.search;
    while (match = r.exec(search.substring(1)))
        params[d(match[1])] = d(match[2]);
    window.params = params;
})();

var roomid = '';
if (localStorage.getItem(connection.socketMessageEvent)) {
    roomid = localStorage.getItem(connection.socketMessageEvent);
} else {
    roomid = connection.token();
}
document.getElementById('room-id').value = roomid;
document.getElementById('room-id').onkeyup = function() {
    localStorage.setItem(connection.socketMessageEvent, this.value);
};

var hashString = location.hash.replace('#', '');
if(hashString.length && hashString.indexOf('comment-') == 0) {
  hashString = '';
}

var roomid = params.roomid;
if(!roomid && hashString.length) {
    roomid = hashString;
}

if(roomid && roomid.length) {
    document.getElementById('room-id').value = roomid;
    localStorage.setItem(connection.socketMessageEvent, roomid);

    // auto-join-room
    (function reCheckRoomPresence() {
        connection.checkPresence(roomid, function(isRoomExists) {
            if(isRoomExists) {
                connection.join(roomid);
                return;
            }

            setTimeout(reCheckRoomPresence, 5000);
        });
    })();

    disableInputButtons();
}



