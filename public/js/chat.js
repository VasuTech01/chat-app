
const socket = io();
//Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button'); 
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const urlTemplate = document.querySelector("#url-template").innerHTML;
const sidebarTemplate=document.querySelector("#sidebar-template").innerHTML
//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });
const autoscroll = () => {
    //new message element
    const $newMessage = $messages.lastElementChild;
    // height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight+newMessageMargin;
    const visibleHeight = $messages.offsetHeight;
    //height of messages container
    const containerHeight = $messages.scrollHeight;
    //how far have i scrolled 
    const scrollOffset = $messages.scrollTop + visibleHeight;
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
}
socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username:message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})
socket.on('locationMessage', (msg) => {
    console.log("*", msg)
    const html = Mustache.render(urlTemplate, {
        username:msg.username,
        url: msg.url,
        createdAt: moment(msg.createdAt).format('h:mm: a')

        
    })
    $messages.insertAdjacentHTML('beforeend', html);
})
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
   users       
    })
    document.querySelector('.chat__sidebar').innerHTML = html;
})
document.querySelector('#message-form').addEventListener('submit', (e) => {
    e.preventDefault();
    $messageFormButton.setAttribute('disabled', 'disabled');
    const value=e.target.elements.message.value;
    socket.emit('sendMessage', value, (error) => {
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();
        if (error) {
            return console.log(error);
        }
        console.log("this message was delivered Successfuly");
    });
})
$locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert("GeoLocation is not supported");
    }
    $locationButton.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((position) => {
        $locationButton.removeAttribute('disabled');
        socket.emit('sendLocation', { latitude: position.coords.latitude, longitude: position.coords.longitude }, () => {
            console.log("Location Shared");
        });
    })
})
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});

