// ......................................................
// .......................UI Code........................
// ......................................................


document.getElementById('join-room').onclick = function() {
    //disableInputButtons();

    connection.sdpConstraints.mandatory = {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: false
    };
    connection.join(roomid);
};

document.getElementById('leave-room').onclick = function() {
    document.getElementById('join-room').disabled = false;
    connection.getAllParticipants().forEach(function(participantId) {
        connection.disconnectWith(participantId);
    });
    // close the URL display
    document.getElementById('room-urls').style.display = "none";
    // close socket.io connection
    connection.closeSocket();
};

// ......................................................
// ..................RTCMultiConnection Code.............
// ......................................................


var connection = new RTCMultiConnection();

connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';



// keep room opened even if owner leaves
connection.autoCloseEntireSession = true;

connection.session = {
    audio: true,
    video: false,
    oneway: true
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
    OfferToReceiveAudio: false,
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

connection.audiosContainer = document.getElementById('audios-container');

connection.onstream = function(event) {
    var existing = document.getElementById(event.streamid);
    if(existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    event.mediaElement.removeAttribute('src');
    event.mediaElement.removeAttribute('srcObject');
    event.mediaElement.muted = true;
    event.mediaElement.volume = 0;

    var audio = document.createElement('audio');

    if(event.type === 'local') {
      audio.volume = 0;
      try {
          audio.setAttributeNode(document.createAttribute('muted'));
      } catch (e) {
          audio.setAttribute('muted', true);
      }
    }
    audio.srcObject = event.stream;

    var mediaElement = getHTMLMediaElement(audio, {
        title: event.userid,
        showOnMouseEnter: false
    });

    connection.audiosContainer.appendChild(mediaElement);

    setTimeout(function() {
        mediaElement.media.play();
    }, 5000);

    mediaElement.id = event.streamid;
};

connection.onstreamended = function(event) {
    var mediaElement = document.getElementById(event.streamid);
    if (mediaElement) {
        mediaElement.parentNode.removeChild(mediaElement);

        if(event.userid === connection.sessionid && !connection.isInitiator) {
          alert('Broadcast is ended. We will reload this page to clear the cache.');
          location.reload();
        }
    }
};


///*************Socket.io*****************
/*var socket = connection.getSocket();

socket.on('buttonEvent', roomid );

Storage();

*/

// ......................................................
// ......................Handling Room-ID................
// ......................................................

function showRoomURL(roomid) {
    var roomHashURL = '#' + roomid;
    var roomQueryStringURL = '?roomid=' + roomid;

    var html = '<h2>Unique URL for your room:</h2><br>';

    html += 'Hash URL: <a href="' + roomHashURL + '" target="_blank">' + roomHashURL + '</a>';
    html += '<br>';
    html += 'QueryString URL: <a href="' + roomQueryStringURL + '" target="_blank">' + roomQueryStringURL + '</a>';

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

function Storage() {
    localStorage.setItem(connection.socketMessageEvent, roomid);
};

var hashString = location.hash.replace('#', '');
if (hashString.length && hashString.indexOf('comment-') == 0) {
    hashString = '';
}

var roomid = params.roomid;
if (!roomid && hashString.length) {
    roomid = hashString;
}

if (roomid && roomid.length) {
    localStorage.setItem(connection.socketMessageEvent, roomid);

    // auto-join-room
    (function reCheckRoomPresence() {
        connection.checkPresence(roomid, function(isRoomExist) {
            if (isRoomExist) {
                connection.join(roomid);
                return;
            }

            setTimeout(reCheckRoomPresence, 5000);
        });
    })();

}


